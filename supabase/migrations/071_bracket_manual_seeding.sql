-- ─────────────────────────────────────────────────────────────────
-- ۰۷۱ — چیدنِ دستیِ براکت
--
-- ── چه چیزی کم بود ──
-- قرعه‌کشی فقط تصادفی بود. برگزارکننده‌ی واقعی این را نمی‌خواهد:
-- بازیکنانِ هم‌باشگاه نباید دورِ اول به هم بخورند، نفراتِ سیدشده باید
-- در دو نیمه‌ی متفاوت بیفتند، و کسی که دیر می‌رسد باید در بازیِ
-- دیرتری باشد. همه‌ی این‌ها یعنی جابه‌جاییِ دستیِ جایگاه‌ها.
--
-- نسخه‌ی قبلیِ رابط این را داشت ولی فقط در حافظه‌ی مرورگر؛ با رفرش
-- می‌رفت. حالا هر جابه‌جایی در دیتابیس ثبت می‌شود.
--
-- ── چرا «تعویض» و نه «انتساب» ──
-- عملِ پایه عمداً swap است نه set. با set، گذاشتنِ بازیکن روی جایگاهی
-- که پر است یعنی بازیکنِ قبلی بی‌صدا حذف می‌شود و از براکت بیرون
-- می‌افتد — و چون همه‌ی جایگاه‌ها پر به‌نظر می‌رسند، کسی متوجه
-- نمی‌شود تا روزِ مسابقه. با swap هیچ‌کس گم نمی‌شود.
--
-- ── محدوده ──
-- فقط دورِ اول و فقط پیش از شروعِ بازی‌ها. بعد از ثبتِ اولین نتیجه،
-- جابه‌جایی یعنی بازنویسیِ تاریخچه‌ی مسابقه.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_bracket_swap_slots(
  p_tournament uuid,
  p_match_a    uuid,
  p_slot_a     integer,     -- ۱ یا ۲
  p_match_b    uuid,
  p_slot_b     integer,
  p_actor      uuid
) RETURNS jsonb AS $$
DECLARE
  a record; b record;
  a_reg uuid; a_name text;
  b_reg uuid; b_name text;
  v_played integer;
BEGIN
  IF p_slot_a NOT IN (1,2) OR p_slot_b NOT IN (1,2) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_slot');
  END IF;

  /* هیچ نتیجه‌ای نباید ثبت شده باشد. این را روی کلِ مسابقه می‌سنجیم
     نه فقط دو بازیِ درگیر: با یک نتیجه‌ی ثبت‌شده، برنده از قبل به
     دورِ بعد رفته و جابه‌جاییِ دورِ اول آن را بی‌معنی می‌کند. */
  SELECT count(*) INTO v_played FROM public.tournament_matches
   WHERE tournament_id = p_tournament AND winner IS NOT NULL;
  IF v_played > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  SELECT * INTO a FROM public.tournament_matches
   WHERE id = p_match_a AND tournament_id = p_tournament FOR UPDATE;
  SELECT * INTO b FROM public.tournament_matches
   WHERE id = p_match_b AND tournament_id = p_tournament FOR UPDATE;

  IF a.id IS NULL OR b.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'match_not_found');
  END IF;

  /* جابه‌جایی فقط در دورِ اول معنی دارد؛ جایگاه‌های دورهای بعد را
     خودِ نتیجه‌ی بازی پر می‌کند، نه دستِ برگزارکننده. */
  IF a.round <> 1 OR b.round <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_first_round');
  END IF;

  /* مقدارهای فعلیِ دو جایگاه */
  IF p_slot_a = 1 THEN a_reg := a.p1_registration_id; a_name := a.p1_name;
                  ELSE a_reg := a.p2_registration_id; a_name := a.p2_name; END IF;
  IF p_slot_b = 1 THEN b_reg := b.p1_registration_id; b_name := b.p1_name;
                  ELSE b_reg := b.p2_registration_id; b_name := b.p2_name; END IF;

  /* جایگاهِ خودش با خودش — کاری لازم نیست */
  IF p_match_a = p_match_b AND p_slot_a = p_slot_b THEN
    RETURN jsonb_build_object('ok', true, 'noop', true);
  END IF;

  /* نوشتنِ مقدارِ B روی جایگاهِ A */
  IF p_slot_a = 1 THEN
    UPDATE public.tournament_matches
       SET p1_registration_id = b_reg, p1_name = b_name WHERE id = p_match_a;
  ELSE
    UPDATE public.tournament_matches
       SET p2_registration_id = b_reg, p2_name = b_name WHERE id = p_match_a;
  END IF;

  /* و مقدارِ A روی جایگاهِ B */
  IF p_slot_b = 1 THEN
    UPDATE public.tournament_matches
       SET p1_registration_id = a_reg, p1_name = a_name WHERE id = p_match_b;
  ELSE
    UPDATE public.tournament_matches
       SET p2_registration_id = a_reg, p2_name = a_name WHERE id = p_match_b;
  END IF;

  RETURN jsonb_build_object('ok', true,
    'a', jsonb_build_object('match', p_match_a, 'slot', p_slot_a, 'name', b_name),
    'b', jsonb_build_object('match', p_match_b, 'slot', p_slot_b, 'name', a_name));
END;
$$ LANGUAGE plpgsql;

/* ── قرعه‌کشیِ خالی ──
   برای چیدنِ کاملاً دستی: ساختارِ براکت ساخته می‌شود ولی هیچ نامی
   در جایگاه‌ها نمی‌نشیند. بدونِ این، برگزارکننده مجبور بود اول
   تصادفی قرعه بکشد و بعد همه را جابه‌جا کند.

   خودِ `bh_tournament_draw` با `p_shuffle` کار می‌کند و ترتیب را
   عوض می‌کند؛ این‌جا فقط نام‌ها پاک می‌شوند تا جایگاه‌ها خالی
   بمانند. ساختار (تعدادِ دور و بازی) دست‌نخورده می‌ماند. */
CREATE OR REPLACE FUNCTION public.bh_bracket_clear_slots(
  p_tournament uuid
) RETURNS jsonb AS $$
DECLARE v_played integer; n integer;
BEGIN
  SELECT count(*) INTO v_played FROM public.tournament_matches
   WHERE tournament_id = p_tournament AND winner IS NOT NULL;
  IF v_played > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  UPDATE public.tournament_matches
     SET p1_registration_id = NULL, p1_name = NULL,
         p2_registration_id = NULL, p2_name = NULL
   WHERE tournament_id = p_tournament AND round = 1;
  GET DIAGNOSTICS n = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'cleared', n);
END;
$$ LANGUAGE plpgsql;

/* ── گذاشتنِ یک بازیکن روی یک جایگاهِ خالی ──
   وقتی بازیکن از «استخر» (فهرستِ چیده‌نشده‌ها) می‌آید، طرفِ مقابلی
   برای تعویض وجود ندارد. اگر جایگاه پر باشد، ساکنِ فعلی به استخر
   برمی‌گردد — یعنی هیچ‌وقت بی‌صدا حذف نمی‌شود. */
CREATE OR REPLACE FUNCTION public.bh_bracket_place(
  p_tournament   uuid,
  p_match        uuid,
  p_slot         integer,
  p_registration uuid,          -- NULL یعنی «خالی کن»
  p_actor        uuid
) RETURNS jsonb AS $$
DECLARE m record; v_played integer; v_name text; v_dup integer;
BEGIN
  IF p_slot NOT IN (1,2) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_slot');
  END IF;

  SELECT count(*) INTO v_played FROM public.tournament_matches
   WHERE tournament_id = p_tournament AND winner IS NOT NULL;
  IF v_played > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  SELECT * INTO m FROM public.tournament_matches
   WHERE id = p_match AND tournament_id = p_tournament FOR UPDATE;
  IF m.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'match_not_found');
  END IF;
  IF m.round <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_first_round');
  END IF;

  IF p_registration IS NOT NULL THEN
    SELECT player_name INTO v_name FROM public.tournament_registrations
     WHERE id = p_registration AND tournament_id = p_tournament;
    IF v_name IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'registration_not_found');
    END IF;

    /* یک بازیکن نباید دو جایگاه داشته باشد. بدونِ این بررسی،
       کشیدنِ دوباره‌ی یک نام از استخر او را در دو بازی می‌گذاشت و
       براکت غیرقابلِ اجرا می‌شد. */
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

  RETURN jsonb_build_object('ok', true, 'name', v_name);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_bracket_swap_slots(uuid, uuid, integer, uuid, integer, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_bracket_clear_slots(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_bracket_place(uuid, uuid, integer, uuid, uuid)
  FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
-- انتظار: fns=3
SELECT count(*) AS fns FROM pg_proc
 WHERE proname IN ('bh_bracket_swap_slots', 'bh_bracket_clear_slots', 'bh_bracket_place');
