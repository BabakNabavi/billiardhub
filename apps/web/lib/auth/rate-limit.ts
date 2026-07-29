/* ─────────────────────────────────────────────────────────────
   محدودیتِ نرخ — سرورساید و مشترک بینِ نمونه‌ها (فاز ۷A).

   چرا دیتابیس و نه حافظه: روی Vercel هر درخواست ممکن است روی نمونه‌ی
   تازه‌ای بنشیند، پس شمارنده‌ی درون‌حافظه‌ای عملاً هیچ چیزی را محدود
   نمی‌کند — مهاجم فقط کافی است چند بار تلاش کند تا به نمونه‌ی خالی
   بخورد. جدولِ مشترک این را می‌بندد و به وابستگیِ تازه (Redis) هم
   نیاز ندارد.

   کلیدِ شمارش عمداً ترکیبی است: هم IP و هم شناسه‌ی هدف (شماره/ایمیل).
   با IPِ تنها، NAT یک اپراتور همه را قفل می‌کرد؛ با هدفِ تنها،
   چرخاندنِ شماره محدودیت را دور می‌زد.
   ───────────────────────────────────────────────────────────── */

import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '../supabase-server'

const sb = () => getSupabaseServer()

export interface RateRule {
  /** نامِ منطقیِ عملیات — در کلید می‌آید تا سطل‌ها قاطی نشوند */
  action: string
  /** سقفِ تلاش در پنجره */
  max: number
  /** طولِ پنجره به ثانیه */
  windowSec: number
}

/** IPِ واقعیِ کاربر پشتِ پراکسیِ Vercel */
export function ipOf(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') || ''
  /* اولین مقدار = نزدیک‌ترین کلاینت به لبه؛ بقیه را خودِ Vercel اضافه
     می‌کند. هدرِ ارسالیِ کاربر جایگزینِ این نمی‌شود چون Vercel آن را
     بازنویسی می‌کند. */
  const first = fwd.split(',')[0]?.trim()
  return first || req.headers.get('x-real-ip') || 'unknown'
}

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * یک تلاش را می‌شمارد و می‌گوید مجاز است یا نه.
 *
 * fail-open عمدی: اگر خودِ جدول در دسترس نباشد، درخواست را رد نمی‌کنیم
 * — قفل‌کردنِ ورودِ همه‌ی کاربران به‌خاطر خطای زیرساخت بدتر از نبودِ
 * محدودیت است. خطا لاگ می‌شود تا خاموش نماند.
 */
export async function hitRateLimit(
  req: NextRequest,
  rule: RateRule,
  target?: string,
): Promise<RateResult> {
  const ip = ipOf(req)
  const key = `${rule.action}:${ip}:${(target || '').toLowerCase().slice(0, 80)}`
  const windowStart = new Date(Date.now() - rule.windowSec * 1000).toISOString()

  try {
    const { data, error } = await sb().rpc('bh_rate_hit', {
      p_key: key,
      p_window_start: windowStart,
      p_max: rule.max,
    })
    if (error) { console.error('rate-limit rpc failed', error.message); return { ok: true, remaining: rule.max, retryAfterSec: 0 } }

    const r = (data ?? {}) as { allowed?: boolean; count?: number; oldest?: string }
    const used = Number(r.count) || 0
    if (r.allowed === false) {
      const oldestMs = r.oldest ? new Date(r.oldest).getTime() : Date.now()
      const retry = Math.max(1, Math.ceil((oldestMs + rule.windowSec * 1000 - Date.now()) / 1000))
      return { ok: false, remaining: 0, retryAfterSec: retry }
    }
    return { ok: true, remaining: Math.max(0, rule.max - used), retryAfterSec: 0 }
  } catch (e) {
    console.error('rate-limit failed', e)
    return { ok: true, remaining: rule.max, retryAfterSec: 0 }
  }
}

/** پاسخِ استانداردِ ۴۲۹ با هدرِ Retry-After */
export function tooMany(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ message: `تلاشِ بیش از حد. ${retryAfterSec} ثانیه دیگر دوباره تلاش کنید.`, retryAfter: retryAfterSec }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSec) } },
  )
}

/* سقف‌های پیش‌فرض — محافظه‌کارانه تا کاربرِ واقعی گیر نکند */
export const RULES = {
  login:     { action: 'login',     max: 10, windowSec: 600 },  // ۱۰ در ۱۰ دقیقه
  register:  { action: 'register',  max: 5,  windowSec: 3600 }, // ۵ در ساعت
  otpSend:   { action: 'otp_send',  max: 5,  windowSec: 900 },  // ۵ در ۱۵ دقیقه
  otpVerify: { action: 'otp_check', max: 10, windowSec: 900 },  // ۱۰ در ۱۵ دقیقه
} as const satisfies Record<string, RateRule>
