import { wasOtpVerified } from './otp-server'

/* احراز هویتِ شاهکار — تطبیقِ «کد ملی ↔ شماره موبایل» از سامانه‌ی شاهکار
   (s.api.ir / ShahkarPro). فقط برای شماره‌ای که کدش تازه تأیید شده مجاز است. */
const SHAHKAR_URL = 'https://s.api.ir/api/sw1/ShahkarPro'

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
