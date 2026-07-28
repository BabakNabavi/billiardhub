-- ═══════════════════════════════════════════════════════════════════
-- 015 — هسته‌ی سیستم تبلیغات (فاز ۲)
--
-- جایگزینِ ساختاریِ ad_slots/ad_placements. سه اصل:
--   ● شش جایگاهِ مستقل — هر کدام is_active و mode خودش را دارد و
--     «هیچ کلیدِ سراسری‌ای» وجود ندارد (تصمیم D1 و بخش ۹ فاز ۱).
--   ● کمپین به‌جای بنرِ خام: هم بنرِ تصویری، هم ارجاع به موجودیت
--     (محصول/باشگاه/فروشگاه) برای سکشن‌های «ویژه»ی صفحه‌ی اصلی.
--   ● قیمت‌ها Database-driven در ad_pricing_plans — نه هاردکد.
--
-- جدول‌های قدیمی (ad_slots، ad_placements) حذف «نمی‌شوند»؛ داده‌شان
-- کپی می‌شود و خودشان به‌عنوان آرشیوِ برگشت‌پذیر می‌مانند. ad_requests
-- همچنان زنده و مشترک است.
-- ═══════════════════════════════════════════════════════════════════

-- ── جایگاه‌ها ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.placements (
  key            text PRIMARY KEY,
  title          text        NOT NULL,
  description    text,
  section        text        NOT NULL DEFAULT '',       -- کجای سایت: market | equipment_stores | clubs | global
  is_active      boolean     NOT NULL DEFAULT false,    -- مستقل؛ بدونِ هیچ کلیدِ سراسری
  mode           text        NOT NULL DEFAULT 'manual', -- free | manual | paid
  content_kind   text        NOT NULL DEFAULT 'banner', -- banner | entity
  entity_type    text,                                  -- برای content_kind=entity: product | club | seller
  capacity       integer     NOT NULL DEFAULT 1,        -- چند کمپین هم‌زمان نمایش داده شود
  price          bigint      NOT NULL DEFAULT 0,        -- تومان، برای یک دوره (mode=paid)
  duration_days  integer     NOT NULL DEFAULT 30,
  sort_order     integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placements_mode_chk    CHECK (mode IN ('free','manual','paid')),
  CONSTRAINT placements_content_chk CHECK (content_kind IN ('banner','entity')),
  CONSTRAINT placements_entity_chk  CHECK (entity_type IS NULL OR entity_type IN ('product','club','seller'))
);

-- ── کمپین‌ها ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key  text        NOT NULL REFERENCES public.placements(key),
  user_id        uuid,                                  -- خریدار/صاحب، اگر کاربرِ سایت باشد
  advertiser     text        NOT NULL DEFAULT '',
  title          text        NOT NULL DEFAULT '',
  /* محتوا:
       بنر:      { "image_url": "...", "link_url": "..." }
       موجودیت:  { "entity_type": "product|club|seller", "ref": "<id یا slug>" } */
  content        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status         text        NOT NULL DEFAULT 'DRAFT',
  starts_at      timestamptz NOT NULL DEFAULT now(),
  ends_at        timestamptz NOT NULL,
  weight         integer     NOT NULL DEFAULT 1,        -- سهم در چرخش اسلایدری
  sort_order     integer     NOT NULL DEFAULT 0,
  impressions    bigint      NOT NULL DEFAULT 0,
  clicks         bigint      NOT NULL DEFAULT 0,
  order_id       uuid,                                  -- سفارشِ خرید (فاز ۵ فعالش می‌کند)
  admin_note     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_status_chk CHECK (status IN
    ('DRAFT','PENDING_PAYMENT','PENDING_REVIEW','SCHEDULED','ACTIVE','EXPIRED','REJECTED','CANCELLED')),
  CONSTRAINT campaigns_window_chk CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS campaigns_live_idx    ON public.campaigns (placement_key, status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS campaigns_user_idx    ON public.campaigns (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_expiry_idx  ON public.campaigns (status, ends_at);

-- ── پلن‌های قیمت‌گذاری (Database-driven؛ هیچ قیمتی هاردکد نیست) ──
CREATE TABLE IF NOT EXISTS public.ad_pricing_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  description    text,
  /* NULL = پلنِ اعتباریِ آگهیِ بازار (وابسته به جایگاه نیست)؛
     مقداردار = پلنِ خریدِ همان جایگاه */
  placement_key  text        REFERENCES public.placements(key),
  price          bigint      NOT NULL DEFAULT 0,        -- تومان (واحد پولی موجود پروژه)
  duration_days  integer     NOT NULL DEFAULT 30,
  ad_quantity    integer     NOT NULL DEFAULT 0,        -- اعتبار آگهی؛ ۰ برای پلن Free = طبق سهمیه‌ی نقش
  is_active      boolean     NOT NULL DEFAULT true,
  sort_order     integer     NOT NULL DEFAULT 0,
  badge          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_pricing_plans_active_idx ON public.ad_pricing_plans (is_active, sort_order);

-- ── اعتبارِ آگهی (Paid Credits — مستقل از سهمیه‌ی رایگان) ─────────
-- فقط اسکیما در این فاز؛ گردشِ خرید/مصرف در فازهای ۴ و ۵ تکمیل می‌شود.
CREATE TABLE IF NOT EXISTS public.ad_credits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,                    -- در فاز ۳ person_id هم اضافه می‌شود
  plan_id      uuid        REFERENCES public.ad_pricing_plans(id),
  order_id     uuid,
  total        integer     NOT NULL,
  used         integer     NOT NULL DEFAULT 0,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_credits_used_chk CHECK (used >= 0 AND used <= total)
);

CREATE INDEX IF NOT EXISTS ad_credits_user_idx ON public.ad_credits (user_id, expires_at DESC);

-- ── سفارشِ خرید (Booking — اسکیما در این فاز، فلو در فاز ۵) ──────
CREATE TABLE IF NOT EXISTS public.campaign_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL,
  kind               text        NOT NULL DEFAULT 'placement',   -- placement | plan
  placement_key      text        REFERENCES public.placements(key),
  plan_id            uuid        REFERENCES public.ad_pricing_plans(id),
  campaign_id        uuid        REFERENCES public.campaigns(id),
  amount             bigint      NOT NULL,
  status             text        NOT NULL DEFAULT 'PENDING',
  provider           text        NOT NULL DEFAULT 'pending',
  provider_authority text,
  provider_ref_id    text,
  snapshot           jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  paid_at            timestamptz,
  CONSTRAINT campaign_orders_status_chk CHECK (status IN ('PENDING','PAID','FAILED','CANCELED'))
);

-- درسِ ممیزی فاز ۱: payments ایندکسِ یکتای authority دارد، سفارش‌های پلن نه — این‌جا از اول یکتا
CREATE UNIQUE INDEX IF NOT EXISTS campaign_orders_auth_uidx
  ON public.campaign_orders (provider, provider_authority) WHERE provider_authority IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_orders_user_idx ON public.campaign_orders (user_id, created_at DESC);

ALTER TABLE public.placements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_orders  ENABLE ROW LEVEL SECURITY;

-- ── انقضا و زمان‌بندیِ خودکار ─────────────────────────────────────
-- SCHEDULED ای که زمانش رسیده ⇒ ACTIVE؛ ACTIVE ای که تمام شده ⇒ EXPIRED.
-- ایمن برای اجرای مکرر؛ هم cron صدایش می‌زند هم مسیرِ خواندنِ عمومی (lazy).
CREATE OR REPLACE FUNCTION public.bh_expire_campaigns()
RETURNS jsonb AS $$
DECLARE v_activated integer; v_expired integer;
BEGIN
  UPDATE public.campaigns
     SET status = 'ACTIVE', updated_at = now()
   WHERE status = 'SCHEDULED' AND starts_at <= now() AND ends_at > now();
  GET DIAGNOSTICS v_activated = ROW_COUNT;

  /* PENDING هایی که پنجره‌شان گذشته هم مرده‌اند — وگرنه برای همیشه
     «در انتظار» می‌ماندند. DRAFT عمداً مستثناست: ادمین شاید هنوز
     بخواهد ویرایش و زمان‌بندیِ دوباره کند. */
  UPDATE public.campaigns
     SET status = 'EXPIRED', updated_at = now()
   WHERE status IN ('ACTIVE','SCHEDULED','PENDING_PAYMENT','PENDING_REVIEW') AND ends_at <= now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  RETURN jsonb_build_object('activated', v_activated, 'expired', v_expired);
END;
$$ LANGUAGE plpgsql;

-- شمارشِ اتمیک نمایش/کلیک — رفعِ read-then-update غیراتمیکِ قبلی.
-- فقط کمپینِ ACTIVE در پنجره‌ی زمانی شمرده می‌شود تا بیکنِ جعلی نتواند
-- آمارِ کمپینِ منقضی/در انتظار را باد کند.
CREATE OR REPLACE FUNCTION public.bh_track_campaign(p_campaign_id uuid, p_kind text)
RETURNS void AS $$
BEGIN
  IF p_kind = 'click' THEN
    UPDATE public.campaigns SET clicks = clicks + 1
     WHERE id = p_campaign_id AND status = 'ACTIVE' AND starts_at <= now() AND ends_at > now();
  ELSE
    UPDATE public.campaigns SET impressions = impressions + 1
     WHERE id = p_campaign_id AND status = 'ACTIVE' AND starts_at <= now() AND ends_at > now();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- PUBLIC هم باید سلب شود: CREATE FUNCTION به‌طورِ ضمنی به PUBLIC اجازه‌ی
-- EXECUTE می‌دهد و سلب از anon به‌تنهایی آن را برنمی‌دارد (rpc از راهِ
-- PostgREST با کلیدِ anon قابلِ فراخوانی می‌ماند).
REVOKE ALL ON FUNCTION public.bh_expire_campaigns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_track_campaign(uuid, text) FROM PUBLIC, anon, authenticated;

-- ── شش جایگاهِ تصمیم D1 ──────────────────────────────────────────
-- همه inactive شروع می‌کنند: کلیدِ سراسریِ قبلی (ad_slots_enabled)
-- خاموش بود، پس رفتارِ فعلیِ سایت (هیچ بنری نمایش داده نمی‌شود)
-- دقیقاً حفظ می‌شود — این‌بار به‌صورتِ per-placement.
INSERT INTO public.placements
  (key, title, description, section, is_active, mode, content_kind, entity_type, capacity, duration_days, sort_order)
VALUES
  ('market_featured_products_homepage', 'محصولات ویژه‌ی بیلیارد بازار — صفحه اصلی',
   'انتخابِ ۱۴ محصولِ سکشن بیلیارد بازار در صفحه‌ی اصلی', 'market',
   false, 'manual', 'entity', 'product', 14, 30, 1),
  ('featured_clubs_homepage', 'باشگاه‌های پیشنهادی — صفحه اصلی',
   'انتخابِ باشگاه‌های سکشن باشگاه‌های پیشنهادی', 'clubs',
   false, 'manual', 'entity', 'club', 8, 30, 2),
  ('featured_equipment_stores_homepage', 'فروشگاه‌های تجهیزات — صفحه اصلی',
   'انتخابِ فروشگاه‌های سکشن فروشندگان تجهیزات', 'equipment_stores',
   false, 'manual', 'entity', 'seller', 12, 30, 3),
  ('equipment_ads_right', 'تبلیغ اسلایدری — سمت راستِ فروشگاه‌های تجهیزات',
   'بنرِ اسلایدری، ستونِ راستِ سکشن فروشندگان تجهیزات در صفحه‌ی اصلی', 'equipment_stores',
   false, 'paid', 'banner', NULL, 1, 30, 4),
  ('equipment_ads_left', 'تبلیغ اسلایدری — سمت چپِ فروشگاه‌های تجهیزات',
   'بنرِ اسلایدری، ستونِ چپِ سکشن فروشندگان تجهیزات در صفحه‌ی اصلی', 'equipment_stores',
   false, 'paid', 'banner', NULL, 1, 30, 5),
  ('homepage_bottom_banner', 'بنر بزرگ انتهای صفحه اصلی — بالای فوتر',
   'بنرِ عریض در همه‌ی صفحات، بالای فوتر', 'global',
   false, 'paid', 'banner', NULL, 1, 30, 6)
ON CONFLICT (key) DO NOTHING;

-- قیمت و ظرفیت و مدتِ تنظیم‌شده‌ی جایگاه‌های قدیمی روی معادل‌های تازه
-- کپی می‌شود. مارکرِ mig_015_data_done تضمین می‌کند مهاجرتِ داده فقط
-- یک‌بار اجرا شود: اجرای دوباره‌ی این فایل نباید تنظیماتِ بعدیِ ادمین
-- را با مقادیرِ آرشیو بازنویسی کند یا کمپین‌های حذف‌شده را برگرداند.
UPDATE public.placements p SET
  price         = CASE WHEN s.price > 0 THEN s.price ELSE p.price END,
  capacity      = greatest(p.capacity, s.capacity),
  duration_days = s.duration_days
FROM public.ad_slots s
WHERE (s.key, p.key) IN
  (('market_1','equipment_ads_right'), ('market_2','equipment_ads_left'), ('footer','homepage_bottom_banner'))
  AND NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_015_data_done');

-- ── مهاجرتِ بنرهای قدیمی (کپی، نه انتقال — ad_placements آرشیو می‌ماند) ──
-- نگاشتِ وضعیت: ACTIVE→ACTIVE، PAUSED→DRAFT (قابل‌بازگشت)، EXPIRED→EXPIRED
INSERT INTO public.campaigns
  (placement_key, user_id, advertiser, title, content, status, starts_at, ends_at, sort_order, impressions, clicks, created_at)
SELECT
  CASE ap.slot_key
    WHEN 'market_1' THEN 'equipment_ads_right'
    WHEN 'market_2' THEN 'equipment_ads_left'
    WHEN 'footer'   THEN 'homepage_bottom_banner'
  END,
  ap.user_id, ap.advertiser, ap.title,
  jsonb_build_object('image_url', ap.image_url, 'link_url', ap.link_url),
  CASE ap.status WHEN 'ACTIVE' THEN 'ACTIVE' WHEN 'PAUSED' THEN 'DRAFT' ELSE 'EXPIRED' END,
  ap.starts_at, ap.ends_at, ap.sort_order, ap.impressions, ap.clicks, ap.created_at
FROM public.ad_placements ap
WHERE ap.slot_key IN ('market_1','market_2','footer')
  AND NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_015_data_done');

-- مهاجرتِ داده تمام شد — از این به بعد اجرای دوباره‌ی فایل فقط
-- اسکیمای idempotent است، نه بازنویسیِ داده.
INSERT INTO public.app_settings (key, value)
VALUES ('mig_015_data_done', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── پلن‌های پیش‌فرض (فقط پیکربندیِ اولیه؛ ادمین بعداً تغییر می‌دهد) ──
INSERT INTO public.ad_pricing_plans (name, description, placement_key, price, duration_days, ad_quantity, sort_order, badge)
SELECT * FROM (VALUES
  ('Free',         'سهمیه‌ی رایگانِ نقشِ شما — بدون پرداخت', NULL::text,       0::bigint, 30,  0, 1, NULL::text),
  ('Base',         'مناسبِ شروع',                           NULL::text,  249000::bigint, 30,  3, 2, NULL::text),
  ('Professional', 'برای فروشنده‌های فعال',                  NULL::text,  499000::bigint, 60,  7, 3, 'پیشنهاد ما'),
  ('Business',     'برای کسب‌وکارهای جدی',                   NULL::text,  999000::bigint, 60, 15, 4, NULL::text),
  ('Store',        'برای فروشگاه‌های بزرگ',                  NULL::text, 1990000::bigint, 90, 30, 5, NULL::text)
) AS v(name, description, placement_key, price, duration_days, ad_quantity, sort_order, badge)
WHERE NOT EXISTS (SELECT 1 FROM public.ad_pricing_plans);
