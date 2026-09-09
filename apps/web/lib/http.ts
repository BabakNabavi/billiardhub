'use client'

/* ─────────────────────────────────────────────────────────────
   فراخوان APIهای خودمان از سمت کلاینت.

   دو چیز را همیشه درست می‌کند:
     • کوکی نشست همراه درخواست می‌رود (credentials)
     • برای متدهای تغییردهنده، توکن CSRF از کوکی خواندنی برداشته و
       در هدر گذاشته می‌شود (الگوی double-submit)

   دیگر هیچ‌جای کلاینت نباید هدر Authorization بسازد؛ توکن اصلا در
   دسترس جاوااسکریپت نیست.
   ───────────────────────────────────────────────────────────── */

import { refreshSession } from './auth/refresh-client'
import { CSRF_COOKIE, CSRF_HEADER } from './auth/constants'

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]!) : null
}

export function csrfToken(): string | null {
  return readCookie(CSRF_COOKIE)
}

/** fetch با کوکی و توکن CSRF */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)

  if (!SAFE.has(method)) {
    const t = csrfToken()
    if (t) headers.set(CSRF_HEADER, t)
  }

  const send = () => fetch(input, { ...init, method, headers, credentials: 'include' })
  const r = await send()

  /* ── ۴۰۱ ⟵ یک‌بار تازه‌سازی و تلاش دوباره ──
     ⚠️ توکن دسترسی ۱۵ دقیقه عمر دارد. تا امروز هیچ‌جا روی ۴۰۱
     تازه‌سازی نمی‌شد، پس کاربری که بیست دقیقه در صفحه مانده بود
     ذخیره‌اش «انجام نشد» می‌گرفت — درحالی‌که فقط توکن کهنه بود و
     توکن تازه‌سازی هنوز معتبر. `SessionBridge` هم فقط در بارگذاری
     و بازگشت به تب کار می‌کند، نه سر درخواست.

     دقیقا یک تلاش دوباره: `send()` حداکثر دو بار صدا زده می‌شود و
     خود تازه‌سازی از این مسیر نمی‌گذرد، پس حلقه ممکن نیست. */
  if (r.status !== 401) return r

  /* مهمان اصلا نشستی ندارد که تازه شود. بدون این، هر پول دوره‌ای
     (پیام‌ها، نشان‌ها) سه درخواست می‌شود به‌جای یکی. کوکی CSRF فقط
     همراه نشست وجود دارد، پس نشانه‌ی خوبی است. */
  if (!csrfToken()) return r

  /* بدنه‌ی جریانی یک‌بارمصرف است؛ تلاش دوم روی آن استثنا می‌دهد و
     پاسخ ۴۰۱ را به یک promise ردشده تبدیل می‌کند. */
  if (typeof ReadableStream !== 'undefined' && init.body instanceof ReadableStream) return r

  const rf = await refreshSession()
  if (!rf.ok) return r

  /* در چرخش دوازده‌ساعته کوکی CSRF هم از نو صادر می‌شود (نه در هر
     تازه‌سازی)، پس هدر دوباره از کوکی خوانده می‌شود. */
  if (!SAFE.has(method)) {
    const t2 = csrfToken()
    if (t2) headers.set(CSRF_HEADER, t2)
  }
  return send()
}

/** میان‌بر برای JSON */
export async function apiJson<T = unknown>(
  input: string, init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const r = await apiFetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  let data: T | null = null
  try { data = await r.json() as T } catch { /* بدنه‌ی خالی */ }
  return { ok: r.ok, status: r.status, data }
}
