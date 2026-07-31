/* ─────────────────────────────────────────────────────────────
   تاریخ شمسی — منبع واحد تبدیل و نمایش.
   هر جای سایت که تاریخ به کاربر نشان داده می‌شود باید از این فایل
   استفاده کند تا هیچ‌جا تاریخ میلادی یا رقم لاتین دیده نشود.
   ───────────────────────────────────────────────────────────── */

export const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] as const
export const J_DAY_NAMES = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'] as const

/** ارقام لاتین → فارسی */
export const toFaDigits = (v: string | number): string =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/** عدد با جداکننده‌ی هزارگان و ارقام فارسی */
export const faNum = (n: unknown): string => Math.round(Number(n) || 0).toLocaleString('fa-IR')

/** میلادی → شمسی */
export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1]!
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365 }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
  return [jy, jm, jd]
}

/** شمسی → میلادی */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd
    + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186)
  let gy = 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365 }
  let gd = days + 1
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 0
  for (gm = 0; gm < 13 && gd > sal_a[gm]!; gm++) gd -= sal_a[gm]!
  return [gy, gm, gd]
}

/** «۸ مرداد ۱۴۰۵» از یک تاریخ ISO یا Date */
export function faDate(input: string | Date | null | undefined): string {
  if (!input) return '—'
  const d = input instanceof Date ? input : new Date(/^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00` : input)
  if (isNaN(d.getTime())) return '—'
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toFaDigits(jd)} ${J_MONTHS[jm - 1]} ${toFaDigits(jy)}`
}

/** «پنج‌شنبه، ۸ مرداد ۱۴۰۵» */
export function faDateLong(input: string | Date | null | undefined): string {
  if (!input) return '—'
  const d = input instanceof Date ? input : new Date(/^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00` : input)
  if (isNaN(d.getTime())) return '—'
  /* شنبه = ۰ در تقویم ایرانی؛ getDay(): یک‌شنبه = ۰ */
  const wd = J_DAY_NAMES[(d.getDay() + 1) % 7]
  return `${wd}، ${faDate(d)}`
}

/** «۸ مرداد ۱۴۰۵ — ساعت ۱۴:۳۰» */
export function faDateTime(input: string | Date | null | undefined): string {
  if (!input) return '—'
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return '—'
  const hh = toFaDigits(String(d.getHours()).padStart(2, '0'))
  const mm = toFaDigits(String(d.getMinutes()).padStart(2, '0'))
  return `${faDate(d)} — ساعت ${hh}:${mm}`
}

/** «۱۸:۰۰ تا ۲۰:۰۰» از رشته‌ی ساعت‌های رزرو ("18,19") */
export function faTimeRange(timeSlots: string | null | undefined): string {
  const hours = String(timeSlots ?? '').split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)
  if (hours.length === 0) return '—'
  const from = toFaDigits(String(hours[0]).padStart(2, '0'))
  const to = toFaDigits(String(hours[hours.length - 1]! + 1).padStart(2, '0'))
  return `${from}:۰۰ تا ${to}:۰۰`
}
