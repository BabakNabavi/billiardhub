-- ═══════════════════════════════════════════════════════════════════════════
-- ۰۶۶ — `clubs.slug`: وجودش و یکتایی‌اش را تضمین می‌کند
--
-- جدولِ `clubs` قدیمی‌تر از این پوشه‌ی مهاجرت است و هیچ‌جا ساختِ این ستون
-- ثبت نشده. با این حال کد در چند جا به آن تکیه می‌کند:
--
--   • `GET /api/clubs/[id]` برای شناسه‌ی غیرUUID روی `slug` جست‌وجو می‌کند
--   • کارتِ باشگاه لینکش را `/clubs/${club.slug || club.id}` می‌سازد
--   • `GET /api/clubs/slug-check` در دسترس بودنش را می‌پرسد
--   • `POST /api/clubs` یک fallback دارد «اگر ستون slug هنوز نیست»
--
-- و حالا فیلدِ «آدرس اختصاصی سایت شما» در پنلِ باشگاه‌دار هم می‌نویسدش.
--
-- ── چرا یکتایی مهم است ──
-- بدونِ قید، دو باشگاه می‌توانند یک نشانی بگیرند. آن‌وقت `GET` که
-- `.single()` می‌زند خطا می‌دهد و **هر دو** صفحه ۵۰۰ می‌شوند. بررسیِ
-- سمتِ مرورگر کافی نیست: دو نفر می‌توانند هم‌زمان همان نشانی را ذخیره
-- کنند و هر دو «در دسترس است» ببینند.
--
-- ایندکس روی مقدارهای NULL حساس نیست، پس باشگاهِ بدونِ نشانی آزاد است.
-- رشته‌ی خالی ولی با رشته‌ی خالیِ دیگر برخورد می‌کند — به NULL تبدیل
-- می‌شود تا ساختِ ایندکس نشکند.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS slug text;

-- رشته‌ی خالی نشانی نیست، «ثبت‌نشده» است
UPDATE public.clubs SET slug = NULL WHERE btrim(coalesce(slug, '')) = '';

-- ── تکراری‌های احتمالیِ داده‌ی قدیمی ──
-- قدیمی‌ترین رکورد نشانی را نگه می‌دارد؛ بقیه پسوندِ کوتاهِ شناسه
-- می‌گیرند تا هم یکتا شوند و هم صفحه‌شان همچنان باز شود.
UPDATE public.clubs c
   SET slug = c.slug || '-' || left(c.id::text, 6)
  FROM (
    SELECT id, row_number() OVER (PARTITION BY slug ORDER BY "createdAt") AS rn
      FROM public.clubs WHERE slug IS NOT NULL
  ) d
 WHERE d.id = c.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS clubs_slug_uniq ON public.clubs (slug);

COMMIT;

-- ── بررسی ──
-- انتظار: has_column = 1 · has_index = 1 · duplicates = 0
SELECT
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema='public' AND table_name='clubs' AND column_name='slug')   AS has_column,
  (SELECT count(*) FROM pg_indexes
     WHERE schemaname='public' AND indexname='clubs_slug_uniq')                    AS has_index,
  (SELECT count(*) FROM (
     SELECT slug FROM public.clubs WHERE slug IS NOT NULL GROUP BY slug HAVING count(*) > 1
   ) x)                                                                           AS duplicates;
