export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getSupabaseServer } from '@/lib/supabase-server'

const JWT_SECRET = process.env.JWT_SECRET!

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
    // احراز هویت JWT
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
    const { nationalId, firstName, lastName } = body

    if (!nationalId || nationalId.length !== 10) {
      return NextResponse.json({ message: 'کد ملی باید ۱۰ رقم باشد' }, { status: 400, headers: CORS_HEADERS })
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ message: 'نام و نام خانوادگی الزامی است' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = getSupabaseServer()

    // دریافت اطلاعات کاربر
    const { data: user } = await supabase
      .from('users')
      .select('id, "firstName", "lastName", national_id_verified')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404, headers: CORS_HEADERS })
    }

    if (user.national_id_verified) {
      return NextResponse.json({ message: 'کد ملی قبلاً تأیید شده است' }, { status: 400, headers: CORS_HEADERS })
    }

    const APIIR_KEY = process.env.APIIR_KEY

    if (!APIIR_KEY) {
      // ── حالت Mock (بدون API key) ──
      const match =
        firstName.trim() === user.firstName?.trim() &&
        lastName.trim() === user.lastName?.trim()

      if (!match) {
        return NextResponse.json(
          { message: 'نام و نام خانوادگی با کد ملی مطابقت ندارد' },
          { status: 422, headers: CORS_HEADERS }
        )
      }

      await supabase.from('users').update({ national_id: nationalId }).eq('id', userId)
      return NextResponse.json({ success: true, message: 'کد ملی تأیید شد' }, { headers: CORS_HEADERS })
    }

    // ── استعلام واقعی از api.ir ──
    const res = await fetch('https://api.api.ir/v1/national-id/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': APIIR_KEY },
      body: JSON.stringify({ nationalCode: nationalId, firstName, lastName }),
    })
    const data = await res.json()

    if (!res.ok || !data.matched) {
      return NextResponse.json(
        { message: 'نام و نام خانوادگی با کد ملی مطابقت ندارد' },
        { status: 422, headers: CORS_HEADERS }
      )
    }

    await supabase.from('users').update({ national_id: nationalId }).eq('id', userId)
    return NextResponse.json({ success: true, message: 'کد ملی تأیید شد' }, { headers: CORS_HEADERS })

  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500, headers: CORS_HEADERS })
  }
}
