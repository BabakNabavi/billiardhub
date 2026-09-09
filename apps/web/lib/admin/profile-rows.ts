'use client'

/* ─────────────────────────────────────────────────────────────
   منبع دادهٔ صفحه‌های نقش پنل ادمین — از دیتابیس، نه localStorage.

   شش صفحه‌ی «مربیان / داوران / بازیکنان / خدمات فنی / فروشندگان /
   تولیدکنندگان» تا امروز از `lib/*-store.ts` می‌خواندند که همه روی
   localStorage بودند. یعنی:
     • هر ادمین روی مرورگر خودش فهرست متفاوتی می‌دید
     • هیچ‌کدام از تأییدها روی سرور ثبت نمی‌شد
     • پروفایل‌هایی که کاربران واقعاً ساخته بودند اصلاً دیده نمی‌شدند

   دادهٔ واقعی از قبل در جدول `profiles` بود و `/api/admin/profiles`
   هم تأیید/رد را پیاده کرده بود؛ فقط این صفحه‌ها به آن وصل نبودند.
   ───────────────────────────────────────────────────────────── */

import { apiFetch } from '../http'
import type { AdminRow } from '../../app/admin/ProfileAdmin'

export type ProfileKind =
  | 'coach' | 'referee' | 'player' | 'technician' | 'seller' | 'manufacturer'

interface ApiProfile {
  id: string
  slug: string
  kind: ProfileKind
  status: 'approved' | 'pending' | 'rejected'
  verified?: boolean
  data?: Record<string, unknown> | null
}

/* مسیر صفحه‌ی عمومی هر نقش */
const HREF: Record<ProfileKind, (slug: string) => string> = {
  coach:        s => `/coaches/${s}`,
  referee:      s => `/referees/${s}`,
  player:       s => `/players/${s}`,
  technician:   s => `/services/${s}`,
  seller:       s => `/sellers/${s}`,
  manufacturer: s => `/manufacturers/${s}`,
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** خط دوم هر ردیف — از فیلدهای آزاد `data` ساخته می‌شود */
function subtitleOf(p: ApiProfile): string {
  const d = p.data ?? {}
  const parts = [
    str(d.discipline) || str(d.specialty) || str(d.category),
    str(d.city),
    str(d.ranking) && `رنکینگ ${str(d.ranking)}`,
  ].filter(Boolean)
  const base = parts.join(' · ') || '—'
  return p.status === 'pending' ? `${base} · در انتظار بررسی` : base
}

/** نام نمایشی */
function titleOf(p: ApiProfile): string {
  const d = p.data ?? {}
  return str(d.name) || str(d.title) || str(d.brand) || str(d.fullName) || p.slug || 'بدون نام'
}

/** خواندن فهرست یک نقش برای ProfileAdmin */
export async function loadProfileRows(kind: ProfileKind): Promise<AdminRow[]> {
  const r = await apiFetch(`/api/admin/profiles?kind=${kind}`, { cache: 'no-store' })
  if (!r.ok) return []
  const j = await r.json().catch(() => null) as { profiles?: Record<string, ApiProfile[]> } | null
  const list = j?.profiles?.[kind] ?? []

  return list.map(p => ({
    slug: p.id,                       // شناسه‌ی پایدار؛ برای PATCH لازم است
    title: titleOf(p),
    subtitle: subtitleOf(p),
    /* ProfileAdmin فقط دو حالت می‌شناسد؛ «در انتظار» هم معلق است */
    status: p.status === 'approved' ? 'approved' : 'rejected',
    href: HREF[kind](p.slug),
    /* برای پنجره‌ی جزئیات — تا ادمین پیش از تصمیم ببیند طرف کیست و
       چه ثبت کرده. `slug` این‌جا خودش شناسه است، ولی صریح بودنش
       بهتر از تکیه بر آن قرارداد است. */
    profileId: p.id,
    verified: p.verified === true,
  }))
}

/* ── چرا این‌ها نتیجه برمی‌گردانند ──
   ⚠️ هر سه تابع قبلاً `void` بودند و `patchAdminProfile` هر خطایی را
   با یک `catch {}` خالی می‌بلعید. ادمین دکمه‌ی «تیک آبی» را می‌زد،
   سرور ۴۰۳ می‌داد (کلیدِ دسترسیِ `verified` را نداشت) و صفحه *هیچ*
   نمی‌گفت — بدتر: کشِ محلی خوش‌بینانه به‌روز می‌شد و ردیف عوض‌شده
   به‌نظر می‌رسید تا اولین بازخوانی. «می‌زنم ولی کار نمی‌کند» دقیقاً
   همین بود. حالا شکست دیده می‌شود. */
export interface AdminActionResult { ok: boolean; message?: string }

async function patchProfile(body: Record<string, unknown>): Promise<AdminActionResult> {
  try {
    const r = await apiFetch('/api/admin/profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (r.ok) return { ok: true }
    const j = await r.json().catch(() => null) as { message?: string } | null
    return { ok: false, message: j?.message ?? `خطای سرور (${r.status})` }
  } catch {
    return { ok: false, message: 'ارتباط با سرور برقرار نشد' }
  }
}

/** اعطا یا پس‌گرفتنِ تیکِ آبی — جدا از انتشار */
export async function setProfileVerified(id: string, next: boolean): Promise<AdminActionResult> {
  return patchProfile({ id, verified: next })
}

/** انتشار ↔ تعلیق */
export async function toggleProfile(id: string, current: 'approved' | 'rejected'): Promise<AdminActionResult> {
  return patchProfile({ id, status: current === 'approved' ? 'rejected' : 'approved' })
}

/* ── برای صفحه‌های ادمینی که ظاهر اختصاصی خودشان را دارند ──
   (مربیان و داوران) و به‌جای AdminRow، خود شیء پروفایل را می‌خواهند. */

/** فهرست خام پروفایل‌های یک نقش، با شکل همان نقش */
/** فهرستِ خامِ یک نقش. `id` همیشه همراه است — کنش‌های ادمین به آن
 *  نیاز دارند و نامک برای شناساییِ ردیف کافی نیست. */
export async function fetchAdminProfiles<T extends object>(kind: ProfileKind): Promise<Array<T & { id: string }>> {
  try {
    const r = await apiFetch(`/api/admin/profiles?kind=${kind}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null) as { profiles?: Record<string, ApiProfile[]> } | null
    const list = j?.profiles?.[kind] ?? []
    /* `slug` و `status` از ستون‌های خود ردیف می‌آیند، نه از data */
    /* `verified` هم ستونِ ردیف است. بدونِ این، صفحه‌های ادمینِ
       مربی/داور/فروشگاه تیک را از داخلِ jsonb می‌خواندند — جایی که
       فرمِ خودِ کاربر می‌نویسد و ادمین نه. */
    return list.map(p => ({
      ...(p.data ?? {}), slug: p.slug, status: p.status, id: p.id,
      verified: p.verified === true,
      /* ⚠️ کستِ دومرحله‌ای لازم است و کوتاهی نیست: `p.data` یک
         `Record<string, unknown>` است و TS نمی‌تواند بداند شکلش با `T`
         می‌خواند. تکِ‌مرحله‌ای کامپایل نمی‌شود. مرزِ واقعیِ اعتماد
         سمتِ سرور است، نه این‌جا. */
    })) as unknown as Array<T & { id: string }>
  } catch { return [] }
}

/* ── تغییر وضعیت/تأیید یک پروفایل ──

   ⚠️ **این تابع با نامک کار می‌کرد و غلط بود.** ایندکسِ دیتابیس
   `UNIQUE (kind, slug)` است (مهاجرتِ ۰۰۸) — یعنی نامک فقط *داخلِ
   هر نقش* یکتاست، نه در کلِ جدول. نسخه‌ی قبلی فهرستِ **همه‌ی
   نقش‌ها** را می‌گرفت و اولین ردیفی را که نامکش می‌خورد برمی‌داشت،
   و ترتیبِ `PROFILE_KINDS` هم `coach` را پیش از `referee`
   می‌گذارد.

   نتیجه‌ی عملی: کسی که هم مربی است هم داور و هر دو پروفایلش یک
   نامک دارد، وقتی ادمین در صفحه‌ی داوران «تأیید» را می‌زد، ردیفِ
   **مربی** به‌روز می‌شد. ردیفِ داور برای همیشه «در انتظار»
   می‌ماند و ادمین می‌دید که دکمه هیچ کاری نمی‌کند — دقیقاً همان
   گزارشی که رسید.

   حالا شناسه‌ی ردیف مستقیم می‌آید. یک درخواستِ کمتر هم هست: آن
   GETِ واسط اصلاً لازم نبود. */
/** ⚠️ شیء می‌گیرد نه دو رشته: `id` و `slug` هر دو `string`اند و
 *  جابه‌جا نوشتنشان بی‌صدا کامپایل می‌شود و همان باگِ ردیفِ اشتباه
 *  را برمی‌گرداند. */
export async function patchAdminProfile(
  row: { id: string }, patch: Record<string, unknown>,
): Promise<AdminActionResult> {
  const id = row?.id
  if (!id) return { ok: false, message: 'شناسه‌ی پروفایل در دست نیست' }

  const body: Record<string, unknown> = { id }
  if (typeof patch.status === 'string') body.status = patch.status
  if (typeof patch.verified === 'boolean') body.verified = patch.verified
  if (!('status' in body) && !('verified' in body)) return { ok: false, message: 'چیزی برای تغییر نبود' }

  return patchProfile(body)
}

/* ساختن سه تابع مورد نیاز ProfileAdmin برای یک نقش.

   نکته: ProfileAdmin در `toggle` فقط slug را می‌دهد و وضعیت فعلی را
   نمی‌فرستد، پس وضعیت را از همان فهرستی که تازه خوانده‌ایم برمی‌داریم. */
export function profileAdminSource(kind: ProfileKind) {
  let cache: AdminRow[] = []
  return {
    load: async () => { cache = await loadProfileRows(kind); return cache },
    toggle: async (id: string) => {
      const row = cache.find(r => r.slug === id)
      await toggleProfile(id, row?.status ?? 'rejected')
    },
    /* حذف پروفایل از پنل عمداً پیاده نشده: پاک‌کردن کار کاربر
       برگشت‌ناپذیر است و «تعلیق» همان اثر نمایشی را دارد. */
    remove: async (id: string) => {
      const row = cache.find(r => r.slug === id)
      if (row?.status === 'approved') await toggleProfile(id, 'approved')
    },
    setVerified: setProfileVerified,
  }
}
