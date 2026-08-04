-- ═══════════════════════════════════════════════════════════════
-- ۰۵۲ — شمارنده‌های «تماشای کامل» و «رد شد»
--
-- ── چرا تابعِ جدا، و چرا کوچک ──
-- `bh_track_campaign` از قبل هست ولی فقط `impressions` و `clicks` را
-- می‌شناسد. دو شمارنده‌ی تازه‌ی پیش‌پخش (completed/skipped) جایی برای
-- افزایشِ اتمی ندارند.
--
-- به‌جای ساختنِ تابعِ تازه‌ی موازی، همین یکی سه ستون را می‌پذیرد و
-- ستون از یک فهرستِ بسته انتخاب می‌شود — نه از رشته‌ی ورودی. اگر
-- نامِ ستون مستقیم در SQL می‌نشست، همان می‌شد تزریق.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.increment_campaign_counter(
  p_campaign uuid,
  p_column   text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فهرستِ بسته: هر چیزِ دیگری بی‌صدا رد می‌شود
  IF p_column = 'completed_views' THEN
    UPDATE campaigns SET completed_views = completed_views + 1 WHERE id = p_campaign;
  ELSIF p_column = 'skipped_views' THEN
    UPDATE campaigns SET skipped_views = skipped_views + 1 WHERE id = p_campaign;
  ELSIF p_column = 'clicks' THEN
    UPDATE campaigns SET clicks = clicks + 1 WHERE id = p_campaign;
  ELSE
    RETURN false;
  END IF;
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.increment_campaign_counter(uuid, text) FROM PUBLIC, anon, authenticated;


-- ── گزارش ──
SELECT count(*) AS fn FROM pg_proc WHERE proname = 'increment_campaign_counter';
-- انتظار: fn = 1
