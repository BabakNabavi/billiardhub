-- ─────────────────────────────────────────────────────────────
-- ۱۰۳ — حذفِ جدولِ بکاپِ بی‌صاحب
--
-- ⚠️ اجرا دستی و با تأییدِ صریح. این تنها مهاجرتِ این مجموعه است
-- که **داده حذف می‌کند**.
--
-- ── چه چیزی و چرا ──
-- `profiles_jsonb_backup_20260818` یک اسنپ‌شاتِ دستی از ستونِ jsonbِ
-- پروفایل‌هاست که ۲۷ مرداد پیش از یک تغییرِ اسکیما گرفته شده. در
-- هیچ فایلِ مهاجرتی نیست و هیچ کدی به آن ارجاع نمی‌دهد. مهاجرتِ
-- ۱۰۰ رویش RLS گذاشت، پس امروز بسته است — ولی داده‌ی پروفایلِ
-- کاربران را بی‌صاحب نگه داشته و در هر بکاپِ شبانه هم تکرار می‌شود.
--
-- ── چرا این مهاجرت خودش را می‌پاید ──
-- ⚠️ حذفِ داده برگشت‌ناپذیر است و من نمی‌توانم از این‌جا محتوای
-- جدول را ببینم. پس به‌جای یک DROPِ کور، خودِ مهاجرت شرط را
-- می‌سنجد و اگر برقرار نبود **هیچ‌چیز حذف نمی‌کند**:
--
--   ۱) اگر ستونِ `id` نداشته باشد ⟵ توقف (شکلش آن چیزی نیست که
--      فرض کرده‌ایم، پس قضاوت درباره‌اش هم معتبر نیست)
--   ۲) اگر حتی یک ردیف داشته باشد که در `profiles`ِ زنده نیست
--      ⟵ توقف (یعنی بکاپ چیزی دارد که جای دیگری نیست)
--
-- فقط وقتی بکاپ زیرمجموعه‌ی کاملِ جدولِ زنده باشد، حذف می‌شود.
--
-- ⚠️ با `--single-transaction` اجرا کنید تا توقف واقعا یعنی
-- «هیچ‌چیز عوض نشد».
--
-- ── و اگر بعدا پشیمان شدید ──
-- محتوایش در بکاپ‌های شبانه هست (`apps/web/scripts/backup.mjs`
-- هر جدول را JSON می‌گیرد و فهرستِ جدول‌ها را از خودِ PostgREST
-- می‌خواند، پس این هم در آن‌هاست).
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  has_id  boolean;
  orphans bigint;
  total   bigint;
BEGIN
  IF to_regclass('public.profiles_jsonb_backup_20260818') IS NULL THEN
    RAISE NOTICE 'جدول وجود ندارد — احتمالا قبلا حذف شده. کاری نشد.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'profiles_jsonb_backup_20260818'
       AND column_name  = 'id'
  ) INTO has_id;

  IF NOT has_id THEN
    RAISE EXCEPTION 'ستونِ id ندارد؛ شکلِ جدول آن چیزی نیست که فرض شده. چیزی حذف نشد.';
  END IF;

  EXECUTE 'SELECT count(*) FROM public.profiles_jsonb_backup_20260818' INTO total;

  EXECUTE $q$
    SELECT count(*) FROM public.profiles_jsonb_backup_20260818 b
     WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = b.id)
  $q$ INTO orphans;

  RAISE NOTICE 'ردیف‌های بکاپ: % — ردیف‌هایی که در جدولِ زنده نیستند: %', total, orphans;

  IF orphans > 0 THEN
    RAISE EXCEPTION
      'بکاپ % ردیف دارد که در profiles نیست. حذف انجام نشد — اول آن‌ها را بررسی کنید.',
      orphans;
  END IF;

  EXECUTE 'DROP TABLE public.profiles_jsonb_backup_20260818';
  RAISE NOTICE 'جدولِ بکاپ حذف شد (% ردیف، همه در جدولِ زنده موجود بودند).', total;
END $$;

NOTIFY pgrst, 'reload schema';
