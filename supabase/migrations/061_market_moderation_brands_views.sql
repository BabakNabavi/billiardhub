/* ═══════════════════════════════════════════════════════════════
   بازار — بازبینیِ آگهی، برندهای کنترل‌شده، بازدیدِ ضدِتکرار
   ───────────────────────────────────────────────────────────────
   سه کارِ جدا که هر سه به یک جدول برمی‌گردند:

   ── ۱) بازبینی ──
   ستونِ `adminNote` برای دلیلِ رد. بدونِ آن، ادمین آگهی را رد می‌کرد
   و فروشنده هرگز نمی‌فهمید چرا — و همان آگهی را دوباره می‌فرستاد.

   ── ۲) برندها ──
   برند تا امروز متنِ آزاد بود: «Predator»، «predator» و «پریداتور»
   سه برندِ جدا می‌شدند، پس فیلترِ برند هرگز کامل نبود. جدولِ
   `market_brands` فهرستِ کنترل‌شده می‌دهد و `slug` کلیدِ یکتای
   نرمال‌شده است.

   عمداً برندِ آزاد را *ممنوع* نمی‌کنیم: بازارِ دستِ‌دومِ بیلیارد
   برندهای محلی و بی‌نام دارد و اجبار یعنی همه «سایر» را می‌زنند.
   به‌جایش، برندِ ناشناخته به فهرست پیشنهاد می‌شود تا ادمین تأیید یا
   ادغامش کند.

   ── ۳) بازدید ──
   `products.views` با هر بارگذاریِ صفحه یکی بالا می‌رفت. یعنی
   فروشنده با ده بار رفرش، آگهی‌اش را «پربازدید» نشان می‌داد و
   مرتب‌سازیِ «محبوب‌ترین» بی‌معنی می‌شد.

   همان الگوی ضدِجعلِ تبلیغات: کلیدِ اصلیِ مرکب + ON CONFLICT، پس
   شمارش اتمیک است و پنجره‌ی مسابقه ندارد.
   ═══════════════════════════════════════════════════════════════ */

/* ── ۱) یادداشتِ ادمین ── */
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS "adminNote" text;

/* صفِ بازبینی — بدونِ این، هر بار که ادمین صفحه را باز کند کلِ جدول
   خوانده می‌شود. */
CREATE INDEX IF NOT EXISTS products_pending_idx
  ON public.products (status, "createdAt" DESC)
  WHERE status = 'pending';

/* ── ۲) برندها ── */
CREATE TABLE IF NOT EXISTS public.market_brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  /* کلیدِ نرمال‌شده: حروفِ کوچکِ لاتین، بدونِ فاصله. «Predator» و
     «predator» و «Predator » یک ردیف می‌شوند. */
  slug       text NOT NULL UNIQUE,
  name       text NOT NULL,
  /* برندی که هنوز ادمین تأییدش نکرده — از فرم پیشنهاد شده */
  is_active  boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_brands_slug_chk CHECK (slug ~ '^[a-z0-9-]{1,60}$')
);

ALTER TABLE public.market_brands ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS market_brands_active_idx
  ON public.market_brands (is_active, sort_order, name);

/* برندهایی که در فرمِ ثبت آگهی هاردکد بودند، به‌عنوان نقطه‌ی شروع.
   `ON CONFLICT DO NOTHING` یعنی اجرای دوباره‌ی این فایل بی‌خطر است. */
INSERT INTO public.market_brands (slug, name, sort_order) VALUES
  ('predator',   'Predator',   10),
  ('aramith',    'Aramith',    20),
  ('rasson',     'Rasson',     30),
  ('brunswick',  'Brunswick',  40),
  ('master',     'Master',     50),
  ('kamui',      'Kamui',      60),
  ('molavi',     'مولوی',      70),
  ('mezz',       'Mezz',       80),
  ('cuetec',     'Cuetec',     90),
  ('longoni',    'Longoni',   100),
  ('peradon',    'Peradon',   110),
  ('other',      'متفرقه / بدون برند', 999)
ON CONFLICT (slug) DO NOTHING;

/* ── ۳) بازدیدِ ضدِتکرار ──
   `viewer` هشِ برگشت‌ناپذیرِ IP+UA است و `bucket` سطلِ زمانی. کلیدِ
   اصلیِ مرکب یعنی بازدیدِ دوم در همان سطل اصلاً درج نمی‌شود. */
CREATE TABLE IF NOT EXISTS public.product_view_hits (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewer     text NOT NULL,
  bucket     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, viewer, bucket)
);

ALTER TABLE public.product_view_hits ENABLE ROW LEVEL SECURITY;

/* پاک‌سازیِ ردیف‌های کهنه بعداً از همین شاخص می‌گذرد */
CREATE INDEX IF NOT EXISTS product_view_hits_time_idx
  ON public.product_view_hits (created_at);

/* شمارشِ اتمیک. اگر ردیف درج شد یعنی بازدیدِ تازه است و شمارنده یکی
   بالا می‌رود؛ وگرنه هیچ. سطلِ ساعتی: بازدیدکننده‌ای که یک ساعت بعد
   دوباره برگردد بازدیدِ تازه است، ولی ده بار رفرش نه. */
CREATE OR REPLACE FUNCTION public.count_product_view(
  p_product uuid,
  p_viewer  text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket text := to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDDHH24');
  v_new    boolean := false;
BEGIN
  INSERT INTO public.product_view_hits (product_id, viewer, bucket)
  VALUES (p_product, left(coalesce(p_viewer, ''), 64), v_bucket)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_new = ROW_COUNT;
  IF v_new THEN
    UPDATE public.products SET views = coalesce(views, 0) + 1 WHERE id = p_product;
  END IF;
  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.count_product_view(uuid, text) FROM PUBLIC, anon, authenticated;

/* ── بررسی ── */
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'adminNote')          AS col_note,
  (SELECT count(*) FROM public.market_brands)                            AS brands,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_name = 'product_view_hits')                              AS tbl_views,
  (SELECT count(*) FROM pg_proc WHERE proname = 'count_product_view')     AS fn_view;
