/* ─────────────────────────────────────────────────────────────
   هسته‌ی سمت‌سرورِ شبکه‌ی اجتماعی (استوری/دایرکت/نوتیفیکیشن).
   داده در Supabase Storage به‌صورت فایل‌های JSON نگه‌داری می‌شود
   (همان الگوی اثبات‌شده‌ی استوریِ باشگاه‌ها). همه‌ی دسترسی‌ها فقط
   از طریق API با service-role انجام می‌شود.
   ───────────────────────────────────────────────────────────── */

import { getSupabaseServer } from './supabase-server'

export const BUCKET = 'club-media'
export const DAY = 24 * 60 * 60 * 1000

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/* کلیدها ممکن است شماره/آیدی باشند؛ برای مسیرِ فایل ایمن‌سازی می‌شوند. */
export const safeKey = (k: string) => (k || 'x').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)
export const convId = (a: string, b: string) => [safeKey(a), safeKey(b)].sort().join('__')

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await getSupabaseServer().storage.from(BUCKET).download(path)
    if (error || !data) return fallback
    return JSON.parse(await data.text()) as T
  } catch { return fallback }
}

export async function writeJson(path: string, obj: unknown): Promise<void> {
  const buf = Buffer.from(JSON.stringify(obj), 'utf8')
  await getSupabaseServer().storage.from(BUCKET).upload(path, buf, {
    upsert: true, contentType: 'application/json',
  })
}

/* ── مسیرها ── */
export const P = {
  stories: 'social/stories/index.json',
  conv:    (id: string) => `social/dm/${id}.json`,
  dmIndex: (user: string) => `social/dm-idx/${safeKey(user)}.json`,
  notif:   (user: string) => `social/notif/${safeKey(user)}.json`,
  poll:    (user: string) => `social/dm-poll/${safeKey(user)}.json`,
}

/* «آخرین فعالیتِ» هر کاربر — برای تیکِ «رسیده» (وقتی طرفِ مقابل لیست/ترد را گرفت). */
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

/* ── ایندکسِ گفتگوهای هر کاربر ── */
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
