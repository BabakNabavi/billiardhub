/* ─────────────────────────────────────────────────────────────
   پیامک خدماتی — اطلاع‌رسانی تراکنش خود کاربر (رزرو، نقش، تسویه).

   ⚠ این فایل فقط برای پیامک «خدماتی» است. پیامک تبلیغاتی خط و مجوز
   جدا دارد و از نظر قانونی به رضایت صریح کاربر و راه لغو اشتراک نیاز
   دارد؛ هرگز از این‌جا تبلیغات نفرستید.

   ── چرا الگو، نه متنِ آزاد ──
   خطِ خدماتیِ اشتراکیِ ملی‌پیامک متنِ دلخواه نمی‌پذیرد. هر متن یک‌بار
   در پنل ثبت و تأیید می‌شود و بعد فقط با `bodyId` و آرایه‌ی متغیرها
   فرستاده می‌شود:

     POST /api/send/shared/{key}
     { bodyId: 524, to: '0912…', args: ['بابک نبوی', 'باشگاه هافظ'] }

   `{0}` جای `args[0]` می‌نشیند و همین‌طور تا آخر. متنِ هر الگو در
   `docs/sms-patterns.md` هست — همان که در پنل ثبت می‌شود.

   ── چرا bodyId در تنظیمات است نه در کد ──
   کدِ هر متن را پنل بعد از تأیید می‌دهد، و اگر روزی متنی اصلاح یا
   اضافه شود کدش عوض می‌شود. گذاشتنش در کد یعنی هر بار یک دیپلوی.

   کلید خاموش/روشن: SMS_NOTIFICATIONS=on
   ───────────────────────────────────────────────────────────── */

import { sb } from './finance/db'

const SEND_URL = (key: string) => `https://console.melipayamak.com/api/send/shared/${key}`

/* پنلِ ملی‌پیامک کلید را داخلِ یک نشانیِ کامل نشان می‌دهد:
     https://console.melipayamak.com/api/send/shared/<کلید>

   طبیعی است که همان را یک‌جا کپی و در متغیر بگذارند. آن‌وقت نشانیِ
   نهایی دوتایی می‌شود و هر پیامک شکست می‌خورد — بی‌صدا، چون
   اطلاع‌رسانی عمداً هیچ‌وقت جریان اصلی را نمی‌شکند. یعنی خرابی ماه‌ها
   دیده نمی‌شود.

   گیومه هم همین‌جا برداشته می‌شود: در فرمِ متغیرهای محیطیِ Vercel
   گیومه بخشی از مقدار می‌شود، ولی چون در فایلِ .env معنایی ندارد،
   طبیعی است که کسی آن را بی‌ضرر بداند.

   پس هر شکلی داده شود، تکه‌ی آخر برداشته می‌شود. */
const cleanKey = (raw: string) => {
  const key = String(raw || '').trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[/\s]+$/, '')
    .split('/').pop() ?? ''

  /* پنل کلید را گاهی با خط‌تیره نشان می‌دهد
     (f616728d-bea2-…) و گاهی بدونِ آن. هر دو یک شناسه‌اند، ولی
     سرویس فقط شکلِ بی‌خط‌تیره را می‌پذیرد.

     شرطِ «نتیجه دقیقاً ۳۲ رقمِ شانزده‌شانزدهی شود» عمدی است: خط‌تیره
     را از هر مقداری برنمی‌داریم، فقط وقتی مطمئنیم همان GUID است. */
  const bare = key.replace(/-/g, '')
  return /^[0-9a-fA-F]{32}$/.test(bare) ? bare : key
}

const normMobile = (m: string) =>
  String(m || '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^0-9]/g, '')

const isMobile = (m: string) => /^09\d{9}$/.test(m)

export interface SmsResult {
  ok: boolean
  skipped?: boolean      // خاموش بود، شماره نبود، یا کدِ متن ثبت نشده
  message?: string
}

/** آیا ارسال پیامک اطلاع‌رسانی روشن است؟ */
export const smsEnabled = () => process.env.SMS_NOTIFICATIONS === 'on'

/* ── الگوها ──
   کلیدها با همان نام‌هایی که در `docs/sms-patterns.md` آمده‌اند. */
export const PATTERNS = [
  'booking_confirmed',
  'booking_cancelled_refund',
  'booking_cancelled',
  'booking_for_owner',
  'settlement_paid',
  'role_approved',
  'role_approved_tick',
  'role_rejected',
  'club_approved',
  'club_rejected',
  'tournament_registered',
  'tournament_cancelled',
  'waitlist_promoted',
  'report_created',

  /* ── پیامکِ باشگاه به اعضا ──
     این چهارتا با بقیه یک فرق مهم دارند: بقیه اطلاع‌رسانیِ تراکنشِ
     خودِ کاربرند، این‌ها دعوت و اطلاعیه‌اند. متنشان در
     `lib/sms/club-templates.ts` است و باشگاه‌دار بابتشان پول
     می‌دهد. */
  'club_tournament',
  'club_class',
  'club_offer',
  'club_notice',
] as const
export type PatternKey = typeof PATTERNS[number]

/* نگاشتِ کلید → کدِ متنِ پنل. یک ردیفِ JSON در `app_settings`:
     { "booking_confirmed": 524, "role_approved": 531, … }

   کوتاه کش می‌شود چون هر پیامک یک بار می‌خواندش و این مقدار عملاً
   هرگز عوض نمی‌شود؛ ولی کش هم نباید آن‌قدر بماند که بعد از افزودنِ
   کدِ تازه، ادمین مجبور به ریستارت شود. */
let cache: { at: number; map: Record<string, number> } | null = null

async function bodyIds(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < 60_000) return cache.map
  try {
    const { data } = await sb().from('app_settings')
      .select('value').eq('key', 'sms_body_ids').maybeSingle()
    const raw = (data as { value?: unknown } | null)?.value
    const map: Record<string, number> = {}
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        const n = Number(v)
        if (Number.isInteger(n) && n > 0) map[k] = n
      }
    }
    cache = { at: Date.now(), map }
    return map
  } catch {
    return cache?.map ?? {}
  }
}

/** فراموش‌کردنِ کش — بعد از ویرایشِ کدهای متن در پنل ادمین */
export const invalidateSmsCache = () => { cache = null }

/** آیا کدِ متنِ این الگوها ثبت شده؟ — برای بستنِ راهِ خریدِ الگوی بی‌کد */
export async function registeredPatterns(keys: readonly string[]): Promise<Set<string>> {
  const map = await bodyIds()
  return new Set(keys.filter(k => !!map[k]))
}

/**
 * ارسال یک الگو به یک شماره. هیچ‌وقت throw نمی‌کند.
 *
 * ترتیبِ `args` باید دقیقاً همان ترتیبی باشد که متن در پنل ثبت شده،
 * وگرنه مقدارها جابه‌جا می‌نشینند و پیامکِ بی‌معنی می‌رود.
 */
export async function sendPattern(
  key: PatternKey, mobile: string | null | undefined, args: (string | number)[],
): Promise<SmsResult> {
  const to = normMobile(String(mobile ?? ''))
  if (!isMobile(to)) return { ok: false, skipped: true, message: 'شماره‌ی معتبری نبود' }

  if (!smsEnabled()) {
    /* در حالت خاموش فقط لاگ می‌شود تا بشود جریان را دنبال کرد */
    console.info('[sms:off]', key, to, '|', args.join(' · ').slice(0, 90))
    return { ok: false, skipped: true, message: 'ارسال پیامک خاموش است' }
  }

  const apiKey = cleanKey(process.env.SMS_API_KEY ?? '')
  if (!apiKey) return { ok: false, skipped: true, message: 'کلید سرویس پیامک تنظیم نشده' }

  /* کلیدِ ملی‌پیامک یک GUID بی‌خط‌تیره است. شکلِ دیگر یعنی احتمالاً
     کلیدِ سرویسِ قبلی هنوز آن‌جاست. جلویش را نمی‌گیریم — شاید روزی
     شکلش عوض شود — ولی باید در لاگ دیده شود. */
  if (!/^[0-9a-fA-F]{32}$/.test(apiKey)) {
    console.warn('[sms] شکلِ کلید به کلیدِ ملی‌پیامک نمی‌خورد — SMS_API_KEY را بررسی کنید')
  }

  const bodyId = (await bodyIds())[key]
  if (!bodyId) {
    /* متن هنوز در پنل ثبت/تأیید نشده. این خطا نیست — حالتِ عادیِ
       پیش از راه‌اندازی است — ولی باید دیده شود، وگرنه ساکت گم می‌شود. */
    console.warn('[sms] کد متن ثبت نشده:', key)
    return { ok: false, skipped: true, message: `کد متن «${key}» ثبت نشده است` }
  }

  try {
    const r = await fetch(SEND_URL(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bodyId, to, args: args.map(a => String(a)) }),
    })
    const j = await r.json().catch(() => null) as { recId?: number | string; status?: string } | null

    /* پاسخِ موفق `recId` بزرگ‌تر از ۱۵ رقم می‌دهد؛ عددهای کوچک کدِ
       خطا هستند و `status` متنِ فارسی‌اش را دارد. */
    const rec = String(j?.recId ?? '')
    if (rec.length > 10 && !/^-/.test(rec)) return { ok: true }

    console.error('[sms] ارسال ناموفق:', key, '| recId:', rec, '| status:', j?.status)
    return { ok: false, message: j?.status || 'ارسال پیامک ناموفق بود' }
  } catch {
    console.error('[sms] خطای شبکه:', key)
    return { ok: false, message: 'خطا در اتصال به سرویس پیامک' }
  }
}

/** بی‌صدا و بدون انتظار — اطلاع‌رسانی هیچ‌وقت نباید جریان اصلی را بشکند */
export function notifyPattern(
  mobile: string | null | undefined, key: PatternKey, args: (string | number)[],
): void {
  if (!mobile) return
  void sendPattern(key, mobile, args).catch(() => { /* بی‌صدا */ })
}

/* عددها در پیامک فارسی خوانده می‌شوند */
export const faNum = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')
