/* ═══════════════════════════════════════════════════════════════
   بیلیارد بازار — قیمتِ توافقی، چرخه‌ی عمرِ آگهی، یکسان‌سازیِ دسته‌ها
   ───────────────────────────────────────────────────────────────
   چهار شکافِ واقعی که Audit پیدا کرد:

   ── ۱) قیمتِ توافقی وجود نداشت ──
   فروشنده‌ای که قیمت را نمی‌خواست بنویسد، مجبور بود صفر بگذارد و
   کارت «۰ تومان» نشان می‌داد. حالا ستونِ `negotiable` هست و قیمتِ
   صفر فقط وقتی مجاز است که آگهی توافقی باشد.

   ── ۲) وضعیتِ آگهی هیچ قیدی نداشت ──
   ستونِ `status` متنِ آزاد بود. یعنی هر مقداری قابلِ نوشتن بود و
   «فروخته شد» اصلاً وجود نداشت. حالا فهرستِ بسته است و `sold` و
   `expired` هم هستند.

   ── ۳) انقضا ستون داشت ولی هرگز پر نمی‌شد ──
   `expiresAt` از مهاجرتِ ۰۰۶ وجود داشت و هیچ‌جا نه نوشته می‌شد نه
   خوانده. آگهی‌ای که دو سال پیش گذاشته شده همچنان بالای فهرست بود.
   حالا مقدارِ پیش‌فرض دارد و آگهی‌های موجود هم عقب‌پر می‌شوند.

   ── ۴) دسته‌ی `case-bag` ──
   تنها گزینه‌ی فرمِ قدیمی بود و بازار آن را به `cue-case` نگاشت
   می‌کرد. حالا هر دو دسته در فرم هستند و ردیف‌های قدیمی به همان
   `cue-case` منتقل می‌شوند تا نگاشتِ زمانِ خواندن لازم نباشد.
   ═══════════════════════════════════════════════════════════════ */

/* ── ۱) قیمتِ توافقی ── */
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "soldAt"   timestamptz,
  ADD COLUMN IF NOT EXISTS "renewedAt" timestamptz;

/* قیمتِ صفر فقط برای آگهیِ توافقی، و منفی هرگز.

   این قید عمداً در دیتابیس است نه فقط در API: دو مسیرِ نوشتن روی این
   جدول وجود دارد (`/api/market/ads` و `/api/products`) و قاعده‌ای که
   در یکی باشد و در دیگری نه، همان باگی است که روزی پیدا می‌شود. */
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_chk') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_chk
      CHECK (price >= 0 AND (negotiable OR price > 0));
  END IF;
END $$;

/* ── ۲) وضعیت‌ها ──
   ردیف‌های موجود اول نرمال می‌شوند، وگرنه افزودنِ قید شکست می‌خورد. */
UPDATE public.products
   SET status = 'active'
 WHERE status IS NULL
    OR status NOT IN ('active','paused','sold','expired','pending','rejected','deleted');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_status_chk') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_status_chk
      CHECK (status IN ('active','paused','sold','expired','pending','rejected','deleted'));
  END IF;
END $$;

/* ── ۳) انقضا ──
   شصت روز: بلندتر از آن یعنی بازار پر از آگهیِ فروخته‌شده‌ای می‌شود که
   کسی جوابِ تلفنش را نمی‌دهد؛ کوتاه‌تر یعنی فروشنده‌ی جدی هم مجبور
   است مدام تمدید کند. */
ALTER TABLE public.products
  ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '60 days');

/* آگهی‌های موجود از تاریخِ ثبتِ خودشان شصت روز می‌گیرند، نه از امروز —
   وگرنه آگهیِ یک‌سال‌پیش ناگهان دو ماه عمرِ تازه می‌گرفت. */
UPDATE public.products
   SET "expiresAt" = "createdAt" + interval '60 days'
 WHERE "expiresAt" IS NULL;

/* فهرستِ بازار همیشه با این سه ستون فیلتر می‌شود */
CREATE INDEX IF NOT EXISTS products_market_idx
  ON public.products (status, "expiresAt" DESC, "createdAt" DESC);

/* ── ۴) یکسان‌سازیِ دسته ── */
UPDATE public.products SET category = 'cue-case' WHERE category IN ('case-bag', 'case');
UPDATE public.products SET category = 'ball-bag' WHERE category = 'bag';

/* ── ۵) وضعیتِ کالا ──
   `needs_repair` تازه است. بدونِ آن، فروشنده‌ی صادق مجبور بود
   «کارکرده» بزند و خریدار سرِ قرار غافلگیر شود. */
UPDATE public.products
   SET condition = 'new'
 WHERE condition IS NULL
    OR condition NOT IN ('new','like_new','used','needs_repair');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_condition_chk') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_condition_chk
      CHECK (condition IN ('new','like_new','used','needs_repair'));
  END IF;
END $$;

/* ── بررسی ── */
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'negotiable')        AS col_negotiable,
  (SELECT count(*) FROM pg_constraint WHERE conname = 'products_price_chk')     AS chk_price,
  (SELECT count(*) FROM pg_constraint WHERE conname = 'products_status_chk')    AS chk_status,
  (SELECT count(*) FROM pg_constraint WHERE conname = 'products_condition_chk') AS chk_condition,
  (SELECT count(*) FROM pg_indexes WHERE indexname = 'products_market_idx')     AS idx,
  (SELECT count(*) FROM public.products)                                       AS products_total;
