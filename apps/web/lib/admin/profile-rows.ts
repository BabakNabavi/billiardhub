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
  }))
}

/** انتشار ↔ تعلیق */
export async function toggleProfile(id: string, current: 'approved' | 'rejected'): Promise<void> {
  await apiFetch('/api/admin/profiles', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: current === 'approved' ? 'rejected' : 'approved' }),
  })
}

/* ── برای صفحه‌های ادمینی که ظاهر اختصاصی خودشان را دارند ──
   (مربیان و داوران) و به‌جای AdminRow، خود شیء پروفایل را می‌خواهند. */

/** فهرست خام پروفایل‌های یک نقش، با شکل همان نقش */
export async function fetchAdminProfiles<T>(kind: ProfileKind): Promise<T[]> {
  try {
    const r = await apiFetch(`/api/admin/profiles?kind=${kind}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null) as { profiles?: Record<string, ApiProfile[]> } | null
    const list = j?.profiles?.[kind] ?? []
    /* `slug` و `status` از ستون‌های خود ردیف می‌آیند، نه از data */
    return list.map(p => ({ ...(p.data ?? {}), slug: p.slug, status: p.status, id: p.id })) as T[]
  } catch { return [] }
}

/** تغییر وضعیت/تأیید یک پروفایل با نامک */
export async function patchAdminProfile(slug: string, patch: Record<string, unknown>): Promise<void> {
  try {
    /* PATCH با شناسه کار می‌کند، پس اول شناسه‌ی همین نامک را پیدا می‌کنیم */
    const r = await apiFetch('/api/admin/profiles', { cache: 'no-store' })
    if (!r.ok) return
    const j = await r.json().catch(() => null) as { profiles?: Record<string, ApiProfile[]> } | null
    const all = Object.values(j?.profiles ?? {}).flat()
    const hit = all.find(p => p.slug === slug)
    if (!hit) return

    const body: Record<string, unknown> = { id: hit.id }
    if (typeof patch.status === 'string') body.status = patch.status
    if (typeof patch.verified === 'boolean') body.verified = patch.verified
    if (!body.status && !('verified' in body)) return

    await apiFetch('/api/admin/profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch { /* بی‌صدا — کش محلی هم‌چنان به‌روز می‌شود */ }
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
  }
}
