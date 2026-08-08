-- ─────────────────────────────────────────────────────────────────
-- ۰۷۳ — «بای» نتیجه‌ی بازی نیست
--
-- ── باگی که این را ساخت ──
-- توابعِ چیدنِ دستی این‌طور بررسی می‌کردند که آیا مسابقه شروع شده:
--
--     SELECT count(*) ... WHERE winner IS NOT NULL
--
-- ولی بازیِ بای هم از همان لحظه‌ی ساخت `winner` دارد — کسی که حریف
-- ندارد خودکار برنده است. پس به‌محضِ اینکه برگزارکننده «تأیید
-- چیدمان» را می‌زد و بای‌ها بسته می‌شدند، همین شرط درست می‌شد و
-- سیستم می‌گفت:
--
--     «نتیجه‌ای ثبت شده — جایگاه‌ها دیگر قابل جابه‌جایی نیستند»
--
-- در حالی که هیچ بازی‌ای انجام نشده بود. برگزارکننده‌ای که می‌خواست
-- چیدمانش را اصلاح کند، قفل می‌شد.
--
-- ── تعریفِ درست ──
-- مسابقه وقتی «شروع شده» است که نتیجه‌ی یک بازیِ **واقعی** ثبت شده
-- باشد — بازی‌ای که هر دو طرفش بازیکن داشته‌اند.
-- ─────────────────────────────────────────────────────────────────

/* بازیِ واقعی: هر دو جایگاهش پر بوده و برنده دارد */
CREATE OR REPLACE FUNCTION public.bh_bracket_has_real_result(p_tournament uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_matches
     WHERE tournament_id = p_tournament
       AND winner IS NOT NULL
       AND p1_registration_id IS NOT NULL
       AND p2_registration_id IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.bh_bracket_swap_slots(
  p_tournament uuid, p_match_a uuid, p_slot_a integer,
  p_match_b uuid, p_slot_b integer, p_actor uuid
) RETURNS jsonb AS $$
DECLARE
  a record; b record;
  a_reg uuid; a_name text; b_reg uuid; b_name text;
BEGIN
  IF p_slot_a NOT IN (1,2) OR p_slot_b NOT IN (1,2) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_slot');
  END IF;
  IF bh_bracket_has_real_result(p_tournament) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  SELECT * INTO a FROM public.tournament_matches
   WHERE id = p_match_a AND tournament_id = p_tournament FOR UPDATE;
  SELECT * INTO b FROM public.tournament_matches
   WHERE id = p_match_b AND tournament_id = p_tournament FOR UPDATE;
  IF a.id IS NULL OR b.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'match_not_found');
  END IF;
  IF a.round <> 1 OR b.round <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_first_round');
  END IF;

  IF p_slot_a = 1 THEN a_reg := a.p1_registration_id; a_name := a.p1_name;
                  ELSE a_reg := a.p2_registration_id; a_name := a.p2_name; END IF;
  IF p_slot_b = 1 THEN b_reg := b.p1_registration_id; b_name := b.p1_name;
                  ELSE b_reg := b.p2_registration_id; b_name := b.p2_name; END IF;

  IF p_match_a = p_match_b AND p_slot_a = p_slot_b THEN
    RETURN jsonb_build_object('ok', true, 'noop', true);
  END IF;

  IF p_slot_a = 1 THEN
    UPDATE public.tournament_matches SET p1_registration_id = b_reg, p1_name = b_name WHERE id = p_match_a;
  ELSE
    UPDATE public.tournament_matches SET p2_registration_id = b_reg, p2_name = b_name WHERE id = p_match_a;
  END IF;
  IF p_slot_b = 1 THEN
    UPDATE public.tournament_matches SET p1_registration_id = a_reg, p1_name = a_name WHERE id = p_match_b;
  ELSE
    UPDATE public.tournament_matches SET p2_registration_id = a_reg, p2_name = a_name WHERE id = p_match_b;
  END IF;

  /* چیدمان که عوض شد، بای‌های قبلی بی‌اعتبارند: بازی‌ای که تک‌نفره
     بود شاید حالا دو نفر دارد. همه پاک می‌شوند و «تأیید چیدمان»
     دوباره می‌سازدشان. */
  UPDATE public.tournament_matches
     SET winner = NULL, status = 'waiting', completed_at = NULL
   WHERE tournament_id = p_tournament AND round = 1;
  UPDATE public.tournament_matches
     SET p1_registration_id = NULL, p1_name = NULL,
         p2_registration_id = NULL, p2_name = NULL
   WHERE tournament_id = p_tournament AND round = 2;

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.bh_bracket_clear_slots(p_tournament uuid)
RETURNS jsonb AS $$
DECLARE n integer;
BEGIN
  IF bh_bracket_has_real_result(p_tournament) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  UPDATE public.tournament_matches
     SET p1_registration_id = NULL, p1_name = NULL,
         p2_registration_id = NULL, p2_name = NULL,
         winner = NULL, status = 'waiting', completed_at = NULL
   WHERE tournament_id = p_tournament AND round = 1;
  GET DIAGNOSTICS n = ROW_COUNT;

  /* دورِ دوم هم پاک می‌شود، وگرنه برنده‌های بایِ قبلی آن‌جا می‌مانند */
  UPDATE public.tournament_matches
     SET p1_registration_id = NULL, p1_name = NULL,
         p2_registration_id = NULL, p2_name = NULL
   WHERE tournament_id = p_tournament AND round = 2;

  RETURN jsonb_build_object('ok', true, 'cleared', n);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.bh_bracket_place(
  p_tournament uuid, p_match uuid, p_slot integer,
  p_registration uuid, p_actor uuid
) RETURNS jsonb AS $$
DECLARE m record; v_name text; v_dup integer;
BEGIN
  IF p_slot NOT IN (1,2) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_slot');
  END IF;
  IF bh_bracket_has_real_result(p_tournament) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  SELECT * INTO m FROM public.tournament_matches
   WHERE id = p_match AND tournament_id = p_tournament FOR UPDATE;
  IF m.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'match_not_found'); END IF;
  IF m.round <> 1 THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_first_round'); END IF;

  IF p_registration IS NOT NULL THEN
    SELECT player_name INTO v_name FROM public.tournament_registrations
     WHERE id = p_registration AND tournament_id = p_tournament;
    IF v_name IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'registration_not_found');
    END IF;

    SELECT count(*) INTO v_dup FROM public.tournament_matches
     WHERE tournament_id = p_tournament
       AND (p1_registration_id = p_registration OR p2_registration_id = p_registration)
       AND NOT (id = p_match AND (
         (p_slot = 1 AND p1_registration_id = p_registration) OR
         (p_slot = 2 AND p2_registration_id = p_registration)));
    IF v_dup > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_placed');
    END IF;
  END IF;

  IF p_slot = 1 THEN
    UPDATE public.tournament_matches
       SET p1_registration_id = p_registration, p1_name = v_name WHERE id = p_match;
  ELSE
    UPDATE public.tournament_matches
       SET p2_registration_id = p_registration, p2_name = v_name WHERE id = p_match;
  END IF;

  /* همان دلیلِ بالا — بای‌ها با هر تغییرِ چیدمان بی‌اعتبار می‌شوند */
  UPDATE public.tournament_matches
     SET winner = NULL, status = 'waiting', completed_at = NULL
   WHERE id = p_match AND winner IS NOT NULL;

  RETURN jsonb_build_object('ok', true, 'name', v_name);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.bh_bracket_finalize(p_tournament uuid)
RETURNS jsonb AS $$
DECLARE v_empty integer; n integer;
BEGIN
  IF bh_bracket_has_real_result(p_tournament) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  SELECT count(*) INTO v_empty FROM public.tournament_matches
   WHERE tournament_id = p_tournament AND round = 1
     AND p1_registration_id IS NULL AND p2_registration_id IS NULL;
  IF v_empty > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'empty_match', 'count', v_empty);
  END IF;

  UPDATE public.tournament_matches
     SET status = 'completed', completed_at = now(),
         winner = CASE WHEN p1_registration_id IS NOT NULL THEN 1 ELSE 2 END
   WHERE tournament_id = p_tournament AND round = 1
     AND (p1_registration_id IS NULL) <> (p2_registration_id IS NULL)
     AND winner IS NULL;

  n := bh_bracket_advance_byes(p_tournament);

  UPDATE public.tournaments SET status = 'registration_closed', updated_at = now()
   WHERE id = p_tournament AND status IN ('registration_open', 'published');

  RETURN jsonb_build_object('ok', true, 'advanced', n);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_bracket_has_real_result(uuid) FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
SELECT count(*) AS fns FROM pg_proc
 WHERE proname IN ('bh_bracket_has_real_result','bh_bracket_swap_slots',
                   'bh_bracket_clear_slots','bh_bracket_place','bh_bracket_finalize');
