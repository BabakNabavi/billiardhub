/* ═══════════════════════════════════════════════════════════════
   درآمدِ تبلیغات در دفترِ مالی + بازپرداخت + هم‌راستاسازیِ ظرفیت
   ───────────────────────────────────────────────────────────────
   سه کارِ به‌هم‌پیوسته:

   ── ۱) درآمدِ تبلیغ هیچ‌جا در دفترِ مالی ثبت نمی‌شد ──
   `campaign_orders` پرداخت را نگه می‌داشت ولی `ledger_entries` —
   که «منبعِ حقیقتِ» مالیِ سایت است — چیزی از تبلیغات نمی‌دانست. یعنی
   درآمدِ رزرو و مسابقه در دفتر بود و درآمدِ تبلیغات نبود؛ هر گزارشِ
   مالی، مالیاتی یا حسابداری ناقص می‌ماند.

   ── ۲) بازپرداخت وجود نداشت ──
   اگر ادمین کمپینی را رد می‌کرد، پولِ پرداخت‌شده هیچ مسیرِ رسمی‌ای
   برای برگشت نداشت. حالا `bh_refund_campaign_order` هم وضعیتِ سفارش
   را می‌برد به REFUNDED، هم کمپین را لغو می‌کند، هم ردیفِ منفی در
   دفتر می‌زند — همه در یک تراکنش.

   ── ۳) دو ناسازگاریِ ظرفیت که باید هم‌راستا شوند ──
   با آمدنِ `reserve_campaign_slot` (مهاجرتِ ۰۵۵)، ظرفیت در دو جا
   سنجیده می‌شود: هنگامِ ساختِ سفارش و هنگامِ فعال‌سازی پس از پرداخت.
   این دو با هم اختلاف داشتند:

     الف) `bh_activate_campaign` پنجره‌ی زمانی را نمی‌دید و همه‌ی
          کمپین‌های جایگاه را می‌شمرد. یعنی کمپینی که برای دو ماهِ
          بعد رزرو شده و درست هم رزرو شده بود، سرِ پرداخت رد می‌شد.

     ب) `capacity = 0` در کدِ نمایش و در ۰۵۵ یعنی «بی‌سقف»، ولی در
          شرطِ `v_used >= v_cap` می‌شد «همیشه پر» — چون هر عددی از
          صفر بزرگ‌تر یا مساوی است. جایگاهی با ظرفیتِ صفر هر پرداختی
          را رد می‌کرد و سفارش را FAILED می‌گذاشت.

   هر دو این‌جا با همان قاعده‌ی ۰۵۵ یکی می‌شوند.
   ═══════════════════════════════════════════════════════════════ */

/* ── ۱) دو نوعِ تازه در دفتر ──
   AD_REVENUE مثبت است (پول وارد شد) و AD_REFUND منفی (خارج شد) —
   همان قاعده‌ی علامتی که بقیه‌ی دفتر دارد. */
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_type_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_type_chk CHECK (type IN (
    'BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION','CLUB_EARNING',
    'CLUB_EARNING_REVERSAL','REFUND','CANCELLATION_FEE','SETTLEMENT',
    'SETTLEMENT_REVERSAL','ADJUSTMENT','AD_REVENUE','AD_REFUND'));

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_sign_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_sign_chk CHECK (
    CASE
      WHEN type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
                    'CLUB_EARNING','CANCELLATION_FEE','SETTLEMENT_REVERSAL',
                    'AD_REVENUE')
        THEN amount >= 0
      WHEN type IN ('REFUND','SETTLEMENT','CLUB_EARNING_REVERSAL','AD_REFUND')
        THEN amount <= 0
      ELSE true
    END);

/* ── ۲) وضعیت و ستون‌های بازپرداخت روی سفارش ── */
ALTER TABLE public.campaign_orders
  ADD COLUMN IF NOT EXISTS refunded_at    timestamptz,
  ADD COLUMN IF NOT EXISTS refund_amount  bigint,
  ADD COLUMN IF NOT EXISTS refund_reason  text;

ALTER TABLE public.campaign_orders DROP CONSTRAINT IF EXISTS campaign_orders_status_chk;
ALTER TABLE public.campaign_orders
  ADD CONSTRAINT campaign_orders_status_chk
  CHECK (status IN ('PENDING','PAID','FAILED','CANCELED','REFUNDED'));

/* ── ۳) فعال‌سازی: ظرفیت با همان قاعده‌ی ۰۵۵ + ثبتِ درآمد ── */
CREATE OR REPLACE FUNCTION public.bh_activate_campaign(p_order_id uuid, p_ref text)
RETURNS jsonb AS $$
DECLARE o record; c record; v_used integer; v_cap integer;
BEGIN
  SELECT * INTO o FROM public.campaign_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  /* قبلاً پرداخت شده ⇒ همان نتیجه، بدونِ اثرِ دوباره (کالبکِ تکراری) */
  IF o.status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'campaign_id', o.campaign_id);
  END IF;
  /* سفارشِ بازپرداخت‌شده دوباره فعال نمی‌شود */
  IF o.status = 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'refunded');
  END IF;

  IF o.campaign_id IS NULL THEN RAISE EXCEPTION 'campaign_missing'; END IF;

  SELECT * INTO c FROM public.campaigns WHERE id = o.campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  /* قفلِ ردیفِ جایگاه — همان قفلی که reserve_campaign_slot می‌گیرد،
     پس این دو هرگز هم‌زمان نمی‌شمارند. */
  SELECT capacity INTO v_cap FROM public.placements WHERE key = o.placement_key FOR UPDATE;

  /* ظرفیتِ صفر = بی‌سقف. پیش‌تر شرطِ `v_used >= v_cap` با صفر همیشه
     برقرار بود و چنین جایگاهی هر پرداختی را رد می‌کرد. */
  IF v_cap IS NOT NULL AND v_cap > 0 THEN
    /* پنجره‌ی زمانیِ خودِ کمپین، نه کلِ جایگاه — وگرنه کمپینی که برای
       ماه‌های بعد رزرو شده بود سرِ پرداخت رد می‌شد. */
    SELECT count(*) INTO v_used FROM public.campaigns x
     WHERE x.placement_key = o.placement_key
       AND x.id <> c.id
       AND x.starts_at < c.ends_at
       AND x.ends_at   > c.starts_at
       AND (
         x.status IN ('PENDING_REVIEW', 'SCHEDULED', 'ACTIVE')
         OR (x.status = 'PENDING_PAYMENT'
             AND x.created_at > now() - interval '20 minutes')
       );

    /* عمداً RAISE نمی‌کنیم: استثنا کلِ تراکنش را برمی‌گرداند و همین دو
       UPDATE را هم خنثی می‌کند، آن‌وقت سفارش برای همیشه PENDING می‌ماند. */
    IF v_used >= v_cap THEN
      UPDATE public.campaign_orders SET status = 'FAILED' WHERE id = p_order_id;
      UPDATE public.campaigns SET status = 'CANCELLED', updated_at = now() WHERE id = c.id;
      RETURN jsonb_build_object('ok', false, 'reason', 'placement_full');
    END IF;
  END IF;

  UPDATE public.campaign_orders
     SET status = 'PAID', provider_ref_id = p_ref, paid_at = now()
   WHERE id = p_order_id;

  /* پرداخت شد ⇒ نوبتِ بررسیِ ادمین. پنجره‌ی زمانی هنگامِ تأیید از نو
     حساب می‌شود تا تبلیغ‌دهنده مدتِ کاملی که خریده را بگیرد. */
  UPDATE public.campaigns
     SET status = 'PENDING_REVIEW', updated_at = now()
   WHERE id = c.id;

  /* ── درآمد در دفترِ مالی ──
     `source_key` یکتاست، پس کالبکِ تکراری ردیفِ دوم نمی‌سازد حتی اگر
     از مسیرِ دیگری به این‌جا برسد. ON CONFLICT DO NOTHING یعنی
     شکستِ ثبتِ تکراری کلِ فعال‌سازی را برنمی‌گرداند. */
  INSERT INTO public.ledger_entries
    (user_id, type, amount, currency, status, source_key, meta)
  VALUES
    (o.user_id, 'AD_REVENUE', ABS(o.amount), 'IRT', 'POSTED',
     'adorder:' || o.id::text || ':revenue',
     jsonb_build_object(
       'orderId', o.id, 'campaignId', c.id,
       'placementKey', o.placement_key, 'kind', o.kind,
       'providerRef', p_ref))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'already', false, 'campaign_id', c.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.bh_activate_campaign(uuid, text) FROM PUBLIC, anon, authenticated;

/* ── ۴) بازپرداخت ──
   اتمیک و idempotent: سفارشی که یک‌بار بازپرداخت شده دوباره نمی‌شود،
   و ردیفِ دفتر هم با `source_key` یکتا دو بار نوشته نمی‌شود.

   مبلغ از خودِ سفارش خوانده می‌شود، نه از ورودی — تنها چیزی که ادمین
   تعیین می‌کند این است که بازپرداخت کامل باشد یا جزئی، و جزئی هم از
   مبلغِ سفارش بیشتر نمی‌شود. */
CREATE OR REPLACE FUNCTION public.bh_refund_campaign_order(
  p_order_id uuid,
  p_amount   bigint DEFAULT NULL,       -- NULL = بازپرداختِ کامل
  p_reason   text   DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE o record; v_amt bigint;
BEGIN
  SELECT * INTO o FROM public.campaign_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  IF o.status = 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'amount', o.refund_amount);
  END IF;
  /* فقط پولی که واقعاً گرفته شده برمی‌گردد */
  IF o.status <> 'PAID' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_paid');
  END IF;

  v_amt := COALESCE(p_amount, o.amount);
  IF v_amt <= 0 OR v_amt > o.amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_amount');
  END IF;

  UPDATE public.campaign_orders
     SET status = 'REFUNDED', refunded_at = now(),
         refund_amount = v_amt, refund_reason = left(COALESCE(p_reason, ''), 500)
   WHERE id = p_order_id;

  /* کمپین هم باید بایستد — بازپرداختِ تبلیغی که همچنان نمایش داده
     می‌شود یعنی خدمات رایگان داده شده. */
  IF o.campaign_id IS NOT NULL THEN
    UPDATE public.campaigns
       SET status = 'CANCELLED', updated_at = now()
     WHERE id = o.campaign_id AND status <> 'EXPIRED';
  END IF;

  INSERT INTO public.ledger_entries
    (user_id, type, amount, currency, status, source_key, meta)
  VALUES
    (o.user_id, 'AD_REFUND', -ABS(v_amt), 'IRT', 'POSTED',
     'adorder:' || o.id::text || ':refund',
     jsonb_build_object(
       'orderId', o.id, 'campaignId', o.campaign_id,
       'placementKey', o.placement_key,
       'original', o.amount, 'reason', left(COALESCE(p_reason, ''), 500)))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'already', false, 'amount', v_amt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.bh_refund_campaign_order(uuid, bigint, text)
  FROM PUBLIC, anon, authenticated;

/* شاخصِ گزارشِ درآمدِ تبلیغات — بدونش هر گزارشِ مالی کلِ دفتر را می‌خواند */
CREATE INDEX IF NOT EXISTS ledger_ad_idx
  ON public.ledger_entries (type, created_at DESC)
  WHERE type IN ('AD_REVENUE', 'AD_REFUND');

/* ── بررسی ── */
SELECT
  (SELECT count(*) FROM pg_proc WHERE proname = 'bh_refund_campaign_order') AS fn_refund,
  (SELECT count(*) FROM pg_proc WHERE proname = 'bh_activate_campaign')     AS fn_activate,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'campaign_orders' AND column_name = 'refund_amount') AS col_refund,
  (SELECT count(*) FROM pg_indexes WHERE indexname = 'ledger_ad_idx')       AS idx;
