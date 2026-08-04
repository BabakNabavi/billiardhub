-- ═══════════════════════════════════════════════════════════════
-- ۰۵۱ — تبلیغِ پیش‌پخشِ ویدیو (Pre-roll)
--
-- ── چرا این‌قدر کوچک است ──
-- سیستمِ تبلیغات از قبل کامل است: جایگاه، کمپین، سفارش، پرداخت،
-- بازبینیِ ادمین، چرخشِ عادلانه و شمارشِ نمایش/کلیک همه هستند.
-- پیش‌پخش یک *نوعِ محتوای* تازه است، نه یک سیستمِ تازه.
--
-- پس این مهاجرت فقط چهار چیز می‌آورد:
--   ۱) اجازه‌ی `content_kind = 'video'`
--   ۲) دو تنظیمِ مخصوصِ ویدیو روی خودِ جایگاه (تا هاردکد نشوند)
--   ۳) دو شمارنده‌ی تازه برای «تماشای کامل» و «رد شده»
--   ۴) جدولِ نمایش — هم برای سقفِ فراوانی، هم برای ضدِجعل
-- ═══════════════════════════════════════════════════════════════

-- ── ۱) نوعِ محتوای ویدیو ──
ALTER TABLE public.placements DROP CONSTRAINT IF EXISTS placements_content_chk;
ALTER TABLE public.placements ADD CONSTRAINT placements_content_chk
  CHECK (content_kind = ANY (ARRAY['banner','entity','video']));


-- ── ۲) تنظیم‌های مخصوصِ ویدیو ──
-- روی *جایگاه* می‌نشینند نه در کد، تا ادمین بتواند بدونِ انتشارِ تازه
-- عوضشان کند. NULL برای جایگاه‌های غیرِویدیویی یعنی «بی‌ربط».
ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS skip_after_sec   integer,
  ADD COLUMN IF NOT EXISTS max_duration_sec integer;

COMMENT ON COLUMN public.placements.skip_after_sec IS
  'پس از چند ثانیه دکمه‌ی «رد کردن» ظاهر شود. NULL یعنی رد کردن ممکن نیست.';
COMMENT ON COLUMN public.placements.max_duration_sec IS
  'سقفِ مدتِ ویدیوی تبلیغ. آپلودِ بلندتر پذیرفته نمی‌شود.';


-- ── ۳) شمارنده‌های تازه ──
-- `impressions` و `clicks` از قبل هستند. این دو برای محاسبه‌ی
-- «نرخِ رد کردن» لازم‌اند — عددی که کیفیتِ تبلیغ را نشان می‌دهد.
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS completed_views bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skipped_views   bigint NOT NULL DEFAULT 0;


-- ── ۴) جدولِ نمایش ──
--
-- دو کار می‌کند و هر دو لازم است:
--
--   الف) ضدِجعل. شمارشِ فعلی (`POST /api/ads/placements`) هر شناسه‌ای
--        را می‌پذیرد و شمارنده را بالا می‌برد؛ یعنی با درخواستِ
--        تکراری می‌شود هزار نمایش ساخت. با کلیدِ اصلیِ
--        (کمپین، بیننده، پنجره)، تلاشِ دوم به تضادِ کلید می‌خورد.
--
--   ب) سقفِ فراوانی. «این کاربر امروز چند بار این تبلیغ را دیده؟»
--        از روی همین ردیف‌ها جواب می‌گیرد.
--
-- `viewer` هشِ برگشت‌ناپذیرِ IP و مرورگر است — نه خودِ آن‌ها.
-- `bucket` روزِ تقویمی است: با آن، کلیدِ اصلی روزی یک‌بار آزاد
-- می‌شود و نمایشِ فردا دوباره شمرده می‌شود.
CREATE TABLE IF NOT EXISTS public.campaign_impressions (
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  viewer      text NOT NULL,
  bucket      date NOT NULL DEFAULT current_date,
  seen_count  integer NOT NULL DEFAULT 1,
  first_at    timestamptz NOT NULL DEFAULT now(),
  last_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, viewer, bucket)
);

CREATE INDEX IF NOT EXISTS campaign_impressions_bucket_idx
  ON public.campaign_impressions (bucket);

ALTER TABLE public.campaign_impressions ENABLE ROW LEVEL SECURITY;


-- ── سقفِ فراوانی روی کمپین ──
-- ۰ یعنی بی‌سقف. عدد یعنی «هر بیننده در روز حداکثر این‌قدر».
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS daily_cap_per_viewer integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impression_limit     bigint  NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.campaigns.daily_cap_per_viewer IS
  'سقفِ نمایشِ روزانه برای هر بیننده. ۰ یعنی بی‌سقف.';
COMMENT ON COLUMN public.campaigns.impression_limit IS
  'سقفِ کلِ نمایش. با رسیدن به آن، کمپین دیگر انتخاب نمی‌شود. ۰ یعنی بی‌سقف.';


-- ── ثبتِ نمایش، اتمی ──
-- خروجی: ۱ اگر شمرده شد، ۰ اگر تکراری یا از سقف گذشته بود.
CREATE OR REPLACE FUNCTION public.count_ad_impression(
  p_campaign uuid,
  p_viewer   text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap   integer;
  v_seen  integer;
BEGIN
  SELECT daily_cap_per_viewer INTO v_cap FROM campaigns
   WHERE id = p_campaign AND status = 'ACTIVE'
     AND now() >= starts_at AND now() < ends_at;
  IF NOT FOUND THEN RETURN 0; END IF;

  INSERT INTO campaign_impressions (campaign_id, viewer, bucket)
  VALUES (p_campaign, p_viewer, current_date)
  ON CONFLICT (campaign_id, viewer, bucket)
  DO UPDATE SET seen_count = campaign_impressions.seen_count + 1,
                last_at    = now()
  RETURNING seen_count INTO v_seen;

  -- از سقفِ روزانه گذشته ⇒ ردیف می‌ماند (برای انتخابِ بعدی) ولی
  -- شمارنده‌ی کمپین بالا نمی‌رود.
  IF v_cap > 0 AND v_seen > v_cap THEN RETURN 0; END IF;

  UPDATE campaigns SET impressions = impressions + 1 WHERE id = p_campaign;
  RETURN 1;
END $$;

REVOKE ALL ON FUNCTION public.count_ad_impression(uuid, text) FROM PUBLIC, anon, authenticated;


-- ── ۵) خودِ جایگاه ──
-- `manual` عمدی است: تا وقتی قیمت و ظرفیت تعیین نشده، نباید در
-- فهرستِ خریدِ کاربر ظاهر شود. ادمین بعداً `paid` و فعالش می‌کند.
INSERT INTO public.placements
  (key, title, description, section, is_active, mode, content_kind,
   capacity, price, duration_days, sort_order, rotation_mode, priority,
   skip_after_sec, max_duration_sec)
VALUES (
  'media_preroll',
  'تبلیغ پیش‌پخش ویدیو',
  'نمایش ویدیوی تبلیغاتی شما پیش از شروع ویدیوهای بیلیارد مدیا. تبلیغ پیش از محتوای اصلی پخش می‌شود و پس از چند ثانیه امکان رد کردن آن برای بیننده فراهم می‌شود.',
  'بیلیارد مدیا',
  false,
  'manual',
  'video',
  3, 0, 30, 10, 'weighted', 0,
  3, 15
)
ON CONFLICT (key) DO NOTHING;


-- ── گزارش ──
SELECT
  (SELECT count(*) FROM placements WHERE key='media_preroll')            AS placement,
  (SELECT skip_after_sec FROM placements WHERE key='media_preroll')      AS skip_after,
  (SELECT max_duration_sec FROM placements WHERE key='media_preroll')    AS max_duration,
  (SELECT count(*) FROM campaign_impressions)                            AS impressions_rows,
  (SELECT count(*) FROM pg_proc WHERE proname='count_ad_impression')     AS fn;
-- انتظار: placement = 1 · skip_after = 3 · max_duration = 15 ·
--         impressions_rows = 0 · fn = 1
