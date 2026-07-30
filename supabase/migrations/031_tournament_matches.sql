-- ─────────────────────────────────────────────────────────────
-- براکتِ مسابقات — جدولِ بازی‌ها و دو عملیاتِ اتمیک.
--
-- تا امروز چهار صفحه‌ی bracket / live / results / admin روی داده‌ی
-- ساختگیِ داخلِ کد کار می‌کردند، چون هیچ جدولی برای «بازی» وجود نداشت.
--
-- مدل: حذفیِ یک‌طرفه (single elimination).
--   round       ۱ = دورِ اول، و هر دور نصفِ دورِ قبل بازی دارد
--   match_index از ۰، درونِ همان دور
--   برنده‌ی (round r, index i) به (round r+1, index i/2) می‌رود؛
--   زوج‌ها جای بازیکنِ ۱ و فردها جای بازیکنِ ۲ می‌نشینند.
--
-- نامِ بازیکن Snapshot می‌شود: اگر ثبت‌نام بعداً لغو یا حذف شود،
-- براکتِ برگزارشده نباید نامش را از دست بدهد.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id      uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round              integer NOT NULL,
  match_index        integer NOT NULL,

  p1_registration_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  p2_registration_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
  p1_name            text,
  p2_name            text,

  score1             integer NOT NULL DEFAULT 0,
  score2             integer NOT NULL DEFAULT 0,
  winner             smallint,          -- ۱ یا ۲ یا NULL
  status             text NOT NULL DEFAULT 'waiting',
  table_number       integer,

  started_at         timestamptz,
  completed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tmatch_round_chk  CHECK (round BETWEEN 1 AND 12),
  CONSTRAINT tmatch_index_chk  CHECK (match_index >= 0),
  CONSTRAINT tmatch_winner_chk CHECK (winner IS NULL OR winner IN (1, 2)),
  CONSTRAINT tmatch_score_chk  CHECK (score1 >= 0 AND score2 >= 0 AND score1 <= 99 AND score2 <= 99),
  CONSTRAINT tmatch_status_chk CHECK (status IN ('waiting', 'in_progress', 'completed')),
  /* بازیِ تمام‌شده حتماً برنده دارد و برعکس — حالتِ نیمه‌کاره ممکن نیست */
  CONSTRAINT tmatch_done_chk   CHECK ((status = 'completed') = (winner IS NOT NULL)),
  CONSTRAINT tmatch_slot_uniq  UNIQUE (tournament_id, round, match_index)
);

CREATE INDEX IF NOT EXISTS idx_tmatch_tournament ON public.tournament_matches (tournament_id, round, match_index);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
-- خواندن و نوشتن فقط از سرور با service-role؛ هیچ policyِ عمومی‌ای نیست.

-- ─────────────────────────────────────────────────────────────
-- قرعه‌کشی — کلِ براکت در یک تراکنش ساخته می‌شود.
--
-- چرا اتمیک: ساختِ براکت یعنی چند ده INSERT. اگر وسطِ کار قطع شود،
-- براکتِ نصفه می‌ماند که از نبودِ براکت بدتر است.
--
-- خطاها با RETURN jsonb برمی‌گردند نه RAISE، چون RAISE کلِ تابع را
-- برمی‌گرداند و پیامِ فارسی هم به کلاینت نمی‌رسد.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_draw(
  p_tournament_id uuid,
  p_shuffle       boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t          record;
  v_count      integer;
  v_size       integer;
  v_rounds     integer;
  v_r          integer;
  v_i          integer;
  v_players    uuid[];
  v_names      text[];
  v_reg        record;
  v_p1         uuid;  v_p2 uuid;
  v_n1         text;  v_n2 text;
  v_byes       integer;
  v_taken      integer;
  v_made       integer := 0;
BEGIN
  SELECT id, status INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF v_t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'مسابقه یافت نشد');
  END IF;

  /* براکتِ موجود بی‌صدا بازنویسی نمی‌شود — نتیجه‌ی ثبت‌شده از بین می‌رود */
  IF EXISTS (SELECT 1 FROM tournament_matches WHERE tournament_id = p_tournament_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'exists',
      'message', 'براکتِ این مسابقه قبلاً ساخته شده است. برای قرعه‌کشیِ دوباره ابتدا آن را حذف کنید.');
  END IF;

  /* فقط ثبت‌نامِ تأییدشده وارد براکت می‌شود */
  SELECT count(*) INTO v_count
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id AND status = 'CONFIRMED';

  IF v_count < 2 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'too_few',
      'message', 'برای قرعه‌کشی حداقل دو ثبت‌نامِ تأییدشده لازم است');
  END IF;

  /* اندازه‌ی براکت = نزدیک‌ترین توانِ ۲ بزرگ‌تر یا مساوی.
     جاهای خالی «بای» می‌شوند و بازیکنِ حاضر خودکار صعود می‌کند. */
  v_size := 2;
  WHILE v_size < v_count LOOP v_size := v_size * 2; END LOOP;
  v_rounds := (ln(v_size) / ln(2))::integer;

  /* ترتیب: یا قرعه‌ی تصادفی، یا به ترتیبِ ثبت‌نام */
  FOR v_reg IN
    SELECT id, coalesce(nullif(btrim(player_name), ''), 'بازیکن') AS nm
    FROM tournament_registrations
    WHERE tournament_id = p_tournament_id AND status = 'CONFIRMED'
    ORDER BY CASE WHEN p_shuffle THEN random() ELSE 0 END, created_at
  LOOP
    v_players := array_append(v_players, v_reg.id);
    v_names   := array_append(v_names, v_reg.nm);
  END LOOP;

  /* پخشِ بای‌ها.

     ساده‌ترین راه — پرکردنِ پشتِ‌سرِهمِ جایگاه‌ها — غلط است: با ۵ بازیکن
     در براکتِ ۸ تایی، بازیِ چهارم هر دو طرفش خالی می‌ماند. آن بازی هیچ
     برنده‌ای ندارد، پس جایگاهش در دورِ بعد هم برای همیشه خالی می‌ماند و
     براکت قفل می‌شود.

     درست: به تعدادِ جاهای خالی (`v_byes`) بازیِ تک‌نفره در ابتدای دور
     می‌گذاریم و بقیه‌ی بازی‌ها دو بازیکنِ کامل می‌گیرند. این‌طور هیچ
     بازی‌ای بدونِ بازیکن نمی‌ماند و بای هم — طبقِ رسمِ مسابقات — نصیبِ
     نفراتِ اولِ فهرست می‌شود. */
  v_byes := v_size - v_count;
  v_taken := 0;

  FOR v_i IN 0 .. (v_size / 2 - 1) LOOP
    IF v_i < v_byes THEN
      /* بازیِ تک‌نفره: بای */
      v_p1 := v_players[v_taken + 1];
      v_n1 := v_names[v_taken + 1];
      v_p2 := NULL; v_n2 := NULL;
      v_taken := v_taken + 1;
    ELSE
      v_p1 := v_players[v_taken + 1];
      v_n1 := v_names[v_taken + 1];
      v_p2 := v_players[v_taken + 2];
      v_n2 := v_names[v_taken + 2];
      v_taken := v_taken + 2;
    END IF;

    INSERT INTO tournament_matches (
      tournament_id, round, match_index,
      p1_registration_id, p2_registration_id, p1_name, p2_name,
      status, winner, completed_at)
    VALUES (
      p_tournament_id, 1, v_i,
      v_p1, v_p2, v_n1, v_n2,
      /* بای: یک طرف خالی است ⇒ بازی همان‌جا تمام‌شده ثبت می‌شود */
      CASE WHEN v_p1 IS NOT NULL AND v_p2 IS NULL THEN 'completed'
           WHEN v_p1 IS NULL AND v_p2 IS NOT NULL THEN 'completed'
           ELSE 'waiting' END,
      CASE WHEN v_p1 IS NOT NULL AND v_p2 IS NULL THEN 1
           WHEN v_p1 IS NULL AND v_p2 IS NOT NULL THEN 2
           ELSE NULL END,
      CASE WHEN (v_p1 IS NULL) <> (v_p2 IS NULL) THEN now() ELSE NULL END);
    v_made := v_made + 1;
  END LOOP;

  /* دورهای بعد خالی ساخته می‌شوند تا شکلِ براکت از همان اول کامل باشد */
  FOR v_r IN 2 .. v_rounds LOOP
    FOR v_i IN 0 .. (v_size / (2 ^ v_r)::integer - 1) LOOP
      INSERT INTO tournament_matches (tournament_id, round, match_index)
      VALUES (p_tournament_id, v_r, v_i);
      v_made := v_made + 1;
    END LOOP;
  END LOOP;

  /* برنده‌های بای بلافاصله به دورِ دوم منتقل می‌شوند */
  PERFORM public.bh_match_advance(id) FROM tournament_matches
   WHERE tournament_id = p_tournament_id AND round = 1 AND status = 'completed';

  UPDATE tournaments
     SET status = CASE WHEN status IN ('draft','published','registration_open')
                       THEN 'registration_closed' ELSE status END,
         updated_at = now()
   WHERE id = p_tournament_id;

  RETURN jsonb_build_object('ok', true, 'players', v_count,
    'bracketSize', v_size, 'rounds', v_rounds, 'matches', v_made);
END $$;

-- ─────────────────────────────────────────────────────────────
-- انتقالِ برنده به دورِ بعد. جدا از ثبتِ نتیجه است چون قرعه‌کشی هم
-- (برای بای‌ها) به آن نیاز دارد.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_match_advance(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m       record;
  w_reg   uuid;
  w_name  text;
  nxt_idx integer;
BEGIN
  SELECT * INTO m FROM tournament_matches WHERE id = p_match_id;
  IF m.id IS NULL OR m.winner IS NULL THEN RETURN; END IF;

  IF m.winner = 1 THEN w_reg := m.p1_registration_id; w_name := m.p1_name;
                  ELSE w_reg := m.p2_registration_id; w_name := m.p2_name; END IF;

  nxt_idx := m.match_index / 2;

  /* زوج → جایگاهِ بازیکنِ ۱، فرد → جایگاهِ بازیکنِ ۲ */
  IF m.match_index % 2 = 0 THEN
    UPDATE tournament_matches
       SET p1_registration_id = w_reg, p1_name = w_name, updated_at = now()
     WHERE tournament_id = m.tournament_id AND round = m.round + 1 AND match_index = nxt_idx;
  ELSE
    UPDATE tournament_matches
       SET p2_registration_id = w_reg, p2_name = w_name, updated_at = now()
     WHERE tournament_id = m.tournament_id AND round = m.round + 1 AND match_index = nxt_idx;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- ثبتِ نتیجه‌ی یک بازی.
--
-- اتمیک است چون سه کار با هم انجام می‌شود: نوشتنِ امتیاز، تعیینِ
-- برنده، و بردنِ برنده به دورِ بعد. اگر دومی انجام شود و سومی نه،
-- براکت ناسازگار می‌ماند.
-- ─────────────────────────────────────────────────────────────
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

  /* اگر برنده‌ی قبلی به دورِ بعد رفته و آن‌جا بازی کرده، تغییرِ نتیجه
     براکت را خراب می‌کند. ابتدا باید نتیجه‌ی دورِ بعد پاک شود. */
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

  /* آخرین بازیِ براکت که تمام شود، مسابقه پایان‌یافته است */
  IF NOT EXISTS (
    SELECT 1 FROM tournament_matches
     WHERE tournament_id = m.tournament_id AND winner IS NULL
  ) THEN
    UPDATE tournaments SET status = 'completed', updated_at = now()
     WHERE id = m.tournament_id AND status <> 'cancelled';
  ELSE
    UPDATE tournaments SET status = 'ongoing', updated_at = now()
     WHERE id = m.tournament_id AND status IN ('registration_closed', 'published', 'registration_open');
  END IF;

  RETURN jsonb_build_object('ok', true, 'winner', v_win);
END $$;

-- ─────────────────────────────────────────────────────────────
-- حذفِ کاملِ براکت — برای قرعه‌کشیِ دوباره.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_reset_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n integer;
BEGIN
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  UPDATE tournaments SET status = 'registration_closed', updated_at = now()
   WHERE id = p_tournament_id AND status IN ('ongoing', 'completed');
  RETURN jsonb_build_object('ok', true, 'deleted', v_n);
END $$;
