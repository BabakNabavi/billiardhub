import { readJson, writeJson, safeKey } from './social-server'

/* OTPِ پیامکی — کد را خودمان می‌سازیم/ذخیره/می‌سنجیم و سرویسِ s.api.ir فقط
   پیامک را می‌رساند. ذخیره روی همان Supabase Storage (مثل استوری/دایرکت). */
const SMS_URL = 'https://s.api.ir/api/swl/SmsOTP'
const TEMPLATE = 1                    // ۱ = کدِ تأیید
const TTL = 2 * 60 * 1000             // اعتبارِ کد: ۲ دقیقه
const RESEND = 60 * 1000              // فاصله‌ی مجازِ ارسالِ مجدد: ۶۰ ثانیه
const MAX_TRIES = 5

interface OtpRec { code: string; at: number; tries: number }
const otpPath = (mobile: string) => `social/otp/${safeKey(mobile)}.json`
const normMobile = (m: string) => (m || '').replace(/[^0-9]/g, '')

export async function sendOtp(mobile: string): Promise<{ ok: boolean; message?: string; wait?: number }> {
  const m = normMobile(mobile)
  if (!/^09\d{9}$/.test(m)) return { ok: false, message: 'شماره‌ی موبایل معتبر نیست' }

  const prev = await readJson<OtpRec | null>(otpPath(m), null)
  const now = Date.now()
  if (prev && now - prev.at < RESEND) {
    return { ok: false, message: 'کمی صبر کنید و دوباره تلاش کنید', wait: Math.ceil((RESEND - (now - prev.at)) / 1000) }
  }

  const code = String(Math.floor(10000 + Math.random() * 90000))   // ۵ رقمی
  await writeJson(otpPath(m), { code, at: now, tries: 0 })

  const key = process.env.SMS_API_KEY
  if (!key) return { ok: true, message: 'حالت آزمایشی: کلیدِ پیامک تنظیم نشده' }   // ذخیره شد ولی ارسال نشد

  try {
    const r = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ code, mobile: m, template: TEMPLATE }),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      return { ok: false, message: r.status === 401 || r.status === 403 ? 'کلیدِ سرویسِ پیامک پذیرفته نشد' : `ارسالِ پیامک ناموفق بود (${r.status})`, ...(t ? {} : {}) }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویسِ پیامک' }
  }
}

export async function verifyOtp(mobile: string, code: string): Promise<{ ok: boolean; message?: string }> {
  const m = normMobile(mobile)
  const rec = await readJson<OtpRec | null>(otpPath(m), null)
  if (!rec) return { ok: false, message: 'کدی ارسال نشده؛ ابتدا کد را دریافت کنید' }
  if (Date.now() - rec.at > TTL) return { ok: false, message: 'کد منقضی شده؛ دوباره دریافت کنید' }
  if (rec.tries >= MAX_TRIES) return { ok: false, message: 'تعدادِ تلاش زیاد شد؛ کدِ جدید بگیرید' }
  if (String(code).replace(/[^0-9]/g, '').trim() !== rec.code) {
    await writeJson(otpPath(m), { ...rec, tries: rec.tries + 1 })
    return { ok: false, message: 'کد نادرست است' }
  }
  await writeJson(otpPath(m), { ...rec, tries: MAX_TRIES + 1 })   // مصرف‌شده
  return { ok: true }
}
