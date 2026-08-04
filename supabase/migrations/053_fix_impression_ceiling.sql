-- ═══════════════════════════════════════════════════════════════
-- ۰۵۳ — اصلاحِ شمارشِ نمایش: سقفِ ضدِجعل حتی وقتی سقفِ روزانه ندارد
--
-- ── باگ ──
-- نسخه‌ی ۰۵۱ هنگام تکرار `seen_count` را بالا می‌برد و بعد فقط وقتی
-- جلوی شمارنده را می‌گرفت که کمپین سقفِ روزانه داشته باشد. پیش‌فرضِ
-- سقف صفر (بی‌سقف) است، پس در عمل هیچ محافظی نبود: آزمون نشان داد
-- شش درخواستِ پیاپی شش نمایش ساخت.
--
-- ── چرا «یک بار در روز» هم جواب نیست ──
-- بیننده‌ای که پنج ویدیوی مختلف تماشا می‌کند واقعاً پنج بار تبلیغ را
-- دیده و آگهی‌دهنده باید پنج نمایش بگیرد. سقفِ یک، تحویلِ واقعی را
-- کم‌شمار می‌کند.
--
-- ── راه‌حل ──
-- وقتی کمپین سقفِ روزانه دارد، همان مبناست. وقتی ندارد، یک سقفِ
-- سخت‌گیرانه‌ی ضدِسوءاستفاده اعمال می‌شود: بیست نمایش برای هر بیننده
-- در روز. برای تماشاگرِ واقعی دست‌ودل‌بازانه است و برای ساختنِ ده هزار
-- نمایشِ جعلی بی‌فایده.
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
  v_cap   integer;
  v_limit integer;
  v_seen  integer;
BEGIN
  SELECT daily_cap_per_viewer INTO v_cap FROM campaigns
   WHERE id = p_campaign AND status = 'ACTIVE'
     AND now() >= starts_at AND now() < ends_at;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- سقفِ کمپین اگر تعیین شده؛ وگرنه سقفِ ضدِسوءاستفاده
  v_limit := CASE WHEN v_cap > 0 THEN v_cap ELSE 20 END;

  INSERT INTO campaign_impressions (campaign_id, viewer, bucket)
  VALUES (p_campaign, p_viewer, current_date)
  ON CONFLICT (campaign_id, viewer, bucket)
  DO UPDATE SET seen_count = campaign_impressions.seen_count + 1,
                last_at    = now()
  RETURNING seen_count INTO v_seen;

  -- ردیف می‌ماند (انتخابِ بعدی به آن نگاه می‌کند) ولی شمارنده‌ی کمپین
  -- بالای سقف نمی‌رود.
  IF v_seen > v_limit THEN RETURN 0; END IF;

  UPDATE campaigns SET impressions = impressions + 1 WHERE id = p_campaign;
  RETURN 1;
END $$;

REVOKE ALL ON FUNCTION public.count_ad_impression(uuid, text) FROM PUBLIC, anon, authenticated;


-- ── گزارش ──
SELECT count(*) AS fn FROM pg_proc WHERE proname = 'count_ad_impression';
-- انتظار: fn = 1
