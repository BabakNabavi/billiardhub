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

/* ── چرا سه حالت، نه دو ──
   `null` سه چیزِ متفاوت را یکی می‌کرد: «پروفایلی نیست»، «۴۰۱» و
   «شبکه قطع بود». پنل‌ها همه‌شان را «هنوز چیزی ثبت نشده» می‌خواندند
   و فیلدِ نشانی را باز می‌کردند. روی موبایلِ ایرانی که درخواست
   تایم‌اوت می‌شود، یعنی فروشنده‌ی موجود می‌توانست نشانیِ منتشرشده‌اش
   را عوض کند و `saveProfile` — که «یکی به‌ازای هر مالک» است — همان
   ردیفِ زنده را تغییرِ نام می‌داد.

   قفل باید در ابهام **بسته** بماند، نه باز. */
export type MyProfileResult<T> =
  | { state: 'found'; profile: RemoteProfile<T> }
  | { state: 'none' }
  | { state: 'error' }

export async function fetchMyProfileResult<T>(kind: ProfileKind): Promise<MyProfileResult<T>> {
  const r = await apiFetch(`/api/profiles/${kind}?mine=1`).catch(() => null)
  if (!r) return { state: 'error' }
  if (!r.ok) return { state: 'error' }
  const j = await json<{ profile: RemoteProfile<T> | null }>(r)
  if (!j) return { state: 'error' }
  return j.profile ? { state: 'found', profile: j.profile } : { state: 'none' }
}

/** پروفایل خود کاربر (نیازمند نشست).
 *  برای تصمیم‌های حساس `fetchMyProfileResult` را صدا بزن — این یکی
 *  «نبود» و «خطا» را از هم جدا نمی‌کند. */
export async function fetchMyProfile<T>(kind: ProfileKind): Promise<RemoteProfile<T> | null> {
  const r = await fetchMyProfileResult<T>(kind)
  return r.state === 'found' ? r.profile : null
}

/** یک پروفایل عمومی با نامک.
 *
 *  با `apiFetch` صدا زده می‌شود نه `fetch` خام: سرور پروفایلِ
 *  تأییدنشده را **به صاحبش و ادمین** نشان می‌دهد، و این تصمیم به
 *  نشست وابسته است. بدونِ فرستادنِ نشست، صاحبِ پروفایل هم مهمان
 *  دیده می‌شود و پیش‌نمایشِ کارِ خودش ۴۰۴ می‌گیرد. */
export async function fetchProfile<T>(kind: ProfileKind, slug: string): Promise<RemoteProfile<T> | null> {
  const r = await apiFetch(`/api/profiles/${kind}?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' }).catch(() => null)
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
