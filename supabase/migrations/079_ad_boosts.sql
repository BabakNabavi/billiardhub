-- ─────────────────────────────────────────────────────────────────
-- ۰۷۹ — ارتقای آگهی: «تازه‌سازی» و «فوری»
--
-- ── دو محصول، دو اهرمِ متفاوت ──
-- اگر هر دو فقط یک برچسب باشند، فروشنده نمی‌داند کدام را بخرد.
-- پس هرکدام روی چیزِ دیگری اثر می‌گذارد:
--
--   تازه‌سازی → `bumped_at` که کلیدِ مرتب‌سازیِ فهرست است.
--               آگهی مثلِ آگهیِ تازه بالا می‌رود و بعد طبیعتاً
--               پایین می‌آید. یک‌باره و ارزان.
--
--   فوری     → `urgent_until`. تا آن لحظه آگهی در نوارِ رزروشده‌ی
--               بالای بازار می‌نشیند و پایین نمی‌آید. چندروزه و
--               گران‌تر.
--
-- نسخه‌ی اولِ طرح «فوری» را فقط یک نشانِ قرمز گرفته بود؛ نشانِ قرمز
-- روی آگهی‌ای که در جایگاهِ چهارصدم است هیچ ارزشی ندارد. جایگاه هم
-- باید بدهد، وگرنه محصول توخالی است.
--
-- ── چرا جدولِ جدا و نه `ad_plan_orders` ──
-- آن جدول برای «چند آگهی حق داری بگذاری» است (quota/period). این
-- یکی «این آگهیِ مشخص را ارتقا بده» است. یک جدول با دو معنی، همان
-- تله‌ای است که چند بار خورده‌ایم.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS bumped_at    timestamptz,
  ADD COLUMN IF NOT EXISTS urgent_until timestamptz;

/* ── مرتب‌سازیِ بازار ──
   `coalesce` روی ستونِ `timestamptz` در ایندکس پذیرفته نمی‌شود
   (Postgres آن را IMMUTABLE نمی‌شمارد). به‌جایش دو ستون با هم
   ایندکس می‌شوند؛ برای فهرستی در این اندازه کافی است. */
CREATE INDEX IF NOT EXISTS products_sort_idx
  ON public.products (bumped_at DESC NULLS LAST, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS products_urgent_idx
  ON public.products (urgent_until) WHERE urgent_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ad_boosts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL,
  kind               text NOT NULL CHECK (kind IN ('bump', 'urgent')),
  /* قیمت در لحظه‌ی خرید Snapshot می‌شود: تغییرِ بعدیِ تعرفه نباید
     سفارشِ نیمه‌تمامِ کسی را گران یا ارزان کند. */
  price              bigint NOT NULL CHECK (price >= 0),
  days               integer,
  status             text NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','PAID','FAILED','CANCELED','REFUNDED')),
  provider           text,
  provider_authority text,
  provider_ref_id    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  paid_at            timestamptz,
  /* تا وقتی این تهی است، ارتقا اعمال نشده. کالبکِ تکراری از همین
     می‌فهمد که کاری نمانده. */
  applied_at         timestamptz
);

CREATE INDEX IF NOT EXISTS ad_boosts_product_idx ON public.ad_boosts (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_boosts_user_idx    ON public.ad_boosts (user_id, created_at DESC);

/* ── تعرفه ──
   در تنظیمات، نه در کد: قیمت عوض می‌شود و نباید دیپلوی بخواهد. */
INSERT INTO public.app_settings (key, value)
VALUES ('ad_boost_pricing', jsonb_build_object(
  'enabled', true,
  'bump',   jsonb_build_object('price', 20000, 'cooldownHours', 24),
  'urgent', jsonb_build_object('price', 50000, 'days', 7)
))
ON CONFLICT (key) DO NOTHING;

/* ── اعمالِ ارتقا ──
   پرداخت، اعمال و ثبتِ مالی یک عملیات‌اند. جدا که باشند، حالتی
   ممکن می‌شود که فروشنده پول داده و آگهی‌اش تکان نخورده — و آن
   حالت را جز با شکایتِ خودش نمی‌فهمیم. */
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
     `source_key` یکتاست، پس حتی اگر این تابع از دو مسیر هم‌زمان
     صدا زده شود، درآمد یک بار می‌نشیند. درآمدِ ارتقا صددرصد
     پلتفرم است و سهمِ باشگاه ندارد، پس تسویه‌ای در کار نیست. */
  INSERT INTO ledger_entries (user_id, type, amount, currency, status, source_key, meta)
  VALUES (o.user_id, 'AD_BOOST_REVENUE', o.price, 'IRT', 'SETTLED',
          'boost:' || o.id::text,
          jsonb_build_object('kind', o.kind, 'productId', o.product_id, 'days', o.days))
  ON CONFLICT (source_key) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'kind', o.kind, 'urgentUntil', v_until);
END $$;

/* ── وضعیتِ ارتقای یک آگهی ──
   برای پنجره‌ی خرید: چه چیزی همین حالا فعال است و چه چیزی قفل. */
CREATE OR REPLACE FUNCTION public.bh_boost_state(p_product uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE p record; v_last timestamptz; v_cool integer;
BEGIN
  SELECT id, bumped_at, urgent_until, "createdAt" INTO p FROM products WHERE id = p_product;
  IF p.id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT coalesce((value->'bump'->>'cooldownHours')::int, 24) INTO v_cool
    FROM app_settings WHERE key = 'ad_boost_pricing';

  /* آخرین تازه‌سازیِ **پرداخت‌شده** — نه سفارشِ نیمه‌کاره */
  SELECT max(applied_at) INTO v_last FROM ad_boosts
   WHERE product_id = p_product AND kind = 'bump' AND applied_at IS NOT NULL;

  RETURN jsonb_build_object(
    'found', true,
    'urgentUntil', p.urgent_until,
    'urgentActive', p.urgent_until IS NOT NULL AND p.urgent_until > now(),
    'lastBumpAt', v_last,
    'bumpReadyAt', CASE WHEN v_last IS NULL THEN NULL
                        ELSE v_last + make_interval(hours => v_cool) END,
    'canBump', v_last IS NULL OR v_last + make_interval(hours => v_cool) <= now()
  );
END $$;

REVOKE ALL ON FUNCTION public.bh_boost_apply(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_boost_state(uuid) FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'products' AND column_name IN ('bumped_at','urgent_until')) AS product_cols,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'ad_boosts') AS boosts_table,
  (SELECT count(*) FROM pg_proc WHERE proname IN ('bh_boost_apply','bh_boost_state')) AS fns,
  (SELECT value FROM app_settings WHERE key = 'ad_boost_pricing') AS pricing;
