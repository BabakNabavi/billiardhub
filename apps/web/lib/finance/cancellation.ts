/* ─────────────────────────────────────────────────────────────
   سیاستِ کنسلی — قابلِ تنظیم و متمرکز (هاردکد در API نیست).
   درصدِ بازپرداخت بر اساسِ فاصله تا زمانِ شروعِ رزرو.
   ───────────────────────────────────────────────────────────── */

export interface CancellationTier { minHoursBefore: number; refundPercent: number; label: string }

/* از بالا به پایین ارزیابی می‌شود؛ اولین موردی که شرطش برقرار شد اعمال می‌گردد.
   این جدول باید همیشه با بند «لغو رزرو و بازگشت وجه» در صفحه‌ی قوانین
   (lib/legal-content.ts → TERMS → cancellation) یکسان بماند. */
export const CANCELLATION_POLICY: CancellationTier[] = [
  { minHoursBefore: 2, refundPercent: 100, label: 'بیش از ۲ ساعت مانده — بازپرداخت کامل' },
  { minHoursBefore: 0, refundPercent: 0,   label: 'کمتر از ۲ ساعت مانده — بدون بازپرداخت' },
]

export interface RefundDecision {
  refundPercent: number
  refundAmount: number
  feeAmount: number
  label: string
  hoursBefore: number
}

/** محاسبه‌ی مبلغِ بازپرداخت برای یک رزروِ پرداخت‌شده */
export function computeRefund(paidAmount: number, startsAt: Date, now = new Date()): RefundDecision {
  const hoursBefore = (startsAt.getTime() - now.getTime()) / 3_600_000
  const tier = CANCELLATION_POLICY.find(t => hoursBefore >= t.minHoursBefore)
    ?? { minHoursBefore: 0, refundPercent: 0, label: 'بدونِ بازپرداخت' }
  const refundAmount = Math.floor((paidAmount * tier.refundPercent) / 100)
  return {
    refundPercent: tier.refundPercent,
    refundAmount,
    feeAmount: paidAmount - refundAmount,
    label: tier.label,
    hoursBefore: Math.round(hoursBefore * 10) / 10,
  }
}

/** زمانِ شروعِ رزرو از تاریخ و ساعت‌های ذخیره‌شده */
export function bookingStartsAt(bookingDate: string, timeSlots: string | null): Date {
  const first = String(timeSlots ?? '').split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)[0] ?? 0
  return new Date(`${bookingDate}T${String(first).padStart(2, '0')}:00:00Z`)
}
