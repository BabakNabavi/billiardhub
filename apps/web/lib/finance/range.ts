/* ─────────────────────────────────────────────────────────────
   بازه‌ی گزارشِ مالی — یک تعریف برای هر دو پنل.

   ── چرا این فایل لازم شد ──
   دو ایرادِ ساکت که ممیزی پیدا کرد:

   ۱) «امروز» با نیمه‌شبِ **UTC** حساب می‌شد. ایران +۰۳:۳۰ است و
      ساعتِ تابستانی هم ندارد، پس درآمدِ روزانه ساعتِ ۳:۳۰ بامداد
      ریست می‌شد و بینِ ۰۰:۰۰ تا ۰۳:۳۰ عددِ دیروز «امروز» بود.

   ۲) `to` وقتی یک تاریخِ خالی بود (`2026-09-15`) به‌عنوان
      نیمه‌شبِ همان روز تفسیر می‌شد، پس **کلِ روزِ پایانی از گزارش
      می‌افتاد**. کلاسیک‌ترین خطای گزارشِ بازه‌ای.

   `created_at` در دیتابیس `timestamptz` است و به UTC ذخیره می‌شود؛
   این‌جا مرزها به UTC تبدیل می‌شوند تا مقایسه درست باشد.
   ───────────────────────────────────────────────────────────── */

/** ایران از ۲۰۲۲ ساعتِ تابستانی ندارد، پس همیشه +۰۳:۳۰ */
export const IRAN_OFFSET_MS = 3.5 * 3600_000

/** تاریخِ امروز به وقتِ تهران — `YYYY-MM-DD` */
export function tehranToday(now = new Date()): string {
  return new Date(now.getTime() + IRAN_OFFSET_MS).toISOString().slice(0, 10)
}

/** تاریخِ تهرانِ `back` روز پیش — `YYYY-MM-DD`.
 *  کلاینت هم از همین می‌خواند تا برچسبِ بازه با محاسبه‌ی سرور یکی باشد. */
export function tehranDay(back = 0, now = new Date()): string {
  return new Date(now.getTime() + IRAN_OFFSET_MS - back * 864e5).toISOString().slice(0, 10)
}

/** آغازِ روزِ تهرانِ `daysAgo` روز پیش، به‌صورت ISO در UTC */
export function tehranDayStart(daysAgo = 0, now = new Date()): string {
  const day = new Date(now.getTime() + IRAN_OFFSET_MS - daysAgo * 864e5)
    .toISOString().slice(0, 10)
  return new Date(`${day}T00:00:00.000+03:30`).toISOString()
}

/** پایانِ روزِ تهرانِ یک تاریخ (لحظه‌ی آخر)، ISO در UTC */
export function tehranDayEnd(day: string): string {
  return new Date(`${day}T23:59:59.999+03:30`).toISOString()
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

export interface Range {
  from: string      // YYYY-MM-DD به وقت تهران
  to: string        // YYYY-MM-DD به وقت تهران (شامل)
  fromISO: string   // UTC
  toISO: string     // UTC — پایانِ همان روز
  preset: 'custom' | 'today' | 'month'
}

/** ورودیِ کاربر را به یک بازه‌ی امن تبدیل می‌کند.
 *
 *  هر دو سر **شاملِ** همان روزند. تاریخِ نامعتبر یا وارونه به بازه‌ی
 *  پیش‌فرض (۳۰ روز اخیر) برمی‌گردد — گزارشِ خالیِ بی‌توضیح بدتر از
 *  گزارشِ پیش‌فرض است. */
export function resolveRange(rawFrom?: string | null, rawTo?: string | null): Range {
  const today = tehranToday()
  let from = String(rawFrom ?? '').trim()
  let to = String(rawTo ?? '').trim()

  if (!DATE.test(from) || !DATE.test(to) || from > to) {
    /* ⚠️ برچسب باید تاریخِ **تهرانی** باشد، نه `slice` روی خروجیِ UTCِ
       `tehranDayStart` — آن یکی نیمه‌شبِ تهران را به UTC برده و
       می‌تواند یک روز عقب‌تر بیفتد. */
    from = new Date(Date.now() + IRAN_OFFSET_MS - 29 * 864e5).toISOString().slice(0, 10)
    to = today
    return { from, to, fromISO: tehranDayStart(29), toISO: tehranDayEnd(to), preset: 'month' }
  }

  return {
    from, to,
    fromISO: new Date(`${from}T00:00:00.000+03:30`).toISOString(),
    toISO: tehranDayEnd(to),
    preset: from === to && to === today ? 'today' : 'custom',
  }
}
