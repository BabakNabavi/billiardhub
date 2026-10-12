-- ─────────────────────────────────────────────────────────────
-- ۱۱۲ — بیلیارد بازار: عمرِ شش‌ماهه‌ی آگهی، تمدیدِ آگهی‌های منقضی،
--        و شمارشِ ضدِتورمِ نمایش/کلیکِ تبلیغ
--
-- ── ۱) عمرِ آگهی: ۶۰ ⟵ ۱۸۰ روز ──
-- تصمیمِ مالک (۲۰ مهر ۱۴۰۵). همه‌ی ۲۱ آگهیِ بازار بینِ ۱۵ تا ۱۹ مهر با هم
-- منقضی شدند و بازار خالی ماند. پیش‌فرضِ ستون همان `AD_LIFETIME_DAYS`ِ
-- `apps/web/lib/market/live.ts` است؛ کدِ ثبت از این به بعد مقدار را صریح
-- می‌گذارد، این پیش‌فرض فقط برای هر مسیرِ دیگری است که ردیف بسازد.
--
-- ── ۲) تمدیدِ آگهی‌های فعال ──
-- به درخواستِ مالک. همان اثرِ دکمه‌ی «تمدید» در داشبورد
-- (`expiresAt` = اکنون + ۱۸۰ روز، `renewedAt` = اکنون). آگهیِ در توقفِ
-- ادمین (`moderation_hold`) و آگهیِ بی‌انقضا دست نمی‌خورند. فروخته/حذف/
-- ردشده/در انتظار هم نه — فقط `status = 'active'`.
--
-- ── ۳) شمارشِ نمایش/کلیک ──
-- `POST /api/ads/placements|slots` بی‌نام و بی‌سقف بود و هر درخواست یک
-- واحد به `campaigns.impressions/clicks` می‌افزود — آمارِ تبلیغ‌دهنده با یک
-- حلقه قابلِ تورم بود. الگو همان `049_video_views`: هر بیننده (HMACِ
-- IP+مرورگر، نه IPِ خام) در هر ساعت یک بار برای هر کمپین. تابعِ قبلیِ
-- `bh_track_campaign` می‌ماند: کدِ تازه تا اجرای این مهاجرت به آن
-- برمی‌گردد (PGRST202)، پس ترتیبِ اجرا مهم نیست.
--
-- ── اجرا (تک‌خطی، با scp — نه لوله) ──
--   scp -i "$env:USERPROFILE\.ssh\billiardhub_parspack" supabase/migrations/112_ad_lifetime_and_campaign_hits.sql root@130.185.72.87:/tmp/112.sql
--   ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/112.sql"
--
-- خودش BEGIN/COMMIT دارد — با --single-transaction اجرا نشود.
-- اجرای دوباره بی‌خطر است (تمدیدِ دوباره فقط مهلت را از همان لحظه
-- می‌شمارد).
-- ─────────────────────────────────────────────────────────────

SET lock_timeout = '3s';

BEGIN;

-- ── ۱) پیش‌فرضِ عمر ──
ALTER TABLE public.products
  ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '180 days');

-- ── ۲) تمدید ──
DO $$
DECLARE n bigint;
BEGIN
  UPDATE public.products
     SET "expiresAt" = now() + interval '180 days',
         "renewedAt" = now()
   WHERE status = 'active'
     AND COALESCE(moderation_hold, false) = false
     AND "expiresAt" IS NOT NULL
     AND "expiresAt" < now() + interval '180 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '112: renewed % active ads to 180 days', n;
END $$;

-- ── ۳) شمارشِ ضدِتورم ──
CREATE TABLE IF NOT EXISTS public.campaign_hits (
  campaign_id uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN ('impression', 'click')),
  viewer      text        NOT NULL,
  seen_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, kind, viewer)
);
ALTER TABLE public.campaign_hits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_hits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.bh_track_campaign_hit(
  p_campaign_id uuid,
  p_kind        text,
  p_viewer      text,
  p_window      interval DEFAULT interval '1 hour'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := CASE WHEN p_kind = 'click' THEN 'click' ELSE 'impression' END;
  v_new  integer := 0;
BEGIN
  /* بی‌شناسه شمرده نمی‌شود — وگرنه همه‌ی درخواست‌های بی‌نام یک «بیننده» بودند */
  IF p_viewer IS NULL OR length(p_viewer) < 8 THEN RETURN false; END IF;

  /* همان شرطِ تابعِ قبلی: فقط کمپینِ فعال در پنجره‌ی خودش. ردیفِ hit برای
     کمپینِ غیرفعال ساخته نمی‌شود. */
  IF NOT EXISTS (
    SELECT 1 FROM campaigns
     WHERE id = p_campaign_id AND status = 'ACTIVE'
       AND starts_at <= now() AND ends_at > now()
  ) THEN
    RETURN false;
  END IF;

  /* سقفِ رشدِ جدول: مسیر بی‌نام است و هر بیننده‌ی تازه یک ردیف می‌سازد.
     گاه‌به‌گاه (حدودِ یک بار در هر ۲۰۰ فراخوانی) ردیف‌های بیش از یک روز —
     که با پنجره‌ی یک‌ساعته دیگر به کاری نمی‌آیند — پاک می‌شوند. */
  IF random() < 0.005 THEN
    DELETE FROM campaign_hits WHERE seen_at < now() - interval '1 day';
  END IF;

  /* بازدیدِ کهنه‌ی همین بیننده کنار می‌رود تا ساعتِ بعد دوباره شمرده شود */
  DELETE FROM campaign_hits
   WHERE campaign_id = p_campaign_id AND kind = v_kind AND viewer = p_viewer
     AND seen_at < now() - p_window;

  INSERT INTO campaign_hits (campaign_id, kind, viewer)
  VALUES (p_campaign_id, v_kind, p_viewer)
  ON CONFLICT (campaign_id, kind, viewer) DO NOTHING;

  GET DIAGNOSTICS v_new = ROW_COUNT;
  IF v_new = 0 THEN RETURN false; END IF;

  IF v_kind = 'click' THEN
    UPDATE campaigns SET clicks = clicks + 1 WHERE id = p_campaign_id;
  ELSE
    UPDATE campaigns SET impressions = impressions + 1 WHERE id = p_campaign_id;
  END IF;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bh_track_campaign_hit(uuid, text, text, interval) FROM PUBLIC, anon, authenticated;

-- ── خودآزمایی ──
DO $$
DECLARE n bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'products'
       AND column_name = 'expiresAt' AND column_default LIKE '%180 days%'
  ) THEN
    RAISE EXCEPTION 'ABORT: products."expiresAt" default is not 180 days';
  END IF;

  SELECT count(*) INTO n FROM public.products
   WHERE status = 'active' AND COALESCE(moderation_hold, false) = false
     AND "expiresAt" IS NOT NULL AND "expiresAt" < now();
  IF n > 0 THEN RAISE EXCEPTION 'ABORT: % active ads still expired', n; END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bh_track_campaign_hit') THEN
    RAISE EXCEPTION 'ABORT: bh_track_campaign_hit missing';
  END IF;
  IF has_function_privilege('anon', 'public.bh_track_campaign_hit(uuid, text, text, interval)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ABORT: anon can execute bh_track_campaign_hit';
  END IF;

  SELECT count(*) INTO n FROM public.products
   WHERE status = 'active' AND ("expiresAt" IS NULL OR "expiresAt" > now());
  RAISE NOTICE '112 self-test passed — live ads now: %', n;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
