/* ─────────────────────────────────────────────────────────────
   پروفایل‌های نقش‌ها روی سرور (جدول profiles).

   بدنه‌ی پروفایل jsonb است تا فرم‌های موجود همان شکل داده‌ی خودشان
   را بفرستند. تنها کار اضافه‌ی این لایه، بیرون‌کشیدن عکس‌هاست:
   فرم‌ها عکس را به‌صورت data:URL می‌سازند و اگر همان را در jsonb
   بگذاریم، هر پروفایل چند مگابایت می‌شود. این‌جا هر data:URL یک‌بار
   به Storage آپلود و با نشانی عمومی‌اش جایگزین می‌شود.
   ───────────────────────────────────────────────────────────── */

import { getSupabaseServer } from '../supabase-server'

export type ProfileKind = 'seller' | 'manufacturer' | 'coach' | 'referee' | 'technician' | 'player'
export const PROFILE_KINDS: ProfileKind[] = ['seller', 'manufacturer', 'coach', 'referee', 'technician', 'player']

const BUCKET = 'club-media'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export interface ProfileRow {
  id: string
  kind: ProfileKind
  slug: string
  ownerId: string
  data: Record<string, unknown>
  status: 'approved' | 'pending' | 'rejected'
  verified: boolean
  licenseNumber: string | null
  licenseUrl: string | null
  licenseVerified: boolean
  licenseNote: string | null
  createdAt: string
  updatedAt: string
}

/* ستون‌های دیتابیس snake_case‌اند؛ بقیه‌ی برنامه camelCase */
type DbRow = {
  id: string; kind: ProfileKind; slug: string; owner_id: string
  data: Record<string, unknown> | null
  status: ProfileRow['status']; verified: boolean
  license_number: string | null; license_url: string | null
  license_verified: boolean; license_note: string | null
  created_at: string; updated_at: string
}

export function toProfile(r: DbRow): ProfileRow {
  return {
    id: r.id, kind: r.kind, slug: r.slug, ownerId: r.owner_id,
    data: r.data ?? {},
    status: r.status, verified: r.verified,
    licenseNumber: r.license_number, licenseUrl: r.license_url,
    licenseVerified: r.license_verified, licenseNote: r.license_note,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

/* ── آپلود عکس‌های data:URL ─────────────────────────────────── */

const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
}

let uploadSeq = 0

/* امضای بایتی قالب‌های مجاز. اعلام نوع در خود data:URL حرف کاربر است
   و قابل جعل؛ این‌جا خود بایت‌ها سنجیده می‌شوند. */
function sniff(b: Buffer): string | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (b.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif'
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  /* AVIF/HEIF: جعبه‌ی ftyp با برند avif */
  if (b.subarray(4, 8).toString('latin1') === 'ftyp' && b.subarray(8, 12).toString('latin1').startsWith('avi')) return 'image/avif'
  return null
}

async function uploadDataUrl(value: string, prefix: string): Promise<string> {
  const m = DATA_URL.exec(value)
  if (!m) return value
  const bytes = Buffer.from(m[2]!, 'base64')
  if (bytes.byteLength > MAX_IMAGE_BYTES) return ''   // عکس بیش‌ازحد بزرگ کنار گذاشته می‌شود

  /* نوع واقعی از روی بایت‌ها، نه از روی برچسب data:URL.
     الگوی قبلی هر image/* را می‌پذیرفت — از جمله image/svg+xml — و آن را
     با همان contentType در باکت عمومی می‌گذاشت؛ یعنی هر کسی می‌توانست
     یک SVG حاوی اسکریپت را به‌عنوان «عکس پروفایل» بالا بدهد. */
  const mime = sniff(bytes)
  if (!mime || !EXT[mime]) return ''

  const path = `${prefix}/${Date.now()}-${uploadSeq++}.${EXT[mime]}`
  const { error } = await getSupabaseServer().storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false, cacheControl: '31536000' })
  if (error) return ''

  const { data } = getSupabaseServer().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** هر data:URL درون داده را (در هر عمقی) به Storage منتقل می‌کند */
export async function offloadImages(value: unknown, prefix: string): Promise<unknown> {
  if (typeof value === 'string') {
    return value.startsWith('data:image/') ? await uploadDataUrl(value, prefix) : value
  }
  if (Array.isArray(value)) {
    const out: unknown[] = []
    for (const item of value) {
      const v = await offloadImages(item, prefix)
      /* آپلود ناموفق ⇒ رشته‌ی خالی؛ در آرایه‌ی عکس‌ها جایی ندارد */
      if (v !== '') out.push(v)
    }
    return out
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await offloadImages(v, prefix)
    }
    return out
  }
  return value
}

/* ── خواندن ──────────────────────────────────────────────────── */

const sb = () => getSupabaseServer()

/** جدول هنوز ساخته نشده ⇒ رفتار مثل «چیزی نیست»، نه خطا */
const missing = (msg?: string) => /does not exist|schema cache/i.test(msg ?? '')

export async function getProfileBySlug(kind: ProfileKind, slug: string): Promise<ProfileRow | null> {
  const { data, error } = await sb().from('profiles').select('*').eq('kind', kind).eq('slug', slug).maybeSingle()
  if (error || !data) return null
  return toProfile(data as DbRow)
}

export async function getProfileByOwner(kind: ProfileKind, ownerId: string): Promise<ProfileRow | null> {
  const { data, error } = await sb().from('profiles').select('*').eq('kind', kind).eq('owner_id', ownerId).maybeSingle()
  if (error || !data) return null
  return toProfile(data as DbRow)
}

export async function listProfiles(kind: ProfileKind, opts: { status?: string; limit?: number } = {}): Promise<ProfileRow[]> {
  let q = sb().from('profiles').select('*').eq('kind', kind)
    .order('updated_at', { ascending: false }).limit(Math.min(500, opts.limit ?? 200))
  if (opts.status) q = q.eq('status', opts.status)
  const { data, error } = await q
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbRow[] ?? []).map(toProfile)
}

/* ── نوشتن ───────────────────────────────────────────────────── */

export interface SaveInput {
  kind: ProfileKind
  ownerId: string
  slug: string
  data: Record<string, unknown>
  licenseNumber?: string | null
  licenseUrl?: string | null
  /** ادمین می‌تواند وضعیت را عوض کند؛ صاحب پروفایل نه */
  status?: ProfileRow['status']
}

export async function saveProfile(input: SaveInput): Promise<ProfileRow> {
  const existing = await getProfileByOwner(input.kind, input.ownerId)

  /* نامک تغییر نمی‌کند — نشانی عمومی که یک‌بار منتشر شد باید بماند */
  const slug = existing?.slug ?? input.slug

  const clean = await offloadImages(input.data, `profiles/${input.kind}/${input.ownerId}`) as Record<string, unknown>

  const row: Record<string, unknown> = {
    kind: input.kind,
    slug,
    owner_id: input.ownerId,
    data: clean,
    updated_at: new Date().toISOString(),
  }
  if (input.licenseNumber !== undefined) row.license_number = input.licenseNumber
  if (input.licenseUrl !== undefined) row.license_url = input.licenseUrl
  if (input.status !== undefined) row.status = input.status

  if (existing) {
    const { data, error } = await sb().from('profiles').update(row).eq('id', existing.id).select().single()
    if (error) throw new Error(error.message)
    return toProfile(data as DbRow)
  }

  /* ── پروفایلِ تازه در انتظارِ بررسی است، نه منتشرشده ──
     ستونِ `status` در مهاجرت ۰۰۸ پیش‌فرضِ `'approved'` دارد، پس هر
     پروفایلِ تازه بی‌درنگ روی سایتِ عمومی می‌نشست. یعنی هر کسی که
     ثبت‌نام می‌کرد می‌توانست خودش را «مربی» یا «فروشنده» اعلام کند و
     همان لحظه منتشر شود؛ صفِ تأییدِ ادمین عملاً تشریفاتی بود.

     این‌جا صریحاً `pending` گذاشته می‌شود تا پیش‌فرضِ دیتابیس بی‌اثر
     شود — بدونِ نیاز به مهاجرت. اگر ادمین خودش وضعیتی داده باشد
     (`input.status`) همان محترم است.

     ⚠️ فقط در *ساخت*. در ویرایش دست نمی‌خورد، وگرنه هر بار که مربیِ
     تأییدشده متنش را عوض می‌کرد از سایت غیب می‌شد. */
  if (row.status === undefined) row.status = 'pending'

  const { data, error } = await sb().from('profiles').insert(row).select().single()
  if (error) throw new Error(error.message)
  return toProfile(data as DbRow)
}

/** تصمیم ادمین — تأیید، رد، تیک آبی و تأیید جواز */
export async function reviewProfile(id: string, patch: {
  status?: ProfileRow['status']
  verified?: boolean
  licenseVerified?: boolean
  licenseNote?: string
}): Promise<ProfileRow | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status !== undefined) row.status = patch.status
  if (patch.verified !== undefined) row.verified = patch.verified
  if (patch.licenseVerified !== undefined) row.license_verified = patch.licenseVerified
  if (patch.licenseNote !== undefined) row.license_note = patch.licenseNote

  const { data, error } = await sb().from('profiles').update(row).eq('id', id).select().single()
  if (error || !data) return null
  return toProfile(data as DbRow)
}

/* ═══════════════════════════════════════════════════════════════
   محتوای نمایشیِ ادمین

   ── چرا مسیرِ جدا ──
   `saveProfile` عمداً «یکی به‌ازای هر مالک» است: اول با
   `getProfileByOwner` می‌گردد و اگر چیزی بود همان را به‌روز می‌کند.
   این برای کاربرِ واقعی درست است — یک شخص یک مربی است — ولی یعنی
   ادمین هم از حسابِ خودش بیش از یکی نمی‌تواند بسازد.

   این تابع هرگز جست‌وجو نمی‌کند و همیشه ردیفِ تازه می‌سازد. ایندکسِ
   یکتایی هم در مهاجرت ۰۴۶ جزئی شد (`WHERE is_demo = false`)، پس
   کاربرِ عادی همچنان یکی می‌ماند و این ردیف‌ها آزادند.

   ── دو چیز که این‌جا قابلِ‌مذاکره نیست ──
   ۱) `verified` همیشه false. تیکِ آبی یعنی هویت استعلام شده؛ روی
      موجودیتی که وجودِ خارجی ندارد این ادعا دروغ است.
   ۲) `is_demo` همیشه true. بدونِ آن، این ردیف‌ها بعداً از داده‌ی
      واقعی قابلِ تفکیک نیستند و پاک‌کردنشان به حدس‌زدن می‌افتد.
   ═══════════════════════════════════════════════════════════════ */

export interface DemoInput {
  kind: ProfileKind
  ownerId: string
  slug: string
  data: Record<string, unknown>
}

export async function createDemoProfile(input: DemoInput): Promise<ProfileRow> {
  const clean = await offloadImages(input.data, `profiles/demo/${input.kind}`) as Record<string, unknown>

  const { data, error } = await sb().from('profiles').insert({
    kind: input.kind,
    slug: input.slug,
    owner_id: input.ownerId,
    data: clean,
    /* منتشرشده — کارِ این ردیف‌ها دقیقاً دیده‌شدن است */
    status: 'approved',
    verified: false,
    is_demo: true,
    updated_at: new Date().toISOString(),
  }).select().single()

  if (error) throw new Error(error.message)
  return toProfile(data as DbRow)
}

export async function listDemoProfiles(kind?: ProfileKind): Promise<ProfileRow[]> {
  let q = sb().from('profiles').select('*').eq('is_demo', true)
  if (kind) q = q.eq('kind', kind)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) return []
  return (data as DbRow[]).map(toProfile)
}

/** حذفِ یک ردیفِ نمایشی. شرطِ `is_demo` عمدی است: حتی اگر شناسه‌ی
    اشتباهی بیاید، پروفایلِ یک کاربرِ واقعی از این مسیر پاک نمی‌شود. */
export async function deleteDemoProfile(id: string): Promise<boolean> {
  const { error, count } = await sb().from('profiles')
    .delete({ count: 'exact' }).eq('id', id).eq('is_demo', true)
  return !error && (count ?? 0) > 0
}
