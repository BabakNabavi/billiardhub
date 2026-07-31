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

export const SMS = {
  /* سرصفحه‌ی همه‌ی پیامک‌ها — تا نام برند در یک جا بماند */
  brand: 'بیلیارد هاب',
  bookingConfirmed: (club: string, date: string, time: string, ref: string) =>
    `بیلیارد هاب\nرزرو شما در ${club} برای ${date} ساعت ${time} قطعی شد.\nکد پیگیری: ${ref}`,

  bookingCancelled: (club: string, date: string, refund: number) =>
    refund > 0
      ? `بیلیارد هاب\nرزرو شما در ${club} برای ${date} لغو شد.\nمبلغ ${fa(refund)} تومان تا ۷۲ ساعت آینده بازمی‌گردد.`
      : `بیلیارد هاب\nرزرو شما در ${club} برای ${date} لغو شد.`,

  /* پیام باشگاه‌دار عمداً کامل است: مدیر باید بدون بازکردن سایت
     بداند کدام میز، چه ساعتی، چه روزی و به نام چه کسی رزرو شده. */
  newBookingForOwner: (club: string, date: string, time: string, table: string, by: string) =>
    `بیلیارد هاب\n`
    + `مدیریت محترم باشگاه ${club}\n`
    + `${table || 'یک میز'} در تاریخ ${date} از ساعت ${time}`
    + `${by ? ` توسط ${by}` : ''} رزرو شد.`,

  settlementPaid: (amount: number) =>
    `بیلیارد هاب\nتسویه به مبلغ ${fa(amount)} تومان به حساب شما واریز شد.`,
}
