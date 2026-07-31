import { createHmac } from 'crypto'
import { writeJson, readJsonFresh, safeKey } from './social-server'

const SUPA = 'https://bxnomfjjvhdtbnqvgjmh.supabase.co'
/* کد را هش‌شده ذخیره می‌کنیم (باکت عمومی است) تا حتی با خواندنِ فایل هم کد لو نرود.

   کلید عمداً fallback ندارد: پیش‌تر اگر JWT_SECRET تنظیم نبود، کدها با
   رشته‌ی ثابتِ داخلِ همین فایل هش می‌شدند — یعنی هر کسی که مخزن را
   می‌خواند می‌توانست کدِ تأیید را از روی هش بسازد. حالا نبودِ کلید
   صدا می‌کند به‌جای اینکه بی‌صدا امنیت را پایین بیاورد. */
const otpKey = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set — OTP hashing unavailable')
  return s
}
const hashCode = (code: string) => createHmac('sha256', otpKey()).update(String(code)).digest('hex')

/* OTPِ پیامکی — کد را خودمان می‌سازیم/ذخیره/می‌سنجیم و سرویسِ s.api.ir فقط
   پیامک را می‌رساند. ذخیره روی همان Supabase Storage (مثل استوری/دایرکت). */
const SMS_URL = 'https://s.api.ir/api/sw1/SmsOTP'   // sw1 = s‑w‑یک (نه swl)
const TEMPLATE = 2                    // قالبِ سرویس: ۲ = «کد تایید» (مناسبِ ثبت‌نام)
                                     // (افزودنِ نامِ «بیلیارد هاب» به تهِ پیامک = تنظیمِ سطحِ حساب از پشتیبانیِ s.api.ir)
const TTL = 5 * 60 * 1000             // اعتبارِ کد: ۵ دقیقه (۲ دقیقه کوتاه بود و زود منقضی می‌شد)
const RESEND = 60 * 1000              // فاصله‌ی مجازِ ارسالِ مجدد: ۶۰ ثانیه
const MAX_TRIES = 5

interface OtpRec {
  hash: string; at: number; tries: number; verifiedAt?: number
  /* هشِ کد ملیِ استعلام‌شده + زمانش (خودِ کد ملی ذخیره نمی‌شود) */
  idHash?: string; idAt?: number
}
const VERIFIED_WINDOW = 30 * 60 * 1000   // نشانِ «تأییدشده» تا ۳۰ دقیقه برای مرحله‌ی بعدی (شاهکار)
const otpPath = (mobile: string) => `social/otp/${safeKey(mobile)}.json`
const normMobile = (m: string) => (m || '').replace(/[^0-9]/g, '')

/* خواندنِ همیشه‌تازه (cache-busted) — کشِ لبه‌ی Supabase رکوردِ کهنه می‌داد و
   کدِ تازه را «منقضی» نشان می‌داد. باکتِ club-media عمومی است. */
async function readOtp(m: string): Promise<OtpRec | null> {
  /* رکوردِ OTP دیگر در باکتِ عمومی نیست و با URLِ عمومی خوانده
     نمی‌شود. `readJsonFresh` خودش تشخیص می‌دهد مسیر خصوصی است و با
     کلیدِ سرویس دانلود می‌کند — دانلودِ مستقیم کشِ لبه ندارد، پس
     همان تازگی که این‌جا لازم بود حفظ می‌شود. */
  const rec = await readJsonFresh<OtpRec | null>(otpPath(m), null)
  return rec ?? null
}

export async function sendOtp(mobile: string): Promise<{ ok: boolean; message?: string; wait?: number }> {
  const m = normMobile(mobile)
  if (!/^09\d{9}$/.test(m)) return { ok: false, message: 'شماره‌ی موبایل معتبر نیست' }

  const prev = await readOtp(m)
  const now = Date.now()
  if (prev && now - prev.at < RESEND) {
    return { ok: false, message: 'کمی صبر کنید و دوباره تلاش کنید', wait: Math.ceil((RESEND - (now - prev.at)) / 1000) }
  }

  const code = String(Math.floor(10000 + Math.random() * 90000))   // ۵ رقمی
  await writeJson(otpPath(m), { hash: hashCode(code), at: now, tries: 0 })

  const key = process.env.SMS_API_KEY
  if (!key) {
    /* پیش‌تر این‌جا `ok: true` برمی‌گشت — یعنی کلید تنظیم نبود، هیچ
       پیامکی نمی‌رفت، ولی همه‌ی لایه‌های بالاتر «ارسال شد» می‌دیدند و
       کاربر منتظرِ کدی می‌ماند که ساخته شده بود ولی هرگز فرستاده نشد.

       حالت آزمایشیِ محلی همچنان کار می‌کند (کد در لاگِ سرور می‌آید تا
       بشود بدونِ پیامک تست کرد)، ولی وضعیت صادقانه گزارش می‌شود. */
    console.warn('[otp] SMS_API_KEY تنظیم نشده — کد ساخته شد ولی ارسال نشد. کدِ آزمایشی:', code)
    return { ok: false, message: 'سرویسِ پیامک پیکربندی نشده است' }
  }

  try {
    const r = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ code, mobile: m, template: TEMPLATE }),
    })
    /* سرویس همیشه ۲۰۰ می‌دهد؛ نتیجه‌ی واقعی در success/message است. */
    if (r.status === 401 || r.status === 403) return { ok: false, message: 'کلیدِ سرویسِ پیامک پذیرفته نشد' }
    const j = await r.json().catch(() => null) as { success?: boolean; data?: boolean; message?: string; code?: number } | null

    /* پاسخِ سرویس همیشه لاگ می‌شود — موفق یا ناموفق.

       تا امروز فقط شکست لاگ می‌شد، پس وقتی سرویس «موفق» می‌گفت ولی
       پیامک به دستِ کاربر نمی‌رسید (اعتبارِ تمام‌شده، قالبِ تأییدنشده،
       فیلترِ اپراتور) هیچ ردی نمی‌ماند تا بشود دنبالش را گرفت. */
    console.info('[otp] SmsOTP →', JSON.stringify({
      mobile: m.slice(0, 4) + '***' + m.slice(-4),   // شماره‌ی کامل در لاگ نمی‌نشیند
      http: r.status, success: j?.success, code: j?.code, message: j?.message,
    }))

    if (j && (j.success === true || j.data === true)) return { ok: true }
    return { ok: false, message: 'ارسالِ کدِ پیامکی ناموفق بود؛ چند لحظه بعد دوباره تلاش کنید' }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویسِ پیامک' }
  }
}

export async function verifyOtp(mobile: string, code: string): Promise<{ ok: boolean; message?: string }> {
  const m = normMobile(mobile)
  const rec = await readOtp(m)
  if (!rec) return { ok: false, message: 'کدی ارسال نشده؛ ابتدا کد را دریافت کنید' }
  if (Date.now() - rec.at > TTL) return { ok: false, message: 'کد منقضی شده؛ دوباره دریافت کنید' }
  if (rec.tries >= MAX_TRIES) return { ok: false, message: 'تعدادِ تلاش زیاد شد؛ کدِ جدید بگیرید' }
  if (hashCode(String(code).replace(/[^0-9]/g, '').trim()) !== rec.hash) {
    await writeJson(otpPath(m), { ...rec, tries: rec.tries + 1 })
    return { ok: false, message: 'کد نادرست است' }
  }
  await writeJson(otpPath(m), { ...rec, tries: MAX_TRIES + 1, verifiedAt: Date.now() })   // مصرف‌شده + نشانِ تأیید
  return { ok: true }
}

/* آیا این شماره اخیراً کدش را تأیید کرده؟ (پیش‌شرطِ استعلامِ شاهکار) */
export async function wasOtpVerified(mobile: string): Promise<boolean> {
  const rec = await readOtp(normMobile(mobile))
  return !!(rec?.verifiedAt && Date.now() - rec.verifiedAt < VERIFIED_WINDOW)
}

/* ── نشانِ «هویتش استعلام شد» ───────────────────────────────────────
   وقتی شاهکار و ثبت‌احوال کد ملی را تأیید کردند، اینجا علامت می‌خورد تا
   مرحله‌ی ساختِ حساب بداند این کد ملی واقعاً استعلام شده است.

   خودِ کد ملی ذخیره نمی‌شود، فقط هشِ HMACش — چون این باکت عمومی است و
   کد ملی داده‌ی هویتی است. برای تطبیق هم همان هش کافی است. */
export async function markIdentityVerified(mobile: string, nationalId: string): Promise<void> {
  const m = normMobile(mobile)
  const rec = await readOtp(m)
  if (!rec) return
  await writeJson(otpPath(m), { ...rec, idHash: hashCode(nationalId), idAt: Date.now() })
}

/** آیا همین کد ملی برای همین شماره اخیراً استعلام شده؟ */
export async function wasIdentityVerified(mobile: string, nationalId: string): Promise<boolean> {
  const rec = await readOtp(normMobile(mobile))
  if (!rec?.idHash || !rec.idAt) return false
  if (Date.now() - rec.idAt > VERIFIED_WINDOW) return false
  return rec.idHash === hashCode(String(nationalId).replace(/[^0-9]/g, ''))
}
