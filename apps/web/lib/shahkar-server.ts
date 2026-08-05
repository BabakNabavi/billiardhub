import { wasOtpVerified } from './otp-server'
import { inquiryKey } from './inquiry-key'

/* احراز هویت شاهکار — تطبیق «کد ملی ↔ شماره موبایل» از سامانه‌ی شاهکار
   (s.api.ir / ShahkarPro). فقط برای شماره‌ای که کدش تازه تأیید شده مجاز است. */
const SHAHKAR_URL = 'https://s.api.ir/api/sw1/ShahkarPro'
const PERSON_URL  = 'https://s.api.ir/api/sw1/PersonInfo'

/* نرمال‌سازی نام فارسی برای مقایسه: ی/ک عربی، اعراب اضافه، نیم‌فاصله و فاصله‌ها */
export function normName(s: string): string {
  return (s || '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[ً-ْٰ‌‏‎]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/* استعلام مشخصات هویتی از ثبت‌احوال (کد ملی + تاریخ تولد) و تطبیق نام و
   نام‌خانوادگی. پیش‌شرط: شماره با کد پیامکی تأیید شده باشد. */
export async function verifyPerson(
  mobile: string, nationalCode: string, birthDate: string, firstName: string, lastName: string,
  opts: { requireOtp?: boolean } = {},
): Promise<{ ok: boolean; match?: boolean; message?: string; unavailable?: boolean }> {
  const m = (mobile || '').replace(/[^0-9]/g, '')
  const nc = (nationalCode || '').replace(/[^0-9]/g, '')
  const bd = (birthDate || '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9/]/g, '')
  if (!/^\d{10}$/.test(nc)) return { ok: false, message: 'کد ملی معتبر نیست' }
  if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(bd)) return { ok: false, message: 'تاریخ تولد را کامل وارد کنید' }
  /* پیش‌شرط کد پیامکی فقط در مسیر ثبت‌نام لازم است؛ برای کاربر
     واردشده‌ای که شماره‌اش در حسابش ثبت است، تکرارش بی‌مورد است. */
  if (opts.requireOtp !== false && !(await wasOtpVerified(m))) {
    return { ok: false, message: 'ابتدا شماره را با کد پیامکی تأیید کنید' }
  }

  const key = inquiryKey()
  if (!key) return { ok: true, match: true }

  try {
    const r = await fetch(PERSON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ nationalCode: nc, birthDate: bd }),
    })
    const j = await r.json().catch(() => null) as { success?: boolean; code?: number; data?: { firstName?: string; lastName?: string; alive?: boolean } | null; message?: string } | null

    /* سرویس در دسترس نیست (سطح دسترسی/کلید/اعتبار) ⇒ «نامشخص»، نه «مغایرت».
       تصمیم‌گیری با فراخوان است: نباید ثبت‌نام را ببندد. */
    const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
      || /trust level|سطح دسترسی|اعتبار|credit/i.test(j?.message || '')
    if (denied) {
      console.error('PersonInfo unavailable:', j?.message || r.status)
      return { ok: false, unavailable: true, message: 'سرویس استعلام مشخصات در دسترس نیست' }
    }
    if (!j) {
      console.error('PersonInfo failed: no body', r.status)
      return { ok: false, unavailable: true, message: 'استعلام مشخصات هویتی ناموفق بود' }
    }
    /* پاسخ معتبر منفی. توجه: سرویس برای «عدم تطابق» هم success=true برمی‌گرداند
       و فقط data را خالی می‌گذارد ⇒ این حالت باید «مغایرت» باشد نه «در دسترس نبودن»،
       وگرنه تاریخ تولد اشتباه از تطبیق رد می‌شد. */
    if (j.success === false || (!j.data && /عدم تطابق|مطابقت|یافت نشد/.test(j.message || ''))) {
      return { ok: true, match: false, message: 'تاریخ تولد با کد ملی مطابقت ندارد' }
    }
    if (!j.data) {
      console.error('PersonInfo failed:', j.message || r.status)
      return { ok: false, unavailable: true, message: 'استعلام مشخصات هویتی ناموفق بود' }
    }
    const okName = normName(j.data.firstName || '') === normName(firstName)
      && normName(j.data.lastName || '') === normName(lastName)
    return { ok: true, match: okName, message: okName ? undefined : 'نام و نام خانوادگی با کد ملی مطابقت ندارد' }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویس استعلام' }
  }
}

export async function verifyIdentity(
  mobile: string, nationalCode: string, opts: { requireOtp?: boolean } = {},
): Promise<{ ok: boolean; match?: boolean; message?: string }> {
  const m = (mobile || '').replace(/[^0-9]/g, '')
  const nc = (nationalCode || '').replace(/[^0-9]/g, '')
  if (!/^09\d{9}$/.test(m)) return { ok: false, message: 'شماره‌ی موبایل معتبر نیست' }
  if (!/^\d{10}$/.test(nc)) return { ok: false, message: 'کد ملی معتبر نیست' }

  /* پیش‌شرط: شماره باید تازه با پیامک تأیید شده باشد (ضد سوءاستفاده/هدررفت اعتبار).
     برای کاربر واردشده‌ای که شماره‌اش از قبل در حسابش ثبت است، لازم نیست. */
  if (opts.requireOtp !== false && !(await wasOtpVerified(m))) {
    return { ok: false, message: 'ابتدا شماره را با کد پیامکی تأیید کنید' }
  }

  const key = inquiryKey()
  if (!key) return { ok: true, match: true }   // محیط توسعه بدون کلید ⇒ رد نکن

  try {
    const r = await fetch(SHAHKAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ isCompany: false, mobile: m, nationalCode: nc }),
    })
    if (r.status === 401 || r.status === 403) return { ok: false, message: 'کلید سرویس احراز هویت پذیرفته نشد' }
    const j = await r.json().catch(() => null) as { success?: boolean; data?: boolean; message?: string } | null
    if (j && j.success === true) return { ok: true, match: j.data === true }
    console.error('ShahkarPro failed:', j?.message || r.status)
    return { ok: false, message: 'استعلام احراز هویت ناموفق بود؛ چند لحظه بعد دوباره تلاش کنید' }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویس احراز هویت' }
  }
}
