-- ─────────────────────────────────────────────────────────────
-- ۱۱۱ — بیلیارد بازار: ضدِتکرارِ پرداختِ ارتقا و ترتیبِ فهرست
--
-- ── ۱) یک پرداخت، چند ارتقا ──
-- روی `ad_boosts.provider_ref_id` قیدِ یکتا نبود و کالبکِ ارتقا
-- authority را اول از نشانی می‌خواند. کسی که یک‌بار ارتقا خریده بود
-- می‌توانست شناسه و کدِ پیگیریِ همان پرداخت را روی سفارش‌های PENDINGِ
-- تازه‌ی هم‌قیمت بگذارد و ارتقاها رایگان اعمال می‌شدند. کالبک در کد
-- هم‌پایه‌ی کالبکِ رزرو شد؛ این‌جا دیتابیس هم جلویش را می‌گیرد.
-- سیاهه‌ی ۳۰ سپتامبر: هیچ کدِ پیگیریِ تکراری‌ای وجود ندارد.
--
-- ── ۲) آگهیِ یک‌بار تازه‌شده برای همیشه بالای فهرست ──
-- فهرست اول با `bumped_at` مرتب می‌شد و بعد با تاریخِ ثبت. ولی
-- `bumped_at` فقط برای آگهی‌های ارتقایافته پر است، پس تازه‌سازیِ سه ماه
-- پیش بالای **همه‌ی** آگهی‌های امروز می‌نشست. کامنتِ کنارِ همان کد
-- می‌گفت «تهی یعنی تاریخِ ثبت ملاک است» ولی پیاده‌سازی این نبود.
-- `listed_at` ستونِ محاسبه‌شده است: آخرین لحظه‌ای که آگهی «تازه» شد.
-- `createdAt` بی‌منطقه‌ی زمانی است و UTC ذخیره می‌شود؛ AT TIME ZONE
-- با منطقه‌ی ثابت تغییرناپذیر است، پس در ستونِ محاسبه‌شده مجاز است.
--
-- ── اجرا (تک‌خطی، با scp — نه لوله) ──
--   scp -i "$env:USERPROFILE\.ssh\billiardhub_parspack" supabase/migrations/111_market_boost_and_order.sql root@130.185.72.87:/tmp/111.sql
--   ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/111.sql"
--
-- ── ۳) توقفِ مدیریت که فروشنده برمی‌گرداند ──
-- ستونِ `moderation_hold`؛ توضیح کنارِ خودش.
--
-- اپِ فعلی با این مهاجرت کار می‌کند (ستون‌های تازه را نمی‌خواند)؛ کدِ
-- تازه بدونِ آن هم کار می‌کند (اگر ستون‌ها نباشند، به رفتارِ قبلی
-- برمی‌گردد). ولی **اول این مهاجرت، بعد دیپلوی** — پرچمِ توقف و
-- ضدِتکرار فقط با آن کامل‌اند.
-- اجرای دوباره بی‌خطر است.
-- ─────────────────────────────────────────────────────────────

SET lock_timeout = '3s';

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS listed_at timestamptz
  GENERATED ALWAYS AS (COALESCE(bumped_at, "createdAt" AT TIME ZONE 'UTC')) STORED;

CREATE INDEX IF NOT EXISTS products_listed_at_idx ON public.products (listed_at DESC);

/* ── ۳) توقفِ مدیریت ≠ توقفِ فروشنده ──
   «توقف موقت»ِ پنلِ ادمین همان `paused`ی را می‌نویسد که فروشنده خودش
   می‌گذارد، پس فروشنده با یک «فعال‌سازی» یا «تمدید» توقفِ مدیریت را
   برمی‌گرداند. این پرچم را هر اقدامِ وضعیتیِ ادمین تنظیم می‌کند و مسیرِ
   ویرایشِ فروشنده تا وقتی روشن است تغییرِ وضعیت و تمدید را رد می‌کند. */
/* تا امروز هیچ رابطی `paused` را برای فروشنده نمی‌فرستاد، پس هر آگهیِ
   `paused`ی که هنگامِ ساختِ ستون هست، توقفِ ادمین است و پرچم می‌گیرد.
   فقط در همان اجرای نخست — اجرای دوباره نباید آگهی‌ای را که فروشنده
   بعدا خودش متوقف کرده، قفل کند. سیاهه‌ی ۳۰ سپتامبر: صفر ردیفِ paused. */
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'products'
                    AND column_name = 'moderation_hold') THEN
    ALTER TABLE public.products ADD COLUMN moderation_hold boolean NOT NULL DEFAULT false;
    UPDATE public.products SET moderation_hold = true WHERE status IN ('paused', 'rejected');
  END IF;
END $$;
COMMENT ON COLUMN public.products.moderation_hold IS
  'true when an admin paused/rejected/sent the ad to review; sellers cannot change status or renew while set. Cleared when an admin activates it.';

CREATE UNIQUE INDEX IF NOT EXISTS ad_boosts_ref_uidx
  ON public.ad_boosts (provider_ref_id) WHERE provider_ref_id IS NOT NULL;

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

  /* ۱۱۱: ضدِ Replay. یک کدِ پیگیری فقط یک سفارش را اعمال می‌کند.
     بدونِ این، کسی که یک‌بار ارتقا خریده بود می‌توانست شناسه و کدِ
     پیگیریِ همان پرداخت را روی سفارشِ PENDINGِ تازه‌ی هم‌قیمت بگذارد؛
     پی‌پینگ برای پرداختِ از قبل تأییدشده «پرداخت‌شده» برمی‌گرداند و
     ارتقاهای بعدی رایگان اعمال می‌شدند. ایندکسِ یکتای پایین هم پشتِ
     همین است. */
  IF nullif(p_ref, '') IS NOT NULL AND EXISTS (
       SELECT 1 FROM ad_boosts WHERE provider_ref_id = nullif(p_ref, '') AND id <> o.id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'ref_reused');
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

DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.products WHERE listed_at IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'ABORT: % products have no listed_at', n; END IF;

  /* ستونِ تازه برای آگهیِ تازه‌نشده همان تاریخِ ثبت است */
  SELECT count(*) INTO n FROM public.products
   WHERE bumped_at IS NULL AND listed_at <> ("createdAt" AT TIME ZONE 'UTC');
  IF n > 0 THEN RAISE EXCEPTION 'ABORT: listed_at differs from createdAt on % rows', n; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'products'
                    AND column_name = 'moderation_hold') THEN
    RAISE EXCEPTION 'ABORT: moderation_hold missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bh_boost_apply'
                  AND prosrc LIKE '%ref_reused%') THEN
    RAISE EXCEPTION 'ABORT: bh_boost_apply was not replaced';
  END IF;
  RAISE NOTICE '111 self-test passed';
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
