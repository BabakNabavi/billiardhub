-- ─────────────────────────────────────────────────────────────────
-- ۰۲۴ — عملیاتِ باشگاه: بستنِ رزروِ امروز، شماره‌ی اطلاع‌رسانی،
--        و انتقالِ «هزینه‌ی بازیکنِ اضافه» از باشگاه به تکِ میز.
--
-- سه تصمیم که شکلِ این مایگریشن را تعیین کرده‌اند:
--
--   ۱) «بستنِ رزروِ امروز» یک پرچمِ ماندگار است، نه یک تاریخِ انقضا.
--      قبلاً همین کار با localStorage و یک timestamp انجام می‌شد که
--      یعنی روی مرورگرِ دیگر اثری نداشت و اصلاً به سرور نمی‌رسید؛
--      پس مشتری همچنان می‌توانست رزرو کند. حالا در دیتابیس است و
--      خودِ API جلوی رزرو را می‌گیرد.
--
--   ۲) «امروز» یعنی امروزِ تهران، نه UTC. اگر UTC حساب کنیم، از
--      ۲۰:۳۰ به بعد «فردا»ی سرور شروع می‌شود و قفلِ امروز زودتر
--      از نیمه‌شبِ محلی برداشته می‌شود.
--
--   ۳) هزینه‌ی بازیکنِ اضافه در سطحِ میز معنا دارد، نه باشگاه: میزِ
--      اسنوکرِ VIP با میزِ ایرهاکی یک قاعده ندارند. ستون‌های میز
--      NULL-پذیرند و NULL یعنی «از باشگاه ارث ببر»، تا داده‌ی موجود
--      رفتارش عوض نشود.
-- ─────────────────────────────────────────────────────────────────

-- ── ۱) پرچم‌های عملیاتیِ باشگاه ──
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "closeTodayReservations" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "notifyPhone" text,
  ADD COLUMN IF NOT EXISTS "bankCardVerified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bankCardCheckedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "bankConfirmedByOwner" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.clubs."closeTodayReservations" IS
  'با فعال بودن، رزروِ میز برای روزِ جاری (به وقتِ تهران) بسته است ولی روزهای آینده باز می‌مانند.';
COMMENT ON COLUMN public.clubs."notifyPhone" IS
  'شماره‌ای که پیامکِ رزرو به آن می‌رود؛ اگر خالی باشد شماره‌ی خودِ باشگاه/مالک.';

-- ── ۲) هزینه‌ی بازیکنِ اضافه در سطحِ میز (NULL ⇒ ارث از باشگاه) ──
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS "playerSurchargeEnabled" boolean,
  ADD COLUMN IF NOT EXISTS "playerSurchargePercent" integer,
  ADD COLUMN IF NOT EXISTS "playerSurchargeFrom"    integer;

ALTER TABLE public.tables
  DROP CONSTRAINT IF EXISTS tables_surcharge_pct_chk,
  DROP CONSTRAINT IF EXISTS tables_surcharge_from_chk;

ALTER TABLE public.tables
  ADD CONSTRAINT tables_surcharge_pct_chk
    CHECK ("playerSurchargePercent" IS NULL OR ("playerSurchargePercent" >= 0 AND "playerSurchargePercent" <= 100)),
  ADD CONSTRAINT tables_surcharge_from_chk
    CHECK ("playerSurchargeFrom" IS NULL OR ("playerSurchargeFrom" >= 1 AND "playerSurchargeFrom" <= 12));

/* آیا رزروِ این باشگاه برای این تاریخ باز است؟
   تاریخ به شکلِ 'YYYY-MM-DD' و همیشه با «امروزِ تهران» مقایسه می‌شود. */
CREATE OR REPLACE FUNCTION public.bh_club_accepts_date(p_club_id uuid, p_date date)
RETURNS boolean AS $$
DECLARE v_closed boolean;
BEGIN
  SELECT "closeTodayReservations" INTO v_closed FROM public.clubs WHERE id = p_club_id;
  IF v_closed IS NOT TRUE THEN RETURN true; END IF;
  /* فقط روزِ جاری بسته است؛ گذشته را خودِ منطقِ رزرو رد می‌کند */
  RETURN p_date <> (now() AT TIME ZONE 'Asia/Tehran')::date;
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE ALL ON FUNCTION public.bh_club_accepts_date(uuid, date) FROM PUBLIC, anon, authenticated;
