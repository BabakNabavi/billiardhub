/* ─────────────────────────────────────────────────────────────
   هسته‌ی سمت‌سرور شبکه‌ی اجتماعی (استوری/دایرکت/نوتیفیکیشن).

   دایرکت (نسخه‌ی حرفه‌ای، ضد گم‌شدن):
   - هر «پیام» یک فایل مستقل و تغییرناپذیر است (append-only) ⇒ دو ارسال
     هم‌زمان دیگر همدیگر را پاک نمی‌کنند و علامت «خوانده‌شد» هم فایل پیام‌ها
     را بازنویسی نمی‌کند (کرسر جدا). این ریشه‌ی «پیام گم می‌شد» بود.
   - Realtime Broadcast (بدون نیاز به جدول Postgres) پیام را در کمتر از یک
     ثانیه به گیرنده می‌رساند؛ پولینگ فقط تور ایمنی افزایشی است.
   ───────────────────────────────────────────────────────────── */

import { getSupabaseServer } from './supabase-server'

export const BUCKET = 'club-media'
export const DAY = 24 * 60 * 60 * 1000
const SUPABASE_URL = 'https://bxnomfjjvhdtbnqvgjmh.supabase.co'

/* ── تفکیک محتوای خصوصی از عمومی ─────────────────────────────

   باکت `club-media` عمومی است — و باید بماند، چون عکس باشگاه،
   محصول و استوری از همان‌جا سرو می‌شوند.

   ولی دایرکت، اعلان، اشتراک Push، رکورد OTP و مدارک هویتی هم در
   همان باکت می‌نشستند. یعنی هر کسی بدون هیچ کلیدی می‌توانست
   `/object/public/club-media/social/dm/<شماره>.json` را بخواند و
   کل باکت را هم فهرست کند. نام فایل‌ها خود شماره‌ی موبایل بود.

   این‌ها حالا به یک باکت **خصوصی** می‌روند. مسیرها عوض نمی‌شوند،
   فقط باکت — پس همه‌ی فراخوان‌های موجود بدون تغییر کار می‌کنند. */
export const PRIVATE_BUCKET = 'bh-private'

const PRIVATE_PREFIXES = [
  'social/dm/', 'social/dm-idx/', 'social/dm-poll/',
  'social/notif/', 'social/push/', 'social/otp/', 'social/seen/',
  'documents/',
]

/** کدام باکت برای این مسیر؟ */
export function bucketFor(path: string): string {
  return PRIVATE_PREFIXES.some(p => path.startsWith(p)) ? PRIVATE_BUCKET : BUCKET
}

/** آیا این مسیر خصوصی است؟ (برای تصمیم خواندن با URL عمومی) */
export const isPrivatePath = (path: string) => bucketFor(path) === PRIVATE_BUCKET

export const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/* کلیدها ممکن است شماره/آیدی باشند؛ برای مسیر فایل ایمن‌سازی می‌شوند. */
export const safeKey = (k: string) => (k || 'x').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)
export const convId = (a: string, b: string) => [safeKey(a), safeKey(b)].sort().join('__')
export const dmTopic = (userKey: string) => `dm-user-${safeKey(userKey)}`

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await getSupabaseServer().storage.from(bucketFor(path)).download(path)
    if (error || !data) return fallback
    return JSON.parse(await data.text()) as T
  } catch { return fallback }
}

/* خواندن تضمین‌شده‌ی تازه — دانلود معمولی گاهی نسخه‌ی کش‌شده‌ی لبه را می‌دهد و
   اگر روی همان نسخه بنویسیم، تغییر همزمان را پاک می‌کند. هرجا نتیجه‌ی خواندن
   مبنای نوشتن است یا کهنگی برای کاربر دیده می‌شود، از این استفاده کنید.
   باکت عمومی است، پس آدرس عمومی با پارامتر ضدکش خوانده می‌شود. */
export async function readJsonFresh<T>(path: string, fallback: T): Promise<T> {
  try {
    /* مسیر خصوصی هرگز از URL عمومی خوانده نمی‌شود — آن باکت public
       نیست و اصلاً پاسخ نمی‌دهد. با کلید سرویس دانلود می‌شود؛ دانلود
       مستقیم کش لبه ندارد، پس همان تازگی مورد نظر را هم می‌دهد. */
    if (isPrivatePath(path)) {
      const { data, error } = await getSupabaseServer().storage.from(PRIVATE_BUCKET).download(path)
      if (error || !data) return fallback
      return JSON.parse(await data.text()) as T
    }
    const bust = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}?t=${bust}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) return fallback
    return (await r.json()) as T
  } catch { return fallback }
}

export async function writeJson(path: string, obj: unknown): Promise<void> {
  const buf = Buffer.from(JSON.stringify(obj), 'utf8')
  await getSupabaseServer().storage.from(bucketFor(path)).upload(path, buf, {
    upsert: true, contentType: 'application/json',
    cacheControl: '0',   // بدون این، خواندن بعدی نسخه‌ی کش‌شده‌ی قدیمی را می‌داد (پیام‌ها دیر/گم می‌شدند)
  })
}

/* ── Realtime Broadcast (سرور → کلاینت‌ها) ── */
export async function broadcast(topic: string, event: string, payload: unknown): Promise<void> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return
  try {
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ messages: [{ topic, event, payload, private: false }] }),
    })
  } catch { /* شکست برادکست حیاتی نیست؛ پولینگ می‌گیردش */ }
}

/* ── مسیرها ── */
export const P = {
  stories: 'social/stories/index.json',
  msgDir:  (cid: string) => `social/dm/${cid}/m`,
  msgFile: (cid: string, name: string) => `social/dm/${cid}/m/${name}`,
  read:    (cid: string, user: string) => `social/dm/${cid}/read/${safeKey(user)}.json`,
  cleared: (cid: string, user: string) => `social/dm/${cid}/cleared/${safeKey(user)}.json`,
  dmIndex: (user: string) => `social/dm-idx/${safeKey(user)}.json`,
  notif:   (user: string) => `social/notif/${safeKey(user)}.json`,
  poll:    (user: string) => `social/dm-poll/${safeKey(user)}.json`,
}

/* ── پیام‌ها: هر پیام یک فایل، نامش = زمان مرتب‌شونده (بدون کلوبر) ── */
export interface DMsg { id: string; fromKey: string; text: string; kind: string; storyRef?: string; at: number }
const pad = (n: number) => String(n).padStart(15, '0')

export async function appendMessage(cid: string, m: DMsg): Promise<void> {
  await writeJson(P.msgFile(cid, `${pad(m.at)}_${m.id}.json`), m)
}

/* since=0 ⇒ آخرین cap پیام؛ since>0 ⇒ فقط پیام‌های تازه‌تر (بر پایه‌ی نام فایل، بدون دانلود اضافه) */
export async function readMessages(cid: string, since = 0, cap = 80): Promise<DMsg[]> {
  try {
    const dir = P.msgDir(cid)
    const { data, error } = await getSupabaseServer().storage.from(bucketFor(dir + '/'))
      .list(dir, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
    if (error || !data) return []
    const rows = data
      .filter(f => f.name.endsWith('.json'))
      .map(f => ({ n: f.name, at: parseInt(f.name.slice(0, 15), 10) || 0 }))
      .filter(x => x.at > since)
      .sort((a, b) => a.at - b.at)
    const take = since > 0 ? rows : rows.slice(-cap)
    const msgs = await Promise.all(take.map(x => readJson<DMsg | null>(P.msgFile(cid, x.n), null)))
    return msgs.filter(Boolean) as DMsg[]
  } catch { return [] }
}

/* ── کرسر «خوانده‌شد» per-user per-conv (فایل پیام‌ها را بازنویسی نمی‌کند) ── */
export async function getReadCursor(cid: string, user: string): Promise<number> {
  return await readJson<number>(P.read(cid, user), 0)
}
export async function setReadCursor(cid: string, user: string, at: number): Promise<boolean> {
  const cur = await getReadCursor(cid, user)
  if (at > cur) { await writeJson(P.read(cid, user), at); return true }
  return false
}

/* «پاک‌کردن گفتگو» per-user (مثل اینستاگرام: فقط از سمت خودش؛ پیام‌ها برای طرف
   مقابل می‌مانند). پیام‌های قدیمی‌تر از این زمان برای این کاربر برنمی‌گردند. */
export async function getClearedAt(cid: string, user: string): Promise<number> {
  return await readJson<number>(P.cleared(cid, user), 0)
}
export async function setClearedAt(cid: string, user: string, at: number): Promise<void> {
  await writeJson(P.cleared(cid, user), at)
}

/* «آخرین فعالیت» هر کاربر — برای تیک «رسیده». */
export async function touchPoll(user: string) {
  if (!user) return
  await writeJson(P.poll(user), Date.now())
}
export async function getPoll(user: string): Promise<number> {
  if (!user) return 0
  return await readJson<number>(P.poll(user), 0)
}

/* ── نوتیفیکیشن ── */
export interface Notif {
  id: string
  type: 'reply' | 'reaction' | 'like'
  fromKey: string
  fromName: string
  fromRole?: string
  text: string
  storyId?: string
  at: number
  read: boolean
}

export async function addNotification(userKey: string, n: Omit<Notif, 'id' | 'at' | 'read'>) {
  if (!userKey) return
  const path = P.notif(userKey)
  const list = await readJson<Notif[]>(path, [])
  list.unshift({ ...n, id: `nt-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, at: Date.now(), read: false })
  await writeJson(path, list.slice(0, 200))
}

/* ── ایندکس گفتگوهای هر کاربر ── */
export interface ConvIndexItem {
  convId: string
  otherKey: string
  otherName: string
  otherRole?: string
  lastText: string
  lastKind: string
  lastAt: number
  unread: number
}

export async function bumpConvIndex(
  userKey: string, other: { key: string; name: string; role?: string },
  lastText: string, lastKind: string, at: number, addUnread: boolean,
) {
  const path = P.dmIndex(userKey)
  const list = await readJson<ConvIndexItem[]>(path, [])
  const id = convId(userKey, other.key)
  const existing = list.find(c => c.convId === id)
  if (existing) {
    existing.otherName = other.name; existing.otherRole = other.role
    existing.lastText = lastText; existing.lastKind = lastKind; existing.lastAt = at
    if (addUnread) existing.unread += 1
  } else {
    list.push({ convId: id, otherKey: other.key, otherName: other.name, otherRole: other.role, lastText, lastKind, lastAt: at, unread: addUnread ? 1 : 0 })
  }
  list.sort((a, b) => b.lastAt - a.lastAt)
  await writeJson(path, list)
}

export async function clearConvUnread(userKey: string, cid: string) {
  const path = P.dmIndex(userKey)
  const list = await readJson<ConvIndexItem[]>(path, [])
  const it = list.find(c => c.convId === cid)
  if (it && it.unread) { it.unread = 0; await writeJson(path, list) }
}
