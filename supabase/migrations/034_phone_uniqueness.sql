-- ─────────────────────────────────────────────────────────────
-- یکتاییِ شماره‌ی موبایل
--
-- مسیرِ ورود این‌طور کاربر را پیدا می‌کند:
--     .from('users').select('*').eq('phone', phone).single()
--
-- `.single()` اگر **بیش از یک ردیف** برگردد خطا می‌دهد، و آن خطا در
-- کدِ ورود دقیقاً مثل «کاربر پیدا نشد» رفتار می‌کند ⇒ پیامِ «رمز
-- اشتباه» به کاربری که رمزش درست بوده.
--
-- تا امروز هیچ قیدی جلوی دو حساب با یک شماره را نمی‌گرفت. داده‌ی فعلی
-- تکراری ندارد (بررسی شد)، ولی نبودِ قید یعنی این باگ هر لحظه ممکن
-- است دوباره ساخته شود.
-- ─────────────────────────────────────────────────────────────

-- ایندکسِ یکتا فقط روی شماره‌های ناتهی؛ NULL چندتایی مجاز می‌ماند
-- (کاربرِ بدونِ شماره در سیستم ممکن است وجود داشته باشد).
DO $$
DECLARE v_dups integer;
BEGIN
  SELECT count(*) INTO v_dups FROM (
    SELECT phone FROM public.users
     WHERE phone IS NOT NULL AND btrim(phone) <> ''
     GROUP BY phone HAVING count(*) > 1
  ) d;

  IF v_dups > 0 THEN
    /* عمداً حذف/ادغام نمی‌کنیم — تصمیم درباره‌ی اینکه کدام حساب بماند
       با صاحبِ محصول است، نه با مهاجرت. فقط هشدار می‌دهیم. */
    RAISE WARNING 'یکتاسازیِ شماره انجام نشد: % شماره‌ی تکراری وجود دارد. ابتدا آن‌ها را تعیین تکلیف کنید.', v_dups;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_phone_uniq') THEN
      CREATE UNIQUE INDEX users_phone_uniq
        ON public.users (phone)
        WHERE phone IS NOT NULL AND btrim(phone) <> '';
    END IF;
  END IF;
END $$;

-- جستجوی ورود روی همین ستون است؛ بدونِ ایندکس هر ورود یک Seq Scan بود.
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users (phone);
