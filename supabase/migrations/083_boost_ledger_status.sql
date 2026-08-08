-- ─────────────────────────────────────────────────────────────────
-- ۰۸۳ — وضعیتِ درستِ سطرِ دفتر در `bh_boost_apply` (و نوعِ بازپرداخت)
--
-- ── چه شد ──
-- لایه‌ی چهارم و آخرِ همان زنجیره. پس از رفعِ ۴۰۳ (پروکسی)، افزودنِ
-- نوع (۰۸۱) و اصلاحِ `ON CONFLICT` (۰۸۲)، درجِ دفتر باز هم می‌شکست:
--
--     new row for relation "ledger_entries"
--     violates check constraint "ledger_entries_status_check"
--
-- ── چرا ──
-- قید فقط دو وضعیت را می‌پذیرد: `POSTED` و `REVERSED`. مهاجرتِ ۰۷۹
-- نوشته بود `SETTLED` — کلمه‌ای که در تسویه‌ی باشگاه‌ها معنا دارد،
-- نه در دفتر. پنج درجِ دیگرِ دفتر همه `POSTED` می‌نویسند؛ ۰۷۹ تنها
-- استثنا بود.
--
-- ── چرا این زنجیره چهار لایه شد ──
-- هر چهار خطا فقط در **زمانِ اجرا** و فقط **پس از یک پرداختِ واقعی**
-- بروز می‌کردند. نه تایپ‌چک می‌گیردشان، نه بیلد، و نه حتی اجرای
-- مهاجرت (تابع با موفقیت ساخته می‌شود؛ بدنه‌اش تا اولین فراخوانی
-- سنجیده نمی‌شود). تنها راهِ دیدنشان، یک خریدِ واقعی بود.
--
-- ── `AD_BOOST_REFUND` ──
-- `/api/admin/finance` این نوع را جمع می‌زند ولی هیچ قیدی نمی‌شناسدش.
-- امروز چیزی نمی‌نویسدش پس صفر برمی‌گردد، ولی روزی که بازپرداختِ
-- ارتقا پیاده شود، دقیقاً همین باگ از نو تکرار می‌شد. حالا مجاز است.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_type_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_type_chk CHECK (type IN (
    'BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION','CLUB_EARNING',
    'CLUB_EARNING_REVERSAL','REFUND','CANCELLATION_FEE','SETTLEMENT',
    'SETTLEMENT_REVERSAL','ADJUSTMENT','AD_REVENUE','AD_REFUND',
    'AD_BOOST_REVENUE','AD_BOOST_REFUND'));

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_sign_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_sign_chk CHECK (
    CASE
      WHEN type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
                    'CLUB_EARNING','CANCELLATION_FEE','SETTLEMENT_REVERSAL',
                    'AD_REVENUE','AD_BOOST_REVENUE')
        THEN amount >= 0
      WHEN type IN ('REFUND','SETTLEMENT','CLUB_EARNING_REVERSAL','AD_REFUND',
                    'AD_BOOST_REFUND')
        THEN amount <= 0
      ELSE true
    END);

CREATE OR REPLACE FUNCTION public.bh_boost_apply(p_order uuid, p_ref text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o record; v_until timestamptz;
BEGIN
  SELECT * INTO o FROM ad_boosts WHERE id = p_order FOR UPDATE;
  IF o.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  /* درگاه‌ها کالبک را تکرار می‌کنند. اجرای دوباره نه آگهی را دوبار
     بالا می‌برد نه درآمد را دوبار می‌شمارد. */
  IF o.applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'kind', o.kind);
  END IF;

  IF o.kind = 'bump' THEN
    UPDATE products SET bumped_at = now(), "updatedAt" = now() WHERE id = o.product_id;
    v_until := NULL;
  ELSE
    /* تمدید است نه ریست: کسی که دو بار می‌خرد ۱۴ روز می‌گیرد، نه ۷ */
    SELECT greatest(now(), coalesce(urgent_until, now())) + make_interval(days => coalesce(o.days, 7))
      INTO v_until FROM products WHERE id = o.product_id;
    UPDATE products SET urgent_until = v_until, "updatedAt" = now() WHERE id = o.product_id;
  END IF;

  UPDATE ad_boosts
     SET status = 'PAID', paid_at = coalesce(paid_at, now()),
         applied_at = now(), provider_ref_id = nullif(p_ref, '')
   WHERE id = p_order;

  /* ── سطرِ مالی ──
     `POSTED` تنها وضعیتِ مجازِ درآمد است (`SETTLED` مالِ تسویه‌ی
     باشگاه است، نه دفتر). شرطِ `WHERE source_key IS NOT NULL` هم
     همان شرطِ ایندکسِ جزئی است و بدونش ایندکس پیدا نمی‌شود.
     درآمدِ ارتقا صددرصد پلتفرم است و سهمِ باشگاه ندارد. */
  INSERT INTO ledger_entries (user_id, type, amount, currency, status, source_key, meta)
  VALUES (o.user_id, 'AD_BOOST_REVENUE', o.price, 'IRT', 'POSTED',
          'boost:' || o.id::text,
          jsonb_build_object('kind', o.kind, 'productId', o.product_id, 'days', o.days))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'kind', o.kind, 'urgentUntil', v_until);
END $$;

REVOKE ALL ON FUNCTION public.bh_boost_apply(uuid, text) FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
-- هر سه باید `t` بدهند.
SELECT
  (SELECT prosrc LIKE '%''POSTED''%' FROM pg_proc WHERE proname = 'bh_boost_apply')      AS status_ok,
  (SELECT prosrc LIKE '%WHERE source_key IS NOT NULL%' FROM pg_proc
     WHERE proname = 'bh_boost_apply')                                                    AS conflict_ok,
  (SELECT pg_get_constraintdef(oid) LIKE '%AD_BOOST_REFUND%'
     FROM pg_constraint WHERE conname = 'ledger_type_chk')                                AS refund_type_ok;
