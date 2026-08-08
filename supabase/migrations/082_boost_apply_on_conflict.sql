-- ─────────────────────────────────────────────────────────────────
-- ۰۸۲ — اصلاحِ `ON CONFLICT` در `bh_boost_apply`
--
-- ── چه شد ──
-- لایه‌ی سومِ همان باگ. پس از رفعِ ۴۰۳ِ کالبک (پروکسی) و افزودنِ نوعِ
-- `AD_BOOST_REVENUE` به قید (مهاجرتِ ۰۸۱)، اعمالِ ارتقا باز هم
-- می‌شکست — این بار با:
--
--     there is no unique or exclusion constraint matching
--     the ON CONFLICT specification
--
-- ── چرا ──
-- ایندکسِ یکتای `ledger_source_key_uidx` (مهاجرتِ ۰۴۰) **جزئی** است:
--
--     CREATE UNIQUE INDEX ... ON ledger_entries (source_key)
--       WHERE source_key IS NOT NULL
--
-- برای اینکه Postgres چنین ایندکسی را برای `ON CONFLICT` استنتاج کند،
-- باید همان شرط در خودِ دستور هم بیاید. هر هشت درجِ دفتر در مهاجرتِ
-- ۰۴۱ این را رعایت کرده‌اند:
--
--     ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING
--
-- مهاجرتِ ۰۷۹ تنها جایی بود که شرط را ننوشت. چون درج آخرین قدمِ تابع
-- است، شکستش کلِ تراکنش را برمی‌گرداند: `bumped_at`، `urgent_until`
-- و `applied_at` همه با آن پاک می‌شدند و سفارشِ پرداخت‌شده `PENDING`
-- می‌ماند.
--
-- بدنه‌ی تابع جز همان یک سطر دست‌نخورده است.
-- ─────────────────────────────────────────────────────────────────

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
     شرطِ `WHERE source_key IS NOT NULL` همان شرطِ ایندکسِ جزئی است و
     بدونش Postgres ایندکس را پیدا نمی‌کند. درآمدِ ارتقا صددرصد
     پلتفرم است و سهمِ باشگاه ندارد، پس تسویه‌ای در کار نیست. */
  INSERT INTO ledger_entries (user_id, type, amount, currency, status, source_key, meta)
  VALUES (o.user_id, 'AD_BOOST_REVENUE', o.price, 'IRT', 'SETTLED',
          'boost:' || o.id::text,
          jsonb_build_object('kind', o.kind, 'productId', o.product_id, 'days', o.days))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'kind', o.kind, 'urgentUntil', v_until);
END $$;

REVOKE ALL ON FUNCTION public.bh_boost_apply(uuid, text) FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
-- باید `t` بدهد: شرطِ ایندکسِ جزئی در بدنه‌ی تابع آمده است.
SELECT prosrc LIKE '%ON CONFLICT (source_key) WHERE source_key IS NOT NULL%' AS fixed
  FROM pg_proc WHERE proname = 'bh_boost_apply';
