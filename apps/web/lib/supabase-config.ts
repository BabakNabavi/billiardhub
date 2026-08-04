/* ─────────────────────────────────────────────────────────────
   نشانیِ پروژه‌ی Supabase — منبعِ واحد.

   ── چرا ──
   این نشانی در سه فایل جدا هاردکد شده بود (`supabase-server`,
   `social-server`, `otp-server`) در حالی که `lib/media/storage.ts`
   آن را از متغیرِ محیطی می‌خواند.

   دو مسئله داشت:
   ۱) اگر روزی مقدارِ محیطی و مقدارِ هاردکد با هم فرق می‌کردند، دو
      بخشِ کد دو نشانیِ متفاوت می‌ساختند — و آن نوع اختلاف بی‌صداست:
      فایل آپلود می‌شود ولی از نشانیِ دیگری خوانده.
   ۲) جابه‌جاییِ پروژه (یا مهاجرتِ آینده‌ی Storage) یعنی پیداکردنِ
      همه‌ی جاهایی که این رشته تایپ شده.

   مقدارِ ثابت به‌عنوان تکیه‌گاه می‌ماند: اگر متغیرِ محیطی نبود، رفتار
   دقیقاً همان امروز است و چیزی نمی‌شکند.
   ───────────────────────────────────────────────────────────── */

const FALLBACK = 'https://bxnomfjjvhdtbnqvgjmh.supabase.co'

export const SUPABASE_URL: string =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '') || FALLBACK

/** باکتِ عمومی — عکس و ویدیوی قابلِ نمایش. */
export const PUBLIC_BUCKET = 'club-media'

/** باکتِ خصوصی — دایرکت، اعلان، مدارک. لینکِ عمومی ندارد. */
export const PRIVATE_BUCKET = 'bh-private'

/** ریشه‌ی نشانیِ عمومیِ یک باکت. */
export const publicRoot = (bucket = PUBLIC_BUCKET) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`
