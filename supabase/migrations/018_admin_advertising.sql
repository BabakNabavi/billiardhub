-- ─────────────────────────────────────────────────────────────────
-- ۰۱۸ — مدیریتِ ادمینِ تبلیغات و قیمت‌گذاری (فاز ۴)
--
-- سه افزوده:
--   ۱) کنترل‌های تازه‌ی هر جایگاه: تعدادِ نمایشِ هم‌زمان، حالتِ چرخش،
--      و اولویت — همه مستقل از هم و بدونِ هیچ کلیدِ سراسری.
--   ۲) ستونِ اعتبار روی پلن‌های قیمت‌گذاری (Credit Amount).
--   ۳) پلن‌های پیش‌فرضِ هر جایگاه با پله‌های مدت (۷ روز / ۳۰ روز / ۳ ماه).
--      این‌ها فقط «پیش‌فرض» هستند؛ ادمین همه را از پنل تغییر می‌دهد و
--      اجرای دوباره‌ی فایل (مارکرِ mig_018_data_done) بازنویسی‌شان نمی‌کند.
-- ─────────────────────────────────────────────────────────────────

-- ── ۱) کنترل‌های تازه‌ی جایگاه ───────────────────────────────────
-- display_count: چند کمپین هم‌زمان دیده شود (۰ = به‌اندازه‌ی ظرفیت).
--   ظرفیت «چند کمپین می‌تواند رزرو شود» است، نمایش «چندتا با هم دیده
--   می‌شود» — در کاروسل این دو یکی نیستند.
ALTER TABLE public.placements ADD COLUMN IF NOT EXISTS display_count integer NOT NULL DEFAULT 0;

-- rotation_mode: چرخشِ کمپین‌های یک جایگاه
--   fixed    = ترتیبِ ثابتِ sort_order (جای اول همیشه یکی است)
--   weighted = سهم بر اساسِ وزنِ کمپین
--   fair     = کمترین نمایش، اول (توزیعِ عادلانه) + تصادفیِ کنترل‌شده
--   random   = تصادفیِ کامل
ALTER TABLE public.placements ADD COLUMN IF NOT EXISTS rotation_mode text NOT NULL DEFAULT 'fair';

DO $$ BEGIN
  ALTER TABLE public.placements
    ADD CONSTRAINT placements_rotation_chk
    CHECK (rotation_mode IN ('fixed', 'weighted', 'fair', 'random'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- priority: اولویتِ جایگاه (بزرگ‌تر = مهم‌تر). ترتیبِ پردازش/نمایشِ
-- جایگاه‌ها را تعیین می‌کند؛ sort_order برای ترتیبِ فهرستِ ادمین می‌ماند.
ALTER TABLE public.placements ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- ── ۲) اعتبارِ پلن (Credit Amount) ──────────────────────────────
-- چند «اعتبارِ کمپین» با خریدِ این پلن به کاربر داده می‌شود. جریانِ
-- مصرفش در فاز ۵ (پرداخت/رزرو) تکمیل می‌شود؛ این‌جا فقط قابلِ تنظیم
-- می‌شود تا قیمت‌گذاری کامل باشد.
ALTER TABLE public.ad_pricing_plans ADD COLUMN IF NOT EXISTS credit_amount integer NOT NULL DEFAULT 0;

-- ── ۳) پلن‌های پیش‌فرضِ هر جایگاه ────────────────────────────────
-- فقط اگر پلنی با همان (جایگاه، مدت، نام) وجود نداشته باشد درج می‌شود،
-- و کلِ این بخش با مارکر یک‌بار اجرا می‌شود.
INSERT INTO public.ad_pricing_plans
  (name, description, placement_key, price, duration_days, ad_quantity, credit_amount, is_active, sort_order, badge)
SELECT v.name, v.description, v.placement_key, v.price, v.duration_days, 1, 1, true, v.sort_order, v.badge
FROM (VALUES
  -- محصولات ویژه‌ی بازار
  ('محصول ویژه — ۷ روزه',        'نمایشِ محصول در سکشنِ محصولات ویژه‌ی صفحه‌ی اصلی',   'market_featured_products_homepage',   399000::bigint,   7, 11, NULL),
  ('محصول ویژه — ۳۰ روزه',       'نمایشِ محصول در سکشنِ محصولات ویژه‌ی صفحه‌ی اصلی',   'market_featured_products_homepage',   999000::bigint,  30, 12, NULL),
  ('محصول ویژه — پرمیوم ۳۰ روزه', 'جایگاهِ ممتاز در سکشنِ محصولات ویژه',                'market_featured_products_homepage',  1990000::bigint,  30, 13, 'پرمیوم'),
  -- باشگاه‌های پیشنهادی
  ('باشگاه پیشنهادی — ۳۰ روزه',  'نمایشِ باشگاه در سکشنِ باشگاه‌های پیشنهادی',          'featured_clubs_homepage',              999000::bigint,  30, 21, NULL),
  -- فروشگاه‌های تجهیزات
  ('فروشگاه ویژه — ۳۰ روزه',     'نمایشِ فروشگاه در سکشنِ فروشگاه‌های تجهیزات',         'featured_equipment_stores_homepage',   999000::bigint,  30, 31, NULL),
  -- بنرِ کناریِ راست
  ('بنر کناری راست — ۷ روزه',    'بنرِ اسلایدریِ سمتِ راستِ سکشنِ فروشگاه‌ها',          'equipment_ads_right',                  799000::bigint,   7, 41, NULL),
  ('بنر کناری راست — ۳۰ روزه',   'بنرِ اسلایدریِ سمتِ راستِ سکشنِ فروشگاه‌ها',          'equipment_ads_right',                 2490000::bigint,  30, 42, NULL),
  ('بنر کناری راست — ۳ ماهه',    'بنرِ اسلایدریِ سمتِ راستِ سکشنِ فروشگاه‌ها',          'equipment_ads_right',                 5990000::bigint,  90, 43, 'صرفه‌جویی'),
  -- بنرِ کناریِ چپ (هم‌قیمتِ راست)
  ('بنر کناری چپ — ۷ روزه',      'بنرِ اسلایدریِ سمتِ چپِ سکشنِ فروشگاه‌ها',            'equipment_ads_left',                   799000::bigint,   7, 51, NULL),
  ('بنر کناری چپ — ۳۰ روزه',     'بنرِ اسلایدریِ سمتِ چپِ سکشنِ فروشگاه‌ها',            'equipment_ads_left',                  2490000::bigint,  30, 52, NULL),
  ('بنر کناری چپ — ۳ ماهه',      'بنرِ اسلایدریِ سمتِ چپِ سکشنِ فروشگاه‌ها',            'equipment_ads_left',                  5990000::bigint,  90, 53, 'صرفه‌جویی'),
  -- بنرِ پایینِ صفحه‌ی اصلی
  ('بنر پایین صفحه — ۷ روزه',    'بنرِ عریضِ انتهای صفحه‌ی اصلی',                       'homepage_bottom_banner',              1490000::bigint,   7, 61, NULL),
  ('بنر پایین صفحه — ۳۰ روزه',   'بنرِ عریضِ انتهای صفحه‌ی اصلی',                       'homepage_bottom_banner',              4990000::bigint,  30, 62, NULL),
  ('بنر پایین صفحه — ۳ ماهه',    'بنرِ عریضِ انتهای صفحه‌ی اصلی',                       'homepage_bottom_banner',             12990000::bigint,  90, 63, 'صرفه‌جویی')
) AS v(name, description, placement_key, price, duration_days, sort_order, badge)
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_018_data_done')
  AND NOT EXISTS (
    SELECT 1 FROM public.ad_pricing_plans p
     WHERE p.placement_key = v.placement_key
       AND p.duration_days = v.duration_days
       AND p.name = v.name
  );

-- پلن‌های عمومیِ فاز ۲ (بدونِ جایگاه) اعتبارشان برابرِ تعدادِ آگهی است
UPDATE public.ad_pricing_plans
   SET credit_amount = ad_quantity
 WHERE placement_key IS NULL
   AND credit_amount = 0
   AND NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_018_data_done');

INSERT INTO public.app_settings (key, value)
VALUES ('mig_018_data_done', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── ایندکس برای فهرست‌های پلنِ هر جایگاه ────────────────────────
CREATE INDEX IF NOT EXISTS ad_pricing_plans_placement_idx
  ON public.ad_pricing_plans (placement_key, sort_order)
  WHERE is_active = true;
