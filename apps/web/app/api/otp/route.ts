export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { sendOtp, verifyOtp } from '@/lib/otp-server'
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit'
import { getSupabaseServer } from '@/lib/supabase-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* آیا این شماره از قبل حساب دارد؟
   پیش از ارسالِ پیامک بررسی می‌شود تا برای شماره‌ی تکراری هزینه‌ی پیامک
   ایجاد نشود. خطای دیتابیس نباید ثبت‌نام را ببندد ⇒ در آن حالت مثل
   «وجود ندارد» رفتار می‌کنیم و مرحله‌ی ساختِ حساب خودش تکراری بودن را می‌گیرد. */
async function phoneTaken(mobile: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseServer()
      .from('users').select('id').eq('phone', mobile).limit(1)
    if (error) return false
    return Array.isArray(data) && data.length > 0
  } catch { return false }
}

/* POST { action:'send', mobile, purpose? }  → ارسالِ کدِ پیامکی
   POST { action:'verify', mobile, code }    → تأییدِ کد */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const mobile = String(b?.mobile || '')

  if (b?.action === 'verify') {
    /* سطلِ جدا از ارسال: حدسِ کد نباید با گرفتنِ کدِ تازه ریست شود */
    const rl = await hitRateLimit(req, RULES.otpVerify, mobile)
    if (!rl.ok) return tooMany(rl.retryAfterSec)

    const r = await verifyOtp(mobile, String(b?.code || ''))
    return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: CORS })
  }

  /* ارسالِ کد — سطلِ مستقل */
  const rlSend = await hitRateLimit(req, RULES.otpSend, mobile)
  if (!rlSend.ok) return tooMany(rlSend.retryAfterSec)

  /* فقط در مسیرِ ثبت‌نام: شماره‌ی تکراری ⇒ اصلاً پیامکی فرستاده نمی‌شود */
  if (b?.purpose === 'register' && /^09\d{9}$/.test(mobile) && await phoneTaken(mobile)) {
    return NextResponse.json({
      ok: false, exists: true,
      message: 'این شماره قبلاً در بیلیارد هاب ثبت‌نام کرده است. وارد شوید یا رمز عبورتان را بازیابی کنید.',
    }, { status: 409, headers: CORS })
  }

  const r = await sendOtp(mobile)
  return NextResponse.json(r, { status: r.ok ? 200 : 400, headers: CORS })
}
