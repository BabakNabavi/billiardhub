'use client'

/* ─────────────────────────────────────────────────────────────
   پل پروفایل‌ها به سرور.

   فرم‌های موجود (پنل فروشگاه، تولیدکننده و…) همان شکل داده‌ی
   قبلی خودشان را می‌دهند؛ این‌جا فقط به سرور می‌رود و برمی‌گردد.
   localStorage به‌عنوان کش آفلاین می‌ماند تا اگر شبکه قطع بود
   صفحه خالی نشود، ولی منبع حقیقت دیگر سرور است.
   ───────────────────────────────────────────────────────────── */

import { apiFetch } from '../http'

export type ProfileKind = 'seller' | 'manufacturer' | 'coach' | 'referee' | 'technician' | 'player'

export interface RemoteProfile<T = Record<string, unknown>> {
  id: string
  kind: ProfileKind
  slug: string
  ownerId: string
  data: T
  status: 'approved' | 'pending' | 'rejected'
  verified: boolean
  licenseNumber: string | null
  licenseUrl: string | null
  licenseVerified: boolean
  licenseNote: string | null
  updatedAt: string
}

async function json<T>(r: Response): Promise<T | null> {
  if (!r.ok) return null
  try { return await r.json() as T } catch { return null }
}

/** پروفایل خود کاربر (نیازمند نشست) */
export async function fetchMyProfile<T>(kind: ProfileKind): Promise<RemoteProfile<T> | null> {
  const r = await apiFetch(`/api/profiles/${kind}?mine=1`).catch(() => null)
  if (!r) return null
  const j = await json<{ profile: RemoteProfile<T> | null }>(r)
  return j?.profile ?? null
}

/** یک پروفایل عمومی با نامک */
export async function fetchProfile<T>(kind: ProfileKind, slug: string): Promise<RemoteProfile<T> | null> {
  const r = await fetch(`/api/profiles/${kind}?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' }).catch(() => null)
  if (!r) return null
  const j = await json<{ profile: RemoteProfile<T> | null }>(r)
  return j?.profile ?? null
}

/** همه‌ی پروفایل‌های تأییدشده‌ی یک نوع */
export async function fetchProfiles<T>(kind: ProfileKind): Promise<RemoteProfile<T>[]> {
  const r = await fetch(`/api/profiles/${kind}`, { cache: 'no-store' }).catch(() => null)
  if (!r) return []
  const j = await json<{ profiles: RemoteProfile<T>[] }>(r)
  return j?.profiles ?? []
}

export interface SaveResult<T> { ok: boolean; profile: RemoteProfile<T> | null; message?: string }

/** ذخیره‌ی پروفایل خود کاربر */
export async function saveProfileRemote<T extends Record<string, unknown>>(
  kind: ProfileKind,
  slug: string,
  data: T,
  license?: { number?: string; url?: string },
): Promise<SaveResult<T>> {
  try {
    const r = await apiFetch(`/api/profiles/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug, data,
        ...(license?.number !== undefined ? { licenseNumber: license.number } : {}),
        ...(license?.url !== undefined ? { licenseUrl: license.url } : {}),
      }),
    })
    const j = await r.json().catch(() => ({})) as { profile?: RemoteProfile<T>; message?: string }
    if (!r.ok) return { ok: false, profile: null, message: j?.message || 'ذخیره روی سرور انجام نشد' }

    /* ── «ثبتِ نهایی» ──
       ذخیره‌ی پروفایل همان لحظه‌ای است که کاربر کارش را تمام کرده، پس
       همین‌جا درخواستِ نقشش هم از `draft` به `pending` می‌رود و روی
       میزِ ادمین می‌نشیند.

       این‌جا انجام می‌شود نه در شش صفحه‌ی داشبورد، چون تنها نقطه‌ی
       مشترکِ ذخیره‌ی پروفایل همین است؛ تکرارش در هر صفحه یعنی روزی
       یکی جا می‌ماند و نقشِ آن کاربر هرگز به ادمین نمی‌رسد.

       بی‌صداست: اگر کاربر آن نقش را انتخاب نکرده باشد (۴۰۴) یا شبکه
       قطع باشد، ذخیره‌ی پروفایل نباید شکست بخورد. */
    void apiFetch('/api/roles/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: kind, docUrl: license?.url }),
    }).catch(() => { })

    return { ok: true, profile: j.profile ?? null }
  } catch {
    return { ok: false, profile: null, message: 'خطا در ارتباط با سرور' }
  }
}
