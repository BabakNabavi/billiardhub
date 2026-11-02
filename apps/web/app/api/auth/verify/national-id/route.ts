export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { sessionFromRequest } from '@/lib/auth/session'
import { verifyIdentity, verifyPerson } from '@/lib/shahkar-server'
import { ensurePersonForUser } from '@/lib/identity'
import { nationalIdBlocked } from '@/lib/enforcement/server'
import { audit, clientIp } from '@/lib/finance/db'
import { canonicalBirthDate } from '@/lib/jalali'
import { PersonName } from '@/lib/auth/person-name'
import { z } from 'zod'
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit'

/* احراز هویت کاربر فعلی — برای حساب‌هایی که پیش از راه‌اندازی استعلام
   ساخته شده‌اند و کد ملی‌شان ثبت نشده است.

   نسخه‌ی قبلی به سرویس api.api.ir وصل بود که هیچ‌وقت کلیدی برایش تنظیم
   نشده بود، و در نبود کلید به «حالت mock» می‌افتاد که فقط نام ارسالی
   کلاینت را با نام داخل دیتابیس مقایسه می‌کرد — یعنی هر کاربری می‌توانست
   هر کد ملی‌ای را به حساب خودش بچسباند. حالا همان سرویس واقعی s.api.ir
   استفاده می‌شود که در ثبت‌نام هم کار می‌کند. */

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
}

const Body = z.object({
  nationalId: z.string().transform(v => v.replace(/[^0-9]/g, '')).pipe(z.string().length(10)),
  firstName: PersonName,
  lastName: PersonName,
  birthDate: z.unknown(),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ message: 'وارد نشده‌اید' }, { status: 401, headers: CORS_HEADERS })
  }

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const bad = parsed.error.issues[0]?.path[0]
    return NextResponse.json(
      { message: bad === 'nationalId' ? 'کد ملی باید ۱۰ رقم باشد' : 'نام و نام خانوادگی را درست و حداکثر ۴۰ حرف وارد کنید' },
      { status: 400, headers: CORS_HEADERS },
    )
  }
  const { nationalId, firstName, lastName } = parsed.data
  /* ⚠️ پیش‌تر تاریخ تولد اختیاری بود و حتی وقتی ثبت‌احوال تأییدش نمی‌کرد
     (سرویس در دسترس نبود) همان تاریخِ تایپ‌شده در حساب می‌نشست — و استعلام
     کارت و شبا بعدا روی همان تکیه می‌کنند. حالا اجباری و تأییدشده است. */
  const birthDate = canonicalBirthDate(parsed.data.birthDate)
  if (!birthDate) {
    return NextResponse.json({ message: 'تاریخ تولد معتبر نیست، آن را از تقویم انتخاب کنید' }, { status: 400, headers: CORS_HEADERS })
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
    return NextResponse.json({ message: 'کد ملی شما قبلا تأیید شده است' }, { status: 400, headers: CORS_HEADERS })
  }
  if (!user.phone) {
    return NextResponse.json({ message: 'ابتدا شماره موبایل خود را ثبت کنید' }, { status: 400, headers: CORS_HEADERS })
  }

  /* دو استعلامِ پولی پشتِ این مسیر است؛ بی‌سقف، اوراکلِ «این کد ملی و
     این تاریخ مال کیست» می‌شد. پس از «قبلا تأیید شده» تا آن سهمیه نسوزاند. */
  const rl = await hitRateLimit(req, RULES.shahkar, session.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  /* گام ۱ — شاهکار: این کد ملی به همین شماره تعلق دارد؟
     کاربر با رمز خودش وارد شده و شماره‌اش در حسابش ثبت است، پس نیازی به
     کد پیامکی دوباره نیست. */
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

  /* گام ۲ — ثبت‌احوال: تاریخ تولد و نامِ واردشده با کد ملی بخوانند.
     فقط «بله»ی صریح پذیرفته است؛ «سرویس در دسترس نیست» یعنی بعدا.
     نامِ فرم سنجیده می‌شود نه نامِ ذخیره‌شده: حساب‌های قدیمی نامِ آزاد
     دارند و فرم همین را می‌پرسید ولی نادیده می‌گرفت — کسی که نامِ درستش
     را می‌زد برای همیشه «مغایرت» می‌گرفت. پس از تأیید، همان نام می‌نشیند. */
  const person = await verifyPerson(
    user.phone, nationalId, birthDate, firstName, lastName,
    { requireOtp: false },
  )
  if (!person.ok) {
    return NextResponse.json(
      { message: person.message ?? 'استعلام ثبت‌احوال ناموفق بود' },
      { status: person.unavailable ? 503 : 400, headers: CORS_HEADERS },
    )
  }
  if (!person.match) {
    return NextResponse.json(
      { message: person.message ?? 'مشخصات با کد ملی مطابقت ندارد' },
      { status: 422, headers: CORS_HEADERS },
    )
  }

  /* حسابِ جایگزین: شاهکار همین حالا گفت این کد ملی مالِ همین آدم است؛
     اگر همان آدم حسابِ مسدود/تعلیق/حذف‌شده دارد، این حساب راهِ دورزدنِ آن است.
     هویت ثبت نمی‌شود و تلاش برای مالک در ممیزی می‌ماند. */
  if (await nationalIdBlocked(nationalId)) {
    void audit({
      actorId: session.id, actorRole: 'user', action: 'ENFORCEMENT_EVASION_BLOCKED',
      entityType: 'user', entityId: session.id, newValue: { via: 'verify/national-id' }, ip: clientIp(req),
    })
    return NextResponse.json(
      { code: 'IDENTITY_BLOCKED', message: 'این هویت قابل ثبت روی این حساب نیست، برای پیگیری با پشتیبانی تماس بگیرید' },
      { status: 403, headers: CORS_HEADERS },
    )
  }

  const { error: saveErr } = await supabase.from('users').update({
    firstName,
    lastName,
    national_id: nationalId,
    national_id_verified: true,
    birth_date: birthDate,
    verificationStatus: 'verified',
  }).eq('id', session.id)
  /* پیش‌تر نتیجه خوانده نمی‌شد: نوشتنِ ناموفق «تأیید شد» می‌گفت و هیچ‌چیز نمی‌نشست */
  if (saveErr) {
    console.error('[verify/national-id] save failed:', saveErr.message)
    return NextResponse.json({ message: 'ثبت نتیجه انجام نشد، دوباره تلاش کنید' }, { status: 500, headers: CORS_HEADERS })
  }

  /* هویت (فاز ۳): اتصال به «شخص» — سهمیه‌ی رایگان از این به بعد شخص‌محور است */
  await ensurePersonForUser(session.id)

  return NextResponse.json(
    { success: true, nameChecked: true, message: 'کد ملی شما با موفقیت تأیید شد' },
    { headers: CORS_HEADERS },
  )
}
