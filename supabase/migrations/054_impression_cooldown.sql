-- ═══════════════════════════════════════════════════════════════
-- ۰۵۴ — فاصله‌ی زمانیِ کمینه بینِ دو نمایشِ شمرده‌شده
--
-- ── چرا سقفِ روزانه کافی نبود ──
-- مهاجرتِ ۰۵۳ سقفِ بیست نمایش برای هر بیننده در روز گذاشت. آن جلوی
-- ساختنِ ده هزار نمایش را می‌گیرد، ولی نه جلوی بیست تا را در دو
-- ثانیه — و آزمون همین را نشان داد: شش درخواستِ پیاپی، شش نمایش.
--
-- بیننده‌ی واقعی نمی‌تواند یک تبلیغ را شش بار در دو ثانیه ببیند.
-- کوتاه‌ترین حالتِ ممکن این است که تبلیغ (دستِ‌کم شش ثانیه) تمام شود،
-- بیننده به ویدیوی دیگری برود و دوباره play بزند.
--
-- سی ثانیه از آن هم سخت‌گیرانه‌تر نیست و برای تماشاگرِ واقعی هرگز
-- به چشم نمی‌آید.
--
-- دو محافظ روی هم: فاصله‌ی زمانی جلوی انفجارِ لحظه‌ای را می‌گیرد،
-- سقفِ روزانه جلوی تکرارِ کشدار در طولِ روز را.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.count_ad_impression(
  p_campaign uuid,
  p_viewer   text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap      integer;
  v_limit    integer;
  v_seen     integer;
  v_prev     timestamptz;
  v_cooldown constant interval := interval '30 seconds';
BEGIN
  SELECT daily_cap_per_viewer INTO v_cap FROM campaigns
   WHERE id = p_campaign AND status = 'ACTIVE'
     AND now() >= starts_at AND now() < ends_at;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_limit := CASE WHEN v_cap > 0 THEN v_cap ELSE 20 END;

  SELECT last_at INTO v_prev FROM campaign_impressions
   WHERE campaign_id = p_campaign AND viewer = p_viewer AND bucket = current_date;

  -- تلاشِ زودهنگام: ردیف را تازه می‌کنیم (برای انتخابِ بعدی) ولی
  -- نه شمارنده‌ی بیننده را و نه شمارنده‌ی کمپین را.
  IF v_prev IS NOT NULL AND now() - v_prev < v_cooldown THEN
    UPDATE campaign_impressions SET last_at = now()
     WHERE campaign_id = p_campaign AND viewer = p_viewer AND bucket = current_date;
    RETURN 0;
  END IF;

  INSERT INTO campaign_impressions (campaign_id, viewer, bucket)
  VALUES (p_campaign, p_viewer, current_date)
  ON CONFLICT (campaign_id, viewer, bucket)
  DO UPDATE SET seen_count = campaign_impressions.seen_count + 1,
                last_at    = now()
  RETURNING seen_count INTO v_seen;

  IF v_seen > v_limit THEN RETURN 0; END IF;

  UPDATE campaigns SET impressions = impressions + 1 WHERE id = p_campaign;
  RETURN 1;
END $$;

REVOKE ALL ON FUNCTION public.count_ad_impression(uuid, text) FROM PUBLIC, anon, authenticated;


-- ── گزارش ──
SELECT count(*) AS fn FROM pg_proc WHERE proname = 'count_ad_impression';
-- انتظار: fn = 1
