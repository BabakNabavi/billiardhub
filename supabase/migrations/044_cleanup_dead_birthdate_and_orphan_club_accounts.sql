-- ═══════════════════════════════════════════════════════════════
-- ۰۴۴ — دو پاک‌سازی: ستونِ مرده‌ی تاریخِ تولد + حساب‌های یتیمِ باشگاه
--
-- ⚠ ترتیب مهم است: این فایل باید *بعد از* رسیدنِ deployِ کد اجرا شود.
--    تا پیش از آن، مسیرِ /api/admin/users هنوز ستونِ "birthDate" را
--    صریح select می‌کند و با نبودنش صفحه‌ی مشخصاتِ کاربر خطا می‌دهد.
-- ═══════════════════════════════════════════════════════════════


-- ── ۱) ستونِ "birthDate" ────────────────────────────────────────
--
-- جدولِ users دو ستونِ تاریخِ تولد داشت:
--   birth_date  ← ثبت‌نام این را می‌نویسد؛ متن، تاریخِ شمسی «1363/06/02»
--   "birthDate" ← بازمانده‌ی نسلِ قبل؛ هیچ مسیری در آن نمی‌نویسد
--
-- در زمانِ نوشتنِ این فایل، صفر از ۲۱ کاربر مقداری در ستونِ دوم
-- داشتند. دو ستونِ همنام با معنیِ یکسان منبعِ باگ‌های خاموش است:
-- یک مسیر از این می‌خواند و مسیرِ دیگر در آن یکی می‌نویسد.

-- محافظ: اگر بر خلافِ انتظار داده‌ای در ستون باشد، مهاجرت متوقف
-- می‌شود. حذفِ ستونی که داده دارد بی‌بازگشت است.
DO $$
DECLARE n integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'birthDate'
  ) THEN
    EXECUTE 'SELECT count(*) FROM users WHERE "birthDate" IS NOT NULL AND "birthDate" <> ''''' INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'ستونِ "birthDate" شاملِ % ردیفِ دارای مقدار است — پیش از حذف باید به birth_date منتقل شود', n;
    END IF;
    ALTER TABLE users DROP COLUMN "birthDate";
    RAISE NOTICE 'ستونِ "birthDate" حذف شد';
  ELSE
    RAISE NOTICE 'ستونِ "birthDate" از قبل نبود — کاری لازم نبود';
  END IF;
END $$;


-- ── ۲) حساب‌های یتیمِ باشگاه ────────────────────────────────────
--
-- همه‌ی باشگاه‌ها پیش‌تر حذف شده‌اند (جدولِ clubs خالی است)، ولی
-- club_accounts کلیدِ خارجی به clubs ندارد، پس ردیف‌هایش با حذفِ
-- باشگاه پاک نشدند و به شناسه‌هایی اشاره می‌کنند که دیگر وجود ندارند.
--
-- این ردیف‌ها همه با موجودیِ صفر هستند و هیچ سند مالی‌ای به آن‌ها
-- وصل نیست (ledger_entries / payments / settlements / refunds همگی
-- خالی‌اند). شرطِ زیر همین را دوباره پیش از حذف بررسی می‌کند تا اگر
-- روزی وضعیت فرق کرده باشد، چیزی حذف نشود.

DELETE FROM club_accounts a
WHERE NOT EXISTS (SELECT 1 FROM clubs c WHERE c.id = a.club_id)
  AND coalesce(a.available_balance, 0) = 0
  AND coalesce(a.pending_balance,   0) = 0
  AND coalesce(a.total_earnings,    0) = 0
  AND coalesce(a.total_commission,  0) = 0
  AND coalesce(a.total_settled,     0) = 0;


-- ── گزارشِ نهایی ────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM clubs)                                   AS clubs,
  (SELECT count(*) FROM club_accounts)                           AS club_accounts,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name = 'birthDate')                             AS birthdate_column_left;
-- انتظار: clubs = 0 · club_accounts = 0 · birthdate_column_left = 0
