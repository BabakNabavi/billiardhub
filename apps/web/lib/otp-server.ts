import { createHmac } from 'crypto'
import { inquiryKey } from './inquiry-key'
import { writeJson, readJsonFresh, safeKey } from './social-server'
import { rpc } from './finance/db'
import { hasAssignedPrefix, INVALID_MOBILE_MESSAGE } from './auth/phone'

/* (ثابت نشانی پروژه از این‌جا برداشته شد: در هیچ‌جای این فایل
   استفاده نمی‌شد. منبع واحدش `lib/supabase-config.ts` است.) */

/* کد را هش‌شده ذخیره می‌کنیم تا حتی با خواندن فایل هم کد لو نرود.

   کلید عمدا fallback ندارد: پیش‌تر اگر JWT_SECRET تنظیم نبود، کدها با
   رشته‌ی ثابت داخل همین فایل هش می‌شدند — یعنی هر کسی که مخزن را
   می‌خواند می‌توانست کد تأیید را از روی هش بسازد. حالا نبود کلید
   صدا می‌کند به‌جای اینکه بی‌صدا امنیت را پایین بیاورد. */
const otpKey = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set — OTP hashing unavailable')
  return s
}
const hashCode = (code: string) => createHmac('sha256', otpKey()).update(String(code)).digest('hex')

/* OTP پیامکی — کد را خودمان می‌سازیم/ذخیره/می‌سنجیم و سرویس s.api.ir فقط
   پیامک را می‌رساند. ذخیره روی همان Supabase Storage (مثل استوری/دایرکت). */
const SMS_URL = 'https://s.api.ir/api/sw1/SmsOTP'   // sw1 = s‑w‑یک (نه swl)
const TEMPLATE = 2                    // قالب سرویس: ۲ = «کد تایید» (مناسب ثبت‌نام)
                                     // (افزودن نام «بیلیارد هاب» به ته پیامک = تنظیم سطح حساب از پشتیبانی s.api.ir)
const TTL = 5 * 60 * 1000             // اعتبار کد: ۵ دقیقه (۲ دقیقه کوتاه بود و زود منقضی می‌شد)
const RESEND = 60 * 1000              // فاصله‌ی مجاز ارسال مجدد: ۶۰ ثانیه
const MAX_TRIES = 5

interface OtpRec {
  hash: string; at: number; tries: number; verifiedAt?: number
  /* هش کد ملی استعلام‌شده + زمانش (خود کد ملی ذخیره نمی‌شود) */
  idHash?: string; idAt?: number
}
const VERIFIED_WINDOW = 30 * 60 * 1000   // نشان «تأییدشده» تا ۳۰ دقیقه برای مرحله‌ی بعدی (شاهکار)
const otpPath = (mobile: string) => `social/otp/${safeKey(mobile)}.json`
const normMobile = (m: string) => (m || '').replace(/[^0-9]/g, '')

/* ── چرا دو مسیر ──────────────────────────────────────────────
   رکوردهای OTP تا امروز در Supabase Storage بودند. مهاجرتِ ۰۹۹
   می‌بردشان به دیتابیس، چون شمارشِ تلاش آن‌جا اتمیک است — و
   اتمیک‌نبودنش یک باگِ امنیتیِ واقعی بود (شرحش در خودِ مهاجرت).

   ⚠️ ولی ترتیبِ «اول مهاجرت، بعد دیپلوی» تضمین‌شده نیست. اگر این
   کد پیش از اجرای مهاجرت بالا برود و مسیرِ پشتیبان نداشته باشد،
   ورود و ثبت‌نامِ همه می‌شکند. پس تا وقتی تابع روی دیتابیس نیست،
   همان مسیرِ Storage کار می‌کند و هیچ‌کس متوجه نمی‌شود.

   ⚠️ فقط PGRST202 («تابع وجود ندارد») پس‌افت می‌دهد. هر خطای
   دیگری — قطعی، مجوز — باید شکست بماند، وگرنه یک اختلالِ گذرا
   بی‌صدا ما را به مسیرِ غیراتمیک برمی‌گرداند.
   ───────────────────────────────────────────────────────────── */
const MISSING = 'PGRST202'
/* ⚠️ یک‌بار در عمرِ پروسه هشدار بده. بدونِ این، «مهاجرت اجرا نشده»
   هیچ نشانه‌ای ندارد و ما فکر می‌کنیم اصلاحِ اتمیک فعال است در حالی
   که کد روی همان مسیرِ آسیب‌پذیر می‌دود. */
let warnedMissing = false

/* ── قراردادِ این ماژول: هیچ تابعی خطا پرتاب نمی‌کند ──────────────
   ⚠️ تا پیش از مهاجرتِ ۰۹۹، هیچ‌کدام از این توابع نمی‌توانستند throw
   کنند: `readJsonFresh` خطا را می‌بلعید و `writeJson` هم. شش
   فراخوان در مسیرِ ورود و ثبت‌نام روی همان فرض نوشته شده‌اند و
   try/catch ندارند.

   اگر مسیرِ دیتابیس خطا پرتاب کند، آن شش‌تا ۵۰۰ می‌دهند — بدونِ
   بدنه‌ی JSON، پس کاربر حتی پیامِ فارسی هم نمی‌بیند. بدتر: مسیرِ
   شاهکار **بعد از** پرداختِ استعلام صدا زده می‌شود، یعنی یک اختلالِ
   لحظه‌ای پولِ استعلام را می‌سوزاند.

   پس هر تابع خودش خطا را می‌گیرد و به حالتِ امن می‌افتد:
     • دروازه‌های امنیتی (`wasOtpVerified`, `wasIdentityVerified`)
       ⟵ false. بسته، نه باز.
     • نوشتنِ بهترین‌تلاش (`markIdentityVerified`) ⟵ سکوت + لاگ.
     • مسیرهای کاربری (`sendOtp`, `verifyOtp`) ⟵ پیامِ فارسی.
   ───────────────────────────────────────────────────────────── */

/** `null` یعنی «تابع نیست، برو سراغ Storage». خطای واقعی throw می‌شود
 *  و فراخوانِ داخلِ همین فایل می‌گیردش. */
async function otpRpc<T>(fn: string, args: Record<string, unknown>): Promise<{ data: T | null } | null> {
  const { data, error } = await rpc<T>(fn, args)
  if (error) {
    if (error.code === MISSING) {
      if (!warnedMissing) {
        warnedMissing = true
        console.warn('[otp] توابعِ bh_otp_* روی دیتابیس نیستند — مهاجرتِ ۰۹۹ اجرا نشده. مسیرِ غیراتمیکِ Storage فعال است.')
      }
      return null
    }
    /* خطای واقعی: بالا می‌رود تا فراخوان تصمیم بگیرد */
    throw new Error(`otp rpc ${fn}: ${error.message ?? 'failed'}`)
  }
  return { data }
}

/* خواندن همیشه‌تازه (cache-busted) — کش لبه‌ی Supabase رکورد کهنه می‌داد و
   کد تازه را «منقضی» نشان می‌داد. باکت club-media عمومی است. */
async function readOtp(m: string): Promise<OtpRec | null> {
  /* رکورد OTP دیگر در باکت عمومی نیست و با URL عمومی خوانده
     نمی‌شود. `readJsonFresh` خودش تشخیص می‌دهد مسیر خصوصی است و با
     کلید سرویس دانلود می‌کند — دانلود مستقیم کش لبه ندارد، پس
     همان تازگی که این‌جا لازم بود حفظ می‌شود. */
  const rec = await readJsonFresh<OtpRec | null>(otpPath(m), null)
  return rec ?? null
}

/** کدام متن؟ `reset` متن اختصاصی تغییر رمز را می‌فرستد. */
export type OtpPurpose = 'generic' | 'reset'

export async function sendOtp(
  mobile: string, purpose: OtpPurpose = 'generic',
): Promise<{ ok: boolean; message?: string; wait?: number }> {
  const m = normMobile(mobile)
  if (!/^09\d{9}$/.test(m)) return { ok: false, message: 'شماره‌ی موبایل معتبر نیست' }

  if (!hasAssignedPrefix(m)) return { ok: false, message: INVALID_MOBILE_MESSAGE }

  const code = String(Math.floor(10000 + Math.random() * 90000))   // ۵ رقمی
  const hash = hashCode(code)

  /* مسیرِ دیتابیس: گاردِ ارسالِ مجدد و نوشتنِ کد در یک تراکنش، پس
     دو درخواستِ هم‌زمان دو پیامک نمی‌فرستند. */
  let issued: { data: { allowed: boolean; wait_sec: number }[] | null } | null
  try {
    issued = await otpRpc<{ allowed: boolean; wait_sec: number }[]>(
      'bh_otp_issue', { p_mobile: m, p_hash: hash, p_resend_ms: RESEND },
    )
  } catch (e) {
    console.error('[otp] bh_otp_issue:', e)
    return { ok: false, message: 'سرویس تأیید در دسترس نیست؛ چند لحظه بعد دوباره تلاش کنید' }
  }
  if (issued) {
    const row = Array.isArray(issued.data) ? issued.data[0] : undefined
    if (row && row.allowed === false) {
      return { ok: false, message: 'کمی صبر کنید و دوباره تلاش کنید', wait: row.wait_sec }
    }
  } else {
    /* مهاجرتِ ۰۹۹ هنوز اجرا نشده — همان مسیرِ قبلی */
    const prev = await readOtp(m)
    const now = Date.now()
    if (prev && now - prev.at < RESEND) {
      return { ok: false, message: 'کمی صبر کنید و دوباره تلاش کنید', wait: Math.ceil((RESEND - (now - prev.at)) / 1000) }
    }
    await writeJson(otpPath(m), { hash, at: now, tries: 0 })
  }

  /* ── متن اختصاصی تغییر رمز، اگر ثبت شده باشد ──
     قالب عمومی `s.api.ir` فقط می‌گوید «کد تایید: ۱۲۳۴۵». کسی که آن
     را می‌گیرد در حالی که خودش چیزی نخواسته، نمی‌فهمد یک نفر دارد
     رمزش را عوض می‌کند — و همان جمله تنها هشداری است که می‌گیرد.

     تا وقتی کد متن در `/admin/sms` وارد نشده، `sendPattern` بی‌صدا
     رد می‌شود و مسیر قدیمی کارش را می‌کند. یعنی این تغییر هیچ‌چیز را
     نمی‌شکند و به‌محض واردکردن کد خودش فعال می‌شود. */
  if (purpose === 'reset') {
    try {
      const { sendPattern } = await import('./sms-server')
      const r = await sendPattern('password_reset_otp', m, [code])
      if (r.ok) return { ok: true }
      if (!r.skipped) {
        /* ثبت شده بود ولی ارسالش شکست خورد — با مسیر دیگر دوباره
           تلاش نمی‌کنیم، چون کد یکی است و دو پیامک متفاوت گیج‌کننده. */
        return { ok: false, message: r.message ?? 'ارسال کد پیامکی ناموفق بود' }
      }
    } catch { /* به مسیر قدیمی می‌افتیم */ }
  }

  const key = inquiryKey()
  if (!key) {
    /* پیش‌تر این‌جا `ok: true` برمی‌گشت — یعنی کلید تنظیم نبود، هیچ
       پیامکی نمی‌رفت، ولی همه‌ی لایه‌های بالاتر «ارسال شد» می‌دیدند و
       کاربر منتظر کدی می‌ماند که ساخته شده بود ولی هرگز فرستاده نشد.

       حالت آزمایشی محلی همچنان کار می‌کند (کد در لاگ سرور می‌آید تا
       بشود بدون پیامک تست کرد)، ولی وضعیت صادقانه گزارش می‌شود. */
    console.warn('[otp] SMS_API_KEY تنظیم نشده — کد ساخته شد ولی ارسال نشد. کد آزمایشی:', code)
    return { ok: false, message: 'سرویس پیامک پیکربندی نشده است' }
  }

  try {
    const r = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ code, mobile: m, template: TEMPLATE }),
    })
    /* سرویس همیشه ۲۰۰ می‌دهد؛ نتیجه‌ی واقعی در success/message است. */
    if (r.status === 401 || r.status === 403) return { ok: false, message: 'کلید سرویس پیامک پذیرفته نشد' }
    const j = await r.json().catch(() => null) as { success?: boolean; data?: boolean; message?: string; code?: number } | null

    /* پاسخ سرویس همیشه لاگ می‌شود — موفق یا ناموفق.

       تا امروز فقط شکست لاگ می‌شد، پس وقتی سرویس «موفق» می‌گفت ولی
       پیامک به دست کاربر نمی‌رسید (اعتبار تمام‌شده، قالب تأییدنشده،
       فیلتر اپراتور) هیچ ردی نمی‌ماند تا بشود دنبالش را گرفت. */
    console.info('[otp] SmsOTP →', JSON.stringify({
      mobile: m.slice(0, 4) + '***' + m.slice(-4),   // شماره‌ی کامل در لاگ نمی‌نشیند
      http: r.status, success: j?.success, code: j?.code, message: j?.message,
    }))

    if (j && (j.success === true || j.data === true)) return { ok: true }
    return { ok: false, message: 'ارسال کد پیامکی ناموفق بود؛ چند لحظه بعد دوباره تلاش کنید' }
  } catch {
    return { ok: false, message: 'خطا در اتصال به سرویس پیامک' }
  }
}

const VERIFY_MSG: Record<string, string> = {
  none:     'کدی ارسال نشده؛ ابتدا کد را دریافت کنید',
  expired:  'کد منقضی شده؛ دوباره دریافت کنید',
  too_many: 'تعداد تلاش زیاد شد؛ کد جدید بگیرید',
  wrong:    'کد نادرست است',
}

export async function verifyOtp(mobile: string, code: string): Promise<{ ok: boolean; message?: string }> {
  const m = normMobile(mobile)
  const clean = String(code).replace(/[^0-9]/g, '').trim()

  /* ⚠️ کلِ بررسی در یک تراکنشِ دیتابیس. نسخه‌ی Storage شمارنده را
     read-then-write بالا می‌برد و N حدسِ هم‌زمان یک بار شمرده
     می‌شد — یعنی سقفِ پنج‌تایی عملا برداشته بود. */
  let res: { data: string | null } | null
  try {
    res = await otpRpc<string>('bh_otp_verify', {
      p_mobile: m, p_hash: hashCode(clean), p_ttl_ms: TTL, p_max_tries: MAX_TRIES,
    })
  } catch (e) {
    /* ⚠️ به مسیرِ Storage پس‌افت **نمی‌کنیم**: آن مسیر همان شمارشِ
       غیراتمیک است و یک قطعیِ ساختگی می‌توانست عمدا ما را رویش
       بیندازد تا سقفِ تلاش دور زده شود. بسته می‌مانیم. */
    console.error('[otp] bh_otp_verify:', e)
    return { ok: false, message: 'سرویس تأیید در دسترس نیست؛ چند لحظه بعد دوباره تلاش کنید' }
  }
  if (res) {
    const status = String(res.data ?? 'none')
    return status === 'ok' ? { ok: true } : { ok: false, message: VERIFY_MSG[status] ?? VERIFY_MSG.none }
  }

  /* مهاجرتِ ۰۹۹ هنوز اجرا نشده — مسیرِ قبلی، با همان ضعفِ شناخته‌شده */
  const rec = await readOtp(m)
  if (!rec) return { ok: false, message: 'کدی ارسال نشده؛ ابتدا کد را دریافت کنید' }
  if (Date.now() - rec.at > TTL) return { ok: false, message: 'کد منقضی شده؛ دوباره دریافت کنید' }
  if (rec.tries >= MAX_TRIES) return { ok: false, message: 'تعداد تلاش زیاد شد؛ کد جدید بگیرید' }
  if (hashCode(clean) !== rec.hash) {
    await writeJson(otpPath(m), { ...rec, tries: rec.tries + 1 })
    return { ok: false, message: 'کد نادرست است' }
  }
  await writeJson(otpPath(m), { ...rec, tries: MAX_TRIES + 1, verifiedAt: Date.now() })   // مصرف‌شده + نشان تأیید
  return { ok: true }
}

/* آیا این شماره اخیرا کدش را تأیید کرده؟ (پیش‌شرط استعلام شاهکار) */
export async function wasOtpVerified(mobile: string): Promise<boolean> {
  const m = normMobile(mobile)
  const st = await otpState(m)
  if (st) {
    if (!st.verified_at) return false
    const at = Date.parse(st.verified_at)
    return Number.isFinite(at) && Date.now() - at < VERIFIED_WINDOW
  }
  const rec = await readOtp(m)
  return !!(rec?.verifiedAt && Date.now() - rec.verifiedAt < VERIFIED_WINDOW)
}

interface OtpState { verified_at: string | null; id_hash: string | null; id_at: string | null }

/** `null` یعنی مهاجرت اجرا نشده و باید از Storage خواند */
async function otpState(m: string): Promise<OtpState | null> {
  let r: { data: OtpState[] | null } | null
  try {
    r = await otpRpc<OtpState[]>('bh_otp_state', { p_mobile: m })
  } catch (e) {
    /* ⚠️ دروازه‌ی امنیتی: خطا یعنی «نمی‌دانیم»، و «نمی‌دانیم» باید
       «نه» معنا بدهد. شیءِ خالی برمی‌گردانیم نه `null`، چون `null`
       یعنی «برو سراغ Storage» و آن‌جا هم جوابِ درست را نداریم. */
    console.error('[otp] bh_otp_state:', e)
    return { verified_at: null, id_hash: null, id_at: null }
  }
  if (!r) return null
  const row = Array.isArray(r.data) ? r.data[0] : undefined
  /* ردیف نبود ⇒ شماره‌ای ثبت نشده. شیءِ خالی برمی‌گردانیم نه `null`،
     چون `null` معنایش «برو سراغ Storage» است. */
  return row ?? { verified_at: null, id_hash: null, id_at: null }
}

/* ── نشان «هویتش استعلام شد» ───────────────────────────────────────
   وقتی شاهکار و ثبت‌احوال کد ملی را تأیید کردند، اینجا علامت می‌خورد تا
   مرحله‌ی ساخت حساب بداند این کد ملی واقعا استعلام شده است.

   خود کد ملی ذخیره نمی‌شود، فقط هش HMACش — چون این باکت عمومی است و
   کد ملی داده‌ی هویتی است. برای تطبیق هم همان هش کافی است. */
export async function markIdentityVerified(mobile: string, nationalId: string): Promise<void> {
  const m = normMobile(mobile)
  /* ⚠️ همان نرمال‌سازیِ `wasIdentityVerified`. بدونِ آن، کد ملیِ
     قالب‌دار هشی می‌نوشت که هیچ‌وقت با خواندن نمی‌خواند و کاربر
     بی‌صدا «تأییدنشده» می‌ماند. */
  const idHash = hashCode(String(nationalId).replace(/[^0-9]/g, ''))
  /* ⚠️ این تابع **بعد از** پرداختِ استعلامِ شاهکار صدا زده می‌شود
     (app/api/shahkar/route.ts). اگر خطا پرتاب کند، یک استعلامِ
     موفق و حساب‌شده به ۵۰۰ تبدیل می‌شود و کاربر باید دوباره
     پولش را بدهد. پس شکست این‌جا فقط لاگ می‌شود. */
  try {
    const done = await otpRpc('bh_otp_mark_identity', { p_mobile: m, p_id_hash: idHash })
    if (done) return
  } catch (e) {
    console.error('[otp] bh_otp_mark_identity:', e)
    return
  }
  const rec = await readOtp(m)
  if (!rec) return
  await writeJson(otpPath(m), { ...rec, idHash, idAt: Date.now() })
}

/** آیا همین کد ملی برای همین شماره اخیرا استعلام شده؟ */
export async function wasIdentityVerified(mobile: string, nationalId: string): Promise<boolean> {
  const m = normMobile(mobile)
  const want = hashCode(String(nationalId).replace(/[^0-9]/g, ''))

  const st = await otpState(m)
  if (st) {
    if (!st.id_hash || !st.id_at) return false
    /* ⚠️ اگر تاریخ خوانده نشود، `NaN` هر مقایسه‌ای را false می‌کند و
       پنجره‌ی سی‌دقیقه‌ای **بی‌صدا رد می‌شد** — یعنی هشِ کهنه هنوز
       هویت را تأیید می‌کرد. صریح بسته می‌شود. */
    const at = Date.parse(st.id_at)
    if (!Number.isFinite(at) || Date.now() - at > VERIFIED_WINDOW) return false
    return st.id_hash === want
  }

  const rec = await readOtp(m)
  if (!rec?.idHash || !rec.idAt) return false
  if (Date.now() - rec.idAt > VERIFIED_WINDOW) return false
  return rec.idHash === want
}
