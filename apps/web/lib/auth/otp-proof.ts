import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { OTP_PROOF_COOKIE } from './constants'
import { normalizePhone } from './phone'

/* ─────────────────────────────────────────────────────────────
   «همین مرورگر کد را وارد کرد» — اثباتِ تأییدِ پیامکی.

   ⚠️ چرا لازم شد (آبانِ ۱۴۰۵): نشانِ تأیید (`wasOtpVerified`) فقط به
   *شماره* بند بود، نه به کسی که کد را وارد کرده. پس تا ۳۰ دقیقه پس از
   اینکه صاحبِ شماره کدش را وارد می‌کرد، هر کسِ دیگری که فقط شماره را
   می‌دانست می‌توانست:
     • با `/api/auth/forgot-password` و گامِ reset رمزِ آن حساب را عوض کند؛
     • با `/api/auth/register` روی شماره‌ای که مالِ او نیست حساب بسازد —
       که آن مسیر اصلاً تأیید را نمی‌سنجید و `phone_verified: true` می‌نوشت.

   حالا گامِ تأیید یک کوکیِ httpOnlyِ امضاشده می‌گذارد و گام‌های بعدی هم
   آن را می‌خواهند و هم نشانِ سرور را. کوکی کد یا رازی ندارد: فقط شماره،
   زمانِ انقضا و امضای HMAC با همان JWT_SECRET.
   ───────────────────────────────────────────────────────────── */

/* همان پنجره‌ی `VERIFIED_WINDOW` در lib/otp-server — بیشتر از آن بی‌معناست */
const PROOF_TTL_SEC = 30 * 60

const key = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set — OTP proof unavailable')
  return s
}

const sign = (phone: string, exp: number) =>
  createHmac('sha256', key()).update(`otp-proof|${phone}|${exp}`).digest('base64url')

/** پس از تأییدِ موفقِ کد صدا زده می‌شود */
export function issueOtpProof(res: NextResponse, rawPhone: unknown): void {
  const phone = normalizePhone(rawPhone)
  if (!phone) return
  const exp = Math.floor(Date.now() / 1000) + PROOF_TTL_SEC
  res.cookies.set(OTP_PROOF_COOKIE, `${phone}.${exp}.${sign(phone, exp)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    path: '/api', maxAge: PROOF_TTL_SEC,
  })
}

/** آیا همین درخواست اثباتِ تأییدِ همین شماره را دارد؟ */
export function hasOtpProof(req: NextRequest, rawPhone: unknown): boolean {
  const phone = normalizePhone(rawPhone)
  const raw = req.cookies.get(OTP_PROOF_COOKIE)?.value
  if (!phone || !raw) return false
  const [p, expStr, sig] = raw.split('.')
  const exp = Number(expStr)
  if (p !== phone || !sig || !Number.isFinite(exp) || exp * 1000 < Date.now()) return false
  try {
    const want = Buffer.from(sign(phone, exp))
    const got = Buffer.from(sig)
    return want.length === got.length && timingSafeEqual(want, got)
  } catch (e) {
    console.error('[otp-proof]', e)
    return false
  }
}

/** پس از مصرف (ساختِ حساب، تعیینِ رمز) — یک اثبات یک کار */
export function clearOtpProof(res: NextResponse): void {
  res.cookies.set(OTP_PROOF_COOKIE, '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    path: '/api', maxAge: 0,
  })
}
