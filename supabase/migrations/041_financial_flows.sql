-- ═══════════════════════════════════════════════════════════════════════════
--  Billiard Hub — جریان‌های مالی بر مدلِ «حسابِ مرکزی»
--
--  مدلی که پیاده می‌شود:
--      کاربر → پرداخت → حسابِ مرکزیِ Billiard Hub
--      سپس بسته به سرنوشتِ تراکنش:
--        الف) لغو  ⇒ بازپرداخت + جریمه (درآمدِ پلتفرم)
--        ب)  انجام ⇒ کمیسیون (درآمدِ پلتفرم) + سهمِ باشگاه (بدهیِ ما)
--
--  تفاوتِ کلیدی با نسخه‌ی قبل: باشگاه دیگر لحظه‌ی *پرداخت* بستانکار
--  نمی‌شود، بلکه پس از *تحویلِ خدمت* (COMPLETED). پیش‌تر رزروِ ماهِ
--  بعد همان امروز بدهیِ پلتفرم می‌شد و قابلِ تسویه بود — یعنی ممکن بود
--  پولِ خدمتی که هنوز انجام نشده به باشگاه پرداخت شود و بعد کاربر لغو کند.
--
--  اجرای مجدد بی‌خطر است. پیش‌نیاز: 040.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ۱) تأییدِ پرداخت — فقط «پول رسید»، نه «باشگاه طلبکار شد»
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_confirm_payment(
  p_payment_id uuid, p_provider_ref text, p_amount bigint
) RETURNS bookings LANGUAGE plpgsql AS $$
DECLARE pay payments; b bookings;
BEGIN
  SELECT * INTO pay FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_not_found'; END IF;

  SELECT * INTO b FROM bookings WHERE id = pay.booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;

  /* idempotent — کالبکِ تکراری هیچ اثرِ مالیِ دوباره ندارد */
  IF pay.status = 'PAID' THEN RETURN b; END IF;

  IF p_amount IS DISTINCT FROM pay.amount THEN RAISE EXCEPTION 'amount_mismatch'; END IF;

  /* رزروِ منقضی یا لغوشده نباید با کالبکِ دیرهنگام زنده شود.
     پیش‌تر این بررسی نبود: پرداختی که پس از ۱۰ دقیقه می‌رسید، رزروی را
     CONFIRMED می‌کرد که اسلاتش آزاد شده و شاید به دیگری فروخته شده بود. */
  IF b.booking_status <> 'PENDING_PAYMENT' THEN
    UPDATE payments SET status = 'PAID', provider_ref_id = p_provider_ref,
           paid_at = now(), updated_at = now(),
           raw_response = COALESCE(raw_response,'{}'::jsonb)
                          || jsonb_build_object('late_callback', true, 'booking_status', b.booking_status)
     WHERE id = pay.id;
    /* پول رسیده ولی رزرو دیگر معتبر نیست ⇒ کلِ مبلغ بدهیِ بازپرداخت است */
    INSERT INTO ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, pay.id, b."clubId", b."userId", 'BOOKING_PAYMENT', pay.amount,
            'booking:' || b.id || ':PAYMENT',
            jsonb_build_object('ref', p_provider_ref, 'late', true))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    INSERT INTO refunds (booking_id, payment_id, club_id, user_id, amount, gross_amount,
                         cancellation_fee, reason, status, idempotency_key)
    VALUES (b.id, pay.id, b."clubId", b."userId", pay.amount, pay.amount, 0,
            'پرداخت پس از انقضای رزرو', 'REQUESTED', 'late:' || pay.id)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    /* عمداً RAISE نمی‌کند: استثنا کلِ تراکنش را برمی‌گرداند و همین
       ردیف‌های بالا — که ثبتِ «پول رسید و باید پس داده شود» هستند —
       پاک می‌شدند. فراخوان از روی `booking_status` می‌فهمد که رزرو
       تأیید نشده. */
    RETURN b;
  END IF;

  UPDATE payments SET status='PAID', provider_ref_id=p_provider_ref, paid_at=now(),
         updated_at=now(),
         gross_amount = pay.amount,
         commission_amount = b.platform_commission,
         club_amount = b.club_amount
   WHERE id = pay.id;

  /* رزرو تأیید می‌شود، ولی سهمِ باشگاه هنوز «سررسید نشده» است */
  UPDATE bookings SET
    payment_status='PAID', booking_status='CONFIRMED', settlement_status='NOT_DUE',
    status='confirmed', "paymentId"=pay.id::text, gateway=pay.provider, "updatedAt"=now()
   WHERE id = b.id RETURNING * INTO b;

  /* تنها رویدادِ مالیِ این لحظه: پول وارد حسابِ مرکزی شد */
  INSERT INTO ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, source_key, meta)
  VALUES (b.id, pay.id, b."clubId", b."userId", 'BOOKING_PAYMENT', b.final_amount,
          'booking:' || b.id || ':PAYMENT',
          jsonb_build_object('ref', p_provider_ref, 'source', 'reservation',
                             'commissionPlanned', b.platform_commission,
                             'clubSharePlanned', b.club_amount))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  INSERT INTO club_accounts (club_id, owner_id) VALUES (b."clubId", b.club_owner_id)
    ON CONFLICT (club_id) DO NOTHING;

  RETURN b;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۲) تحویلِ خدمت — این‌جاست که باشگاه طلبکار می‌شود
--
--    فقط رزروی که پرداخت شده و زمانش گذشته. کمیسیون همان مبلغی است که
--    لحظه‌ی رزرو اسنپ‌شات شده، نه نرخِ امروز.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_complete_booking(p_booking_id uuid)
RETURNS bookings LANGUAGE plpgsql AS $$
DECLARE b bookings;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;

  IF b.booking_status = 'COMPLETED' THEN RETURN b; END IF;
  IF b.booking_status <> 'CONFIRMED' OR b.payment_status <> 'PAID' THEN
    RAISE EXCEPTION 'booking_not_completable:%', b.booking_status;
  END IF;

  UPDATE bookings SET booking_status='COMPLETED', status='completed',
         settlement_status='PENDING', completed_at=now(), "updatedAt"=now()
   WHERE id = b.id RETURNING * INTO b;

  /* درآمدِ پلتفرم — همیشه مثبت */
  IF b.platform_commission > 0 THEN
    INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, b."clubId", b."userId", 'PLATFORM_COMMISSION', b.platform_commission,
            'booking:' || b.id || ':COMMISSION',
            jsonb_build_object('source','reservation','gross', b.final_amount,
                               'commissionType', b.commission_type,
                               'commissionValue', b.commission_value))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
  END IF;

  /* بدهیِ پلتفرم به باشگاه */
  IF b.club_amount > 0 THEN
    INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, b."clubId", b."userId", 'CLUB_EARNING', b.club_amount,
            'booking:' || b.id || ':CLUB_EARNING',
            jsonb_build_object('source','reservation','gross', b.final_amount))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
  END IF;

  PERFORM public.bh_reconcile_club_account(b."clubId");
  RETURN b;
END $$;

/* رزروهایی که زمانشان گذشته و پرداخت شده‌اند، خودکار تکمیل می‌شوند.
   `bookingDate` تاریخ است و `timeSlots` رشته‌ی ساعت‌ها («۱۸,۱۹,۲۰»)؛
   پایانِ سانس = بزرگ‌ترین ساعت + ۱. */
CREATE OR REPLACE FUNCTION public.bh_complete_due_bookings() RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := 0; r record; last_hour int;
BEGIN
  FOR r IN
    SELECT id, "bookingDate", "timeSlots" FROM bookings
     WHERE booking_status = 'CONFIRMED' AND payment_status = 'PAID'
       AND "bookingDate" <= (now() AT TIME ZONE 'Asia/Tehran')::date
     LIMIT 500
  LOOP
    BEGIN
      /* `MAX(x)` روی متن مقایسه‌ی الفبایی می‌کند و «۹» را بزرگ‌تر از
         «۱۸» می‌گیرد؛ تبدیل باید *پیش* از MAX انجام شود. */
      SELECT COALESCE(MAX(x::int), 23) INTO last_hour
        FROM unnest(string_to_array(COALESCE(r."timeSlots",''), ',')) AS x
       WHERE trim(x) ~ '^[0-9]+$';

      IF (r."bookingDate" + ((last_hour + 1) || ' hours')::interval)
         <= (now() AT TIME ZONE 'Asia/Tehran') THEN
        PERFORM public.bh_complete_booking(r.id);
        n := n + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      /* یک رزروِ خراب نباید کلِ اجرا را متوقف کند */
      RAISE WARNING 'complete_failed % : %', r.id, SQLERRM;
    END;
  END LOOP;
  RETURN n;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۳) لغو — بازپرداختِ واقعی + جریمه به‌عنوان درآمد
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_cancel_booking(
  p_booking_id uuid, p_refund bigint, p_reason text
) RETURNS bookings LANGUAGE plpgsql AS $$
DECLARE b bookings; pay payments; fee bigint; refund bigint;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;
  IF b.booking_status = 'CANCELLED' THEN RETURN b; END IF;

  DELETE FROM booking_slots WHERE booking_id = b.id;   -- آزادسازیِ زمان

  IF b.payment_status <> 'PAID' THEN
    UPDATE bookings SET booking_status='CANCELLED', status='cancelled',
           cancelled_at=now(), cancellation_reason=p_reason, "updatedAt"=now()
     WHERE id = b.id RETURNING * INTO b;
    RETURN b;
  END IF;

  /* بازپرداخت هرگز از مبلغِ پرداخت‌شده بیشتر نمی‌شود — سرور سقف را
     تحمیل می‌کند، حتی اگر لایه‌ی بالاتر عددِ بزرگ‌تری بفرستد. */
  refund := GREATEST(0, LEAST(p_refund, b.final_amount));
  fee    := b.final_amount - refund;

  SELECT * INTO pay FROM payments
   WHERE booking_id = b.id AND status = 'PAID' ORDER BY paid_at DESC LIMIT 1;

  /* اگر سهمِ باشگاه قبلاً تعلق گرفته بود (رزروِ تکمیل‌شده)، برگردانده شود */
  IF b.booking_status = 'COMPLETED' AND b.club_amount > 0 THEN
    INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, b."clubId", b."userId", 'CLUB_EARNING_REVERSAL', -b.club_amount,
            'booking:' || b.id || ':CLUB_REVERSAL',
            jsonb_build_object('reason', p_reason))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, b."clubId", b."userId", 'ADJUSTMENT', -b.platform_commission,
            'booking:' || b.id || ':COMMISSION_REVERSAL',
            jsonb_build_object('kind','commission_reversal','reason', p_reason))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
  END IF;

  IF refund > 0 THEN
    INSERT INTO ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, pay.id, b."clubId", b."userId", 'REFUND', -refund,
            'booking:' || b.id || ':REFUND',
            jsonb_build_object('reason', p_reason, 'gross', b.final_amount))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    /* بازپرداخت یک عملیاتِ مالیِ واقعی است، نه فقط عوض‌کردنِ وضعیت.
       پیش‌تر این ردیف هرگز ساخته نمی‌شد و جدولِ refunds خالی می‌ماند. */
    INSERT INTO refunds (booking_id, payment_id, club_id, user_id, amount, gross_amount,
                         cancellation_fee, reason, status, idempotency_key)
    VALUES (b.id, pay.id, b."clubId", b."userId", refund, b.final_amount, fee,
            p_reason, 'REQUESTED', 'booking:' || b.id)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
  END IF;

  /* جریمه‌ی لغو درآمدِ پلتفرم است و باید همان‌جا ثبت شود، وگرنه در
     گزارشِ مالیاتی پولی می‌ماند که معلوم نیست چه شد. */
  IF fee > 0 THEN
    INSERT INTO ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, pay.id, b."clubId", b."userId", 'CANCELLATION_FEE', fee,
            'booking:' || b.id || ':CANCEL_FEE',
            jsonb_build_object('reason', p_reason, 'gross', b.final_amount))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
  END IF;

  UPDATE bookings SET
    booking_status='CANCELLED', status='cancelled', cancelled_at=now(),
    cancellation_reason=p_reason, refund_amount=refund,
    settlement_status='NONE',
    payment_status = CASE WHEN refund >= b.final_amount THEN 'REFUNDED'
                          WHEN refund > 0 THEN 'PARTIALLY_REFUNDED'
                          ELSE b.payment_status END,
    refund_status = CASE WHEN refund > 0 THEN 'REQUESTED' ELSE 'NONE' END,
    "updatedAt"=now()
   WHERE id = b.id RETURNING * INTO b;

  PERFORM public.bh_reconcile_club_account(b."clubId");
  RETURN b;
END $$;

/* نهایی‌کردنِ بازپرداخت پس از انجامِ واقعیِ انتقالِ وجه */
CREATE OR REPLACE FUNCTION public.bh_complete_refund(
  p_refund_id uuid, p_reference text, p_admin uuid
) RETURNS refunds LANGUAGE plpgsql AS $$
DECLARE r refunds;
BEGIN
  SELECT * INTO r FROM refunds WHERE id = p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'refund_not_found'; END IF;
  IF r.status = 'COMPLETED' THEN RETURN r; END IF;

  UPDATE refunds SET status='COMPLETED', provider_ref=p_reference,
         processed_by=p_admin, completed_at=now()
   WHERE id = p_refund_id RETURNING * INTO r;

  IF r.booking_id IS NOT NULL THEN
    UPDATE bookings SET refund_status='COMPLETED', "updatedAt"=now() WHERE id = r.booking_id;
  END IF;
  IF r.payment_id IS NOT NULL THEN
    UPDATE payments SET refunded_amount = LEAST(amount, refunded_amount + r.amount),
           status = CASE WHEN refunded_amount + r.amount >= amount THEN 'REFUNDED' ELSE status END,
           updated_at = now()
     WHERE id = r.payment_id;
  END IF;

  RETURN r;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۴) تسویه — جزئی، با تأیید، و قابلِ برگشت
-- ───────────────────────────────────────────────────────────────────────────
/* امضای قدیمی حذف می‌شود، وگرنه فراخوانِ دوآرگومانی میانِ نسخه‌ی قدیم و
   نسخه‌ی تازه (که دو آرگومانِ پیش‌فرض دارد) مبهم می‌ماند و خطا می‌دهد. */
DROP FUNCTION IF EXISTS public.bh_create_settlement(uuid, uuid);

CREATE OR REPLACE FUNCTION public.bh_create_settlement(
  p_club_id uuid, p_admin uuid, p_amount bigint DEFAULT NULL, p_idem text DEFAULT NULL
) RETURNS settlements LANGUAGE plpgsql AS $$
DECLARE acc club_accounts; ba club_bank_accounts; s settlements; amt bigint;
BEGIN
  /* موجودی از دفتر بازسازی می‌شود، نه از کَشی که ممکن است منحرف باشد */
  acc := public.bh_reconcile_club_account(p_club_id);

  /* «قابلِ تسویه» در ستونِ available_balance است، نه pending.
     در ۰۴۰ معنا صریح شد: available = بدهیِ پرداختنیِ اکنون،
     pending = تسویه‌ای که تأیید شده ولی هنوز پرداخت نشده. */
  amt := COALESCE(p_amount, acc.available_balance);
  IF amt <= 0 THEN RAISE EXCEPTION 'nothing_to_settle'; END IF;
  IF amt > acc.available_balance THEN
    RAISE EXCEPTION 'amount_exceeds_payable:% > %', amt, acc.available_balance;
  END IF;

  SELECT * INTO ba FROM club_bank_accounts
   WHERE club_id = p_club_id AND is_active AND verification_status = 'VERIFIED'
   ORDER BY verified_at DESC NULLS LAST, created_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'bank_account_not_verified'; END IF;

  INSERT INTO settlements (club_id, amount, iban, bank_account_snapshot, status,
                           admin_id, approved_by, approved_at, idempotency_key)
  VALUES (p_club_id, amt, ba.iban,
          jsonb_build_object('holder', ba.account_holder_name, 'bank', ba.bank_name,
                             'iban', ba.iban, 'verified_at', ba.verified_at),
          'APPROVED', p_admin, p_admin, now(), p_idem)
  RETURNING * INTO s;

  INSERT INTO ledger_entries (club_id, type, amount, source_key, meta)
  VALUES (p_club_id, 'SETTLEMENT', -amt, 'settlement:' || s.id,
          jsonb_build_object('settlement_id', s.id, 'admin', p_admin));

  /* فقط رزروهایی که واقعاً در این تسویه آمده‌اند علامت می‌خورند */
  UPDATE bookings SET settlement_status = 'SETTLED'
   WHERE "clubId" = p_club_id AND settlement_status = 'PENDING'
     AND booking_status = 'COMPLETED';

  PERFORM public.bh_reconcile_club_account(p_club_id);
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.bh_complete_settlement(p_id uuid, p_reference text)
RETURNS settlements LANGUAGE plpgsql AS $$
DECLARE s settlements;
BEGIN
  SELECT * INTO s FROM settlements WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'settlement_not_found'; END IF;
  IF s.status = 'COMPLETED' THEN RETURN s; END IF;
  IF s.status NOT IN ('PENDING','APPROVED','PROCESSING') THEN
    RAISE EXCEPTION 'settlement_not_completable:%', s.status;
  END IF;

  UPDATE settlements SET status='COMPLETED', reference_number=p_reference,
         processed_at=COALESCE(processed_at, now()), completed_at=now()
   WHERE id = p_id RETURNING * INTO s;

  PERFORM public.bh_reconcile_club_account(s.club_id);
  RETURN s;
END $$;

/* تسویه‌ی ناموفق: بدهی باید برگردد، وگرنه پولِ باشگاه بی‌صدا گم می‌شود */
CREATE OR REPLACE FUNCTION public.bh_fail_settlement(p_id uuid, p_reason text)
RETURNS settlements LANGUAGE plpgsql AS $$
DECLARE s settlements;
BEGIN
  SELECT * INTO s FROM settlements WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'settlement_not_found'; END IF;
  IF s.status IN ('FAILED','REVERSED') THEN RETURN s; END IF;

  UPDATE settlements SET status='FAILED', failure_reason=p_reason, reversed_at=now()
   WHERE id = p_id RETURNING * INTO s;

  INSERT INTO ledger_entries (club_id, type, amount, source_key, meta)
  VALUES (s.club_id, 'SETTLEMENT_REVERSAL', s.amount, 'settlement:' || s.id || ':REVERSAL',
          jsonb_build_object('settlement_id', s.id, 'reason', p_reason))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  UPDATE bookings SET settlement_status = 'PENDING'
   WHERE "clubId" = s.club_id AND settlement_status = 'SETTLED';

  PERFORM public.bh_reconcile_club_account(s.club_id);
  RETURN s;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۵) مسابقات روی همان هسته
--    پیش‌تر پولِ مسابقه هرگز به `club_accounts` نمی‌رسید و کمیسیونش از
--    جدولِ دیگری می‌آمد. حالا همان مسیرِ رزرو را می‌رود.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_confirm(
  p_registration_id uuid, p_provider text, p_ref_id text, p_amount bigint
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r tournament_registrations; t tournaments; rule commission_rules;
        comm bigint; net bigint;
BEGIN
  SELECT * INTO r FROM tournament_registrations WHERE id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;
  SELECT * INTO t FROM tournaments WHERE id = r.tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  IF r.payment_status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'registrationId', r.id);
  END IF;
  IF p_amount IS DISTINCT FROM r.amount THEN RAISE EXCEPTION 'amount_mismatch'; END IF;

  rule := public.bh_commission_rule(t.club_id, 'TOURNAMENT');
  comm := public.bh_commission_for_ctx(t.club_id, r.amount, 'TOURNAMENT');
  net  := r.amount - comm;

  UPDATE tournament_registrations SET
    payment_status='PAID', status='CONFIRMED',
    commission_percent = CASE WHEN rule.type='PERCENTAGE' THEN rule.value ELSE NULL END,
    commission_amount = comm, net_amount = net, updated_at = now()
   WHERE id = r.id RETURNING * INTO r;

  /* پول وارد حسابِ مرکزی شد */
  INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
  VALUES (t.club_id, r.user_id, 'TOURNAMENT_PAYMENT', r.amount,
          'treg:' || r.id || ':PAYMENT',
          jsonb_build_object('source','tournament','registrationId', r.id,
                             'tournamentId', t.id, 'tournamentTitle', t.title,
                             'provider', p_provider, 'refId', p_ref_id,
                             'commissionPlanned', comm, 'clubSharePlanned', net))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  INSERT INTO club_accounts (club_id) VALUES (t.club_id) ON CONFLICT (club_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'registrationId', r.id, 'amount', r.amount,
                            'commission', comm, 'net', net);
END $$;

/* امضای قدیمی حفظ می‌شود و به منطقِ تازه واگذار می‌کند.
   بدونِ این، کدِ موجود (`lib/tournaments/server.ts`) همچنان نسخه‌ی
   قدیمی را صدا می‌زد که کمیسیون را با علامتِ وارونه می‌نوشت و
   `club_accounts` را هرگز به‌روز نمی‌کرد. */
CREATE OR REPLACE FUNCTION public.bh_tournament_confirm_payment(
  p_registration uuid, p_expected_amount integer, p_paid_amount integer,
  p_provider text, p_ref_id text
) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  IF p_expected_amount IS DISTINCT FROM p_paid_amount THEN
    RAISE EXCEPTION 'amount_mismatch';
  END IF;
  RETURN public.bh_tournament_confirm(p_registration, p_provider, p_ref_id, p_paid_amount::bigint);
END $$;

/* پایانِ مسابقه ⇒ کمیسیون و سهمِ باشگاه قطعی می‌شود */
CREATE OR REPLACE FUNCTION public.bh_tournament_complete(p_tournament_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int := 0; t tournaments; r record;
BEGIN
  SELECT * INTO t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  FOR r IN SELECT * FROM tournament_registrations
            WHERE tournament_id = p_tournament_id AND payment_status = 'PAID'
              AND status <> 'CANCELLED'
  LOOP
    IF r.commission_amount > 0 THEN
      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'PLATFORM_COMMISSION', r.commission_amount,
              'treg:' || r.id || ':COMMISSION',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'gross', r.amount,
                                 'commissionPercent', r.commission_percent))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;

    IF r.net_amount > 0 THEN
      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'CLUB_EARNING', r.net_amount,
              'treg:' || r.id || ':CLUB_EARNING',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'gross', r.amount))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;
    n := n + 1;
  END LOOP;

  UPDATE tournaments SET status='completed', updated_at=now() WHERE id = p_tournament_id;
  PERFORM public.bh_reconcile_club_account(t.club_id);
  RETURN n;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۶) حالا که همه‌ی توابع علامتِ درست می‌نویسند، قید اعمال می‌شود
--
--    این قید عمداً در ۰۴۰ نبود: توابعِ نسخه‌ی ۰۰۱ کمیسیون را منفی
--    می‌نوشتند و اگر قید زودتر می‌آمد، در فاصله‌ی میان دو مهاجرت هر
--    تأییدِ پرداختی خطا می‌داد.
-- ───────────────────────────────────────────────────────────────────────────
UPDATE public.ledger_entries SET amount = ABS(amount)
 WHERE type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
                'CLUB_EARNING','CANCELLATION_FEE','SETTLEMENT_REVERSAL')
   AND amount < 0;
UPDATE public.ledger_entries SET amount = -ABS(amount)
 WHERE type IN ('REFUND','SETTLEMENT','CLUB_EARNING_REVERSAL')
   AND amount > 0;

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_sign_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_sign_chk CHECK (
    CASE
      WHEN type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
                    'CLUB_EARNING','CANCELLATION_FEE','SETTLEMENT_REVERSAL')
        THEN amount >= 0
      WHEN type IN ('REFUND','SETTLEMENT','CLUB_EARNING_REVERSAL')
        THEN amount <= 0
      ELSE true            -- ADJUSTMENT هر دو علامت را می‌پذیرد
    END);

/* موجودی‌ها پس از نرمال‌سازیِ علامت دوباره از دفتر ساخته می‌شوند */
SELECT public.bh_reconcile_all_clubs();

-- ───────────────────────────────────────────────────────────────────────────
-- ۷) دسترسی — هیچ‌کدام از این توابع از کلاینت صدا زده نمی‌شوند
-- ───────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.bh_complete_booking(uuid)              FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_complete_due_bookings()             FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_complete_refund(uuid,text,uuid)     FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_create_settlement(uuid,uuid,bigint,text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_fail_settlement(uuid,text)          FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_confirm(uuid,text,text,bigint) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_complete(uuid)           FROM anon, authenticated;
