import { wasOtpVerified } from './otp-server'

/* احراز هویتِ شاهکار — تطبیقِ «کد ملی ↔ شماره موبایل» از سامانه‌ی شاهکار
   (s.api.ir / ShahkarPro). فقط برای شماره‌ای که کدش تازه تأیید شده مجاز است. */
const SHAHKAR_URL = 'https://s.api.ir/api/sw1/ShahkarPro'
const PERSON_URL  = 'https://s.api.ir/api/sw1/PersonInfo'

/* نرمال‌سازیِ نامِ فارسی برای مقایسه: ی/ک عربی، اعرابِ اضافه، نیم‌فاصله و فاصله‌ها */
export function normName(s: string): string {
  return (s || '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[ً-ْٰ‌‏‎]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/* استعلامِ مشخصاتِ هویتی از ثبت‌احوال (کد ملی + تاریخ تولد) و تطبیقِ نام و
   نام‌خانوادگی. پیش‌شرط: شماره با کدِ پیامکی تأیید شده باشد. */
export async function verifyPerson(
  mobile: string, nationalCode: string, birthDate: string, firstName: string, lastName: string,
): Promise<{ ok: boolean; match?: boolean; message?: string }> {
  const m = (mobile || '').replace(/[^0-9]/g, '')
  const nc = (nationalCode || '').replace(/[^0-9]/g, '')
  const bd = (birthDate || '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9/]/g, '')
  if (!/^\d{10}$/.test(nc)) return { ok: false, message: 'کد ملی معتبر نیست' }
  if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(bd)) return { ok: false, message: 'تاریخ تولد را کامل وارد کنید' }
  if (!(await wasOtpVerified(m))) return { ok: false, message: 'ابتدا شماره را با کد پیامکی تأیید کنید' }

  const key = process.env.SMS_API_KEY
  if (!key) return { ok: true, match: true }

  try {
    const r = await fetch(PERSON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ nationalCode: nc, birthDate: bd }),
    })
    if (r.status === 401 || r.status === 403) return { ok: false, message: 'کلیدِ سرویسِ استعلام پذیرفته نشد' }
    const j = await r.json().catch(() => null) as { success?: boolean; data?: { firstName?: string; lastName?: string; alive?: boolean } | null; message?: string } | null
    if (!j || j.success !== true || !j.data) {
      /* تاریخ تولد با کد ملی نخواند ⇒ سرویس داده برنمی‌گرداند */
      if (j && j.success === false) return { ok: true, match: false, message: 'تاریخ تولد با کد ملی مطابقت ندارد' }
      console.error('PersonInfo failed:', j?.message || r.status)
      return { ok: false, message: 'استعلامِ مشخصاتِ هویتی ناموفق بود؛ دوباره تلاش کنید' }
    }
    const okName = normName(j.data.firstName || '') === normName(firstName)
      && normName(j.data.lastName || '') === normName(lastName)
    return { ok: true, match: okName, message: okName ? undefined : 'نام و نام خانوادگی با کد ملی مطابقت ندارد' }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویسِ استعلام' }
  }
}

export async function verifyIdentity(mobile: string, nationalCode: string): Promise<{ ok: boolean; match?: boolean; message?: string }> {
  const m = (mobile || '').replace(/[^0-9]/g, '')
  const nc = (nationalCode || '').replace(/[^0-9]/g, '')
  if (!/^09\d{9}$/.test(m)) return { ok: false, message: 'شماره‌ی موبایل معتبر نیست' }
  if (!/^\d{10}$/.test(nc)) return { ok: false, message: 'کد ملی معتبر نیست' }

  /* پیش‌شرط: شماره باید تازه با پیامک تأیید شده باشد (ضدِ سوءاستفاده/هدررفتِ اعتبار) */
  if (!(await wasOtpVerified(m))) return { ok: false, message: 'ابتدا شماره را با کد پیامکی تأیید کنید' }

  const key = process.env.SMS_API_KEY
  if (!key) return { ok: true, match: true }   // محیطِ توسعه بدونِ کلید ⇒ رد نکن

  try {
    const r = await fetch(SHAHKAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ isCompany: false, mobile: m, nationalCode: nc }),
    })
    if (r.status === 401 || r.status === 403) return { ok: false, message: 'کلیدِ سرویسِ احراز هویت پذیرفته نشد' }
    const j = await r.json().catch(() => null) as { success?: boolean; data?: boolean; message?: string } | null
    if (j && j.success === true) return { ok: true, match: j.data === true }
    console.error('ShahkarPro failed:', j?.message || r.status)
    return { ok: false, message: 'استعلامِ احراز هویت ناموفق بود؛ چند لحظه بعد دوباره تلاش کنید' }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویسِ احراز هویت' }
  }
}
