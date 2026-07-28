/* ─────────────────────────────────────────────────────────────
   پروفایل‌های نقش‌ها روی سرور (جدولِ profiles).

   بدنه‌ی پروفایل jsonb است تا فرم‌های موجود همان شکلِ داده‌ی خودشان
   را بفرستند. تنها کارِ اضافه‌ی این لایه، بیرون‌کشیدنِ عکس‌هاست:
   فرم‌ها عکس را به‌صورت data:URL می‌سازند و اگر همان را در jsonb
   بگذاریم، هر پروفایل چند مگابایت می‌شود. این‌جا هر data:URL یک‌بار
   به Storage آپلود و با نشانیِ عمومی‌اش جایگزین می‌شود.
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

/* ── آپلودِ عکس‌های data:URL ─────────────────────────────────── */

const DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
}

let uploadSeq = 0

async function uploadDataUrl(value: string, prefix: string): Promise<string> {
  const m = DATA_URL.exec(value)
  if (!m) return value
  const mime = m[1]!.toLowerCase()
  const bytes = Buffer.from(m[2]!, 'base64')
  if (bytes.byteLength > MAX_IMAGE_BYTES) return ''   // عکسِ بیش‌ازحد بزرگ کنار گذاشته می‌شود

  const path = `${prefix}/${Date.now()}-${uploadSeq++}.${EXT[mime] ?? 'jpg'}`
  const { error } = await getSupabaseServer().storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false })
  if (error) return ''

  const { data } = getSupabaseServer().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** هر data:URL درونِ داده را (در هر عمقی) به Storage منتقل می‌کند */
export async function offloadImages(value: unknown, prefix: string): Promise<unknown> {
  if (typeof value === 'string') {
    return value.startsWith('data:image/') ? await uploadDataUrl(value, prefix) : value
  }
  if (Array.isArray(value)) {
    const out: unknown[] = []
    for (const item of value) {
      const v = await offloadImages(item, prefix)
      /* آپلودِ ناموفق ⇒ رشته‌ی خالی؛ در آرایه‌ی عکس‌ها جایی ندارد */
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
  /** ادمین می‌تواند وضعیت را عوض کند؛ صاحبِ پروفایل نه */
  status?: ProfileRow['status']
}

export async function saveProfile(input: SaveInput): Promise<ProfileRow> {
  const existing = await getProfileByOwner(input.kind, input.ownerId)

  /* نامک تغییر نمی‌کند — نشانیِ عمومی که یک‌بار منتشر شد باید بماند */
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

  const { data, error } = await sb().from('profiles').insert(row).select().single()
  if (error) throw new Error(error.message)
  return toProfile(data as DbRow)
}

/** تصمیمِ ادمین — تأیید، رد، تیکِ آبی و تأییدِ جواز */
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
