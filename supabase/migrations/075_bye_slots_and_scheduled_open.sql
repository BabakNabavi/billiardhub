-- ─────────────────────────────────────────────────────────────────
-- ۰۷۵ — بایِ ماندگار روی جایگاه، و بازشدنِ زمان‌بندی‌شده‌ی ثبت‌نام
--
-- ── باگِ اول: بای هیچ‌جا ذخیره نمی‌شد ──
-- در چیدنِ دستی، «بای» فقط یک عددِ محاسبه‌شده در مرورگر بود:
--
--     byeCount = جایگاه‌ها − پرشده‌ها − استخر
--
-- برگزارکننده تراشه‌ی Bye را می‌کشید روی یک جایگاه، رها می‌کرد، و
-- سرور `place(slot, NULL)` می‌گرفت — یعنی «این جایگاه را خالی کن».
-- جایگاه از قبل خالی بود، پس هیچ‌چیز عوض نمی‌شد و تراشه سرِ جایش
-- برمی‌گشت. بدتر: چون `byeCount` هرگز کم نمی‌شد و دکمه‌ی «تأیید
-- چیدمان» شرطِ `byeCount = 0` داشت، جدولی که تعدادِ بازیکنش توانِ
-- دو نبود **هرگز** قابلِ تأیید نبود.
--
-- حالا بای یک واقعیتِ ذخیره‌شده است: `p1_bye` / `p2_bye`.
--
-- ── باگِ دوم: ثبت‌نام دستی باز می‌شد ──
-- باشگاه‌دار مسابقه را می‌ساخت و یا همان لحظه ثبت‌نام باز می‌شد یا
-- باید یادش می‌ماند که رأسِ ساعتِ فلان برگردد و دکمه را بزند.
-- `registration_starts_at` این را زمان‌بندی می‌کند: مسابقه در
-- «بزودی» می‌ماند و خودش سرِ وقت به «در حال ثبت‌نام» می‌رود.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS p1_bye boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS p2_bye boolean NOT NULL DEFAULT false;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS registration_starts_at timestamptz;

/* ── گذاشتن روی جایگاه ──
   `p_bye = true` یعنی «این جایگاه عمداً خالی می‌ماند». نسخه‌ی
   پنج‌آرگومانی حذف می‌شود، وگرنه فراخوانیِ نام‌دار بینِ دو امضا
   مبهم می‌ماند. */
DROP FUNCTION IF EXISTS public.bh_bracket_place(uuid, uuid, integer, uuid, uuid);

CREATE OR REPLACE FUNCTION public.bh_bracket_place(
  p_tournament uuid, p_match uuid, p_slot integer,
  p_registration uuid, p_actor uuid, p_bye boolean DEFAULT false
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

  /* بای و بازیکن با هم بی‌معنی است */
  IF p_bye AND p_registration IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_slot');
  END IF;

  /* هر دو طرفِ یک بازی بای یعنی بازی‌ای که هیچ‌وقت انجام نمی‌شود و
     دورِ بعد یک جایگاهِ مرده می‌گیرد. جلویش همین‌جا گرفته می‌شود، نه
     در «تأیید چیدمان» که دیرتر و گیج‌کننده‌تر است. */
  IF p_bye THEN
    IF (p_slot = 1 AND m.p2_bye AND m.p2_registration_id IS NULL)
    OR (p_slot = 2 AND m.p1_bye AND m.p1_registration_id IS NULL) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'both_bye');
    END IF;
  END IF;

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
       SET p1_registration_id = p_registration, p1_name = v_name, p1_bye = p_bye
     WHERE id = p_match;
  ELSE
    UPDATE public.tournament_matches
       SET p2_registration_id = p_registration, p2_name = v_name, p2_bye = p_bye
     WHERE id = p_match;
  END IF;

  UPDATE public.tournament_matches
     SET winner = NULL, status = 'waiting', completed_at = NULL
   WHERE id = p_match AND winner IS NOT NULL;

  RETURN jsonb_build_object('ok', true, 'name', v_name, 'bye', p_bye);
END;
$$ LANGUAGE plpgsql;

/* خالی‌کردن ⇒ بای‌ها هم پاک می‌شوند، وگرنه جدولِ «خالی» جایگاه‌هایی
   دارد که هنوز خودشان را بای می‌دانند. */
CREATE OR REPLACE FUNCTION public.bh_bracket_clear_slots(p_tournament uuid)
RETURNS jsonb AS $$
DECLARE n integer;
BEGIN
  IF bh_bracket_has_real_result(p_tournament) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  UPDATE public.tournament_matches
     SET p1_registration_id = NULL, p1_name = NULL, p1_bye = false,
         p2_registration_id = NULL, p2_name = NULL, p2_bye = false,
         winner = NULL, status = 'waiting', completed_at = NULL
   WHERE tournament_id = p_tournament AND round = 1;
  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE public.tournament_matches
     SET p1_registration_id = NULL, p1_name = NULL,
         p2_registration_id = NULL, p2_name = NULL
   WHERE tournament_id = p_tournament AND round = 2;

  RETURN jsonb_build_object('ok', true, 'cleared', n);
END;
$$ LANGUAGE plpgsql;

/* جابه‌جایی ⇒ نشانِ بای هم با ساکن جابه‌جا می‌شود. اگر نشود، بازیکنی
   که روی جایگاهِ بای می‌نشیند برچسبِ بای را به ارث می‌برد. */
CREATE OR REPLACE FUNCTION public.bh_bracket_swap_slots(
  p_tournament uuid, p_match_a uuid, p_slot_a integer,
  p_match_b uuid, p_slot_b integer, p_actor uuid
) RETURNS jsonb AS $$
DECLARE
  a record; b record;
  a_reg uuid; a_name text; a_bye boolean;
  b_reg uuid; b_name text; b_bye boolean;
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
  IF p_match_a = p_match_b AND p_slot_a = p_slot_b THEN
    RETURN jsonb_build_object('ok', true, 'noop', true);
  END IF;

  IF p_slot_a = 1 THEN a_reg := a.p1_registration_id; a_name := a.p1_name; a_bye := a.p1_bye;
                  ELSE a_reg := a.p2_registration_id; a_name := a.p2_name; a_bye := a.p2_bye; END IF;
  IF p_slot_b = 1 THEN b_reg := b.p1_registration_id; b_name := b.p1_name; b_bye := b.p1_bye;
                  ELSE b_reg := b.p2_registration_id; b_name := b.p2_name; b_bye := b.p2_bye; END IF;

  IF p_slot_a = 1 THEN
    UPDATE public.tournament_matches
       SET p1_registration_id = b_reg, p1_name = b_name, p1_bye = b_bye WHERE id = p_match_a;
  ELSE
    UPDATE public.tournament_matches
       SET p2_registration_id = b_reg, p2_name = b_name, p2_bye = b_bye WHERE id = p_match_a;
  END IF;
  IF p_slot_b = 1 THEN
    UPDATE public.tournament_matches
       SET p1_registration_id = a_reg, p1_name = a_name, p1_bye = a_bye WHERE id = p_match_b;
  ELSE
    UPDATE public.tournament_matches
       SET p2_registration_id = a_reg, p2_name = a_name, p2_bye = a_bye WHERE id = p_match_b;
  END IF;

  /* برنده‌های بای بی‌اعتبارند، ولی خودِ نشانِ بای می‌ماند: چیدمان
     عوض شده، تصمیمِ برگزارکننده که کجا بای باشد نه. */
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

/* تأییدِ چیدمان: جایگاهِ بای «پر» حساب می‌شود. پیش‌تر شرط این بود که
   هر بازی حداقل یک بازیکن داشته باشد؛ حالا صریح‌تر است — هیچ جایگاهی
   نباید بلاتکلیف بماند. */
CREATE OR REPLACE FUNCTION public.bh_bracket_finalize(p_tournament uuid)
RETURNS jsonb AS $$
DECLARE v_open integer; n integer;
BEGIN
  IF bh_bracket_has_real_result(p_tournament) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_started');
  END IF;

  SELECT count(*) INTO v_open FROM public.tournament_matches
   WHERE tournament_id = p_tournament AND round = 1
     AND ( (p1_registration_id IS NULL AND NOT p1_bye)
        OR (p2_registration_id IS NULL AND NOT p2_bye) );
  IF v_open > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'empty_match', 'count', v_open);
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

/* ── بازشدنِ زمان‌بندی‌شده‌ی ثبت‌نام ──
   مثلِ `bh_tournaments_autostart` کران ندارد و همان‌جا که فهرست
   خوانده می‌شود صدا زده می‌شود. کران یعنی یک نقطه‌ی خرابیِ دیگر که
   وقتی نخوابد کسی خبردار نمی‌شود. */
CREATE OR REPLACE FUNCTION public.bh_tournaments_autoopen()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  UPDATE public.tournaments
     SET status = 'registration_open', updated_at = now()
   WHERE status = 'published'
     AND registration_starts_at IS NOT NULL
     AND registration_starts_at <= now()
     /* مهلتی که قبلاً گذشته باشد، بازکردن بی‌معنی است */
     AND (registration_ends_at IS NULL OR registration_ends_at > now())
     AND (starts_at IS NULL OR starts_at > now());
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.bh_bracket_place(uuid, uuid, integer, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournaments_autoopen() FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'tournament_matches' AND column_name IN ('p1_bye','p2_bye')) AS bye_cols,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'registration_starts_at') AS open_col,
  (SELECT count(*) FROM pg_proc WHERE proname = 'bh_tournaments_autoopen') AS autoopen;
