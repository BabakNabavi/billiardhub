/* نشانیِ سایت — یک منبعِ واحد.

   تا امروز دامنه در چند جای کد هاردکد بود و دو تایشان اصلاً غلط
   بودند: صفحه‌ی خبر و ویدیو لینکِ اشتراک‌گذاری را روی
   `mybilliardhb1.vercel.app` می‌ساختند — دامنه‌ای که دیگر دامنه‌ی این
   پروژه نیست. یعنی هر کس خبری را در واتساپ یا تلگرام می‌فرستاد، لینکِ
   شکسته می‌فرستاد.

   ترتیبِ اولویت:
   ۱) `NEXT_PUBLIC_SITE_URL` — دامنه‌ی رسمی، روی Vercel تنظیم می‌شود
   ۲) `VERCEL_PROJECT_PRODUCTION_URL` — خودِ Vercel می‌گذارد
   ۳) دامنه‌ی اصلی به‌عنوان آخرین تکیه‌گاه

   دامنه‌ی رسمی بدونِ www است و www به آن ۳۰۷ می‌خورد. این باید با
   تنظیمِ Vercel یکی بماند: اگر canonical به www اشاره کند و www
   ریدایرکت شود، گوگل دو نسخه از هر صفحه می‌بیند. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  || 'https://billiardhub.net'
).replace(/\/+$/, '')

/** نشانیِ کاملِ یک مسیر — برای canonical و اشتراک‌گذاری.
 *
 *  در مرورگر عمداً از `window.location.origin` استفاده می‌شود: هر
 *  دامنه‌ای که کاربر واقعاً روی آن است، همان درست است. این کاری
 *  می‌کند که لینکِ اشتراک‌گذاری حتی روی دامنه‌ی پیش‌نمایش هم درست
 *  بماند و با عوض‌شدنِ دامنه هیچ‌جای کد لازم نباشد دست بخورد. */
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (typeof window !== 'undefined') return window.location.origin + p
  return SITE_URL + p
}
