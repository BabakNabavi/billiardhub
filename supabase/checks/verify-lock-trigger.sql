-- ─────────────────────────────────────────────────────────────
-- خودآزمونِ تریگرِ قفل (مهاجرت ۱۰۲) + وضعیتِ نهاییِ امنیتی
--
-- ── چرا خودآزمون ──
-- ⚠️ یک ساز و کارِ ایمنی که آزموده نشده از نبودنش بدتر است، چون
-- آدم بهش تکیه می‌کند. تریگر یک تابعِ آزمایشی می‌سازد و بلافاصله
-- می‌سنجد که دسترسیِ عمومی‌اش بسته شده یا نه.
--
-- ⚠️ همه‌چیز داخلِ یک تراکنش است که در انتها ROLLBACK می‌شود، پس
-- هیچ اثری روی دیتابیس نمی‌ماند — نه تابعِ آزمایشی، نه چیزِ دیگر.
--
-- این فایل هیچ تغییرِ ماندگاری نمی‌دهد.
-- ─────────────────────────────────────────────────────────────

BEGIN;

\echo '── ۱) خودآزمون: یک تابعِ تازه می‌سازیم و دسترسی‌اش را می‌سنجیم ──'
CREATE FUNCTION public.bh_zz_selftest() RETURNS integer
LANGUAGE sql IMMUTABLE AS $$ SELECT 1 $$;

SELECT
  has_function_privilege('anon',          'public.bh_zz_selftest()', 'EXECUTE') AS anon_can_run,
  has_function_privilege('authenticated', 'public.bh_zz_selftest()', 'EXECUTE') AS auth_can_run,
  has_function_privilege('service_role',  'public.bh_zz_selftest()', 'EXECUTE') AS service_can_run;

\echo '   انتظار: anon = f · authenticated = f · service_role = t'
\echo '   اگر anon برابر t بود، تریگر کار نکرده.'

ROLLBACK;

\echo ''
\echo '── ۲) تریگر نصب است؟ ──'
SELECT evtname, evtenabled, evtevent
  FROM pg_event_trigger
 WHERE evtname = 'bh_lock_new_functions_trg';

\echo ''
\echo '── ۳) وضعیتِ نهایی: توابعِ پروژه که هنوز برای anon بازند ──'
\echo '   باید خالی باشد. (توابعِ pg_trgm عمدا کنار گذاشته شده‌اند.)'
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname LIKE 'bh\_%'
   AND p.prorettype <> 'pg_catalog.trigger'::regtype
   AND has_function_privilege('anon', p.oid, 'EXECUTE')
 ORDER BY 1;

\echo ''
\echo '── ۴) خلاصهٔ امنیتی ──'
SELECT
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity)      AS tables_without_rls,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'bh\_%'
      AND p.prorettype <> 'pg_catalog.trigger'::regtype
      AND has_function_privilege('anon', p.oid, 'EXECUTE'))                       AS bh_functions_open,
  (SELECT count(*) FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated'))       AS direct_table_grants;

\echo '   انتظار: 0 · 0 · 2  (دو تا همان products برای anon و authenticated)'
