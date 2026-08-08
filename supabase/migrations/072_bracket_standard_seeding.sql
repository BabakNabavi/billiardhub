-- ─────────────────────────────────────────────────────────────────
-- ۰۷۲ — قرعه‌کشی به روشِ استانداردِ حذفی
--
-- ── باگی که این را ساخت ──
-- تابعِ قبلی بای‌ها را «به تعدادِ جاهای خالی، در ابتدای دور» می‌گذاشت:
-- اولین N بازی تک‌نفره می‌شدند و بقیه دو‌نفره. با ۱۳ بازیکن در جدولِ
-- ۱۶تایی نتیجه این شد:
--
--     نیمه‌ی راست (بازی ۱–۴):  ۳ بای  →  سه نفر مجانی صعود
--     نیمه‌ی چپ  (بازی ۵–۸):  ۰ بای  →  هر چهار بازی واقعی
--
-- یعنی یک نیمه‌ی جدول عملاً یک دور کمتر بازی می‌کرد. در هیچ مسابقه‌ی
-- استانداردی این پذیرفته نیست.
--
-- ── روشِ درست ──
-- جدولِ حذفی «ترتیبِ جایگاهِ سید» دارد که بازگشتی ساخته می‌شود:
--
--     order(1)  = [1]
--     order(2n) = برای هر x در order(n):  x , 2n+1-x
--
-- برای ۱۶:
--     [1,16, 8,9, 4,13, 5,12, 2,15, 7,10, 3,14, 6,11]
--
-- خاصیتش این است که سیدِ ۱ و ۲ در دو نیمه‌ی متفاوت می‌افتند، ۳ و ۴ هم
-- همین‌طور، و هر سید با دورترین سیدِ ممکن بازی می‌کند. بای‌ها هم خودکار
-- پخش می‌شوند: با ۱۳ بازیکن، سیدهای ۱۴ و ۱۵ و ۱۶ وجود ندارند، پس
-- حریفِ سیدهای ۳ و ۲ و ۱ خالی می‌ماند — یکی در نیمه‌ی راست و دو تا در
-- نیمه‌ی چپ، نه هر سه در یک طرف.
--
-- ── دو چیزِ دیگر ──
--   • حالتِ «براکتِ خالی» برای چیدنِ کاملاً دستی. تا امروز تنها راهِ
--     ساختِ جدول، قرعه‌کشیِ تصادفی بود؛ یعنی برگزارکننده باید اول
--     تصادفی می‌ریخت و بعد همه را جابه‌جا می‌کرد.
--   • قرعه‌کشی ثبت‌نام را می‌بندد. جدولی که کشیده شده با ثبت‌نامِ باز
--     یعنی نفرِ تازه جایی در جدول ندارد.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_seed_order(p_size integer)
RETURNS integer[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE cur integer[] := ARRAY[1]; nxt integer[]; sz integer := 1; x integer;
BEGIN
  WHILE sz < p_size LOOP
    sz := sz * 2;
    nxt := ARRAY[]::integer[];
    FOREACH x IN ARRAY cur LOOP
      nxt := nxt || x || (sz + 1 - x);
    END LOOP;
    cur := nxt;
  END LOOP;
  RETURN cur;
END $$;

CREATE OR REPLACE FUNCTION public.bh_tournament_draw(
  p_tournament_id uuid,
  p_shuffle       boolean DEFAULT true,
  /* خالی: ساختارِ جدول ساخته می‌شود ولی هیچ نامی نمی‌نشیند */
  p_empty         boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t record; v_count integer; v_size integer; v_rounds integer;
  v_r integer; v_i integer;
  v_players uuid[]; v_names text[];
  v_reg record;
  v_order integer[];
  s1 integer; s2 integer;
  v_p1 uuid; v_p2 uuid; v_n1 text; v_n2 text;
  v_made integer := 0;
BEGIN
  SELECT id, status INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF v_t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'مسابقه یافت نشد');
  END IF;

  IF EXISTS (SELECT 1 FROM tournament_matches WHERE tournament_id = p_tournament_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'exists',
      'message', 'براکتِ این مسابقه قبلاً ساخته شده است. برای قرعه‌کشیِ دوباره ابتدا آن را حذف کنید.');
  END IF;

  SELECT count(*) INTO v_count FROM tournament_registrations
   WHERE tournament_id = p_tournament_id AND status = 'CONFIRMED';

  IF v_count < 2 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'too_few',
      'message', 'برای ساختن جدول حداقل دو ثبت‌نامِ تأییدشده لازم است');
  END IF;

  v_size := 2;
  WHILE v_size < v_count LOOP v_size := v_size * 2; END LOOP;
  v_rounds := (ln(v_size) / ln(2))::integer;
  v_order  := bh_seed_order(v_size);

  IF NOT p_empty THEN
    FOR v_reg IN
      SELECT id, coalesce(nullif(btrim(player_name), ''), 'بازیکن') AS nm
      FROM tournament_registrations
      WHERE tournament_id = p_tournament_id AND status = 'CONFIRMED'
      ORDER BY CASE WHEN p_shuffle THEN random() ELSE 0 END, created_at
    LOOP
      v_players := array_append(v_players, v_reg.id);
      v_names   := array_append(v_names, v_reg.nm);
    END LOOP;
  END IF;

  FOR v_i IN 0 .. (v_size / 2 - 1) LOOP
    /* دو جایگاهِ این بازی طبقِ ترتیبِ استاندارد */
    s1 := v_order[v_i * 2 + 1];
    s2 := v_order[v_i * 2 + 2];

    /* سیدی که بزرگ‌تر از تعدادِ بازیکنان باشد وجود ندارد ⇒ بای */
    v_p1 := CASE WHEN p_empty OR s1 > v_count THEN NULL ELSE v_players[s1] END;
    v_n1 := CASE WHEN p_empty OR s1 > v_count THEN NULL ELSE v_names[s1]   END;
    v_p2 := CASE WHEN p_empty OR s2 > v_count THEN NULL ELSE v_players[s2] END;
    v_n2 := CASE WHEN p_empty OR s2 > v_count THEN NULL ELSE v_names[s2]   END;

    INSERT INTO tournament_matches (
      tournament_id, round, match_index,
      p1_registration_id, p2_registration_id, p1_name, p2_name,
      status, winner, completed_at)
    VALUES (
      p_tournament_id, 1, v_i, v_p1, v_p2, v_n1, v_n2,
      CASE WHEN (v_p1 IS NULL) <> (v_p2 IS NULL) THEN 'completed' ELSE 'waiting' END,
      CASE WHEN v_p1 IS NOT NULL AND v_p2 IS NULL THEN 1
           WHEN v_p1 IS NULL AND v_p2 IS NOT NULL THEN 2 ELSE NULL END,
      CASE WHEN (v_p1 IS NULL) <> (v_p2 IS NULL) THEN now() ELSE NULL END);
    v_made := v_made + 1;
  END LOOP;

  FOR v_r IN 2 .. v_rounds LOOP
    FOR v_i IN 0 .. (v_size / (2 ^ v_r)::integer - 1) LOOP
      INSERT INTO tournament_matches (tournament_id, round, match_index)
      VALUES (p_tournament_id, v_r, v_i);
      v_made := v_made + 1;
    END LOOP;
  END LOOP;

  /* برنده‌های بای همان‌جا به دورِ دوم می‌روند */
  IF NOT p_empty THEN
    PERFORM bh_bracket_advance_byes(p_tournament_id);
  END IF;

  /* ── بستنِ ثبت‌نام ──
     جدولی که کشیده شده با ثبت‌نامِ باز یعنی نفرِ تازه پول می‌دهد و
     جایی در جدول ندارد. */
  UPDATE tournaments SET status = 'registration_closed', updated_at = now()
   WHERE id = p_tournament_id AND status IN ('registration_open', 'published');

  RETURN jsonb_build_object('ok', true, 'matches', v_made,
    'size', v_size, 'rounds', v_rounds, 'players', v_count, 'empty', p_empty);
END $$;

/* ── صعودِ برنده‌های بای ──
   بازیِ تک‌نفره از همان لحظه برنده دارد؛ اگر همان‌جا به دورِ بعد
   نرود، جایگاهش تا ثبتِ نتیجه‌ی بازیِ کناری خالی می‌ماند و جدول
   ناقص دیده می‌شود. */
CREATE OR REPLACE FUNCTION public.bh_bracket_advance_byes(p_tournament uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE m record; n integer := 0; v_reg uuid; v_name text;
BEGIN
  FOR m IN
    SELECT * FROM tournament_matches
     WHERE tournament_id = p_tournament AND round = 1 AND winner IS NOT NULL
     ORDER BY match_index
  LOOP
    IF m.winner = 1 THEN v_reg := m.p1_registration_id; v_name := m.p1_name;
                    ELSE v_reg := m.p2_registration_id; v_name := m.p2_name; END IF;
    IF v_reg IS NULL THEN CONTINUE; END IF;

    IF m.match_index % 2 = 0 THEN
      UPDATE tournament_matches SET p1_registration_id = v_reg, p1_name = v_name
       WHERE tournament_id = p_tournament AND round = 2 AND match_index = m.match_index / 2;
    ELSE
      UPDATE tournament_matches SET p2_registration_id = v_reg, p2_name = v_name
       WHERE tournament_id = p_tournament AND round = 2 AND match_index = m.match_index / 2;
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

/* ── تأییدِ چیدمانِ دستی ──
   بعد از چیدنِ دستی، بازی‌هایی که یک طرفشان خالی مانده باید بای
   شوند و برنده‌شان صعود کند — همان کاری که قرعه‌کشیِ خودکار در
   لحظه‌ی ساخت می‌کند. */
CREATE OR REPLACE FUNCTION public.bh_bracket_finalize(p_tournament uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE v_played integer; v_empty integer; n integer;
BEGIN
  SELECT count(*) INTO v_played FROM tournament_matches
   WHERE tournament_id = p_tournament AND round > 1 AND winner IS NOT NULL;
  IF v_played > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  /* بازیِ کاملاً خالی یعنی چیدمان ناقص است */
  SELECT count(*) INTO v_empty FROM tournament_matches
   WHERE tournament_id = p_tournament AND round = 1
     AND p1_registration_id IS NULL AND p2_registration_id IS NULL;
  IF v_empty > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'empty_match', 'count', v_empty);
  END IF;

  UPDATE tournament_matches
     SET status = 'completed', completed_at = now(),
         winner = CASE WHEN p1_registration_id IS NOT NULL THEN 1 ELSE 2 END
   WHERE tournament_id = p_tournament AND round = 1
     AND (p1_registration_id IS NULL) <> (p2_registration_id IS NULL)
     AND winner IS NULL;

  n := bh_bracket_advance_byes(p_tournament);

  UPDATE tournaments SET status = 'registration_closed', updated_at = now()
   WHERE id = p_tournament AND status IN ('registration_open', 'published');

  RETURN jsonb_build_object('ok', true, 'advanced', n);
END $$;

/* ── پایانِ مسابقه ──
   تا امروز هیچ راهی برای «تمام شد» نبود: مسابقه بعد از فینال هم در
   وضعیتِ قبلی می‌ماند و هیچ‌وقت به تبِ «پایان یافته» نمی‌رفت. */
CREATE OR REPLACE FUNCTION public.bh_tournament_finish(p_tournament uuid, p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE t record; v_final record;
BEGIN
  SELECT * INTO t FROM tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF t.status = 'completed' THEN RETURN jsonb_build_object('ok', true, 'idempotent', true); END IF;
  IF t.status = 'cancelled' THEN RETURN jsonb_build_object('ok', false, 'reason', 'cancelled'); END IF;

  UPDATE tournaments SET status = 'completed', updated_at = now() WHERE id = p_tournament;
  RETURN jsonb_build_object('ok', true);
END $$;

/* ── شروعِ خودکار ──
   مسابقه‌ای که ساعتِ شروعش رسیده باید از «ثبت‌نام بسته» به «در حال
   برگزاری» برود. کران نساختیم؛ همان‌جا که فهرست خوانده می‌شود صدا
   زده می‌شود. */
CREATE OR REPLACE FUNCTION public.bh_tournaments_autostart()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  UPDATE tournaments
     SET status = 'ongoing', updated_at = now()
   WHERE status IN ('registration_closed', 'registration_open')
     AND starts_at IS NOT NULL AND starts_at <= now()
     AND EXISTS (SELECT 1 FROM tournament_matches m WHERE m.tournament_id = tournaments.id);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.bh_tournament_draw(uuid, boolean, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_bracket_finalize(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_finish(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournaments_autostart() FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
-- ترتیبِ سیدِ ۱۶تایی باید دقیقاً این باشد
SELECT bh_seed_order(16) AS seed_order_16,
       (SELECT count(*) FROM pg_proc WHERE proname IN
         ('bh_seed_order','bh_bracket_finalize','bh_tournament_finish',
          'bh_tournaments_autostart','bh_bracket_advance_byes')) AS fns;
