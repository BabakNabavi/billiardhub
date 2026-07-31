'use client'

/* ─────────────────────────────────────────────────────────────
   فراخوان APIهای خودمان از سمت کلاینت.

   دو چیز را همیشه درست می‌کند:
     • کوکی نشست همراه درخواست می‌رود (credentials)
     • برای متدهای تغییردهنده، توکن CSRF از کوکی خواندنی برداشته و
       در هدر گذاشته می‌شود (الگوی double-submit)

   دیگر هیچ‌جای کلاینت نباید هدر Authorization بسازد؛ توکن اصلاً در
   دسترس جاوااسکریپت نیست.
   ───────────────────────────────────────────────────────────── */

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

  return fetch(input, { ...init, method, headers, credentials: 'include' })
}

/** میان‌بُر برای JSON */
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
