-- ─────────────────────────────────────────────────────────────
-- بررسیِ امنیتی: نقشِ anon به چه چیزی دسترسیِ مستقیم دارد؟
--
-- ── چرا مهم است ──
-- درگاهِ Supabase از بیرون باز است (/rest/v1/ روی دامنه پاسخ
-- می‌دهد) و کلیدِ anon طبق طراحی داخلِ باندلِ مرورگر است. پس هر
-- دسترسی‌ای که این نقش داشته باشد، عملا دسترسیِ عمومیِ اینترنت است.
--
-- ── خروجیِ مورد انتظار ──
-- فقط یک ردیف: products / anon / SELECT (و همان برای authenticated).
-- هر ردیفِ دیگری یک درِ باز است و باید بسته شود.
--
-- ── چرا فایل و نه دستورِ درون‌خطی ──
-- ⚠️ این کوئری نقل‌قول و پرانتز دارد و در پاورشل و حتی در bash
-- داخلِ رشته‌ی ssh تکه‌تکه می‌شود. همان الگوی مهاجرت‌ها امن است:
--   cat supabase/checks/anon-grants.sql | ssh … "docker exec -i …"
-- ─────────────────────────────────────────────────────────────

\echo '── دسترسی‌های مستقیمِ anon/authenticated ──'
SELECT table_name, grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND grantee IN ('anon', 'authenticated')
 ORDER BY table_name, grantee, privilege_type;

\echo ''
\echo '── جدول‌های بدونِ RLS (باید خالی باشد) ──'
SELECT c.relname AS table_without_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relkind = 'r'
   AND NOT c.relrowsecurity
 ORDER BY 1;

\echo ''
\echo '── شمارشِ کلی ──'
SELECT
  count(*) FILTER (WHERE c.relrowsecurity)     AS with_rls,
  count(*) FILTER (WHERE NOT c.relrowsecurity) AS without_rls,
  count(*)                                     AS total
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r';

\echo ''
\echo '── ژورنالِ خطا زنده است؟ ──'
SELECT count(*) AS rows_in_app_errors FROM public.app_errors;
