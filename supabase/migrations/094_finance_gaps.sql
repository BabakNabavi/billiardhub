-- ═══════════════════════════════════════════════════════════════════════════
--  Billiard Hub — بستنِ شکاف‌های مالیِ ممیزیِ ۱۴۰۵/۰۶
--
--  هیچ‌کدام از اینها نقصِ معماری نیست؛ همه «سیمِ وصل‌نشده»اند: تابعی که
--  وجود دارد ولی صدا زده نمی‌شود، نمایی که با نوع‌های تازه به‌روز نشده،
--  یا ردیفی که ساخته نمی‌شود و بدهی را نامرئی می‌کند.
--
--  اجرای مجدد بی‌خطر است. هیچ داده‌ای حذف نمی‌شود. پیش‌نیاز: ۰۴۰، ۰۴۱، ۰۸۳.
--  واحدِ پول: تومان، BIGINT.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ۱) نوعِ تازه: برگشتِ کمیسیون
--
--    تا امروز `bh_cancel_booking` برگشتِ کمیسیون را با نوعِ `ADJUSTMENT`
--    می‌نوشت. ولی هر جایی که «درآمدِ پلتفرم» را حساب می‌کند فقط
--    `PLATFORM_COMMISSION` و `CANCELLATION_FEE` را جمع می‌زند — پس
--    کمیسیونی که برگشت خورده برای همیشه در درآمد می‌ماند.
--
--    نوشتنِ آن با علامتِ منفی روی خودِ `PLATFORM_COMMISSION` ممکن نیست:
--    `ledger_sign_chk` آن نوع را همیشه مثبت می‌خواهد و این قید عمدی است.
--    پس یک نوعِ جدا با علامتِ منفی، دقیقا مثلِ `CLUB_EARNING_REVERSAL`.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_type_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_type_chk CHECK (type IN (
    'BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
    'PLATFORM_COMMISSION_REVERSAL','CLUB_EARNING','CLUB_EARNING_REVERSAL',
    'REFUND','CANCELLATION_FEE','SETTLEMENT','SETTLEMENT_REVERSAL','ADJUSTMENT',
    'AD_REVENUE','AD_REFUND','AD_BOOST_REVENUE','AD_BOOST_REFUND'));

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_sign_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_sign_chk CHECK (
    CASE
      WHEN type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
                    'CLUB_EARNING','CANCELLATION_FEE','SETTLEMENT_REVERSAL',
                    'AD_REVENUE','AD_BOOST_REVENUE')
        THEN amount >= 0
      WHEN type IN ('REFUND','SETTLEMENT','CLUB_EARNING_REVERSAL',
                    'PLATFORM_COMMISSION_REVERSAL','AD_REFUND','AD_BOOST_REFUND')
        THEN amount <= 0
      ELSE true            -- ADJUSTMENT هر دو علامت را می‌پذیرد
    END);

-- ───────────────────────────────────────────────────────────────────────────
-- ۱ب) مهاجرتِ برگشت‌های کمیسیونِ **قبلی**
--
--     ۰۴۱ آن‌ها را با نوعِ `ADJUSTMENT` و کلیدِ
--     `booking:<id>:COMMISSION_REVERSAL` نوشته بود — همان کلیدی که کدِ
--     تازه هم می‌خواهد بنویسد. پس `ON CONFLICT DO NOTHING` جلوی درجِ
--     دوباره را می‌گیرد و ردیفِ قدیمی دست‌نخورده می‌ماند: یعنی هر
--     کمیسیونی که تا امروز پس داده شده، برای همیشه در «درآمد پلتفرم»
--     باقی می‌ماند.
--
--     دفتر append-only است (تریگرِ ۰۴۰ فقط گذارِ POSTED→REVERSED را
--     می‌پذیرد)، پس اصلاح باید افزایشی باشد: ردیفِ تازه با کلیدِ `:v2`،
--     و باطل‌کردنِ ردیفِ قدیمی تا دوبار شمرده نشود.
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.ledger_entries
     WHERE type = 'ADJUSTMENT' AND status = 'POSTED'
       AND meta->>'kind' = 'commission_reversal'
  LOOP
    INSERT INTO public.ledger_entries
      (booking_id, payment_id, club_id, user_id, type, amount, currency, source_key, meta)
    VALUES (r.booking_id, r.payment_id, r.club_id, r.user_id,
            'PLATFORM_COMMISSION_REVERSAL', -ABS(r.amount), r.currency,
            COALESCE(r.source_key, 'adj:' || r.id) || ':v2',
            COALESCE(r.meta, '{}'::jsonb)
              || jsonb_build_object('migrated_from', r.id, 'migration', '094'))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    UPDATE public.ledger_entries SET status = 'REVERSED' WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'commission_reversal مهاجرت‌یافته: %', n;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۲) هر تسویه می‌داند کدام رزروها را پوشش داده
--
--    `bh_create_settlement` تا امروز **همه‌ی** رزروهای در انتظارِ باشگاه را
--    `SETTLED` علامت می‌زد، حتی در تسویه‌ی جزئی — یعنی رزروی که پولش
--    پرداخت نشده بود «تسویه‌شده» ثبت می‌شد. و `bh_fail_settlement` برعکس،
--    **همه‌ی** رزروهای تسویه‌شده را برمی‌گرداند، حتی آن‌هایی که در
--    تسویه‌های موفقِ قبلی پرداخت شده بودند.
--
--    با این ستون، هر دو دقیق می‌شوند.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS settled_in uuid;

CREATE INDEX IF NOT EXISTS bookings_settled_in_idx
  ON public.bookings(settled_in) WHERE settled_in IS NOT NULL;

COMMENT ON COLUMN public.bookings.settled_in IS
  'شناسه‌ی تسویه‌ای که سهمِ این رزرو در آن پرداخت شد. NULL یعنی هنوز در هیچ تسویه‌ای نیامده.';

-- ───────────────────────────────────────────────────────────────────────────
-- ۳) نمای گزارشِ مالی، با درآمدِ تبلیغات و ارتقای آگهی
--
--    نما در ۰۴۰ ساخته شد و بعد از آن هرگز به‌روز نشد، در حالی که ۰۵۸
--    (تبلیغات) و ۰۷۹/۰۸۳ (ارتقای آگهی) چهار نوعِ تازه اضافه کردند. نتیجه:
--    خروجیِ CSVای که برای حسابدار ساخته شده، درآمدِ تبلیغات و
--    «فوری»/«نردبان» را **صفر** گزارش می‌کرد.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_financial_transactions AS
SELECT
  l.id,
  l.created_at,
  l.type,
  l.status,
  l.amount,
  l.currency,
  l.club_id,
  c.name              AS club_name,
  l.user_id,
  l.booking_id,
  l.payment_id,
  l.source_key,
  l.meta,
  COALESCE(l.meta->>'source', 'reservation') AS source,
  /* درآمدِ پلتفرم: کمیسیون، جریمه‌ی لغو، و فروشِ تبلیغات و ارتقا —
     منهای آنچه از هرکدام برگشته. برگشت‌ها منفی ذخیره می‌شوند، پس
     جمعِ ساده درست است. */
  CASE WHEN l.type IN ('PLATFORM_COMMISSION','PLATFORM_COMMISSION_REVERSAL',
                       'CANCELLATION_FEE','AD_REVENUE','AD_REFUND',
                       'AD_BOOST_REVENUE','AD_BOOST_REFUND')
       THEN l.amount ELSE 0 END
                      AS platform_revenue,
  CASE WHEN l.type IN ('CLUB_EARNING','CLUB_EARNING_REVERSAL') THEN l.amount
       ELSE 0 END
                      AS club_share,
  CASE WHEN l.type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT',
                       'AD_REVENUE','AD_BOOST_REVENUE')
       THEN l.amount ELSE 0 END
                      AS gross_in,
  CASE WHEN l.type IN ('REFUND','AD_REFUND','AD_BOOST_REFUND')
       THEN -l.amount ELSE 0 END
                      AS refunded_out
FROM public.ledger_entries l
LEFT JOIN public.clubs c ON c.id = l.club_id;

COMMENT ON VIEW public.v_financial_transactions IS
  'هر ردیفِ دفتر با تفکیکِ درآمدِ پلتفرم (کمیسیون، جریمه، تبلیغات، ارتقا)، سهمِ باشگاه و ورودی/خروجیِ نقدی — پایه‌ی گزارشِ مالیاتی.';

REVOKE ALL ON public.v_financial_transactions FROM anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ۴) آشتیِ موجودی: برگشتِ کمیسیون هم کسر شود
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_reconcile_club_account(p_club_id uuid)
RETURNS club_accounts LANGUAGE plpgsql AS $$
DECLARE acc club_accounts; earned bigint; reversed bigint; settled bigint;
        comm bigint; inflight bigint;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO earned   FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'CLUB_EARNING';
  SELECT COALESCE(SUM(-amount),0) INTO reversed FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'CLUB_EARNING_REVERSAL';

  /* تسویه‌ی خالص: پرداخت‌شده منهای آنچه برگشت خورده. بدونِ کسرِ
     برگشت‌ها، یک تسویه‌ی ناموفق برای همیشه از بدهیِ باشگاه کم می‌ماند. */
  SELECT COALESCE(SUM(-amount),0) INTO settled FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'SETTLEMENT';
  SELECT settled - COALESCE(SUM(amount),0) INTO settled FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'SETTLEMENT_REVERSAL';

  /* کمیسیونِ خالص — برگشت‌ها منفی‌اند، پس جمعِ ساده کافی است.
     پیش‌تر فقط `PLATFORM_COMMISSION` شمرده می‌شد و کمیسیونِ لغوشده
     برای همیشه در «کمیسیون پلتفرم»ِ پنلِ باشگاه می‌ماند. */
  SELECT COALESCE(SUM(amount),0) INTO comm     FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED'
     AND type IN ('PLATFORM_COMMISSION','PLATFORM_COMMISSION_REVERSAL');

  INSERT INTO public.club_accounts (club_id) VALUES (p_club_id)
    ON CONFLICT (club_id) DO NOTHING;

  SELECT COALESCE(SUM(amount),0) INTO inflight FROM public.settlements
   WHERE club_id = p_club_id AND status IN ('PENDING','APPROVED','PROCESSING');

  UPDATE public.club_accounts SET
    total_earnings   = earned - reversed,
    total_commission = comm,
    total_settled    = settled,
    pending_balance  = inflight,
    available_balance = (earned - reversed) - settled,
    updated_at = now()
   WHERE club_id = p_club_id
   RETURNING * INTO acc;

  RETURN acc;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۵) ساختِ رزرو: کمیسیونِ آگاه‌به‌زمینه + اسنپ‌شاتِ نرخ
--
--    دو ایراد با هم:
--
--    الف) `bh_commission_for` قدیمی ستونِ `context` را **نمی‌شناسد** (پیش از
--         ۰۴۰ نوشته شده). حالا که یک قانونِ GLOBAL برای رزرو و یکی برای
--         مسابقه هست، آن کوئری دو ردیف می‌گیرد و با `LIMIT 1` یکی را
--         دلبخواهی برمی‌دارد. امروز هر دو ۵٪‌اند پس دیده نمی‌شود؛ روزی
--         که نرخِ مسابقات عوض شود، رزروِ میز به‌صورت تصادفی نرخِ مسابقات
--         می‌گیرد.
--
--    ب)  ستون‌های `commission_rule_id/type/value` در ۰۴۰ ساخته شدند تا
--        بشود ثابت کرد تراکنشِ دیروز با چه نرخی حساب شده — و هیچ‌وقت
--        پُر نشدند.
--
--    امضا عمداً دست‌نخورده می‌ماند؛ `app/api/bookings/route.ts` همین را
--    صدا می‌زند.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_create_booking(
  p_user_id uuid, p_club_id uuid, p_table_id text, p_table_type text,
  p_date date, p_hours smallint[], p_base bigint, p_discount bigint, p_final bigint,
  p_reference text, p_ttl_minutes int DEFAULT 10
) RETURNS bookings LANGUAGE plpgsql AS $$
DECLARE b bookings; h smallint; owner uuid; comm bigint; rule commission_rules;
BEGIN
  PERFORM public.bh_expire_bookings();

  SELECT "ownerId" INTO owner FROM clubs WHERE id = p_club_id;

  rule := public.bh_commission_rule(p_club_id, 'RESERVATION');
  /* ⚠️ اگر قانونِ فعالِ رزرو نباشد، `bh_commission_for_ctx` صفر برمی‌گرداند
     و رزرو بی‌صدا با کمیسیونِ ۰٪ ساخته می‌شود — خطایی که تا ماه‌ها بعد
     دیده نمی‌شود. بهتر است رزرو انجام نشود تا اینکه رایگان انجام شود. */
  IF rule.id IS NULL THEN RAISE EXCEPTION 'no_commission_rule:RESERVATION'; END IF;
  comm := public.bh_commission_for_ctx(p_club_id, p_final, 'RESERVATION');

  INSERT INTO bookings (
    "userId","clubId","tableId","tableType","bookingDate","timeSlots","totalHours","totalPrice",
    status, booking_status, payment_status, settlement_status, expires_at,
    base_amount, discount_amount, final_amount, platform_commission, club_amount,
    club_owner_id, booking_reference,
    commission_rule_id, commission_type, commission_value
  ) VALUES (
    p_user_id, p_club_id, p_table_id, p_table_type, p_date,
    array_to_string(p_hours, ','), array_length(p_hours,1), p_final,
    'pending', 'PENDING_PAYMENT', 'UNPAID', 'NONE', now() + (p_ttl_minutes || ' minutes')::interval,
    p_base, p_discount, p_final, comm, p_final - comm,
    owner, p_reference,
    rule.id, rule.type, rule.value
  ) RETURNING * INTO b;

  FOREACH h IN ARRAY p_hours LOOP
    INSERT INTO booking_slots (booking_id, club_id, table_id, booking_date, hour)
    VALUES (b.id, p_club_id, p_table_id, p_date, h);   -- یکتایی ⇒ خطا و rollback
  END LOOP;

  RETURN b;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۶) لغوِ رزرو: برگشتِ کمیسیون با نوعِ درست
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

  refund := GREATEST(0, LEAST(p_refund, b.final_amount));
  fee    := b.final_amount - refund;

  SELECT * INTO pay FROM payments
   WHERE booking_id = b.id AND status = 'PAID' ORDER BY paid_at DESC LIMIT 1;

  /* اگر سهمِ باشگاه قبلاً تعلق گرفته بود (رزروِ تکمیل‌شده)، برگردانده شود */
  IF b.booking_status = 'COMPLETED' AND b.club_amount > 0 THEN
    INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, b."clubId", b."userId", 'CLUB_EARNING_REVERSAL', -b.club_amount,
            'booking:' || b.id || ':CLUB_REVERSAL',
            jsonb_build_object('reason', p_reason, 'source','reservation'))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
  END IF;

  /* برگشتِ کمیسیون — نوعِ اختصاصی، نه ADJUSTMENT. با ADJUSTMENT هیچ
     گزارشی آن را از درآمد کم نمی‌کرد. */
  IF b.booking_status = 'COMPLETED' AND b.platform_commission > 0 THEN
    INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, b."clubId", b."userId", 'PLATFORM_COMMISSION_REVERSAL', -b.platform_commission,
            'booking:' || b.id || ':COMMISSION_REVERSAL',
            jsonb_build_object('reason', p_reason, 'source','reservation'))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
  END IF;

  IF refund > 0 THEN
    INSERT INTO ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, pay.id, b."clubId", b."userId", 'REFUND', -refund,
            'booking:' || b.id || ':REFUND',
            jsonb_build_object('reason', p_reason, 'gross', b.final_amount, 'source','reservation'))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    INSERT INTO refunds (booking_id, payment_id, club_id, user_id, amount, gross_amount,
                         cancellation_fee, reason, status, idempotency_key)
    VALUES (b.id, pay.id, b."clubId", b."userId", refund, b.final_amount, fee,
            p_reason, 'REQUESTED', 'booking:' || b.id)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
  END IF;

  IF fee > 0 THEN
    INSERT INTO ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (b.id, pay.id, b."clubId", b."userId", 'CANCELLATION_FEE', fee,
            'booking:' || b.id || ':CANCEL_FEE',
            jsonb_build_object('reason', p_reason, 'gross', b.final_amount, 'source','reservation'))
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

-- ───────────────────────────────────────────────────────────────────────────
-- ۷) تسویه: فقط رزروهایی که واقعاً پوشش داده شده‌اند علامت می‌خورند
--
--    کامنتِ ۰۴۱ همین را ادعا می‌کرد ولی کد `WHERE settlement_status='PENDING'`
--    بدونِ هیچ سقفی می‌زد. در تسویه‌ی جزئی یعنی رزروی که پولش پرداخت نشده
--    «تسویه‌شده» ثبت می‌شد.
--
--    حالا از قدیمی‌ترین رزرو شروع می‌شود و تا سقفِ مبلغِ تسویه جلو می‌رود.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_create_settlement(
  p_club_id uuid, p_admin uuid, p_amount bigint DEFAULT NULL, p_idem text DEFAULT NULL
) RETURNS settlements LANGUAGE plpgsql AS $$
DECLARE acc club_accounts; ba club_bank_accounts; s settlements;
        amt bigint; used bigint := 0; r record;
BEGIN
  /* ⚠️ قفل **پیش از** آشتی گرفته می‌شود، نه حینِ آن.
     `bh_reconcile_club_account` اول دفتر را با چند SELECT می‌خواند و تازه
     بعد `club_accounts` را UPDATE می‌کند — یعنی قفلِ ردیف تا آن لحظه
     گرفته نمی‌شود. زیرِ READ COMMITTED دو درخواستِ همزمان هر دو دفترِ
     قدیمی را می‌خواندند، هر دو از شرطِ `amt > available` رد می‌شدند و
     باشگاه **دو بار** پول می‌گرفت. کلیدِ ضدِتکرارِ لایه‌ی API فقط
     دابل‌کلیکِ با مبلغِ یکسان را می‌گیرد، نه ۶۰۰ هزار در یک تب و ۵۰۰
     هزار در تبِ دیگر. */

  /* ⚠️ ترتیبِ قفل این‌جا وارونه‌ی `bh_cancel_booking`/`bh_complete_booking`
     است (آن‌ها اول `bookings` می‌گیرند بعد `club_accounts`). پس پنجره‌ی
     بن‌بست هست: تسویه همزمان با لغو یا تکمیلِ رزروِ همان باشگاه. داده
     خراب نمی‌شود — پستگرس یک طرف را می‌کشد — ولی برای ادمین یک ۵۰۰ِ
     بی‌توضیح می‌شود. مهلتِ کوتاه، خطای صریح می‌دهد به‌جای انتظارِ طولانی. */
  SET LOCAL lock_timeout = '4s';

  INSERT INTO club_accounts (club_id) VALUES (p_club_id) ON CONFLICT (club_id) DO NOTHING;
  PERFORM 1 FROM club_accounts WHERE club_id = p_club_id FOR UPDATE;

  acc := public.bh_reconcile_club_account(p_club_id);

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

  /* از قدیمی‌ترین رزروِ تکمیل‌شده‌ی تسویه‌نشده، تا سقفِ مبلغِ این تسویه.

     ⚠️ `COALESCE` حیاتی است: `club_amount` در ردیف‌های قدیمی می‌تواند
     NULL باشد (۰۴۰ فقط جایی را بک‌فیل کرد که `final_amount <> comm +
     club_amount` بود، و آن مقایسه با NULL هرگز true نمی‌شود). بدونِ
     COALESCE، `used + NULL > amt` می‌شود NULL، `EXIT WHEN` آن را false
     می‌گیرد، `used` هم NULL می‌ماند — و از آن به بعد **همه‌ی** رزروهای
     در انتظار SETTLED علامت می‌خورند. یعنی دقیقا همان باگی که این بخش
     قرار بود درستش کند. */
  FOR r IN
    SELECT id, COALESCE(club_amount, 0) AS club_amount FROM bookings
     WHERE "clubId" = p_club_id AND settlement_status = 'PENDING'
       AND booking_status = 'COMPLETED' AND settled_in IS NULL
     ORDER BY completed_at NULLS LAST, "createdAt"
  LOOP
    /* `CONTINUE` و نه `EXIT`: رزروی که در باقی‌مانده جا نمی‌شود رد
       می‌شود، ولی رزروِ کوچک‌ترِ بعدی ممکن است جا شود. با `EXIT`،
       بعد از یک تسویه‌ی جزئی رزروِ جامانده برای همیشه `PENDING`
       می‌ماند — حتی وقتی بعدا کاملا پرداخت شده. */
    CONTINUE WHEN used + r.club_amount > amt;
    UPDATE bookings SET settlement_status = 'SETTLED', settled_in = s.id WHERE id = r.id;
    used := used + r.club_amount;
    EXIT WHEN used = amt;
  END LOOP;

  PERFORM public.bh_reconcile_club_account(p_club_id);
  RETURN s;
END $$;

/* تسویه‌ی ناموفق: فقط رزروهای همین تسویه برمی‌گردند، نه همه‌ی
   تسویه‌شده‌های باشگاه. */
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

  UPDATE bookings SET settlement_status = 'PENDING', settled_in = NULL
   WHERE settled_in = s.id;

  PERFORM public.bh_reconcile_club_account(s.club_id);
  RETURN s;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۸) انصرافِ بازیکن از مسابقه: بدهی باید دیده شود
--
--    تا امروز فقط وضعیتِ ثبت‌نام عوض می‌شد. نه ردیفی در `refunds`، نه
--    ردیفی در دفتر. کامنتِ ۰۷۴ می‌گفت «انتقالِ واقعی در دستورِ پرداختِ
--    پنلِ ادمین می‌آید» — ولی آن صفحه فهرستش را از جدولِ `refunds`
--    می‌سازد و هرگز به `tournament_registrations` نگاه نمی‌کند.
--
--    نتیجه: بازیکن پیام «مبلغ طی روزهای آینده بازگردانده می‌شود» می‌گرفت
--    و آن بدهی در هیچ صفحه‌ای دیده نمی‌شد.
--
--    چون لغو فقط پیش از کشیدنِ جدول ممکن است، مسابقه هنوز `completed`
--    نشده و هیچ `CLUB_EARNING`ای وجود ندارد — پس برگشتِ سهم لازم نیست.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_self_cancel(
  p_registration uuid,
  p_user         uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r record; t record; v_deadline timestamptz; v_hours numeric; pay payments;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations
   WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF r.user_id IS NULL OR r.user_id <> p_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_yours');
  END IF;

  IF r.status IN ('CANCELLED', 'REFUNDED', 'EXPIRED') THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tournament_matches WHERE tournament_id = t.id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bracket_drawn');
  END IF;

  v_deadline := coalesce(t.registration_ends_at, t.starts_at);
  IF v_deadline IS NOT NULL THEN
    v_hours := extract(epoch FROM (v_deadline - now())) / 3600.0;
    IF v_hours < 4 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'too_late',
        'hoursLeft', round(v_hours, 1));
    END IF;
  END IF;

  IF r.payment_status = 'PAID' THEN
    UPDATE public.tournament_registrations
       SET status = 'REFUNDED', payment_status = 'REFUNDED',
           refund_amount = r.amount, refunded_at = now(),
           cancel_reason = 'انصراف بازیکن', updated_at = now()
     WHERE id = p_registration;

    SELECT * INTO pay FROM public.payments
     WHERE tournament_registration_id = r.id AND status = 'PAID'
     ORDER BY paid_at DESC LIMIT 1;

    /* پول از حسابِ مرکزی خارج می‌شود */
    INSERT INTO public.ledger_entries
      (payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (pay.id, t.club_id, r.user_id, 'REFUND', -r.amount,
            'treg:' || r.id || ':REFUND',
            jsonb_build_object('source','tournament', 'registrationId', r.id,
                               'tournamentId', t.id, 'reason','انصراف بازیکن',
                               'gross', r.amount))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    /* و در صفِ دستورِ پرداختِ ادمین می‌نشیند */
    INSERT INTO public.refunds
      (tournament_registration_id, payment_id, club_id, user_id, amount, gross_amount,
       cancellation_fee, reason, status, idempotency_key)
    VALUES (r.id, pay.id, t.club_id, r.user_id, r.amount, r.amount, 0,
            'انصراف بازیکن از مسابقه', 'REQUESTED', 'treg:' || r.id)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    PERFORM public.bh_reconcile_club_account(t.club_id);
    RETURN jsonb_build_object('ok', true, 'refunded', r.amount);
  END IF;

  UPDATE public.tournament_registrations
     SET status = 'CANCELLED', cancel_reason = 'انصراف بازیکن', updated_at = now()
   WHERE id = p_registration;
  RETURN jsonb_build_object('ok', true, 'refunded', 0);
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۸ب) بدهیِ انصراف‌های **قبلیِ** مسابقه
--
--     ۰۷۴ ثبت‌نام را `REFUNDED` می‌کرد و هیچ ردیفی در `refunds` یا دفتر
--     نمی‌ساخت. آن بازیکن‌ها پیامِ «مبلغ برمی‌گردد» گرفته‌اند و بدهی‌شان
--     در هیچ صفحه‌ای دیده نمی‌شود. همان کلیدهای ضدِتکرارِ نسخه‌ی تازه
--     استفاده می‌شوند، پس اجرای دوباره چیزی را دو بار نمی‌سازد.
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE r record; t record; pay payments; n int := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.tournament_registrations
     WHERE status = 'REFUNDED' AND COALESCE(refund_amount, 0) > 0
       AND NOT EXISTS (SELECT 1 FROM public.refunds f
                        WHERE f.tournament_registration_id = tournament_registrations.id)
  LOOP
    SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id;
    CONTINUE WHEN t.id IS NULL;

    SELECT * INTO pay FROM public.payments
     WHERE tournament_registration_id = r.id AND status = 'PAID'
     ORDER BY paid_at DESC LIMIT 1;

    INSERT INTO public.ledger_entries
      (payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (pay.id, t.club_id, r.user_id, 'REFUND', -r.refund_amount,
            'treg:' || r.id || ':REFUND',
            jsonb_build_object('source','tournament','registrationId', r.id,
                               'tournamentId', t.id, 'reason', COALESCE(r.cancel_reason,'انصراف بازیکن'),
                               'gross', r.amount, 'backfilled', true))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    INSERT INTO public.refunds
      (tournament_registration_id, payment_id, club_id, user_id, amount, gross_amount,
       cancellation_fee, reason, status, idempotency_key)
    VALUES (r.id, pay.id, t.club_id, r.user_id, r.refund_amount, r.amount, 0,
            COALESCE(r.cancel_reason, 'انصراف بازیکن از مسابقه'), 'REQUESTED', 'treg:' || r.id)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    n := n + 1;
  END LOOP;
  RAISE NOTICE 'بازپرداختِ مسابقه‌ی بک‌فیل‌شده: %', n;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۸ج) `bh_complete_due_bookings` — فیلترِ سررسید در خودِ SQL
--
--     نسخه‌ی ۰۴۱ همه‌ی رزروهای CONFIRMEDِ امروز و قبل را با `LIMIT 500`
--     و **بدونِ ORDER BY** برمی‌داشت، بعد سررسید را در plpgsql چک می‌کرد.
--     رزروِ امروز که ساعتش هنوز نرسیده، هر بار در همان پنجره می‌ماند و
--     جای رزروهای عقب‌افتاده را می‌گیرد — یعنی حلقه‌ی جبرانی می‌تواند
--     با `n = 0` خارج شود در حالی که هنوز عقب‌ماندگی هست.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_complete_due_bookings() RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := 0; r record;
BEGIN
  FOR r IN
    SELECT b.id FROM bookings b
     WHERE b.booking_status = 'CONFIRMED' AND b.payment_status = 'PAID'
       AND b."bookingDate" <= (now() AT TIME ZONE 'Asia/Tehran')::date
       /* پایانِ سانس = بزرگ‌ترین ساعت + ۱. تبدیل به عدد باید **پیش** از
          MAX باشد: روی متن، «۹» بزرگ‌تر از «۱۸» است. */
       AND (b."bookingDate" + (
             (COALESCE((SELECT MAX(x::int) FROM unnest(string_to_array(COALESCE(b."timeSlots",''), ',')) AS x
                         WHERE trim(x) ~ '^[0-9]+$'), 23) + 1) || ' hours')::interval)
           <= (now() AT TIME ZONE 'Asia/Tehran')
     ORDER BY b."bookingDate"
     LIMIT 500
  LOOP
    BEGIN
      PERFORM public.bh_complete_booking(r.id);
      n := n + 1;
    EXCEPTION WHEN OTHERS THEN
      /* یک رزروِ خراب نباید کلِ اجرا را متوقف کند */
      RAISE WARNING 'complete_failed % : %', r.id, SQLERRM;
    END;
  END LOOP;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.bh_complete_due_bookings() FROM anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ۹) تکمیلِ رزروی که دستی COMPLETED شده
--
--    مسیرِ `PUT /api/bookings/:id/status` اجازه می‌داد باشگاه‌دار وضعیت را
--    مستقیم روی COMPLETED بگذارد، بدونِ عبور از `bh_complete_booking`. آن در
--    پشتی در همین دور بسته شد، ولی اگر ردیفی از قبل این‌طور مانده باشد
--    هرگز سهمِ باشگاه نمی‌سازد: `bh_complete_due_bookings` فقط دنبالِ
--    CONFIRMED می‌گردد و `bh_complete_booking` روی COMPLETED زود برمی‌گردد.
--
--    این تابع همان ردیف‌ها را نجات می‌دهد. idempotent است چون
--    `source_key` یکتاست.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_backfill_completed_ledger() RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := 0; b record;
BEGIN
  /* ⚠️ `club_amount > 0` در شرط لازم است: ردیفی با سهمِ صفر یا NULL
     هرگز `CLUB_EARNING` نمی‌گیرد، پس `NOT EXISTS` برایش همیشه true
     می‌ماند و هر اجرا دوباره پردازشش می‌کرد. */
  FOR b IN
    SELECT * FROM bookings
     WHERE booking_status = 'COMPLETED' AND payment_status = 'PAID'
       AND COALESCE(club_amount, 0) > 0
       AND NOT EXISTS (SELECT 1 FROM ledger_entries
                        WHERE source_key = 'booking:' || bookings.id || ':CLUB_EARNING')
  LOOP
    IF b.platform_commission > 0 THEN
      INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
      VALUES (b.id, b."clubId", b."userId", 'PLATFORM_COMMISSION', b.platform_commission,
              'booking:' || b.id || ':COMMISSION',
              jsonb_build_object('source','reservation','gross', b.final_amount,
                                 'backfilled', true))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;

    IF b.club_amount > 0 THEN
      INSERT INTO ledger_entries (booking_id, club_id, user_id, type, amount, source_key, meta)
      VALUES (b.id, b."clubId", b."userId", 'CLUB_EARNING', b.club_amount,
              'booking:' || b.id || ':CLUB_EARNING',
              jsonb_build_object('source','reservation','gross', b.final_amount,
                                 'backfilled', true))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;

    UPDATE bookings SET settlement_status = 'PENDING',
           completed_at = COALESCE(completed_at, "updatedAt", now())
     WHERE id = b.id AND settlement_status <> 'SETTLED';

    PERFORM public.bh_reconcile_club_account(b."clubId");
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۹ب) جمع‌های گزارشِ ادمین — در SQL، نه در حافظه‌ی Node
--
--     `/api/admin/finance` کلِ `ledger_entries` را می‌کشید و در جاوااسکریپت
--     جمع می‌زد. PostgREST سقفِ پیش‌فرضِ سطر دارد، پس با رشدِ دفتر همه‌ی
--     عددهای «نمای کلی» بی‌صدا **کمتر از واقع** می‌شدند — بدترین نوع
--     باگ در صفحه‌ی مالی، چون هیچ خطایی نمی‌دهد.
--
--     `p_from/p_to` هر دو شامل‌اند و NULL یعنی «بی‌مرز».
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_finance_totals(
  p_from timestamptz DEFAULT NULL,
  p_to   timestamptz DEFAULT NULL,
  p_club uuid        DEFAULT NULL,
  p_with_held boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE j jsonb; held bigint;
BEGIN
  SELECT jsonb_object_agg(t, s) INTO j FROM (
    SELECT type AS t, COALESCE(SUM(amount), 0) AS s
      FROM public.ledger_entries
     WHERE status = 'POSTED'
       AND (p_from IS NULL OR created_at >= p_from)
       AND (p_to   IS NULL OR created_at <= p_to)
       AND (p_club IS NULL OR club_id = p_club)
     GROUP BY type) x;

  /* کمیسیون به تفکیکِ منبع — برای «از رزرو» و «از مسابقات» */
  SELECT COALESCE(j, '{}'::jsonb) || jsonb_build_object(
    'COMMISSION_RESERVATION', COALESCE((
      SELECT SUM(amount) FROM public.ledger_entries
       WHERE status='POSTED' AND type IN ('PLATFORM_COMMISSION','PLATFORM_COMMISSION_REVERSAL')
         AND COALESCE(meta->>'source','reservation') = 'reservation'
         AND (p_from IS NULL OR created_at >= p_from)
         AND (p_to   IS NULL OR created_at <= p_to)
         AND (p_club IS NULL OR club_id = p_club)), 0),
    'COMMISSION_TOURNAMENT', COALESCE((
      SELECT SUM(amount) FROM public.ledger_entries
       WHERE status='POSTED' AND type IN ('PLATFORM_COMMISSION','PLATFORM_COMMISSION_REVERSAL')
         AND meta->>'source' = 'tournament'
         AND (p_from IS NULL OR created_at >= p_from)
         AND (p_to   IS NULL OR created_at <= p_to)
         AND (p_club IS NULL OR club_id = p_club)), 0)
  ) INTO j;

  IF NOT p_with_held THEN RETURN COALESCE(j, '{}'::jsonb); END IF;

  /* ── پولی که نگه داشته‌ایم و هنوز تکلیفش روشن نیست ──
     چهار منبع دارد و هر چهار باید بیایند، وگرنه ناوردایِ گزارش ذاتا
     ناصفر می‌شود و هشدارِ «ناترازی دفتر» همیشه روشن می‌ماند:

       ۱) رزروِ پرداخت‌شده‌ای که هنوز برگزار نشده (CONFIRMED)
       ۲) رزروی که مشتری نیامده (NO_SHOW) — هنوز نه درآمد است نه بدهی
       ۳) ثبت‌نامِ پرداخت‌شده‌ی مسابقه‌ای که هنوز `completed` نشده
       ۴) بدهیِ بازپرداختی که هنوز ردیفِ REFUND در دفتر ندارد

     ⚠️ موردِ چهارم از مسیرِ «کالبکِ دیرهنگام» (۰۴۱) می‌آید: پول رسیده،
     رزرو منقضی شده، یک ردیفِ `refunds` ساخته می‌شود ولی هیچ
     `REFUND`ی در دفتر نوشته نمی‌شود. بدونِ این بند، هر کالبکِ
     دیرهنگام ناوردا را برای همیشه به‌اندازه‌ی همان پرداخت خراب می‌کرد.

     ⚠️ `HELD` عمدا **کلِ تاریخ** است و به `p_from/p_to` توجه نمی‌کند:
     «چقدر همین حالا نگه داشته‌ایم» یک وضعیتِ لحظه‌ای است، نه جریانِ
     یک بازه. فراخوان باید در گزارشِ بازه‌ای نادیده‌اش بگیرد. */
  SELECT COALESCE(SUM(final_amount), 0) INTO held FROM public.bookings
   WHERE payment_status = 'PAID' AND booking_status IN ('CONFIRMED','NO_SHOW')
     AND (p_club IS NULL OR "clubId" = p_club);

  SELECT held + COALESCE(SUM(r.amount), 0) INTO held
    FROM public.tournament_registrations r
    JOIN public.tournaments t ON t.id = r.tournament_id
   WHERE r.payment_status = 'PAID' AND r.status <> 'CANCELLED'
     AND t.status <> 'completed'
     AND (p_club IS NULL OR t.club_id = p_club);

  SELECT held + COALESCE(SUM(f.amount), 0) INTO held
    FROM public.refunds f
   WHERE f.status <> 'FAILED'
     AND (p_club IS NULL OR f.club_id = p_club)
     AND NOT EXISTS (
       SELECT 1 FROM public.ledger_entries l
        WHERE l.type = 'REFUND' AND l.status = 'POSTED'
          AND ((f.booking_id IS NOT NULL AND l.booking_id = f.booking_id)
            OR (f.tournament_registration_id IS NOT NULL
                AND l.source_key = 'treg:' || f.tournament_registration_id || ':REFUND')));

  RETURN COALESCE(j, '{}'::jsonb) || jsonb_build_object('HELD', held);
END $$;

/* امضای سه‌آرگومانیِ نسخه‌ی اولِ همین مهاجرت حذف می‌شود، وگرنه فراخوانِ
   سه‌آرگومانی میان آن و نسخه‌ی تازه (که آرگومانِ چهارم پیش‌فرض دارد)
   مبهم می‌ماند و PostgREST خطای «could not choose function» می‌دهد. */
DROP FUNCTION IF EXISTS public.bh_finance_totals(timestamptz, timestamptz, uuid);

REVOKE ALL ON FUNCTION public.bh_finance_totals(timestamptz,timestamptz,uuid,boolean) FROM anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- ۱۰) اجرای جبرانی + آشتیِ همه
--
--    از روزی که سایت از ورسل به سرورِ اختصاصی رفت، هیچ کرونی
--    `bh_complete_due_bookings` را صدا نزده — چون تنها زمان‌بندش
--    `vercel.json` بود. رزروهای برگزارشده‌ی این فاصله همین‌جا تکلیفشان
--    روشن می‌شود.
-- ───────────────────────────────────────────────────────────────────────────
SELECT public.bh_backfill_completed_ledger();

/* `bh_complete_due_bookings` هر بار حداکثر ۵۰۰ ردیف برمی‌دارد — سقفی که
   برای اجرای روزانه بسته شده. این‌جا عقب‌ماندگیِ چندماهه است، پس تا
   خالی‌شدنِ صف تکرار می‌شود. سقفِ ۴۰ دور = ۲۰٬۰۰۰ رزرو، فقط برای اینکه
   خطای ناشناخته مهاجرت را در حلقه‌ی بی‌پایان نیندازد. */
DO $$
DECLARE i int := 0; n int;
BEGIN
  LOOP
    SELECT public.bh_complete_due_bookings() INTO n;
    i := i + 1;
    EXIT WHEN n = 0 OR i >= 40;
  END LOOP;
  RAISE NOTICE 'complete_due_bookings: % دور', i;
END $$;

SELECT public.bh_reconcile_all_clubs();

-- ───────────────────────────────────────────────────────────────────────────
-- ۱۱) دسترسی
-- ───────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.bh_backfill_completed_ledger()   FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_create_booking(uuid,uuid,text,text,date,smallint[],bigint,bigint,bigint,text,int) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_cancel_booking(uuid,bigint,text)    FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_create_settlement(uuid,uuid,bigint,text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_fail_settlement(uuid,text)          FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_self_cancel(uuid,uuid)   FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_reconcile_club_account(uuid)        FROM anon, authenticated;
