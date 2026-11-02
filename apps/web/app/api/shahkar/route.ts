export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CORS } from '@/lib/social-server'
import { verifyIdentity, verifyPerson, identitySubject } from '@/lib/shahkar-server'
import { markIdentityVerified } from '@/lib/otp-server'
import { hitRateLimit, tooMany, RULES } from '@/lib/auth/rate-limit'
import { hasOtpProof } from '@/lib/auth/otp-proof'
import { PersonName } from '@/lib/auth/person-name'
import { canonicalBirthDate } from '@/lib/jalali'
import { logHandled } from '@/lib/log-handled'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* همان شکلی که ساختِ حساب بعدا می‌پذیرد — استعلامِ پولی روی نامی که ثبت‌نام
   ردش می‌کند هدر نمی‌رود */
const Body = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
  nationalCode: z.string().regex(/^\d{10}$/),
  firstName: PersonName,
  lastName: PersonName,
  birthDate: z.unknown(),
})

/* POST { mobile, nationalCode, birthDate, firstName, lastName }
   ⟵ شاهکار (کد ملی ↔ موبایل) و ثبت‌احوال (کد ملی + تاریخ تولد ↔ نام)

   ⚠️ تا آبانِ ۱۴۰۵ این مسیر دو راهِ دور زدن داشت:
     • اگر ثبت‌احوال جوابِ قطعی نمی‌داد (یا جوابش با چند عبارتِ حدسی
       نمی‌خواند) به شاهکار بسنده می‌کرد ⟵ تاریخ تولدِ اشتباه پذیرفته
       می‌شد (گزارشِ مالک از ثبت‌نامِ واقعی).
     • بدونِ تاریخ تولد و نام هم «تأیید» می‌داد، و ساختِ حساب هر تاریخ
       و نامی را کنارِ آن کد ملی می‌نشاند.
   حالا نشانِ تأیید فقط وقتی می‌خورد که هر دو استعلام صریحا «بله»
   گفته باشند، و روی همه‌ی اجزای هویت. */
export async function POST(req: NextRequest) {
  /* شکل را پیش از مصرف سهمیه بسنج تا درخواست ناقص سهمیه نسوزاند */
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const bad = parsed.error.issues[0]?.path[0]
    return NextResponse.json({
      ok: false,
      message: bad === 'firstName' || bad === 'lastName'
        ? 'نام و نام خانوادگی را درست و حداکثر ۴۰ حرف وارد کنید'
        : 'شماره موبایل یا کد ملی معتبر نیست',
    }, { status: 400, headers: CORS })
  }
  const { mobile, nationalCode: nc, firstName, lastName } = parsed.data
  const birthDate = canonicalBirthDate(parsed.data.birthDate)
  if (!birthDate) {
    return NextResponse.json({ ok: false, message: 'تاریخ تولد معتبر نیست، آن را از تقویم انتخاب کنید' },
      { status: 400, headers: CORS })
  }

  /* سقف نرخ روی IP+شماره — بدون این، این مسیر هم اعتبار سرویس پولی را
     می‌سوزاند و هم اجازه می‌دهد کسی جفت «کد ملی ↔ شماره» را انبوه استعلام کند. */
  const rl = await hitRateLimit(req, RULES.shahkar, mobile)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  /* کسی که فقط شماره را می‌داند نباید در پنجره‌ی تأییدِ صاحبش استعلامِ پولی
     بزند یا هویتی را به آن شماره ببندد — lib/auth/otp-proof */
  if (!hasOtpProof(req, mobile)) {
    return NextResponse.json({ ok: false, code: 'OTP_REQUIRED', message: 'مهلت تأیید شماره تمام شده است، دوباره کد پیامکی بگیرید' },
      { status: 403, headers: CORS })
  }

  const shahkar = await verifyIdentity(mobile, nc)
  /* نشانِ پیامکیِ سرور منقضی شد ⟵ کلاینت به گامِ شماره برمی‌گردد، نه «سرویس قطع است» */
  if (shahkar.code === 'OTP_REQUIRED') return NextResponse.json(shahkar, { status: 403, headers: CORS })
  if (!shahkar.ok) return NextResponse.json(shahkar, { status: 503, headers: CORS })
  if (!shahkar.match) {
    return NextResponse.json({ ok: true, match: false, message: 'این کد ملی به نام این شماره موبایل نیست، شماره باید به نام خودتان باشد' },
      { headers: CORS })
  }

  const person = await verifyPerson(mobile, nc, birthDate, firstName, lastName)
  if (person.code === 'OTP_REQUIRED') return NextResponse.json(person, { status: 403, headers: CORS })
  if (person.unavailable) {
    /* بسته می‌مانیم و فقط می‌گوییم بعدا. اگر سرویس مدام در دسترس نباشد
       ثبت‌نام کلا می‌خوابد، پس باید در /admin/errors دیده شود. */
    void logHandled('shahkar/person-unavailable', new Error(person.message ?? 'PersonInfo unavailable')).catch(() => {})
    return NextResponse.json({ ok: false, message: person.message }, { status: 503, headers: CORS })
  }
  if (!person.ok) return NextResponse.json(person, { status: 400, headers: CORS })
  if (!person.match) return NextResponse.json(person, { headers: CORS })

  /* «بله» گرفتیم ولی اگر نشان ننشیند، ساختِ حساب رد می‌شود — پس همین‌جا بگو */
  if (!(await markIdentityVerified(mobile, identitySubject(nc, birthDate, firstName, lastName)))) {
    void logHandled('shahkar/mark-identity', new Error('identity mark not persisted')).catch(() => {})
    return NextResponse.json({ ok: false, message: 'ثبت نتیجه‌ی استعلام انجام نشد، چند لحظه بعد دوباره تلاش کنید' },
      { status: 503, headers: CORS })
  }
  return NextResponse.json({ ok: true, match: true }, { headers: CORS })
}
