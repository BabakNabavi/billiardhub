/* ─────────────────────────────────────────────────────────────
   سیاست لغو رزرو و بازگشت وجه — منبع واحد.
   هر جای سایت که درصد بازپرداخت، مبلغ بازگشتی یا امکان لغو را
   نشان می‌دهد باید از همین فایل بخواند؛ هاردکد در UI یا API ممنوع.
   ───────────────────────────────────────────────────────────── */

export interface CancellationTier {
  minHoursBefore: number   // از این تعداد ساعت مانده به شروع، به بالا
  refundPercent: number
  label: string            // متن کوتاه برای نمایش پس از محاسبه
  rule: string             // متن بند قانون برای نمایش در جدول قوانین
}

/* از بالا به پایین ارزیابی می‌شود؛ اولین موردی که شرطش برقرار شد اعمال می‌گردد.
   این جدول باید همیشه با بند «لغو رزرو و بازگشت وجه» در صفحه‌ی قوانین
   (lib/legal-content.ts → TERMS → cancellation) یکسان بماند. */
export const CANCELLATION_POLICY: CancellationTier[] = [
  { minHoursBefore: 4, refundPercent: 100, label: 'بیش از ۴ ساعت مانده — بازگشت کامل وجه', rule: 'لغو رزرو تا ۴ ساعت قبل از زمان رزرو: بازگشت کامل وجه' },
  { minHoursBefore: 3, refundPercent: 75,  label: 'بین ۳ تا ۴ ساعت مانده — بازگشت ۷۵٪ وجه', rule: 'لغو رزرو بین ۳ تا ۴ ساعت قبل از زمان رزرو: بازگشت ۷۵٪ وجه' },
  { minHoursBefore: 2, refundPercent: 50,  label: 'بین ۲ تا ۳ ساعت مانده — بازگشت ۵۰٪ وجه',  rule: 'لغو رزرو بین ۲ تا ۳ ساعت قبل از زمان رزرو: بازگشت ۵۰٪ وجه' },
  { minHoursBefore: 0, refundPercent: 0,   label: 'کمتر از ۲ ساعت مانده — بدون بازگشت وجه',  rule: 'کمتر از ۲ ساعت مانده به زمان رزرو: امکان لغو رزرو و بازگشت وجه وجود ندارد' },
]

/** کمترین فاصله تا شروع که هنوز لغو ممکن است (ساعت) */
export const MIN_CANCEL_HOURS = 2

/** عنوان و بندهای قانون برای نمایش یکدست در همه‌ی صفحات */
export const CANCELLATION_TITLE = 'قوانین لغو رزرو'
export const CANCELLATION_RULES = CANCELLATION_POLICY.map(t => t.rule)

/* قوانین عمومی رزرو — جدا از قوانین لغو، چون کاربر پیش از پرداخت
   باید هر دو را دیده باشد. یک منبع واحد تا در صفحه‌ی رزرو، صفحه‌ی
   قوانین و پیام تأیید یک چیز نوشته شود. */
export const BOOKING_TITLE = 'قوانین رزرو باشگاه'
export const BOOKING_RULES: string[] = [
  'رزرو تنها پس از پرداخت کامل مبلغ قطعی می‌شود؛ تا آن لحظه ساعت انتخابی برای شما نگه داشته نمی‌شود.',
  'ساعت رزرو به وقت رسمی ایران است و بازه‌ها ساعت‌به‌ساعت محاسبه می‌شوند.',
  'هزینه‌ی بازیکن اضافه بر اساس نرخ اعلام‌شده‌ی همان میز به مبلغ افزوده می‌شود.',
  'باشگاه می‌تواند رزرو روز جاری را ببندد؛ در این حالت تنها روزهای آینده قابل رزرو هستند.',
  'در صورت بروز مشکل فنی برای میز، باشگاه موظف است میز جایگزین بدهد یا کل مبلغ را بازگرداند.',
  'مسئولیت رعایت مقررات داخلی باشگاه بر عهده‌ی رزروکننده است.',
]

export interface RefundDecision {
  refundPercent: number
  refundAmount: number
  feeAmount: number
  label: string
  hoursBefore: number
  canCancel: boolean
}

/** محاسبه‌ی مبلغ بازپرداخت برای یک رزرو پرداخت‌شده */
export function computeRefund(paidAmount: number, startsAt: Date, now = new Date()): RefundDecision {
  const hoursBefore = (startsAt.getTime() - now.getTime()) / 3_600_000
  const tier = CANCELLATION_POLICY.find(t => hoursBefore >= t.minHoursBefore)
    ?? CANCELLATION_POLICY[CANCELLATION_POLICY.length - 1]!
  const refundAmount = Math.floor((paidAmount * tier.refundPercent) / 100)
  return {
    refundPercent: tier.refundPercent,
    refundAmount,
    feeAmount: paidAmount - refundAmount,
    label: tier.label,
    hoursBefore: Math.round(hoursBefore * 10) / 10,
    canCancel: hoursBefore >= MIN_CANCEL_HOURS,
  }
}

/** آیا رزرو هنوز قابل لغو است؟ (فقط بر اساس زمان — وضعیت رزرو جداگانه بررسی می‌شود) */
export function canCancelAt(startsAt: Date, now = new Date()): boolean {
  return (startsAt.getTime() - now.getTime()) / 3_600_000 >= MIN_CANCEL_HOURS
}

/* ساعت رزرو به وقت ایران ذخیره می‌شود (ایران از ۲۰۲۲ ساعت تابستانی ندارد،
   پس همیشه +۰۳:۳۰). بدون این آفست، زمان شروع ۳:۳۰ دیرتر حساب می‌شد و
   کاربر می‌توانست دیرتر از مهلت هم رزرو را با بازپرداخت لغو کند. */
const IRAN_OFFSET = '+03:30'

/** زمان شروع رزرو از تاریخ و ساعت‌های ذخیره‌شده */
export function bookingStartsAt(bookingDate: string, timeSlots: string | null): Date {
  const first = String(timeSlots ?? '').split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)[0] ?? 0
  return new Date(`${bookingDate}T${String(first).padStart(2, '0')}:00:00${IRAN_OFFSET}`)
}
