/* ─────────────────────────────────────────────────────────────
   نشست‌ها در دیتابیس + ست/پاک‌کردنِ کوکی‌ها.
   فقط سمتِ سرور. هیچ‌کدام از این‌ها نباید در کامپوننتِ کلاینت import شود.
   ───────────────────────────────────────────────────────────── */

import { createHmac, timingSafeEqual } from 'crypto'
import type { NextResponse } from 'next/server'
import { getSupabaseServer } from '../supabase-server'
import {
  ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE,
  ACCESS_TTL_SEC, REFRESH_TTL_SEC,
  signAccessToken, signRefreshToken,
} from './session'

const sb = () => getSupabaseServer()

/* رفرش‌توکن خودش در دیتابیس ذخیره نمی‌شود؛ فقط هشِ HMACش. اگر روزی
   دیتابیس لو برود، از روی این هش نمی‌توان توکنِ معتبر ساخت. */
export function hashToken(token: string): string {
  return createHmac('sha256', process.env.JWT_SECRET!).update(token).digest('hex')
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8'), y = Buffer.from(b, 'utf8')
  return x.length === y.length && timingSafeEqual(x, y)
}

export interface SessionRow {
  id: string
  user_id: string
  refresh_hash: string | null
  expires_at: string
  revoked_at: string | null
}

/* ── چرخه‌ی عمرِ نشست ──────────────────────────────────────────── */

/** نشستِ تازه. اگر جدول هنوز نباشد، null برمی‌گردد و فراخوان تصمیم می‌گیرد. */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null; origin?: 'login' | 'register' | 'adopt' },
): Promise<string | null> {
  const expires = new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString()
  const { data, error } = await sb().from('sessions').insert({
    user_id: userId,
    expires_at: expires,
    user_agent: (meta.userAgent ?? '').slice(0, 300) || null,
    ip: meta.ip ?? null,
    origin: meta.origin ?? 'login',
  }).select('id').single()

  if (error) { console.error('createSession failed:', error.message); return null }
  return String((data as { id: string }).id)
}

/** ثبتِ هشِ رفرش‌توکنِ فعلی روی نشست */
export async function setSessionRefresh(sid: string, refreshToken: string): Promise<void> {
  await sb().from('sessions')
    .update({ refresh_hash: hashToken(refreshToken), last_used_at: new Date().toISOString() })
    .eq('id', sid)
}

export async function revokeSession(sid: string, reason: string): Promise<void> {
  await sb().from('sessions')
    .update({ revoked_at: new Date().toISOString(), revoked_reason: reason })
    .eq('id', sid).is('revoked_at', null)
}

export async function revokeAllSessions(userId: string, reason: string): Promise<void> {
  await sb().from('sessions')
    .update({ revoked_at: new Date().toISOString(), revoked_reason: reason })
    .eq('user_id', userId).is('revoked_at', null)
}

export type RefreshCheck =
  | { ok: true; row: SessionRow }
  | { ok: false; reason: 'missing' | 'revoked' | 'expired' | 'reused' | 'unavailable' }

/** اعتبارسنجیِ رفرش‌توکن در برابرِ نشستِ ذخیره‌شده (با تشخیصِ استفاده‌ی مجدد) */
export async function checkRefresh(sid: string, presented: string): Promise<RefreshCheck> {
  const { data, error } = await sb().from('sessions')
    .select('id,user_id,refresh_hash,expires_at,revoked_at').eq('id', sid).maybeSingle()

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return { ok: false, reason: 'unavailable' }
    return { ok: false, reason: 'unavailable' }
  }
  const row = data as SessionRow | null
  if (!row) return { ok: false, reason: 'missing' }
  if (row.revoked_at) return { ok: false, reason: 'revoked' }
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' }

  /* توکنی که با هشِ فعلی نمی‌خواند یعنی نسخه‌ی قدیمیِ چرخیده ⇒ سرقت */
  if (!row.refresh_hash || !sameHash(row.refresh_hash, hashToken(presented))) {
    await revokeSession(sid, 'refresh token reuse detected')
    return { ok: false, reason: 'reused' }
  }
  return { ok: true, row }
}

/* ── کوکی‌ها ──────────────────────────────────────────────────── */

/* Secure فقط در production: روی http://localhost کوکیِ Secure اصلاً
   ست نمی‌شود و توسعه از کار می‌افتد. بقیه‌ی صفات یکسان می‌مانند تا
   رفتارِ dev و prod از هم دور نشود. */
const isProd = () => process.env.NODE_ENV === 'production'

/** یک رشته‌ی تصادفی برای توکنِ CSRF (مرحله‌ی ج اعمالش می‌کند) */
export function newCsrfToken(): string {
  return createHmac('sha256', process.env.JWT_SECRET!)
    .update(`${Date.now()}:${Math.random()}`).digest('hex').slice(0, 32)
}

/** ست‌کردنِ کوکی‌های نشست روی پاسخ */
export function setSessionCookies(
  res: NextResponse,
  tokens: { access: string; refresh: string; csrf?: string },
): NextResponse {
  const secure = isProd()

  res.cookies.set(ACCESS_COOKIE, tokens.access, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: ACCESS_TTL_SEC,
  })
  /* رفرش فقط به مسیرهای auth فرستاده می‌شود، نه به هر درخواستی */
  res.cookies.set(REFRESH_COOKIE, tokens.refresh, {
    httpOnly: true, secure, sameSite: 'lax', path: '/api/auth', maxAge: REFRESH_TTL_SEC,
  })
  /* CSRF عمداً httpOnly نیست: کلاینت باید بتواند بخواند و در هدر بگذارد */
  res.cookies.set(CSRF_COOKIE, tokens.csrf ?? newCsrfToken(), {
    httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge: REFRESH_TTL_SEC,
  })
  return res
}

/** پاک‌کردنِ کوکی‌ها — Path باید دقیقاً همانی باشد که موقعِ ست استفاده شد */
export function clearSessionCookies(res: NextResponse): NextResponse {
  const secure = isProd()
  const kill = (name: string, path: string) =>
    res.cookies.set(name, '', { httpOnly: name !== CSRF_COOKIE, secure, sameSite: 'lax', path, maxAge: 0 })

  kill(ACCESS_COOKIE, '/')
  kill(REFRESH_COOKIE, '/api/auth')
  kill(CSRF_COOKIE, '/')
  return res
}

/** ساخت نشست + توکن‌ها + ست‌کردنِ کوکی‌ها — مسیرِ مشترکِ login/register/adopt */
export async function issueSession(
  res: NextResponse,
  user: { id: string; role: string; phone?: string },
  meta: { userAgent?: string | null; ip?: string | null; origin?: 'login' | 'register' | 'adopt' },
): Promise<{ sid: string | null; access: string }> {
  const sid = await createSession(user.id, meta)

  /* اگر ساختِ نشست ممکن نشد (مثلاً مایگریشن اجرا نشده) باز هم کوکیِ
     access داده می‌شود تا کاربر بیرون نیفتد؛ فقط رفرش نخواهد داشت. */
  const access = signAccessToken({ id: user.id, role: user.role, phone: user.phone, sid: sid ?? undefined })
  if (!sid) {
    res.cookies.set(ACCESS_COOKIE, access, {
      httpOnly: true, secure: isProd(), sameSite: 'lax', path: '/', maxAge: ACCESS_TTL_SEC,
    })
    return { sid: null, access }
  }

  const refresh = signRefreshToken({ id: user.id, sid })
  await setSessionRefresh(sid, refresh)
  setSessionCookies(res, { access, refresh })
  return { sid, access }
}
