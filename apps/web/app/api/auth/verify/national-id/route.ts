export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { sessionFromRequest } from '@/lib/auth/session'
import { verifyIdentity, verifyPerson } from '@/lib/shahkar-server'
import { ensurePersonForUser } from '@/lib/identity'

/* احرازِ هویتِ کاربرِ فعلی — برای حساب‌هایی که پیش از راه‌اندازیِ استعلام
   ساخته شده‌اند و کد ملی‌شان ثبت نشده است.

   نسخه‌ی قبلی به سرویسِ api.api.ir وصل بود که هیچ‌وقت کلیدی برایش تنظیم
   نشده بود، و در نبودِ کلید به «حالتِ mock» می‌افتاد که فقط نامِ ارسالیِ
   کلاینت را با نامِ داخلِ دیتابیس مقایسه می‌کرد — یعنی هر کاربری می‌توانست
   هر کد ملی‌ای را به حسابِ خودش بچسباند. حالا همان سرویسِ واقعیِ s.api.ir
   استفاده می‌شود که در ثبت‌نام هم کار می‌کند. */

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ message: 'وارد نشده‌اید' }, { status: 401, headers: CORS_HEADERS })
  }

  const body = await req.json().catch(() => ({}))
  const nationalId = String(body?.nationalId ?? '').replace(/[^0-9]/g, '')
  const birthDate = String(body?.birthDate ?? '').trim()

  if (nationalId.length !== 10) {
    return NextResponse.json({ message: 'کد ملی باید ۱۰ رقم باشد' }, { status: 400, headers: CORS_HEADERS })
  }

  const supabase = getSupabaseServer()
  const { data } = await supabase
    .from('users')
    .select('id, phone, "firstName", "lastName", national_id_verified')
    .eq('id', session.id)
    .maybeSingle()

  const user = data as {
    id: string; phone?: string; firstName?: string; lastName?: string; national_id_verified?: boolean
  } | null

  if (!user) return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404, headers: CORS_HEADERS })
  if (user.national_id_verified) {
    return NextResponse.json({ message: 'کد ملی شما قبلاً تأیید شده است' }, { status: 400, headers: CORS_HEADERS })
  }
  if (!user.phone) {
    return NextResponse.json({ message: 'ابتدا شماره موبایل خود را ثبت کنید' }, { status: 400, headers: CORS_HEADERS })
  }

  /* گامِ ۱ — شاهکار: این کد ملی به همین شماره تعلق دارد؟
     کاربر با رمزِ خودش وارد شده و شماره‌اش در حسابش ثبت است، پس نیازی به
     کدِ پیامکیِ دوباره نیست. */
  const shahkar = await verifyIdentity(user.phone, nationalId, { requireOtp: false })
  if (!shahkar.ok) {
    return NextResponse.json({ message: shahkar.message ?? 'استعلام ناموفق بود' }, { status: 503, headers: CORS_HEADERS })
  }
  if (!shahkar.match) {
    return NextResponse.json(
      { message: 'این کد ملی به شماره موبایل شما تعلق ندارد' },
      { status: 422, headers: CORS_HEADERS },
    )
  }

  /* گامِ ۲ — ثبت‌احوال: نام و تاریخ تولد هم بخوانند (اگر تاریخ داده شده) */
  let nameChecked = false
  if (birthDate) {
    const person = await verifyPerson(
      user.phone, nationalId, birthDate,
      user.firstName ?? '', user.lastName ?? '',
      { requireOtp: false },
    )
    if (person.ok && person.match === false) {
      return NextResponse.json(
        { message: person.message ?? 'مشخصات با کد ملی مطابقت ندارد' },
        { status: 422, headers: CORS_HEADERS },
      )
    }
    nameChecked = !!(person.ok && person.match)
  }

  await supabase.from('users').update({
    national_id: nationalId,
    national_id_verified: true,
    ...(birthDate ? { birth_date: birthDate.slice(0, 12) } : {}),
    verificationStatus: 'verified',
  }).eq('id', session.id)

  /* هویت (فاز ۳): اتصال به «شخص» — سهمیه‌ی رایگان از این به بعد شخص‌محور است */
  await ensurePersonForUser(session.id)

  return NextResponse.json(
    { success: true, nameChecked, message: 'کد ملی شما با موفقیت تأیید شد' },
    { headers: CORS_HEADERS },
  )
}
