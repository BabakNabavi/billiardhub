-- ═══════════════════════════════════════════════════════════════
-- ۰۵۰ — کلیدِ ذخیره‌سازی در کنارِ نشانی
--
-- ── مسئله ──
-- `src` و `thumb` نشانیِ *مطلق* را نگه می‌دارند:
--   https://<project>.supabase.co/storage/v1/object/public/club-media/social/media/vid/x.mp4
--
-- یعنی نامِ ارائه‌دهنده، نامِ باکت و شکلِ نشانی در هر ردیف پخته شده.
-- روزی که بخواهیم فایل‌ها را جای دیگری ببریم (مثلاً وقتی هزینه‌ی
-- پهنای‌باند از خودِ نگهداری بیشتر شد)، باید روی رشته‌ی نشانیِ هر ردیف
-- جراحی کنیم — کاری که با هر تفاوتِ کوچک در شکلِ نشانی می‌شکند.
--
-- ── راه‌حلِ کوچک ــ نه یک لایه‌ی انتزاعیِ کامل ──
-- فقط سه ستون: ارائه‌دهنده، کلیدِ فایل، کلیدِ بندانگشتی. نشانی از
-- روی این‌ها ساخته می‌شود. مهاجرت آن روز یعنی عوض‌کردنِ یک تابع و یک
-- مقدارِ ستون — نه بازنویسیِ صفحه‌ها.
--
-- ستون‌های `src`/`thumb` می‌مانند و همچنان پر می‌شوند: ردیف‌های قدیمی
-- کلید ندارند و چیزی نباید بشکند.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS storage_provider text NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS storage_key      text,
  ADD COLUMN IF NOT EXISTS thumb_key        text;

COMMENT ON COLUMN public.videos.storage_provider IS
  'کجا نگهداری می‌شود. امروز فقط supabase؛ نشانی از روی همین ساخته می‌شود.';
COMMENT ON COLUMN public.videos.storage_key IS
  'مسیرِ فایل داخلِ باکت، بدونِ دامنه — مثلاً social/media/vid/<id>.mp4';
COMMENT ON COLUMN public.videos.thumb_key IS
  'مسیرِ بندانگشتی داخلِ باکت، بدونِ دامنه.';

-- ── پرکردنِ ردیف‌های موجود از روی نشانی ──
-- الگو عمداً سخت‌گیرانه است: فقط نشانی‌هایی که واقعاً شکلِ Storage
-- عمومیِ همین پروژه را دارند. هر چیز دیگری دست‌نخورده می‌ماند تا
-- حدسِ اشتباه، مسیرِ بی‌معنی نسازد.
UPDATE public.videos
SET storage_key = substring(src from '/storage/v1/object/public/[^/]+/(.+)$')
WHERE storage_key IS NULL
  AND src ~ '/storage/v1/object/public/[^/]+/';

UPDATE public.videos
SET thumb_key = substring(thumb from '/storage/v1/object/public/[^/]+/(.+)$')
WHERE thumb_key IS NULL
  AND thumb ~ '/storage/v1/object/public/[^/]+/';

-- برای پیداکردنِ ردیف‌های یک ارائه‌دهنده هنگامِ مهاجرت
CREATE INDEX IF NOT EXISTS videos_provider_idx
  ON public.videos (storage_provider);


-- ── گزارش ──
SELECT
  count(*)                                             AS total,
  count(*) FILTER (WHERE storage_key IS NOT NULL)      AS with_key,
  count(DISTINCT storage_provider)                     AS providers;
-- انتظار روی دیتابیسِ خالی: همه صفر
