/* ─────────────────────────────────────────────────────────────
   فاصله تا باشگاه — یک فرمول، یک شکلِ نوشتن.

   ⚠️ تا مهرِ ۱۴۰۵ فهرستِ باشگاه‌ها و صفحه‌ی باشگاه هر کدام فرمولِ خودشان
   را داشتند و دو جور می‌نوشتند: یکی «۲.۳ km» با نقطه‌ی لاتین و واحدِ
   انگلیسی، دیگری «۲٫۳ کیلومتر». حالا هر دو از همین فایل می‌خوانند.
   ───────────────────────────────────────────────────────────── */

import { faNum } from '../jalali'

/** فاصله‌ی دو نقطه روی کره به کیلومتر (هاورسین) */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const ONE_DECIMAL = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 })

/** «۸۰۰ متر» زیرِ یک کیلومتر، «۲٫۳ کیلومتر» بالای آن — ممیزِ فارسی */
export function faDistance(km: number): string {
  return km < 1
    ? `${faNum(Math.round(km * 1000))} متر`
    : `${ONE_DECIMAL.format(Math.round(km * 10) / 10)} کیلومتر`
}

/** مختصاتِ معتبر؟ صفر و صفر یعنی «وارد نشده»، نه خلیجِ گینه.
 *  ⚠️ \`null\` و رشته‌ی خالی جدا رد می‌شوند: \`Number(null)\` صفر است، پس یک
 *  مختصاتِ جاافتاده کنارِ دیگری «معتبر» حساب می‌شد. */
export function hasCoords(lat: unknown, lng: unknown): boolean {
  const blank = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
  if (blank(lat) || blank(lng)) return false
  const a = Number(lat), b = Number(lng)
  return Number.isFinite(a) && Number.isFinite(b) && !(a === 0 && b === 0)
}
