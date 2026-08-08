-- ─────────────────────────────────────────────────────────────────
-- ۰۷۸ — برک برای هر بازیکن، و سقفِ درستِ فریم
--
-- ── ۱) سقف اشتباه بود ──
-- مهاجرت ۰۷۷ «هدف» را درست حساب می‌کرد (Best of 5 ⇒ ۳) ولی همان
-- سقف را به **هر دو** بازیکن می‌داد. یعنی ۳–۳ پذیرفته می‌شد؛
-- نتیجه‌ای که در Best of 5 اصلاً وجود ندارد.
--
-- قاعده‌ی درست: فقط یکی می‌تواند به هدف برسد. بازنده حداکثر یک
-- فریم کمتر. Best of 5 ⇒ حداکثر ۳–۲ · Best of 3 ⇒ حداکثر ۲–۱ ·
-- Race to 7 ⇒ حداکثر ۷–۶.
--
-- ── ۲) برک یکی بود، باید دو تا باشد ──
-- `high_break` + `high_break_player` یعنی هر بازی فقط یک برک دارد.
-- ولی برک مالِ بازیکن است نه بازی: در یک بازی هر دو نفر ممکن است
-- برکِ قابل‌ثبت بزنند. حالا هر طرف ستونِ خودش را دارد و بالاترینِ
-- مسابقه از بیشترینِ همه‌ی این‌ها درمی‌آید.
--
-- دو ستونِ قبلی حذف می‌شوند نه اینکه بمانند: دو جا برای یک چیز
-- یعنی دیر یا زود یکی به‌روز می‌شود و دیگری نه. بررسی شد که هیچ
-- ردیفی مقدار نداشت (۰ ردیف).
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS high_break_p1 integer,
  ADD COLUMN IF NOT EXISTS high_break_p2 integer;

DROP FUNCTION IF EXISTS public.bh_match_set_break(uuid, integer, smallint);

ALTER TABLE public.tournament_matches
  DROP COLUMN IF EXISTS high_break,
  DROP COLUMN IF EXISTS high_break_player;

/* برکِ یک بازیکن در یک بازی. `p_value = NULL` یعنی پاک کن. */
CREATE OR REPLACE FUNCTION public.bh_match_set_break(
  p_match_id uuid, p_player integer, p_value integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record;
BEGIN
  IF p_player NOT IN (1, 2) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_player', 'message', 'بازیکن معتبر نیست');
  END IF;

  SELECT * INTO m FROM tournament_matches WHERE id = p_match_id FOR UPDATE;
  IF m.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'بازی یافت نشد');
  END IF;

  IF p_value IS NOT NULL AND (p_value < 0 OR p_value > 200) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'bad_break', 'message', 'مقدار برک معتبر نیست');
  END IF;
  IF (p_player = 1 AND m.p1_registration_id IS NULL)
  OR (p_player = 2 AND m.p2_registration_id IS NULL) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'incomplete', 'message', 'این بازیکن هنوز مشخص نیست');
  END IF;

  IF p_player = 1 THEN
    UPDATE tournament_matches SET high_break_p1 = p_value, updated_at = now() WHERE id = p_match_id;
  ELSE
    UPDATE tournament_matches SET high_break_p2 = p_value, updated_at = now() WHERE id = p_match_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'player', p_player, 'value', p_value);
END $$;

/* ── سقفِ فریم ──
   یک تابعِ مشترک تا هر دو مسیر (امتیازِ زنده و پایانِ بازی) یک
   قاعده داشته باشند. `NULL` یعنی مشکلی نیست. */
CREATE OR REPLACE FUNCTION public.bh_score_problem(
  p_target integer, p_score1 integer, p_score2 integer
) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_target IS NULL THEN RETURN NULL; END IF;
  IF p_score1 > p_target OR p_score2 > p_target THEN RETURN 'over_target'; END IF;
  /* هر دو به هدف برسند یعنی بازی‌ای که تمام نمی‌شود */
  IF p_score1 >= p_target AND p_score2 >= p_target THEN RETURN 'both_at_target'; END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.bh_match_live_score(
  p_match_id uuid, p_score1 integer, p_score2 integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; v_target integer; v_format text; v_bad text;
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
  v_bad := bh_score_problem(v_target, p_score1, p_score2);
  IF v_bad = 'over_target' THEN
    RETURN jsonb_build_object('ok', false, 'code', v_bad,
      'message', format('در این فرمت بیش از %s فریم ممکن نیست', v_target));
  ELSIF v_bad = 'both_at_target' THEN
    RETURN jsonb_build_object('ok', false, 'code', v_bad,
      'message', format('فقط یکی می‌تواند به %s فریم برسد — بازنده حداکثر %s', v_target, v_target - 1));
  END IF;

  UPDATE tournament_matches
     SET score1 = p_score1, score2 = p_score2,
         status = CASE WHEN status = 'waiting' THEN 'in_progress' ELSE status END,
         started_at = coalesce(started_at, now()), updated_at = now()
   WHERE id = p_match_id;

  RETURN jsonb_build_object('ok', true, 'score1', p_score1, 'score2', p_score2, 'target', v_target);
END $$;

CREATE OR REPLACE FUNCTION public.bh_match_report(
  p_match_id uuid, p_score1 integer, p_score2 integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m record; v_win smallint; v_next record;
  v_format text; v_target integer; v_bad text;
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
  v_bad := bh_score_problem(v_target, p_score1, p_score2);
  IF v_bad = 'over_target' THEN
    RETURN jsonb_build_object('ok', false, 'code', v_bad,
      'message', format('در این فرمت بیش از %s فریم ممکن نیست', v_target));
  ELSIF v_bad = 'both_at_target' THEN
    RETURN jsonb_build_object('ok', false, 'code', v_bad,
      'message', format('فقط یکی می‌تواند به %s فریم برسد — بازنده حداکثر %s', v_target, v_target - 1));
  END IF;
  IF v_target IS NOT NULL AND greatest(p_score1, p_score2) < v_target THEN
    RETURN jsonb_build_object('ok', false, 'code', 'under_target',
      'message', format('برای پایانِ بازی یکی باید به %s فریم برسد', v_target));
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

REVOKE ALL ON FUNCTION public.bh_match_set_break(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_score_problem(integer, integer, integer) FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
SELECT bh_score_problem(3, 3, 3) AS bo5_3_3_should_be_both,
       bh_score_problem(3, 3, 2) AS bo5_3_2_should_be_null,
       bh_score_problem(3, 4, 0) AS bo5_4_0_should_be_over,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_name = 'tournament_matches'
           AND column_name IN ('high_break_p1','high_break_p2')) AS break_cols;
