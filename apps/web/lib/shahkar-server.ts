import { wasOtpVerified } from './otp-server'
import { inquiryKey } from './inquiry-key'
import { canonicalBirthDate } from './jalali'
import { logHandled } from './log-handled'

/* احراز هویت شاهکار — تطبیق «کد ملی ↔ شماره موبایل» از سامانه‌ی شاهکار
   (s.api.ir / ShahkarPro). فقط برای شماره‌ای که کدش تازه تأیید شده مجاز است. */
const SHAHKAR_URL = 'https://s.api.ir/api/sw1/ShahkarPro'
const PERSON_URL  = 'https://s.api.ir/api/sw1/PersonInfo'

/* بی‌کلید فقط در توسعه‌ی صریح «تأیید» است. ⚠️ پیش‌تر در پروداکشن هم همین
   بود: اگر کلید پاک یا عوض می‌شد، هر کد ملی و هر تاریخ تولدی تأییدشده
   می‌نشست و هیچ‌چیز خبر نمی‌داد. «نه پروداکشن» کافی نیست — پروسه‌ای که
   بی NODE_ENV بالا بیاید هم باز می‌شد. */
const devBypass = () => process.env.NODE_ENV === 'development'

/* نرمال‌سازی نام فارسی برای مقایسه: ی/ک عربی، اعراب (فتحه تا سکون، تشدید،
   الفِ کوتاه)، کشیده، نیم‌فاصله و نشانه‌های جهت، خط‌تیره و فاصله‌ها.
   ⚠️ بازه‌ی اعراب پیش‌تر نیمه‌کاره بود (فقط U+0670) و «محمّد» با «محمد»
   نمی‌خواند. بازه: U+064B تا U+065F، U+0670، U+0640، U+200C/E/F و «-»؛
   فرمت‌کننده escapeها را به نویسه برمی‌گرداند، پس با تستِ تشدید پاسبانی می‌شود. */
export function normName(s: string): string {
  return (s || '')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[ً-ٰٟـ‌‎‏-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/* «محمد علی» و «محمدعلی» یک نام‌اند — ثبت‌احوال و کاربر فاصله را یکسان نمی‌گذارند */
const sameName = (a: string, b: string) => normName(a).replace(/ /g, '') === normName(b).replace(/ /g, '')

/** هویتی که استعلام شد، با همه‌ی اجزایش. نشانِ «تأییدشده» روی همین
 *  می‌نشیند، نه فقط روی کد ملی — وگرنه کسی می‌توانست با یک تاریخ تولد
 *  و نامِ درست استعلام بگیرد و حساب را با تاریخ و نامِ دیگری بسازد. */
export function identitySubject(nationalCode: string, birthDate: string, firstName: string, lastName: string): string {
  return [
    String(nationalCode).replace(/[^0-9]/g, ''),
    canonicalBirthDate(birthDate) ?? '',
    normName(firstName).replace(/ /g, ''),
    normName(lastName).replace(/ /g, ''),
  ].join('|')
}

type PersonData = { firstName?: string; lastName?: string; alive?: boolean; birthDate?: string; birth_date?: string }
type PersonEnvelope = { success?: boolean; code?: number; data?: PersonData | null; message?: string }

/* یک استعلام. سه نتیجه: پیدا شد، «با این تاریخ کسی نیست»، یا «نمی‌دانیم». */
async function lookup(key: string, nc: string, bd: string):
  Promise<{ kind: 'found'; data: PersonData } | { kind: 'none'; odd?: string } | { kind: 'unknown'; why: string }> {
  const r = await fetch(PERSON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ nationalCode: nc, birthDate: bd }),
  })
  const j = await r.json().catch(() => null) as PersonEnvelope | null
  /* ⚠️ «اعتبار» به‌تنهایی دیگر نشانه‌ی قطعی نیست: «تاریخ فاقد اعتبار است»
     هم با آن می‌خواند و تاریخِ اشتباه را «سرویس در دسترس نیست» می‌کرد */
  const denied = [401, 402, 403, 429].includes(r.status) || [401, 402, 403, 429].includes(j?.code ?? 0)
    || /trust level|سطح دسترسی|credit|balance|موجودی|شارژ|اعتبار (حساب|کافی|شما)/i.test(j?.message || '')
  if (denied) return { kind: 'unknown', why: `denied: ${j?.message || r.status}` }
  if (!j) return { kind: 'unknown', why: `no body: ${r.status}` }
  if (r.status >= 500 || (j.code ?? 0) >= 500) return { kind: 'unknown', why: `server: ${j.message || r.status}` }
  if (j.data && typeof j.data === 'object') return { kind: 'found', data: j.data }
  /* سرویس جواب داد ولی شخصی با این کد ملی و تاریخ تولد نداد. ⚠️ تا امروز
     این حالت فقط وقتی «مغایرت» بود که متنِ پیام با چند عبارتِ حدسی
     می‌خواند؛ هر متنِ دیگری «در دسترس نیست» خوانده می‌شد و ثبت‌نام با
     تاریخ تولدِ اشتباه پیش می‌رفت.
     : پاسخِ غیرعادی (۴xx یا success=false) — رد می‌شود ولی ثبت هم می‌شود،
     چون تغییرِ قالبِ درخواستِ سرویس همین شکل را می‌سازد و ثبت‌نامِ همه را
     با پیامِ «تاریخ تولد مطابقت ندارد» می‌خواباند. */
  const odd = r.status >= 400 || j.success === false ? `${r.status} ${j.code ?? ''} ${j.message ?? ''}` : undefined
  return { kind: 'none', odd }
}

/* استعلام مشخصات هویتی از ثبت‌احوال (کد ملی + تاریخ تولد) و تطبیق نام و
   نام‌خانوادگی. پیش‌شرط: شماره با کد پیامکی تأیید شده باشد.

   `unavailable` یعنی سرویس جوابِ قطعی نداد. فراخوان باید آن را «تأییدنشده»
   بخواند، نه «تأییدشده». */
export async function verifyPerson(
  mobile: string, nationalCode: string, birthDate: string, firstName: string, lastName: string,
  opts: { requireOtp?: boolean } = {},
): Promise<{ ok: boolean; match?: boolean; message?: string; unavailable?: boolean; code?: 'OTP_REQUIRED' }> {
  const m = (mobile || '').replace(/[^0-9]/g, '')
  const nc = (nationalCode || '').replace(/[^0-9]/g, '')
  const bd = canonicalBirthDate(birthDate)
  if (!/^\d{10}$/.test(nc)) return { ok: false, message: 'کد ملی معتبر نیست' }
  if (!bd) return { ok: false, message: 'تاریخ تولد معتبر نیست، آن را از تقویم انتخاب کنید' }
  if (!normName(firstName) || !normName(lastName)) return { ok: false, message: 'نام و نام خانوادگی الزامی است' }
  /* پیش‌شرط کد پیامکی فقط در مسیر ثبت‌نام لازم است؛ برای کاربر
     واردشده‌ای که شماره‌اش در حسابش ثبت است، تکرارش بی‌مورد است. */
  if (opts.requireOtp !== false && !(await wasOtpVerified(m))) {
    return { ok: false, code: 'OTP_REQUIRED', message: 'مهلت تأیید شماره تمام شده است، دوباره کد پیامکی بگیرید' }
  }

  const key = inquiryKey()
  if (!key) {
    if (devBypass()) return { ok: true, match: true }
    console.error('PersonInfo unavailable: inquiry key is not set')
    return { ok: false, unavailable: true, message: 'سرویس استعلام ثبت‌احوال در دسترس نیست، چند دقیقه بعد دوباره تلاش کنید' }
  }

  /* قالبِ تاریخی که سرویس می‌خواهد مستند نیست: فرمِ تایپی `1370/05/12`
     می‌فرستاد و تقویم `1370/5/12`. اول قالبِ کامل، و اگر کسی پیدا نشد
     قالبِ بی‌صفر — تا یک قالبِ اشتباه، تاریخِ درست را «مغایر» نکند. */
  const unpadded = bd.replace(/\/0/g, '/')
  const variants = unpadded === bd ? [bd] : [bd, unpadded]
  const odd: string[] = []
  try {
    for (const v of variants) {
      const res = await lookup(key, nc, v)
      if (res.kind === 'unknown') {
        console.error('PersonInfo unavailable:', res.why)
        return { ok: false, unavailable: true, message: 'سرویس استعلام ثبت‌احوال در دسترس نیست، چند دقیقه بعد دوباره تلاش کنید' }
      }
      if (res.kind === 'none') { if (res.odd) odd.push(res.odd); continue }
      if (res.data.alive === false) return { ok: true, match: false, message: 'این مشخصات در ثبت‌احوال قابل تأیید نیست' }
      /* اگر سرویس خودش تاریخ تولد را برگرداند، با همان هم بسنج — تا اگر روزی
         فقط با کد ملی جواب داد، تاریخِ اشتباه از تطبیقِ نام عبور نکند */
      const regBd = canonicalBirthDate(res.data.birthDate ?? res.data.birth_date)
      if (regBd && regBd !== bd) return { ok: true, match: false, message: 'تاریخ تولد با کد ملی مطابقت ندارد' }
      const okName = sameName(res.data.firstName || '', firstName) && sameName(res.data.lastName || '', lastName)
      return { ok: true, match: okName, message: okName ? undefined : 'نام و نام خانوادگی با کد ملی مطابقت ندارد' }
    }
    if (odd.length === variants.length) {
      void logHandled('shahkar/person-none', new Error(`PersonInfo odd negative: ${odd.join(' | ')}`)).catch(() => {})
    }
    return { ok: true, match: false, message: 'تاریخ تولد با کد ملی مطابقت ندارد' }
  } catch (e) {
    console.error('PersonInfo failed:', (e as Error).message)
    return { ok: false, unavailable: true, message: 'خطا در اتصال به سرویس استعلام، چند دقیقه بعد دوباره تلاش کنید' }
  }
}
export async function verifyIdentity(
  mobile: string, nationalCode: string, opts: { requireOtp?: boolean } = {},
): Promise<{ ok: boolean; match?: boolean; message?: string; code?: 'OTP_REQUIRED' }> {
  const m = (mobile || '').replace(/[^0-9]/g, '')
  const nc = (nationalCode || '').replace(/[^0-9]/g, '')
  if (!/^09\d{9}$/.test(m)) return { ok: false, message: 'شماره‌ی موبایل معتبر نیست' }
  if (!/^\d{10}$/.test(nc)) return { ok: false, message: 'کد ملی معتبر نیست' }

  /* پیش‌شرط: شماره باید تازه با پیامک تأیید شده باشد (ضد سوءاستفاده/هدررفت اعتبار).
     برای کاربر واردشده‌ای که شماره‌اش از قبل در حسابش ثبت است، لازم نیست. */
  if (opts.requireOtp !== false && !(await wasOtpVerified(m))) {
    return { ok: false, code: 'OTP_REQUIRED', message: 'مهلت تأیید شماره تمام شده است، دوباره کد پیامکی بگیرید' }
  }

  const key = inquiryKey()
  if (!key) {
    if (devBypass()) return { ok: true, match: true }   // محیط توسعه بدون کلید ⇒ رد نکن
    console.error('ShahkarPro unavailable: inquiry key is not set')
    return { ok: false, message: 'سرویس احراز هویت در دسترس نیست، چند دقیقه بعد دوباره تلاش کنید' }
  }

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
