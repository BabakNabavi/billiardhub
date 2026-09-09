/* ─────────────────────────────────────────────────────────────
   قالبِ زمان و عدد در تحریریه.

   ⚠️ همه‌ی ساعت‌ها تهران خوانده می‌شوند، نه ساعتِ دستگاهِ بیننده.
   خبر لحظه‌ی مشخصی دارد؛ اگر خواننده‌ای بیرون از ایران باشد، «۱۲:۴۵»
   باید همان ۱۲:۴۵ِ تحریریه بماند وگرنه با تاریخِ شمسیِ کنارش
   نمی‌خواند.
   ───────────────────────────────────────────────────────────── */

import { faDate, toFaDigits } from '../jalali'

const TEHRAN = 'Asia/Tehran'

/** «۱۲:۴۵» به وقتِ تهران */
export function clock(ts: number): string {
  if (!ts) return ''
  const hm = new Intl.DateTimeFormat('en-US', {
    timeZone: TEHRAN, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(ts))
  return toFaDigits(hm)
}

/** آیا این لحظه در «امروزِ» تهران است؟ */
function sameTehranDay(a: number, b: number): boolean {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TEHRAN })
  return f.format(new Date(a)) === f.format(new Date(b))
}

/* ── مُهرِ زمانِ جریانِ اخبار ──
   ⚠️ رفتارِ استانداردِ اتاقِ خبر: خبرِ امروز ساعت می‌گیرد و خبرِ
   قدیمی‌تر تاریخ. نمایشِ «۳ روز پیش» برای آرشیو بی‌فایده است و
   نمایشِ تاریخِ کامل برای خبرِ یک‌ساعت‌پیش سرد و بی‌جان. */
export function stamp(ts: number, now = Date.now()): string {
  if (!ts) return ''
  if (sameTehranDay(ts, now)) return clock(ts)
  return faDate(new Date(ts))
}

/** «۱۲ دقیقه پیش» — فقط برای پنجره‌ی کوتاه، وگرنه رشته‌ی خالی. */
export function ago(ts: number, now = Date.now()): string {
  if (!ts) return ''
  const d = now - ts
  if (d < 0 || d >= 6 * 3_600_000) return ''
  const m = Math.round(d / 60_000)
  if (m < 1) return 'همین حالا'
  if (m < 60) return `${toFaDigits(m)} دقیقه پیش`
  return `${toFaDigits(Math.round(m / 60))} ساعت پیش`
}

/** «۸ مرداد ۱۴۰۵» */
export const dateOf = (ts: number) => (ts ? faDate(new Date(ts)) : '')

/** شناسه‌ی ماشین‌خوانِ ISO برای `<time dateTime>` و اسکیما */
export const iso = (ts: number) => (ts ? new Date(ts).toISOString() : undefined)

/** «۴ دقیقه» — صفر یعنی متنی نیست، پس چیزی نشان داده نمی‌شود. */
export const readTime = (min: number) => (min > 0 ? `${toFaDigits(min)} دقیقه مطالعه` : '')

/** رتبه‌ی دورقمیِ پربازدیدها: ۰۱، ۰۲ … */
export const rank = (i: number) => toFaDigits(String(i + 1).padStart(2, '0'))
