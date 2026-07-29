-- ─────────────────────────────────────────────────────────────────
-- ۰۲۷ — تسویه و کمیسیونِ ثبت‌نامِ مسابقات
--
-- تصمیمِ مالکِ پروژه: پولِ ورودیِ مسابقه مستقیم به حسابِ صاحبِ باشگاه
-- می‌رود و پلتفرم ۵٪ کمیسیون می‌گیرد.
--
-- سه نکته که شکلِ این مایگریشن را تعیین کرده‌اند:
--
--   ۱) خودِ عدد **نهایی نیست**. پس در کد هاردکد نشده و در
--      app_settings نشسته تا بدونِ Deploy عوض شود. هر سفارش نرخِ
--      لحظه‌ی خودش را Snapshot می‌کند، پس تغییرِ بعدیِ نرخ روی
--      تراکنش‌های گذشته اثر ندارد.
--
--   ۲) «مستقیم به حسابِ باشگاه» یعنی تسویه در سطحِ **درگاه** تقسیم
--      می‌شود. اینکه پی‌پینگ این را پشتیبانی می‌کند یا نه، تا رسیدنِ
--      مستندات رسمی نامعلوم است. تا آن روز، دفترِ مالی هر سه عدد را
--      ثبت می‌کند (ناخالص، کمیسیون، خالص) و اگر درگاه تقسیم نکند،
--      همین دفتر مبنای تسویه‌ی دستی است. هیچ فرضی درباره‌ی درگاه
--      در کد نیست.
--
--   ۳) ثبت در دفتر **Idempotent** است: یک پرداختِ موفق هرگز دو ردیف
--      نمی‌سازد، حتی اگر Callback چند بار بیاید.
-- ─────────────────────────────────────────────────────────────────

/* نرخِ کمیسیون — قابلِ تغییر از پنل، بدونِ Deploy */
INSERT INTO public.app_settings (key, value)
VALUES ('tournament_commission_percent', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;

/* Snapshotِ نرخ و مبالغ روی خودِ ثبت‌نام */
ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2),
  ADD COLUMN IF NOT EXISTS commission_amount  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount         integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tournament_registrations.commission_percent IS
  'نرخِ کمیسیون در لحظه‌ی تأییدِ پرداخت — تغییرِ بعدیِ نرخ روی این ردیف اثر ندارد.';
COMMENT ON COLUMN public.tournament_registrations.net_amount IS
  'سهمِ باشگاه پس از کسرِ کمیسیون.';

/* واژگانِ دفترِ مالی از قبل تعریف شده و CHECK دارد:
     type   ∈ BOOKING_PAYMENT | PLATFORM_COMMISSION | CLUB_EARNING |
              REFUND | CANCELLATION_FEE | SETTLEMENT | SETTLEMENT_REVERSAL | ADJUSTMENT
     status ∈ POSTED | REVERSED

   پس نوعِ تازه‌ای ساخته نمی‌شود — همان‌هایی که رزرو استفاده می‌کند
   این‌جا هم به کار می‌روند و منبعِ رویداد با meta.source = 'tournament'
   تفکیک می‌شود. یک دفتر برای کلِ پلتفرم، نه دفترِ موازی. */

/* ── تأییدِ پرداخت + محاسبه‌ی کمیسیون + ثبت در دفتر ──
   جایگزینِ نسخه‌ی ۰۲۶؛ همان قراردادِ ورودی/خروجی را نگه می‌دارد. */
CREATE OR REPLACE FUNCTION public.bh_tournament_confirm_payment(
  p_registration uuid,
  p_expected_amount integer,
  p_paid_amount integer,
  p_provider text,
  p_ref_id text
) RETURNS jsonb AS $$
DECLARE
  r record; t record; v_taken integer;
  v_pct numeric; v_commission integer; v_net integer;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF r.status = 'CONFIRMED' AND r.payment_status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'registrationId', r.id);
  END IF;

  IF r.status IN ('CANCELLED','REFUNDED') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'registration_closed');
  END IF;

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

  /* نرخِ لحظه‌ی تأیید — Snapshot می‌شود */
  SELECT COALESCE((value #>> '{}')::numeric, 5) INTO v_pct
    FROM public.app_settings WHERE key = 'tournament_commission_percent';
  IF v_pct IS NULL OR v_pct < 0 OR v_pct > 100 THEN v_pct := 5; END IF;

  v_commission := FLOOR(r.amount * v_pct / 100.0)::integer;
  v_net := r.amount - v_commission;

  UPDATE public.tournament_registrations
     SET status = 'CONFIRMED', payment_status = 'PAID',
         provider = p_provider, provider_ref_id = p_ref_id,
         commission_percent = v_pct, commission_amount = v_commission, net_amount = v_net,
         paid_at = now(), updated_at = now()
   WHERE id = r.id;

  /* ── دفترِ مالی ──
     ON CONFLICT ندارد چون ledger_entries کلیدِ یکتای طبیعی ندارد؛
     به‌جایش پیش از درج بررسی می‌شود که ردیفی برای همین ثبت‌نام نباشد.
     چون کلِ تابع در یک تراکنش با قفلِ ردیف اجرا می‌شود، دو Callbackِ
     هم‌زمان نمی‌توانند هر دو از این بررسی رد شوند. */
  IF NOT EXISTS (
    SELECT 1 FROM public.ledger_entries
     WHERE type = 'CLUB_EARNING'
       AND meta->>'source' = 'tournament'
       AND meta->>'registrationId' = r.id::text
  ) THEN
    INSERT INTO public.ledger_entries (club_id, user_id, type, amount, currency, status, meta)
    VALUES (
      t.club_id, r.user_id, 'CLUB_EARNING', v_net, 'IRT', 'POSTED',
      jsonb_build_object(
        'source', 'tournament',
        'registrationId', r.id, 'tournamentId', t.id, 'tournamentTitle', t.title,
        'gross', r.amount, 'commissionPercent', v_pct, 'commission', v_commission,
        'provider', p_provider, 'refId', p_ref_id,
        'settlement', 'direct_to_club'
      )
    );

    IF v_commission > 0 THEN
      INSERT INTO public.ledger_entries (club_id, user_id, type, amount, currency, status, meta)
      VALUES (
        t.club_id, r.user_id, 'PLATFORM_COMMISSION', v_commission, 'IRT', 'POSTED',
        jsonb_build_object(
          'source', 'tournament',
          'registrationId', r.id, 'tournamentId', t.id,
          'gross', r.amount, 'commissionPercent', v_pct,
          'provider', p_provider, 'refId', p_ref_id,
          'settlement', 'direct_to_club'
        )
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'registrationId', r.id, 'amount', r.amount,
                            'commission', v_commission, 'net', v_net,
                            'commissionPercent', v_pct);
END;
$$ LANGUAGE plpgsql;

/* ── بازپرداخت + معکوسِ دفتر ── */
CREATE OR REPLACE FUNCTION public.bh_tournament_refund(
  p_registration uuid, p_amount integer, p_reason text
) RETURNS jsonb AS $$
DECLARE r record; t record; v_refund integer;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF r.status = 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;
  IF r.payment_status <> 'PAID' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_paid');
  END IF;

  v_refund := LEAST(GREATEST(p_amount, 0), r.amount);
  SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id;

  UPDATE public.tournament_registrations
     SET status = 'REFUNDED', payment_status = 'REFUNDED',
         refund_amount = v_refund, refunded_at = now(),
         cancel_reason = p_reason, updated_at = now()
   WHERE id = r.id;

  /* رویدادِ معکوس — مبلغِ منفی تا جمعِ دفتر خودبه‌خود درست بماند */
  IF NOT EXISTS (
    SELECT 1 FROM public.ledger_entries
     WHERE type = 'REFUND'
       AND meta->>'source' = 'tournament'
       AND meta->>'registrationId' = r.id::text
  ) THEN
    /* رویدادِ معکوس با مبلغِ منفی تا جمعِ دفتر خودبه‌خود درست بماند */
    INSERT INTO public.ledger_entries (club_id, user_id, type, amount, currency, status, meta)
    VALUES (
      t.club_id, r.user_id, 'REFUND', -v_refund, 'IRT', 'POSTED',
      jsonb_build_object(
        'source', 'tournament',
        'registrationId', r.id, 'tournamentId', r.tournament_id,
        'reversedCommission', r.commission_amount, 'reversedNet', r.net_amount,
        'reason', p_reason
      )
    );

    /* ردیف‌های اصلی به REVERSED علامت می‌خورند تا گزارش‌گیری ساده بماند */
    UPDATE public.ledger_entries
       SET status = 'REVERSED'
     WHERE meta->>'source' = 'tournament'
       AND meta->>'registrationId' = r.id::text
       AND type IN ('CLUB_EARNING', 'PLATFORM_COMMISSION');
  END IF;

  RETURN jsonb_build_object('ok', true, 'refunded', v_refund);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_tournament_confirm_payment(uuid, integer, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_refund(uuid, integer, text) FROM PUBLIC, anon, authenticated;
