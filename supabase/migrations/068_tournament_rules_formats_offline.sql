-- ─────────────────────────────────────────────────────────────────
-- ۰۶۸ — قوانینِ مسابقه، فرمت‌های تازه، و ثبت‌نامِ حضوری
--
-- سه کمبود که در آزمایشِ واقعیِ یک مسابقه بیرون زدند:
--
--   ۱) **قوانین هیچ‌وقت ذخیره نمی‌شد.** فرمِ ساخت یک textarea داشت،
--      ولی نه ستونی در جدول بود و نه مسیرِ API آن را می‌خواند. متن
--      در مرورگر می‌ماند و با اولین رفرش می‌رفت. صفحه‌ی عمومی هم
--      بخشِ «قوانین مسابقه» را همیشه خالی نشان می‌داد.
--
--   ۲) **فرمت فقط «Best of» بود.** اصطلاحِ درستِ ایت‌بال و ناین‌بال
--      «Race to N» است، و های‌بال اصلاً دو شکل دارد: مسابقه‌ای
--      (Race to N) و زمان‌دار (۹۰ دقیقه). قیدِ CHECK مهاجرتِ ۰۳۰ فقط
--      پنج مقدارِ bo را می‌پذیرفت.
--
--   ۳) **ثبت‌نامِ حضوری راه نداشت.** هر کس تلفنی یا حضوری اسم می‌داد،
--      باشگاه‌دار هیچ جایی برای واردکردنش نداشت — یعنی شمارشِ ظرفیت
--      و براکت با واقعیت نمی‌خواند. ستونِ `user_id` اجباری بود و
--      کسی که حساب ندارد اصلاً نمی‌توانست ردیف بگیرد.
-- ─────────────────────────────────────────────────────────────────

-- ── ۱ · قوانین ──
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS rules text;

-- ── ۲ · فرمت‌ها ──
-- قیدِ قبلی فقط bo3..bo11 را می‌پذیرفت. حالا سه خانواده:
--   race3..race11   ایت‌بال، ناین‌بال، های‌بال
--   bo3..bo11       اسنوکر (و ردیف‌های قدیمی که همه bo بودند)
--   time30..time180 های‌بالِ زمان‌دار
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_match_format_chk;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_match_format_chk
  CHECK (
    match_format IS NULL
    OR match_format ~ '^(bo(3|5|7|9|11)|race([3-9]|1[01])|time(30|45|60|75|90|105|120|150|180))$'
  );

-- ── ۳ · ثبت‌نامِ حضوری ──
--
-- ردیفِ حضوری کاربرِ سایت ندارد، پس `user_id` باید NULL بپذیرد.
-- ولی قیدِ یکتاییِ «هر کاربر یک ثبت‌نام» نباید از دست برود — با
-- ایندکسِ جزئی همان قاعده برای ردیف‌های آنلاین برقرار می‌ماند و
-- ردیف‌های حضوری (که همه user_id تهی دارند) از آن معاف‌اند.
ALTER TABLE public.tournament_registrations
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.tournament_registrations
  DROP CONSTRAINT IF EXISTS treg_one_per_user;

CREATE UNIQUE INDEX IF NOT EXISTS treg_one_per_user_idx
  ON public.tournament_registrations (tournament_id, user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'online';

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS added_by uuid;      -- کدام باشگاه‌دار واردش کرد

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS note text;          -- «تلفنی»، «حضوری»، هرچه

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treg_source_chk') THEN
    ALTER TABLE public.tournament_registrations
      ADD CONSTRAINT treg_source_chk CHECK (source IN ('online','offline'));
  END IF;
END $$;

/* ── افزودنِ ثبت‌نامِ حضوری — اتمیک ──

   همان قفلِ ردیفِ مسابقه که مسیرِ آنلاین دارد، وگرنه باشگاه‌دار
   می‌توانست هم‌زمان با پرداختِ یک بازیکن، آخرین صندلی را دستی پر
   کند و ظرفیت از سقف رد شود.

   `payment_status` عمداً 'PAID' می‌نشیند: پول حضوری گرفته شده و از
   دیدِ دفترِ مالی این ثبت‌نام تسویه‌شده است. مبلغ از خودِ مسابقه
   خوانده می‌شود مگر باشگاه‌دار صریحاً مقدارِ دیگری بدهد (تخفیف یا
   مهمانِ رایگان). */
CREATE OR REPLACE FUNCTION public.bh_tournament_add_offline(
  p_tournament uuid,
  p_name       text,
  p_phone      text,
  p_amount     integer,
  p_note       text,
  p_actor      uuid
) RETURNS jsonb AS $$
DECLARE t record; v_taken integer; v_id uuid; v_amount integer;
BEGIN
  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF t.status IN ('cancelled','completed') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tournament_closed');
  END IF;

  IF coalesce(btrim(p_name), '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'name_required');
  END IF;

  SELECT count(*) INTO v_taken FROM public.tournament_registrations
   WHERE tournament_id = p_tournament AND status IN ('PENDING_PAYMENT','CONFIRMED');

  IF v_taken >= t.max_players THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'full');
  END IF;

  v_amount := GREATEST(0, COALESCE(p_amount, t.entry_fee));

  INSERT INTO public.tournament_registrations
    (tournament_id, user_id, player_name, contact_phone, amount,
     status, payment_status, paid_at, source, added_by, note)
  VALUES
    (p_tournament, NULL, btrim(p_name), NULLIF(btrim(p_phone), ''), v_amount,
     'CONFIRMED', 'PAID', now(), 'offline', p_actor, NULLIF(btrim(p_note), ''))
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'registrationId', v_id,
                            'amount', v_amount, 'taken', v_taken + 1,
                            'maxPlayers', t.max_players);
END;
$$ LANGUAGE plpgsql;

/* ── حذفِ ثبت‌نامِ حضوری ──

   فقط ردیفِ `offline` حذف می‌شود. ثبت‌نامِ آنلاین پولِ واقعی پشتش
   دارد و مسیرش بازپرداخت است نه حذف — وگرنه ردِ تراکنش گم می‌شود و
   دفترِ مالی با درگاه نمی‌خواند. */
CREATE OR REPLACE FUNCTION public.bh_tournament_remove_offline(
  p_registration uuid
) RETURNS jsonb AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF r.source <> 'offline' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_offline');
  END IF;

  DELETE FROM public.tournament_registrations WHERE id = p_registration;
  RETURN jsonb_build_object('ok', true, 'tournamentId', r.tournament_id);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_tournament_add_offline(uuid, text, text, integer, text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_remove_offline(uuid)
  FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
-- انتظار: rules=1 · source=1 · توابع=2
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'rules')            AS rules_col,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'tournament_registrations' AND column_name = 'source') AS source_col,
  (SELECT count(*) FROM pg_proc
    WHERE proname IN ('bh_tournament_add_offline','bh_tournament_remove_offline')) AS fns;
