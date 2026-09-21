-- ─────────────────────────────────────────────────────────────
-- بررسیِ `profiles_jsonb_backup_20260818` — فقط خواندنی.
--
-- ── این جدول چیست ──
-- در هیچ فایلِ مهاجرتی نیست و هیچ‌جای کد به آن ارجاع نمی‌دهد. یک
-- اسنپ‌شاتِ دستی از ستونِ jsonbِ پروفایل‌هاست که روزِ ۲۷ مرداد ۱۴۰۵
-- پیش از یک تغییرِ اسکیما گرفته شده.
--
-- ── خطرناک است؟ ──
-- نه. بررسیِ دسترسی‌ها نشان داد نقشِ anon هیچ دسترسی‌ای به آن ندارد،
-- پس از اینترنت خوانده نمی‌شود. ولی داده‌ی پروفایلِ کاربران در آن
-- است و بی‌صاحب در اسکیمای public نشسته — و تنها جدولی است که RLS
-- ندارد.
--
-- ⚠️ این فایل فقط **می‌پرسد**، چیزی را حذف نمی‌کند. تصمیمِ حذف با
-- مالک است و در CLAUDE.md هم همین نوشته شده.
-- ─────────────────────────────────────────────────────────────

\echo '── چند ردیف، و چقدر جا گرفته ──'
SELECT
  (SELECT count(*) FROM public.profiles_jsonb_backup_20260818) AS backup_rows,
  (SELECT count(*) FROM public.profiles)                       AS live_rows,
  pg_size_pretty(pg_total_relation_size('public.profiles_jsonb_backup_20260818')) AS backup_size;

\echo ''
\echo '── ستون‌هایش ──'
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'profiles_jsonb_backup_20260818'
 ORDER BY ordinal_position;

\echo ''
\echo '── آیا ردیفی در بکاپ هست که در جدولِ زنده نباشد؟ ──'
\echo '   (اگر صفر بود، بکاپ چیزی ندارد که از دست برود)'
SELECT count(*) AS rows_only_in_backup
  FROM public.profiles_jsonb_backup_20260818 b
 WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = b.id);
