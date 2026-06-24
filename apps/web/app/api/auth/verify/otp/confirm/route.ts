export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getSupabaseServer } from '@/lib/supabase-server'

const JWT_SECRET = process.env.JWT_SECRET!
const OTP_MAX_ATTEMPTS = 5

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ message: 'وارد نشده‌اید' }, { status: 401, headers: CORS_HEADERS })
    }

    let userId: string
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
      userId = payload.sub
    } catch {
      return NextResponse.json({ message: 'توکن نامعتبر' }, { status: 401, headers: CORS_HEADERS })
    }

    const body = await req.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json({ message: 'کد تأیید باید ۶ رقم باشد' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = getSupabaseServer()

    const { data: user } = await supabase
      .from('users')
      .select('id, otp_code, otp_expires_at, otp_attempts')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404, headers: CORS_HEADERS })
    }

    // بررسی تعداد تلاش
    if ((user.otp_attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: 'تعداد تلاش‌های مجاز تمام شد. لطفاً مجدداً درخواست کد کنید' },
        { status: 429, headers: CORS_HEADERS }
      )
    }

    // بررسی انقضا
    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      return NextResponse.json({ message: 'کد تأیید منقضی شده است' }, { status: 400, headers: CORS_HEADERS })
    }

    // بررسی کد
    if (user.otp_code !== code) {
      await supabase.from('users')
        .update({ otp_attempts: (user.otp_attempts ?? 0) + 1 })
        .eq('id', userId)
      return NextResponse.json({ message: 'کد تأیید اشتباه است' }, { status: 400, headers: CORS_HEADERS })
    }

    // ✅ تأیید موفق
    await supabase.from('users').update({
      phone_verified:      true,
      verification_status: 'verified',
      otp_code:            null,
      otp_expires_at:      null,
      otp_attempts:        0,
    }).eq('id', userId)

    return NextResponse.json({ success: true, message: 'شماره موبایل با موفقیت تأیید شد' }, { headers: CORS_HEADERS })

  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500, headers: CORS_HEADERS })
  }
}
