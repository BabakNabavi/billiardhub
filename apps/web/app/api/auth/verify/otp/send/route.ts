export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getSupabaseServer } from '@/lib/supabase-server'

const JWT_SECRET = process.env.JWT_SECRET!
const OTP_EXPIRE_MIN = 2

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

    const supabase = getSupabaseServer()

    const { data: user } = await supabase
      .from('users')
      .select('id, phone, phone_verified, otp_expires_at, otp_attempts')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404, headers: CORS_HEADERS })
    }
    if (!user.phone) {
      return NextResponse.json({ message: 'شماره موبایل ثبت نشده' }, { status: 400, headers: CORS_HEADERS })
    }
    if (user.phone_verified) {
      return NextResponse.json({ message: 'موبایل قبلاً تأیید شده است' }, { status: 400, headers: CORS_HEADERS })
    }

    // cooldown یک دقیقه
    if (user.otp_expires_at) {
      const remaining = new Date(user.otp_expires_at).getTime() - Date.now()
      if (remaining > 60 * 1000) {
        return NextResponse.json({ message: 'لطفاً یک دقیقه صبر کنید' }, { status: 429, headers: CORS_HEADERS })
      }
    }

    // تولید کد ۶ رقمی
    const code    = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000).toISOString()

    await supabase.from('users').update({
      otp_code:       code,
      otp_expires_at: expires,
      otp_attempts:   0,
    }).eq('id', userId)

    const KAVENEGAR_KEY = process.env.KAVENEGAR_API_KEY

    if (!KAVENEGAR_KEY) {
      // Mock: کد رو در response برمی‌گردونیم (فقط dev)
      return NextResponse.json(
        { success: true, message: `کد تأیید (حالت تست): ${code}` },
        { headers: CORS_HEADERS }
      )
    }

    // ارسال پیامک با Kavenegar
    const kavRes = await fetch(
      `https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/verify/lookup.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          receptor: user.phone,
          token:    code,
          template: 'verify',
        }),
      }
    )

    if (!kavRes.ok) {
      return NextResponse.json({ message: 'خطا در ارسال پیامک' }, { status: 500, headers: CORS_HEADERS })
    }

    return NextResponse.json({ success: true, message: 'کد تأیید ارسال شد' }, { headers: CORS_HEADERS })

  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500, headers: CORS_HEADERS })
  }
}
