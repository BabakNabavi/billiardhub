/* ─────────────────────────────────────────────────────────────
   پیامک خدماتی — اطلاع‌رسانی تراکنش خود کاربر (رزرو، لغو، تسویه).

   ⚠ این فایل فقط برای پیامک «خدماتی» است. پیامک تبلیغاتی لاین و مجوز
   جدا دارد و از نظر قانونی به رضایت صریح کاربر و راه لغو اشتراک نیاز
   دارد؛ هرگز از این‌جا تبلیغات نفرستید.

   کلید خاموش/روشن: SMS_NOTIFICATIONS=on
   پیش‌فرض خاموش است تا در دوره‌ی تست، هر رزرو آزمایشی هزینه نسازد.
   روشن‌کردنش فقط تغییر متغیر محیطی است، نه دیپلوی مجدد.
   ───────────────────────────────────────────────────────────── */

const SEND_URL = 'https://s.api.ir/api/sw1/SendSms'

const normMobile = (m: string) =>
  String(m || '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^0-9]/g, '')

const isMobile = (m: string) => /^09\d{9}$/.test(m)

export interface SmsResult {
  ok: boolean
  skipped?: boolean      // خاموش بود یا شماره‌ای نبود
  message?: string
}

interface Envelope { success?: boolean; code?: number; message?: string | null; data?: number | string | null }

/** آیا ارسال پیامک اطلاع‌رسانی روشن است؟ */
export const smsEnabled = () => process.env.SMS_NOTIFICATIONS === 'on'

/** ارسال پیامک به یک یا چند شماره. هیچ‌وقت throw نمی‌کند. */
export async function sendSms(mobiles: string[], message: string): Promise<SmsResult> {
  const list = [...new Set(mobiles.map(normMobile).filter(isMobile))]
  if (list.length === 0) return { ok: false, skipped: true, message: 'شماره‌ی معتبری نبود' }
  if (!message.trim()) return { ok: false, skipped: true, message: 'متن پیامک خالی است' }

  if (!smsEnabled()) {
    /* در حالت خاموش فقط لاگ می‌شود تا بشود جریان را دنبال کرد */
    console.info('[sms:off]', list.join(','), '|', message.replace(/\s+/g, ' ').slice(0, 80))
    return { ok: false, skipped: true, message: 'ارسال پیامک خاموش است' }
  }

  const key = process.env.SMS_API_KEY
  if (!key) return { ok: false, skipped: true, message: 'کلید سرویس پیامک تنظیم نشده' }

  try {
    const r = await fetch(SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ message, mobiles: list }),
    })
    const j = await r.json().catch(() => null) as Envelope | null

    if (!j || j.success !== true) {
      console.error('SendSms failed:', j?.message || r.status)
      return { ok: false, message: 'ارسال پیامک ناموفق بود' }
    }
    return { ok: true }
  } catch {
    console.error('SendSms: network error')
    return { ok: false, message: 'خطا در اتصال به سرویس پیامک' }
  }
}

/* بی‌صدا و بدون انتظار — اطلاع‌رسانی هیچ‌وقت نباید جریان اصلی (پرداخت،
   لغو، تسویه) را کند یا خراب کند. */
export function notify(mobile: string | null | undefined, message: string): void {
  if (!mobile) return
  void sendSms([mobile], message).catch(() => { /* بی‌صدا */ })
}

/* ── متن‌ها — یک‌جا تا لحن و قالب یکدست بماند ────────────────────── */

const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')

/* ── قالبِ مشترک ──────────────────────────────────────────────
   هر پیامک سه بخش دارد:

     خطِ اول   «{نام} گرامی» — یا اگر نام نداشتیم، نامِ برند
     بدنه      خودِ خبر
     خطِ آخر   www.billiardhub.net

   نشانیِ سایت جای سرصفحه‌ی «بیلیارد هاب» را گرفت: هم برند را
   می‌رساند، هم گیرنده می‌تواند مستقیم برود و ببیند. دو خط برای یک
   کار لازم نیست، و پیامکِ فارسی هر ۷۰ کاراکتر یک بخش هزینه دارد.

   نامِ خالی حالتِ عادی است — کاربری که نامش را ثبت نکرده باید همان
   پیامک را بگیرد، فقط بی‌خطاب. */
const SITE = 'www.billiardhub.net'

const wrap = (name: string, body: string) =>
  `${name.trim() ? `${name.trim()} گرامی` : 'بیلیارد هاب'}\n${body}\n${SITE}`

export const SMS = {
  /* سرصفحه‌ی پیام‌هایی که گیرنده‌ی نام‌دار ندارند */
  brand: 'بیلیارد هاب',

  /** پوششِ عمومی — برای پیام‌هایی که قالبِ اختصاصی ندارند */
  wrap,

  bookingConfirmed: (name: string, club: string, date: string, time: string, ref: string) =>
    wrap(name, `رزرو شما در ${club} برای ${date} ساعت ${time} قطعی شد.\nکد پیگیری: ${ref}`),

  bookingCancelled: (name: string, club: string, date: string, refund: number) =>
    wrap(name, refund > 0
      ? `رزرو شما در ${club} برای ${date} لغو شد.\nمبلغ ${fa(refund)} تومان تا ۷۲ ساعت آینده بازمی‌گردد.`
      : `رزرو شما در ${club} برای ${date} لغو شد.`),

  /* پیام باشگاه‌دار عمداً کامل است: مدیر باید بدون بازکردن سایت
     بداند کدام میز، چه ساعتی، چه روزی و به نام چه کسی رزرو شده. */
  newBookingForOwner: (owner: string, club: string, date: string, time: string, table: string, by: string) =>
    wrap(owner, `${table || 'یک میز'} در باشگاه ${club}\n`
      + `تاریخ ${date} از ساعت ${time}`
      + `${by ? ` توسط ${by}` : ''} رزرو شد.`),

  settlementPaid: (name: string, amount: number) =>
    wrap(name, `تسویه به مبلغ ${fa(amount)} تومان به حساب شما واریز شد.`),

  /* هشدارِ گزارشِ تخلف به ادمین. عنوانِ آگهی داخلش می‌آید تا ادمین
     بدونِ بازکردنِ پنل بداند موضوع چیست و فوریتش را بسنجد. */
  reportCreated: (kind: string, title: string, reason: string) =>
    wrap('', `گزارش تخلف تازه روی ${kind}${title ? ` «${title.slice(0, 40)}»` : ''}\n`
      + `دلیل: ${reason}\n`
      + `بررسی: /admin/reports`),
}
