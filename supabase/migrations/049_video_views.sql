-- ═══════════════════════════════════════════════════════════════
-- ۰۴۹ — شمارشِ بازدیدِ ویدیو
--
-- ── مسئله ──
-- ستونِ `views` بود ولی هیچ‌جا زیاد نمی‌شد. ساده‌ترین راه —
-- `UPDATE ... SET views = views + 1` در هر بار بازکردنِ صفحه — یعنی
-- نگه‌داشتنِ F5 عدد را بی‌نهایت بالا می‌برد و عدد بی‌معنی می‌شود.
--
-- ── راه‌حل ──
-- یک ردیفِ کوتاه‌عمر برای هر (ویدیو، بیننده) که کلیدِ اصلی‌اش خودِ
-- همان جفت است. تلاشِ دوم در پنجره‌ی زمانی به تضادِ کلید می‌خورد و
-- شمارنده بالا نمی‌رود. تابع همه‌ی این را یک‌جا و اتمی انجام می‌دهد
-- تا بینِ خواندن و نوشتن مسابقه‌ای نماند.
--
-- «بیننده» یک هشِ برگشت‌ناپذیر از IP و مرورگر است، نه خودِ آن‌ها:
-- برای تشخیصِ تکرار کافی است و چیزی درباره‌ی شخص نگه نمی‌دارد.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.video_view_hits (
  video_id   uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  viewer     text NOT NULL,
  seen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, viewer)
);

-- برای پاک‌سازیِ ردیف‌های کهنه
CREATE INDEX IF NOT EXISTS video_view_hits_seen_idx ON public.video_view_hits (seen_at);

ALTER TABLE public.video_view_hits ENABLE ROW LEVEL SECURITY;


-- ── ثبتِ یک بازدید ──
-- خروجی: تعدادِ بازدیدِ تازه (۱ اگر شمرده شد، ۰ اگر تکراری بود).
CREATE OR REPLACE FUNCTION public.count_video_view(
  p_slug   text,
  p_viewer text,
  p_window interval DEFAULT interval '6 hours'
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id   uuid;
  v_new  integer := 0;
BEGIN
  SELECT id INTO v_id FROM videos
   WHERE slug = p_slug AND status = 'published' AND visibility <> 'private';
  IF v_id IS NULL THEN RETURN 0; END IF;

  -- ردیفِ کهنه‌ی همین بیننده کنار می‌رود تا بازدیدِ فردا دوباره شمرده شود
  DELETE FROM video_view_hits
   WHERE video_id = v_id AND viewer = p_viewer AND seen_at < now() - p_window;

  INSERT INTO video_view_hits (video_id, viewer)
  VALUES (v_id, p_viewer)
  ON CONFLICT (video_id, viewer) DO NOTHING;

  GET DIAGNOSTICS v_new = ROW_COUNT;
  IF v_new > 0 THEN
    UPDATE videos SET views = views + 1 WHERE id = v_id;
  END IF;

  RETURN v_new;
END $$;

REVOKE ALL ON FUNCTION public.count_video_view(text, text, interval) FROM PUBLIC, anon, authenticated;


-- ── گزارش ──
SELECT
  (SELECT count(*) FROM public.video_view_hits) AS hits,
  (SELECT count(*) FROM pg_proc WHERE proname = 'count_video_view') AS fn;
-- انتظار: hits = 0 · fn = 1
