'use client'

/* رپرهای کلاینتِ OTP */
export interface OtpResult { ok: boolean; message?: string; wait?: number; exists?: boolean }

/* purpose='register' ⇒ اگر شماره از قبل حساب داشته باشد، سرور پیامکی
   نمی‌فرستد و exists را برمی‌گرداند (جلوگیری از هزینه‌ی بیهوده). */
export async function sendOtp(mobile: string, purpose?: 'register'): Promise<OtpResult> {
  try {
    const r = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', mobile, purpose }) })
    return await r.json()
  } catch { return { ok: false, message: 'خطا در اتصال' } }
}

export async function verifyOtp(mobile: string, code: string): Promise<OtpResult> {
  try {
    const r = await fetch('/api/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', mobile, code }) })
    return await r.json()
  } catch { return { ok: false, message: 'خطا در اتصال' } }
}

/* احراز هویت: شاهکار (کد ملی ↔ موبایل) و در صورتِ دادنِ تاریخ تولد و نام،
   تطبیقِ نام و نام‌خانوادگی با ثبت‌احوال */
export async function verifyIdentity(
  mobile: string, nationalCode: string,
  extra?: { birthDate?: string; firstName?: string; lastName?: string },
): Promise<{ ok: boolean; match?: boolean; message?: string }> {
  try {
    const r = await fetch('/api/shahkar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, nationalCode, ...(extra || {}) }) })
    return await r.json()
  } catch { return { ok: false, message: 'خطا در اتصال' } }
}
