-- ─────────────────────────────────────────────────────────────────
-- ۰۷۷ — امتیازِ زنده، سقفِ فرمت، و بالاترین برک
--
-- ── سه ایرادِ ثبتِ نتیجه ──
--
-- ۱) هیچ راهی برای «امتیازِ فعلی» نبود. `bh_match_report` امتیاز را
--    می‌نوشت، **همان لحظه برنده اعلام می‌کرد و به دورِ بعد صعود
--    می‌داد**. یعنی برای اینکه روی مانیتور ۱–۰ دیده شود، باید بازی
--    تمام‌شده اعلام می‌شد. عملاً تماشاگر امتیازِ زنده نمی‌دید.
--
-- ۲) سقفِ فرمت اعمال نمی‌شد. در Best of 5 هرکس به ۳ برسد برنده است،
--    ولی سیستم ۷–۴ هم قبول می‌کرد. یک اشتباهِ تایپی روی مانیتور
--    نتیجه‌ای می‌نوشت که در آن فرمت اصلاً ممکن نیست.
--
-- ۳) بالاترین برک جایی ذخیره نمی‌شد. `Tournament.highestBreak` در
--    تایپ‌های فرانت بود، ولی هیچ ستونی پشتش نبود و هیچ‌کس پرش
--    نمی‌کرد.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS high_break integer,
  ADD COLUMN IF NOT EXISTS high_break_player smallint;

/* هدفِ فرمت: چند فریم برای بُرد لازم است.
     race{N} → N        (اول به N برسد)
     bo{N}   → N/2 + 1  (اکثریتِ N)
     time{M} → NULL     (سقف ندارد؛ ساعت تعیین می‌کند)
   NULL یعنی «سقفی در کار نیست»، نه «صفر». */
CREATE OR REPLACE FUNCTION public.bh_format_target(p_format text)
RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE n integer;
BEGIN
  IF p_format IS NULL THEN RETURN NULL; END IF;
  IF p_format ~ '^race\d{1,2}$' THEN
    RETURN substring(p_format from 5)::integer;
  END IF;
  IF p_format ~ '^bo\d{1,2}$' THEN
    n := substring(p_format from 3)::integer;
    RETURN (n / 2) + 1;
  END IF;
  RETURN NULL;   -- time{M} و هر چیزِ ناشناخته
END $$;

/* ── امتیازِ زنده ──
   فقط عدد را می‌نویسد. برنده اعلام نمی‌کند و به دورِ بعد صعود
   نمی‌دهد — آن کارِ «پایان بازی» است. بازیِ تمام‌شده از این مسیر
   دست نمی‌خورد، چون تغییرِ بی‌صدای امتیازِ یک بازیِ تمام‌شده یعنی
   جدول و نتیجه با هم نمی‌خوانند. */
CREATE OR REPLACE FUNCTION public.bh_match_live_score(
  p_match_id uuid, p_score1 integer, p_score2 integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; v_target integer; v_format text;
BEGIN
  SELECT * INTO m FROM tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF m.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'بازی یافت نشد');
  END IF;
  IF m.p1_registration_id IS NULL OR m.p2_registration_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'incomplete',
      'message', 'هر دو بازیکنِ این بازی هنوز مشخص نشده‌اند');
  END IF;
  IF m.winner IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'completed',
      'message', 'این بازی تمام شده — برای اصلاح، نتیجه‌ی نهایی را دوباره ثبت کنید');
  END IF;
  IF p_score1 < 0 OR p_score2 < 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_score', 'message', 'امتیاز معتبر نیست');
  END IF;

  SELECT match_format INTO v_format FROM tournaments WHERE id = m.tournament_id;
  v_target := bh_format_target(v_format);
  IF v_target IS NOT NULL AND (p_score1 > v_target OR p_score2 > v_target) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'over_target',
      'message', format('در این فرمت بیش از %s فریم ممکن نیست', v_target));
  END IF;

  UPDATE tournament_matches
     SET score1 = p_score1, score2 = p_score2,
         status = CASE WHEN status = 'waiting' THEN 'in_progress' ELSE status END,
         started_at = coalesce(started_at, now()), updated_at = now()
   WHERE id = p_match_id;

  RETURN jsonb_build_object('ok', true, 'score1', p_score1, 'score2', p_score2,
    'target', v_target);
END $$;

/* ── بالاترین برک ──
   روی خودِ بازی می‌نشیند، نه روی مسابقه: برکِ مسابقه بیشترینِ
   همین‌هاست و اگر نتیجه‌ای اصلاح شود، خودبه‌خود درست می‌ماند.
   `p_value = NULL` یعنی پاک کن. */
CREATE OR REPLACE FUNCTION public.bh_match_set_break(
  p_match_id uuid, p_value integer, p_player smallint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record;
BEGIN
  SELECT * INTO m FROM tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF m.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'بازی یافت نشد');
  END IF;

  IF p_value IS NULL THEN
    UPDATE tournament_matches SET high_break = NULL, high_break_player = NULL, updated_at = now()
     WHERE id = p_match_id;
    RETURN jsonb_build_object('ok', true, 'cleared', true);
  END IF;

  IF p_value < 0 OR p_value > 200 OR p_player NOT IN (1,2) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_break', 'message', 'مقدار برک معتبر نیست');
  END IF;
  IF (p_player = 1 AND m.p1_registration_id IS NULL)
  OR (p_player = 2 AND m.p2_registration_id IS NULL) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'incomplete', 'message', 'این بازیکن هنوز مشخص نیست');
  END IF;

  UPDATE tournament_matches
     SET high_break = p_value, high_break_player = p_player, updated_at = now()
   WHERE id = p_match_id;
  RETURN jsonb_build_object('ok', true, 'value', p_value, 'player', p_player);
END $$;

/* ── پایان بازی ──
   همان `bh_match_report` است، با سقفِ فرمت اضافه‌شده. سقف در
   دیتابیس است نه در فرم، چون همان تابع از سه صفحه (پنل، مانیتور،
   لایو) صدا زده می‌شود و بررسیِ سمتِ فرم را هر کدام باید جدا
   تکرار کنند. */
CREATE OR REPLACE FUNCTION public.bh_match_report(
  p_match_id uuid,
  p_score1   integer,
  p_score2   integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m        record;
  v_win    smallint;
  v_next   record;
  v_format text;
  v_target integer;
BEGIN
  SELECT * INTO m FROM tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF m.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'بازی یافت نشد');
  END IF;

  IF m.p1_registration_id IS NULL OR m.p2_registration_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'incomplete',
      'message', 'هر دو بازیکنِ این بازی هنوز مشخص نشده‌اند');
  END IF;

  IF p_score1 IS NULL OR p_score2 IS NULL OR p_score1 < 0 OR p_score2 < 0
     OR p_score1 > 99 OR p_score2 > 99 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_score', 'message', 'امتیاز معتبر نیست');
  END IF;

  IF p_score1 = p_score2 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'draw',
      'message', 'بازیِ حذفی مساوی نمی‌شود — یکی باید برنده باشد');
  END IF;

  SELECT match_format INTO v_format FROM tournaments WHERE id = m.tournament_id;
  v_target := bh_format_target(v_format);
  IF v_target IS NOT NULL THEN
    IF p_score1 > v_target OR p_score2 > v_target THEN
      RETURN jsonb_build_object('ok', false, 'code', 'over_target',
        'message', format('در این فرمت بیش از %s فریم ممکن نیست', v_target));
    END IF;
    /* برنده باید واقعاً به هدف رسیده باشد، وگرنه بازی تمام نشده */
    IF greatest(p_score1, p_score2) < v_target THEN
      RETURN jsonb_build_object('ok', false, 'code', 'under_target',
        'message', format('برای پایانِ بازی یکی باید به %s فریم برسد', v_target));
    END IF;
  END IF;

  IF m.winner IS NOT NULL THEN
    SELECT * INTO v_next FROM tournament_matches
     WHERE tournament_id = m.tournament_id AND round = m.round + 1
       AND match_index = m.match_index / 2;
    IF v_next.id IS NOT NULL AND v_next.winner IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 'locked',
        'message', 'نتیجه‌ی دورِ بعد ثبت شده است؛ ابتدا آن را اصلاح کنید');
    END IF;
  END IF;

  v_win := CASE WHEN p_score1 > p_score2 THEN 1 ELSE 2 END;

  UPDATE tournament_matches
     SET score1 = p_score1, score2 = p_score2, winner = v_win,
         status = 'completed', completed_at = now(), updated_at = now(),
         started_at = coalesce(started_at, now())
   WHERE id = p_match_id;

  PERFORM public.bh_match_advance(p_match_id);

  IF NOT EXISTS (
    SELECT 1 FROM tournament_matches
     WHERE tournament_id = m.tournament_id AND winner IS NULL
  ) THEN
    UPDATE tournaments SET status = 'completed', updated_at = now()
     WHERE id = m.tournament_id AND status <> 'cancelled';
  ELSE
    UPDATE tournaments SET status = 'ongoing', updated_at = now()
     WHERE id = m.tournament_id AND status IN ('registration_open', 'registration_closed', 'published');
  END IF;

  RETURN jsonb_build_object('ok', true, 'winner', v_win, 'target', v_target);
END $$;

REVOKE ALL ON FUNCTION public.bh_match_live_score(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_match_set_break(uuid, integer, smallint) FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
SELECT bh_format_target('bo5')   AS bo5_should_be_3,
       bh_format_target('race7') AS race7_should_be_7,
       bh_format_target('time90') AS time_should_be_null,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_name = 'tournament_matches'
           AND column_name IN ('high_break','high_break_player')) AS break_cols;
