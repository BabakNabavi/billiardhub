/* ─────────────────────────────────────────────────────────────
   «آگهیِ زنده» — یک تعریف، همه‌جا.

   آگهی عمومی دیده می‌شود اگر `status = 'active'` باشد **و** `expiresAt`
   نگذشته باشد. «منقضی» وضعیتِ ذخیره‌شده نیست؛ از روی تاریخ مشتق می‌شود
   (داشبوردِ فروشنده همین را «منقضی» نشان می‌دهد و «تمدید» پیشنهاد
   می‌کند، و تمدید `expiresAt` را `AD_LIFETIME_DAYS` روز جلو می‌برد).

   ⚠️ تا مهرِ ۱۴۰۵ فقط فهرستِ بازار (`/api/market/ads`) تاریخ را می‌سنجید؛
   سه سازنده‌ی کارتِ صفحه‌ی اصلی (`lib/home-featured`، `lib/ads/free`،
   `lib/ads/resolve`) فقط `status` را. وقتی همه‌ی آگهی‌ها در یک هفته
   منقضی شدند، صفحه‌ی بازار خالی بود و صفحه‌ی اصلی همان آگهی‌ها را
   هنوز نشان می‌داد. هر مسیرِ تازه‌ای که آگهیِ عمومی می‌خواند باید از
   این فایل بگذرد.
   ───────────────────────────────────────────────────────────── */

/** عمرِ آگهی — ثبت، تمدید و خریدِ جایگاهِ پولی همه از همین. شش ماه (تصمیمِ
 *  مالک، ۲۰ مهر ۱۴۰۵؛ پیش‌تر ۶۰ روز بود و همه‌ی آگهی‌ها در یک هفته منقضی شدند).
 *  ⚠️ پیش‌فرضِ ستون در دیتابیس هم همین است (مهاجرتِ ۱۱۲) — اگر عوض شد، هر دو. */
export const AD_LIFETIME_DAYS = 180
export const AD_LIFETIME_MS = AD_LIFETIME_DAYS * 86_400_000

/** وضعیت‌هایی که صفحه‌ی تک‌آگهی برای غیرِمالک باز می‌شود. `sold` و `expired`
 *  عمداً هستند (لینکِ قدیمی ۴۰۴ نشود)؛ `paused`/`pending`/`rejected`/`deleted`
 *  نه. هر چیزی که دربارهٔ یک آگهی بیرون می‌دهد — پاسخِ API، متادیتا، پیش‌نمایشِ
 *  لینک — از همین فهرست می‌پرسد. «زنده» (پایین) زیرمجموعه‌ی سخت‌ترِ همین است. */
export const PUBLIC_AD_STATUSES: readonly string[] = ['active', 'sold', 'expired']

/** شرطِ PostgREST برای `.or(...)` — همیشه کنارِ `.eq('status', 'active')` */
export const notExpiredOr = (now: Date = new Date()): string =>
  `expiresAt.is.null,expiresAt.gt.${now.toISOString()}`

/** همان شرط روی ردیفی که از قبل خوانده شده (`status` و `expiresAt` لازم است) */
export function isLiveAd(
  row: { status?: unknown; expiresAt?: unknown },
  now: number = Date.now(),
): boolean {
  if (row.status !== 'active') return false
  if (row.expiresAt == null || row.expiresAt === '') return true
  /* ستون timestamptz است و همیشه منطقه دارد؛ رشته‌ی خراب یعنی تاریخی
     نیست که گذشته باشد — مثلِ NULL رفتار می‌کند، همان‌طور که فیلترِ
     دیتابیس می‌کند. */
  const t = Date.parse(String(row.expiresAt))
  return Number.isNaN(t) || t > now
}
