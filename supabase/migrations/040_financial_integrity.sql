-- ═══════════════════════════════════════════════════════════════════════════
--  Billiard Hub — یکپارچگیِ مالی، دفترِ قابلِ حسابرسی، و مدلِ حسابِ مرکزی
--
--  این مهاجرت معماریِ مالیِ موجود را *گسترش* می‌دهد، نه بازنویسی.
--  هسته‌ی ۰۰۱ (توابعِ اتمیک، پرداختِ idempotent، قفلِ اسلات) دست‌نخورده
--  می‌ماند؛ آنچه این‌جا اضافه می‌شود، چیزهایی است که برای کارکردن با
--  پولِ واقعی و پاسخ‌دادن به حسابرس لازم است و امروز وجود ندارد.
--
--  اجرای مجدد بی‌خطر است (idempotent). هیچ داده‌ای حذف نمی‌شود.
--  واحدِ پول: تومان، BIGINT.
--
--  ── مسئله‌هایی که حل می‌کند ────────────────────────────────────────────
--  ۱) کنوانسیونِ علامتِ متناقض: رزرو کمیسیون را منفی و مسابقه مثبت
--     می‌نوشت؛ پس SUM روی PLATFORM_COMMISSION بی‌معنا بود.
--  ۲) دفتر append-only نبود و هیچ کلیدِ یکتایی نداشت ⇒ ردیفِ مالیِ
--     تکراری ممکن بود.
--  ۳) «تحویلِ خدمت» هیچ نقطه‌ای نداشت: باشگاه لحظه‌ی پرداخت بستانکار
--     می‌شد، حتی برای رزروِ ماهِ بعد.
--  ۴) دو موتورِ کمیسیونِ موازی (commission_rules در برابر app_settings).
--  ۵) پولِ مسابقه هرگز به بدهیِ پلتفرم به باشگاه تبدیل نمی‌شد.
--  ۶) جدولِ refunds هرگز پر نمی‌شد و جریمه‌ی لغو ثبت نمی‌شد.
--  ۷) موجودیِ کَش‌شده‌ی باشگاه راهی برای آشتی با دفتر نداشت.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- ۱) کنوانسیونِ رسمیِ علامت در دفتر
--
--    از این پس هر نوع علامتِ ثابتی دارد و دیتابیس آن را تضمین می‌کند.
--    معنا: علامت از دیدِ *خزانه‌ی پلتفرم* است.
--
--      BOOKING_PAYMENT      + پول وارد حسابِ مرکزی شد
--      TOURNAMENT_PAYMENT   + همان، برای ثبت‌نامِ مسابقه
--      PLATFORM_COMMISSION  + درآمدِ پلتفرم (همیشه مثبت)
--      CANCELLATION_FEE     + درآمدِ پلتفرم از جریمه
--      CLUB_EARNING         + بدهیِ پلتفرم به باشگاه زیاد شد
--      CLUB_EARNING_REVERSAL− بدهی کم شد (لغو پس از تعلقِ سهم)
--      REFUND               − پول از حسابِ مرکزی خارج شد
--      SETTLEMENT           − پرداخت به باشگاه، بدهی صفر شد
--      SETTLEMENT_REVERSAL  + تسویه ناموفق بود و بدهی برگشت
--      ADJUSTMENT             اصلاحِ دستی، هر دو علامت
-- ───────────────────────────────────────────────────────────────────────────

/* نوع‌های تازه به CHECK اضافه می‌شوند. چون CHECK موجود نامِ خودکار دارد،
   با نامِ واقعی‌اش پیدا و جایگزین می‌شود. */
DO $$
DECLARE c_name text;
BEGIN
  SELECT con.conname INTO c_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
   WHERE rel.relname = 'ledger_entries' AND con.contype = 'c'
     AND pg_get_constraintdef(con.oid) ILIKE '%BOOKING_PAYMENT%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ledger_entries DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_type_chk CHECK (type IN (
    'BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION','CLUB_EARNING',
    'CLUB_EARNING_REVERSAL','REFUND','CANCELLATION_FEE','SETTLEMENT',
    'SETTLEMENT_REVERSAL','ADJUSTMENT'));

/* داده‌ی موجود پیش از اعمالِ قاعده‌ی علامت نرمال می‌شود.
   امروز جدول خالی است، ولی این‌جا می‌ماند تا اجرای مهاجرت روی هر
   نسخه‌ای از دیتابیس بی‌خطر باشد. */
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

COMMENT ON COLUMN public.ledger_entries.amount IS
  'علامت از دیدِ خزانه‌ی پلتفرم. مثبت = ورود/درآمد/بدهیِ تازه به باشگاه، منفی = خروج/تسویه.';

-- ───────────────────────────────────────────────────────────────────────────
-- ۲) دفتر واقعاً append-only می‌شود
--
--    تا امروز هیچ چیز جلوی UPDATE یا DELETE را نمی‌گرفت و ۰۲۷ هم فعالانه
--    ردیف‌ها را به REVERSED به‌روز می‌کرد. سابقه‌ی مالی نباید بازنویسی
--    شود؛ اصلاح باید با ردیفِ معکوس انجام شود.
--
--    تنها استثنا: عوض‌کردنِ `status` از POSTED به REVERSED، آن هم فقط
--    وقتی هیچ ستونِ دیگری تغییر نکند. این‌طور «باطل شد» ثبت می‌شود
--    بدونِ اینکه مبلغ یا مرجع دستکاری شود.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_ledger_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'ledger_is_append_only: حذفِ ردیفِ دفتر مجاز نیست (id=%)', OLD.id;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.amount     IS DISTINCT FROM OLD.amount
     OR NEW.type       IS DISTINCT FROM OLD.type
     OR NEW.club_id    IS DISTINCT FROM OLD.club_id
     OR NEW.user_id    IS DISTINCT FROM OLD.user_id
     OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.payment_id IS DISTINCT FROM OLD.payment_id
     OR NEW.currency   IS DISTINCT FROM OLD.currency
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'ledger_is_append_only: فقط status می‌تواند به REVERSED برود (id=%)', OLD.id;
  END IF;

  IF NOT (OLD.status = 'POSTED' AND NEW.status = 'REVERSED') THEN
    RAISE EXCEPTION 'ledger_is_append_only: گذرِ status نامعتبر است (% → %)', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ledger_append_only ON public.ledger_entries;
CREATE TRIGGER ledger_append_only
  BEFORE UPDATE OR DELETE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.bh_ledger_guard();

-- ───────────────────────────────────────────────────────────────────────────
-- ۳) کلیدِ یکتای طبیعی برای دفتر — ضدِ ردیفِ مالیِ تکراری
--
--    ۰۲۷ به‌جای کلیدِ یکتا از «اول SELECT بعد INSERT» استفاده می‌کرد که
--    زیرِ فشارِ همزمانی تضمینی ندارد. حالا خودِ دیتابیس تضمین می‌کند.
--
--    `source_key` امضای یکتای رویداد است؛ توابع پُرش می‌کنند.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ledger_entries
  ADD COLUMN IF NOT EXISTS source_key text;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_source_key_uidx
  ON public.ledger_entries(source_key) WHERE source_key IS NOT NULL;

COMMENT ON COLUMN public.ledger_entries.source_key IS
  'امضای یکتای رویدادِ مالی، مثلِ «booking:<id>:CLUB_EARNING». ضدِ درجِ دوباره.';

/* ایندکس‌هایی که کوئری‌های واقعیِ داشبورد لازم دارند */
CREATE INDEX IF NOT EXISTS ledger_posted_type_idx
  ON public.ledger_entries(type, created_at DESC) WHERE status = 'POSTED';
CREATE INDEX IF NOT EXISTS ledger_club_posted_idx
  ON public.ledger_entries(club_id, created_at DESC) WHERE status = 'POSTED';

-- ───────────────────────────────────────────────────────────────────────────
-- ۴) ناوردایِ حسابداری روی خودِ رزرو
--    مبلغِ نهایی همیشه = کمیسیون + سهمِ باشگاه
-- ───────────────────────────────────────────────────────────────────────────
UPDATE bookings SET club_amount = final_amount - platform_commission
 WHERE final_amount <> platform_commission + club_amount;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_split_chk;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_split_chk
  CHECK (final_amount = platform_commission + club_amount);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_amounts_nonneg_chk;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_amounts_nonneg_chk
  CHECK (final_amount >= 0 AND platform_commission >= 0 AND club_amount >= 0
         AND refund_amount >= 0 AND refund_amount <= final_amount);

/* وضعیت‌ها تا امروز متنِ آزاد بودند */
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_chk;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_booking_status_chk CHECK (booking_status IN
    ('PENDING_PAYMENT','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_chk;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_status_chk CHECK (payment_status IN
    ('UNPAID','PAID','REFUNDED','PARTIALLY_REFUNDED'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_settlement_status_chk;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_settlement_status_chk CHECK (settlement_status IN
    ('NONE','NOT_DUE','PENDING','SETTLED'));

-- ───────────────────────────────────────────────────────────────────────────
-- ۵) اسنپ‌شاتِ نرخِ کمیسیون
--    مبلغ ذخیره می‌شد ولی نرخ نه. اگر فردا کمیسیون ۵٪ شود ۱۲٪، باید
--    بشود ثابت کرد تراکنشِ دیروز با چه نرخی حساب شده.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_rule_id uuid,
  ADD COLUMN IF NOT EXISTS commission_type    text,
  ADD COLUMN IF NOT EXISTS commission_value   numeric(10,2),
  ADD COLUMN IF NOT EXISTS completed_at       timestamptz;

COMMENT ON COLUMN bookings.commission_value IS
  'نرخ یا مبلغِ ثابتِ کمیسیون در لحظه‌ی رزرو — تغییرِ بعدیِ قانون این را عوض نمی‌کند';

-- ───────────────────────────────────────────────────────────────────────────
-- ۶) تفکیکِ مبلغ روی خودِ پرداخت
--    تا امروز `payments` فقط یک عدد داشت و برای پاسخ به حسابرس باید به
--    رزرو join می‌شد.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gross_amount      bigint,
  ADD COLUMN IF NOT EXISTS commission_amount bigint,
  ADD COLUMN IF NOT EXISTS club_amount       bigint,
  ADD COLUMN IF NOT EXISTS refunded_amount   bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purpose           text NOT NULL DEFAULT 'RESERVATION';

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_purpose_chk;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_purpose_chk CHECK (purpose IN ('RESERVATION','TOURNAMENT'));

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_refunded_chk;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_refunded_chk
  CHECK (refunded_amount >= 0 AND refunded_amount <= amount);

/* مسابقه پرداختِ بدونِ رزرو دارد؛ ستون باید اجازه‌ی NULL بدهد */
ALTER TABLE public.payments ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS tournament_registration_id uuid;

CREATE INDEX IF NOT EXISTS payments_treg_idx
  ON public.payments(tournament_registration_id) WHERE tournament_registration_id IS NOT NULL;

/* پرداخت باید دقیقاً به یکی از دو چیز وصل باشد، نه هیچ‌کدام و نه هر دو */
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_subject_chk;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_subject_chk CHECK (
    (booking_id IS NOT NULL AND tournament_registration_id IS NULL)
    OR (booking_id IS NULL AND tournament_registration_id IS NOT NULL));

-- ───────────────────────────────────────────────────────────────────────────
-- ۷) یک موتورِ کمیسیون برای هر دو جریان
--    `context` اضافه می‌شود تا نرخِ رزرو و مسابقه جدا باشند ولی از یک
--    جدول بیایند. `app_settings.tournament_commission_percent` منسوخ است.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'RESERVATION';

ALTER TABLE public.commission_rules DROP CONSTRAINT IF EXISTS commission_context_chk;
ALTER TABLE public.commission_rules
  ADD CONSTRAINT commission_context_chk CHECK (context IN ('RESERVATION','TOURNAMENT'));

/* ایندکس‌های یکتای قبلی context را نمی‌شناختند */
DROP INDEX IF EXISTS commission_global_uidx;
DROP INDEX IF EXISTS commission_club_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS commission_global_ctx_uidx
  ON public.commission_rules(context) WHERE scope = 'GLOBAL' AND is_active;
CREATE UNIQUE INDEX IF NOT EXISTS commission_club_ctx_uidx
  ON public.commission_rules(club_id, context) WHERE scope = 'CLUB' AND is_active;

/* نرخِ مسابقه از app_settings منتقل می‌شود تا رفتار عوض نشود */
INSERT INTO public.commission_rules (scope, context, type, value, is_active)
SELECT 'GLOBAL', 'TOURNAMENT', 'PERCENTAGE',
       COALESCE((SELECT (value #>> '{}')::numeric FROM public.app_settings
                  WHERE key = 'tournament_commission_percent'), 5)
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_rules
   WHERE scope = 'GLOBAL' AND context = 'TOURNAMENT' AND is_active);

/* نسخه‌ی آگاه‌به‌زمینه. امضای قدیمی حفظ می‌شود تا کدِ موجود نشکند. */
CREATE OR REPLACE FUNCTION public.bh_commission_rule(p_club_id uuid, p_context text)
RETURNS commission_rules LANGUAGE plpgsql STABLE AS $$
DECLARE r commission_rules;
BEGIN
  SELECT * INTO r FROM public.commission_rules
   WHERE is_active AND context = p_context
     AND ((scope = 'CLUB' AND club_id = p_club_id) OR scope = 'GLOBAL')
   ORDER BY (scope = 'CLUB') DESC LIMIT 1;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.bh_commission_for_ctx(
  p_club_id uuid, p_amount bigint, p_context text
) RETURNS bigint LANGUAGE plpgsql STABLE AS $$
DECLARE r commission_rules; c bigint;
BEGIN
  r := public.bh_commission_rule(p_club_id, p_context);
  IF r.id IS NULL THEN RETURN 0; END IF;
  IF r.type = 'PERCENTAGE' THEN c := FLOOR(p_amount * r.value / 100.0)::bigint;
  ELSE c := r.value::bigint; END IF;
  RETURN GREATEST(0, LEAST(c, p_amount));
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- ۸) تسویه: چرخه‌ی کامل + تسویه‌ی جزئی + شکست و بازگشت
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS approved_at   timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by   uuid,
  ADD COLUMN IF NOT EXISTS method        text,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS reversed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS settlements_idem_uidx
  ON public.settlements(idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_status_check;
ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_status_chk;
ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_status_chk CHECK (status IN
    ('PENDING','APPROVED','PROCESSING','COMPLETED','FAILED','REVERSED'));

-- ───────────────────────────────────────────────────────────────────────────
-- ۹) بازپرداخت: چرخه‌ی واقعی + ضدِ بازپرداختِ دوباره
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.refunds
  ADD COLUMN IF NOT EXISTS tournament_registration_id uuid,
  ADD COLUMN IF NOT EXISTS cancellation_fee bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_amount     bigint,
  ADD COLUMN IF NOT EXISTS method           text,
  ADD COLUMN IF NOT EXISTS requested_by     uuid,
  ADD COLUMN IF NOT EXISTS processed_by     uuid,
  ADD COLUMN IF NOT EXISTS idempotency_key  text;

ALTER TABLE public.refunds ALTER COLUMN booking_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS refunds_idem_uidx
  ON public.refunds(idempotency_key) WHERE idempotency_key IS NOT NULL;
/* یک رزرو فقط یک بازپرداختِ فعال دارد */
CREATE UNIQUE INDEX IF NOT EXISTS refunds_booking_active_uidx
  ON public.refunds(booking_id)
  WHERE booking_id IS NOT NULL AND status <> 'FAILED';
CREATE UNIQUE INDEX IF NOT EXISTS refunds_treg_active_uidx
  ON public.refunds(tournament_registration_id)
  WHERE tournament_registration_id IS NOT NULL AND status <> 'FAILED';

-- ───────────────────────────────────────────────────────────────────────────
-- ۱۰) آشتیِ موجودیِ باشگاه با دفتر
--
--     `club_accounts` یک کَش است و امروز ثابت شد می‌تواند دروغ بگوید:
--     باشگاهی موجودیِ ۲۸۵٬۰۰۰ داشت در حالی که دفتر خالی بود.
--     این تابع حقیقت را از دفتر بازمی‌سازد.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_reconcile_club_account(p_club_id uuid)
RETURNS club_accounts LANGUAGE plpgsql AS $$
DECLARE acc club_accounts; earned bigint; reversed bigint; settled bigint; comm bigint;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO earned   FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'CLUB_EARNING';
  SELECT COALESCE(SUM(-amount),0) INTO reversed FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'CLUB_EARNING_REVERSAL';
  SELECT COALESCE(SUM(-amount),0) INTO settled  FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'SETTLEMENT';
  SELECT COALESCE(SUM(amount),0) INTO comm     FROM public.ledger_entries
   WHERE club_id = p_club_id AND status='POSTED' AND type = 'PLATFORM_COMMISSION';

  INSERT INTO public.club_accounts (club_id) VALUES (p_club_id)
    ON CONFLICT (club_id) DO NOTHING;

  UPDATE public.club_accounts SET
    total_earnings   = earned - reversed,
    total_commission = comm,
    total_settled    = settled,
    /* بدهیِ باقی‌مانده‌ی پلتفرم به این باشگاه */
    pending_balance  = (earned - reversed) - settled,
    available_balance = 0,
    updated_at = now()
   WHERE club_id = p_club_id
   RETURNING * INTO acc;

  RETURN acc;
END $$;

COMMENT ON FUNCTION public.bh_reconcile_club_account(uuid) IS
  'موجودیِ کَش‌شده را از دفتر بازمی‌سازد. دفتر منبعِ حقیقت است.';

/* آشتیِ همه‌ی باشگاه‌ها — برای cron و برای همین مهاجرت */
CREATE OR REPLACE FUNCTION public.bh_reconcile_all_clubs() RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := 0; c record;
BEGIN
  FOR c IN SELECT DISTINCT club_id FROM public.club_accounts
           UNION SELECT DISTINCT club_id FROM public.ledger_entries WHERE club_id IS NOT NULL
  LOOP
    PERFORM public.bh_reconcile_club_account(c.club_id);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

/* موجودی‌های منحرفِ امروز همین‌جا اصلاح می‌شوند */
SELECT public.bh_reconcile_all_clubs();

-- ───────────────────────────────────────────────────────────────────────────
-- ۱۱) نمای گزارشِ مالی — یک ردیف به‌ازای هر رویدادِ پول
--     برای گزارشِ مالیاتی و صفحه‌ی ادمین.
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
  CASE WHEN l.type IN ('PLATFORM_COMMISSION','CANCELLATION_FEE') THEN l.amount ELSE 0 END
                      AS platform_revenue,
  CASE WHEN l.type = 'CLUB_EARNING' THEN l.amount
       WHEN l.type = 'CLUB_EARNING_REVERSAL' THEN l.amount ELSE 0 END
                      AS club_share,
  CASE WHEN l.type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT') THEN l.amount ELSE 0 END
                      AS gross_in,
  CASE WHEN l.type = 'REFUND' THEN -l.amount ELSE 0 END
                      AS refunded_out
FROM public.ledger_entries l
LEFT JOIN public.clubs c ON c.id = l.club_id;

COMMENT ON VIEW public.v_financial_transactions IS
  'هر ردیفِ دفتر با تفکیکِ درآمدِ پلتفرم، سهمِ باشگاه و ورودی/خروجیِ نقدی — پایه‌ی گزارشِ مالیاتی.';

-- ───────────────────────────────────────────────────────────────────────────
-- ۱۲) امنیت
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.v_financial_transactions FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_reconcile_club_account(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_reconcile_all_clubs()        FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_commission_for_ctx(uuid,bigint,text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_commission_rule(uuid,text)   FROM anon, authenticated;
