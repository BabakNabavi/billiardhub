-- ─────────────────────────────────────────────────────────────────
-- ۰۲۶ — مسابقات باشگاه‌ها: ثبت‌نام + پرداختِ ورودی
--
-- تا امروز این ماژول کاملاً ساختگی بود: مسابقات از یک آرایه‌ی هاردکد
-- می‌آمدند، ثبت‌نام‌ها در localStorage می‌نشستند، و دکمه‌ی پرداخت بدونِ
-- هیچ درگاهی «رسید» صادر می‌کرد.
--
-- پنج تصمیمی که شکلِ این اسکیما را تعیین کرده‌اند:
--
--   ۱) وضعیتِ **ثبت‌نام** و وضعیتِ **پرداخت** دو ستونِ جدا هستند. یک
--      فیلدِ واحد نمی‌تواند «ثبت‌نام شده ولی هنوز پرداخت نشده» را از
--      «پرداخت شده ولی هنوز تأیید نشده» تفکیک کند.
--
--   ۲) مبلغ در لحظه‌ی ساختِ سفارش از دیتابیس خوانده و در خودِ سفارش
--      **Snapshot** می‌شود. اگر بعداً باشگاه ورودی را عوض کند، سفارشِ
--      قبلی دست‌نخورده می‌ماند.
--
--   ۳) ظرفیت با یک تابعِ اتمیک و قفلِ ردیف کنترل می‌شود، نه با
--      SELECT count() و بعد INSERT — وگرنه دو پرداختِ هم‌زمان روی
--      آخرین ظرفیت هر دو موفق می‌شدند.
--
--   ۴) یکتاییِ «هر کاربر یک ثبت‌نام در هر مسابقه» با UNIQUE در
--      دیتابیس تضمین می‌شود، نه با بررسی در UI.
--
--   ۵) شماره‌ی مرجعِ درگاه یکتاست تا یک تراکنش نتواند دو ثبت‌نام را
--      تأیید کند (ضدِ Replay).
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tournaments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id           uuid NOT NULL,
  created_by        uuid NOT NULL,
  slug              text UNIQUE,
  title             text NOT NULL,
  description       text,
  discipline        text NOT NULL DEFAULT 'snooker',
  max_players       integer NOT NULL DEFAULT 16,
  entry_fee         integer NOT NULL DEFAULT 0,      -- تومان؛ ۰ = رایگان
  prize             text,
  venue             text,
  province          text,
  city              text,
  starts_at         timestamptz,
  registration_ends_at timestamptz,
  status            text NOT NULL DEFAULT 'draft',
  cover_url         text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournaments_status_chk CHECK (status IN
    ('draft','published','registration_open','registration_closed','ongoing','completed','cancelled')),
  CONSTRAINT tournaments_capacity_chk CHECK (max_players BETWEEN 2 AND 512),
  CONSTRAINT tournaments_fee_chk CHECK (entry_fee >= 0 AND entry_fee <= 500000000)
);
CREATE INDEX IF NOT EXISTS tournaments_club_idx ON public.tournaments (club_id, status);
CREATE INDEX IF NOT EXISTS tournaments_open_idx ON public.tournaments (status, starts_at);

CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id     uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL,
  player_name       text,
  contact_phone     text,
  /* وضعیتِ ثبت‌نام — جدا از وضعیتِ پرداخت */
  status            text NOT NULL DEFAULT 'PENDING_PAYMENT',
  /* وضعیتِ مالی */
  payment_status    text NOT NULL DEFAULT 'UNPAID',
  /* Snapshotِ مبلغ در لحظه‌ی ساختِ سفارش — تغییرِ بعدیِ ورودی اثری ندارد */
  amount            integer NOT NULL DEFAULT 0,
  payment_id        uuid,
  provider          text,
  provider_authority text,
  provider_ref_id   text,
  paid_at           timestamptz,
  refunded_at       timestamptz,
  refund_amount     integer NOT NULL DEFAULT 0,
  cancel_reason     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT treg_status_chk CHECK (status IN
    ('PENDING_PAYMENT','CONFIRMED','CANCELLED','REFUNDED','EXPIRED')),
  CONSTRAINT treg_pay_chk CHECK (payment_status IN
    ('UNPAID','INITIATED','PAID','FAILED','REFUNDED')),
  CONSTRAINT treg_amount_chk CHECK (amount >= 0),
  /* هر کاربر فقط یک ثبت‌نام در هر مسابقه */
  CONSTRAINT treg_one_per_user UNIQUE (tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS treg_tournament_idx ON public.tournament_registrations (tournament_id, status);
CREATE INDEX IF NOT EXISTS treg_user_idx ON public.tournament_registrations (user_id, created_at DESC);

/* یک شماره‌ی مرجعِ درگاه نباید دو بار مصرف شود (ضدِ Replay).
   NULL محدود نمی‌شود، پس ثبت‌نامِ رایگان مشکلی ندارد. */
CREATE UNIQUE INDEX IF NOT EXISTS treg_provider_ref_uniq
  ON public.tournament_registrations (provider_ref_id)
  WHERE provider_ref_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS treg_authority_uniq
  ON public.tournament_registrations (provider_authority)
  WHERE provider_authority IS NOT NULL;

-- ── امنیت ──
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tournaments FROM anon, authenticated;
REVOKE ALL ON TABLE public.tournament_registrations FROM anon, authenticated;

/* ── ظرفیتِ باقی‌مانده ── */
CREATE OR REPLACE FUNCTION public.bh_tournament_seats_left(p_tournament uuid)
RETURNS integer AS $$
DECLARE v_max integer; v_taken integer;
BEGIN
  SELECT max_players INTO v_max FROM public.tournaments WHERE id = p_tournament;
  IF v_max IS NULL THEN RETURN 0; END IF;
  SELECT count(*) INTO v_taken FROM public.tournament_registrations
   WHERE tournament_id = p_tournament
     AND status IN ('PENDING_PAYMENT','CONFIRMED');
  RETURN GREATEST(0, v_max - v_taken);
END;
$$ LANGUAGE plpgsql STABLE;

/* ── ساختِ سفارشِ ثبت‌نام — اتمیک ──

   مبلغ از خودِ جدولِ مسابقه خوانده می‌شود؛ هرچه کلاینت بفرستد نادیده
   گرفته می‌شود. ردیفِ مسابقه قفل می‌شود تا شمارشِ ظرفیت و درج در یک
   تراکنش اتفاق بیفتد و دو درخواستِ هم‌زمان از سقف رد نشوند.

   خطاها با RETURN برمی‌گردند نه RAISE — چون RAISE کلِ تراکنش را
   برمی‌گرداند و همان درسی است که در فاز ۶ گرفتیم. */
CREATE OR REPLACE FUNCTION public.bh_tournament_register(
  p_tournament uuid,
  p_user uuid,
  p_player_name text,
  p_phone text
) RETURNS jsonb AS $$
DECLARE t record; v_taken integer; v_existing record; v_id uuid;
BEGIN
  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF t.status <> 'registration_open' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'registration_closed', 'status', t.status);
  END IF;

  IF t.registration_ends_at IS NOT NULL AND t.registration_ends_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'deadline_passed');
  END IF;

  /* ثبت‌نامِ قبلیِ همین کاربر */
  SELECT * INTO v_existing FROM public.tournament_registrations
   WHERE tournament_id = p_tournament AND user_id = p_user;

  /* توجه: `v_existing IS NOT NULL` این‌جا کار نمی‌کند. برای یک RECORD
     این عبارت فقط وقتی درست است که **همه‌ی** ستون‌ها ناتهی باشند، و
     ستون‌هایی مثل paid_at همیشه NULL هستند. پس ردیفِ موجود «تهی»
     دیده می‌شد و مسیر به INSERT می‌رفت و به UNIQUE می‌خورد. */
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status IN ('CONFIRMED') THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_registered', 'registrationId', v_existing.id);
    END IF;
    IF v_existing.status = 'PENDING_PAYMENT' THEN
      /* سفارشِ باز — همان را برگردان تا کاربر پرداخت را ادامه دهد */
      RETURN jsonb_build_object('ok', true, 'resumed', true,
        'registrationId', v_existing.id, 'amount', v_existing.amount);
    END IF;
    /* لغوشده یا منقضی ⇒ اجازه‌ی ثبت‌نامِ دوباره با به‌روزرسانیِ همان ردیف */
  END IF;

  SELECT count(*) INTO v_taken FROM public.tournament_registrations
   WHERE tournament_id = p_tournament AND status IN ('PENDING_PAYMENT','CONFIRMED');

  IF v_taken >= t.max_players THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'full');
  END IF;

  /* توجه: `v_existing IS NOT NULL` این‌جا کار نمی‌کند. برای یک RECORD
     این عبارت فقط وقتی درست است که **همه‌ی** ستون‌ها ناتهی باشند، و
     ستون‌هایی مثل paid_at همیشه NULL هستند. پس ردیفِ موجود «تهی»
     دیده می‌شد و مسیر به INSERT می‌رفت و به UNIQUE می‌خورد. */
  IF v_existing.id IS NOT NULL THEN
    UPDATE public.tournament_registrations
       SET status = 'PENDING_PAYMENT', payment_status = CASE WHEN t.entry_fee = 0 THEN 'PAID' ELSE 'UNPAID' END,
           amount = t.entry_fee, player_name = p_player_name, contact_phone = p_phone,
           provider_authority = NULL, provider_ref_id = NULL, cancel_reason = NULL,
           updated_at = now()
     WHERE id = v_existing.id
     RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.tournament_registrations
      (tournament_id, user_id, player_name, contact_phone, amount, status, payment_status)
    VALUES (p_tournament, p_user, p_player_name, p_phone, t.entry_fee,
            'PENDING_PAYMENT', CASE WHEN t.entry_fee = 0 THEN 'PAID' ELSE 'UNPAID' END)
    RETURNING id INTO v_id;
  END IF;

  /* مسابقه‌ی رایگان همان‌جا قطعی می‌شود */
  IF t.entry_fee = 0 THEN
    UPDATE public.tournament_registrations
       SET status = 'CONFIRMED', paid_at = now(), updated_at = now()
     WHERE id = v_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'registrationId', v_id, 'amount', t.entry_fee,
                            'free', t.entry_fee = 0);
END;
$$ LANGUAGE plpgsql;

/* ── تأییدِ پرداخت — اتمیک و Idempotent ──

   دو حفاظ:
     • اگر ثبت‌نام از قبل CONFIRMED است، دوباره کاری نمی‌کند و ok
       برمی‌گرداند (Callbackِ تکراری بی‌خطر است).
     • ظرفیت **دوباره** بررسی می‌شود؛ ممکن است بینِ ساختِ سفارش و
       بازگشت از درگاه، جای آخر پر شده باشد. */
CREATE OR REPLACE FUNCTION public.bh_tournament_confirm_payment(
  p_registration uuid,
  p_expected_amount integer,
  p_paid_amount integer,
  p_provider text,
  p_ref_id text
) RETURNS jsonb AS $$
DECLARE r record; t record; v_taken integer;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  /* Idempotency — همان مرجع، همان نتیجه */
  IF r.status = 'CONFIRMED' AND r.payment_status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'registrationId', r.id);
  END IF;

  IF r.status IN ('CANCELLED','REFUNDED') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'registration_closed');
  END IF;

  /* مبلغ باید دقیقاً با Snapshotِ سفارش بخواند */
  IF p_paid_amount IS DISTINCT FROM p_expected_amount
     OR p_expected_amount IS DISTINCT FROM r.amount THEN
    UPDATE public.tournament_registrations
       SET payment_status = 'FAILED', updated_at = now() WHERE id = r.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'amount_mismatch',
                              'expected', r.amount, 'paid', p_paid_amount);
  END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id FOR UPDATE;
  IF t.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tournament_cancelled');
  END IF;

  SELECT count(*) INTO v_taken FROM public.tournament_registrations
   WHERE tournament_id = r.tournament_id AND status = 'CONFIRMED' AND id <> r.id;
  IF v_taken >= t.max_players THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'full_after_payment');
  END IF;

  UPDATE public.tournament_registrations
     SET status = 'CONFIRMED', payment_status = 'PAID',
         provider = p_provider, provider_ref_id = p_ref_id,
         paid_at = now(), updated_at = now()
   WHERE id = r.id;

  RETURN jsonb_build_object('ok', true, 'registrationId', r.id, 'amount', r.amount);
END;
$$ LANGUAGE plpgsql;

/* ── بازپرداخت — Idempotent ── */
CREATE OR REPLACE FUNCTION public.bh_tournament_refund(
  p_registration uuid, p_amount integer, p_reason text
) RETURNS jsonb AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF r.status = 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;
  IF r.payment_status <> 'PAID' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_paid');
  END IF;

  UPDATE public.tournament_registrations
     SET status = 'REFUNDED', payment_status = 'REFUNDED',
         refund_amount = LEAST(p_amount, r.amount), refunded_at = now(),
         cancel_reason = p_reason, updated_at = now()
   WHERE id = r.id;

  RETURN jsonb_build_object('ok', true, 'refunded', LEAST(p_amount, r.amount));
END;
$$ LANGUAGE plpgsql;

/* ── انقضای سفارش‌های نیمه‌کاره (برای کران) ── */
CREATE OR REPLACE FUNCTION public.bh_tournament_expire_pending(p_minutes integer DEFAULT 30)
RETURNS integer AS $$
DECLARE n integer;
BEGIN
  UPDATE public.tournament_registrations
     SET status = 'EXPIRED', updated_at = now()
   WHERE status = 'PENDING_PAYMENT'
     AND payment_status IN ('UNPAID','INITIATED','FAILED')
     AND created_at < now() - make_interval(mins => p_minutes);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_tournament_seats_left(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_register(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_confirm_payment(uuid, integer, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_refund(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_expire_pending(integer) FROM PUBLIC, anon, authenticated;
