-- ─────────────────────────────────────────────────────────────
-- بررسیِ امنیتی: چه تابعی را نقشِ anon می‌تواند صدا بزند؟
--
-- ── چرا این جدا از anon-grants.sql است ──
-- ⚠️ آن بررسی فقط `role_table_grants` را می‌دید، یعنی فقط جدول‌ها.
-- این یک نقصِ واقعی در ممیزیِ اول بود: در پستگرس هر تابعِ تازه
-- به‌طور **پیش‌فرض** برای PUBLIC قابلِ اجراست، و PostgREST هر تابعِ
-- قابلِ اجرا برای anon را روی `/rest/v1/rpc/<name>` باز می‌کند.
--
-- یعنی یک تابعِ فراموش‌شده می‌تواند از اینترنت صدا زده شود حتی وقتی
-- همه‌ی جدول‌ها قفل‌اند. مهاجرتِ ۰۲۲ یک‌بار همه را REVOKE کرد، ولی
-- هر تابعی که بعد از آن ساخته شده به REVOKEِ خودش وابسته است.
--
-- ── خروجیِ مورد انتظار ──
-- بخشِ اول باید **خالی** باشد. هر ردیفی در آن، یک نقطه‌ی ورودِ باز
-- از اینترنت است.
-- ─────────────────────────────────────────────────────────────

\echo '── توابعی که anon یا authenticated می‌تواند اجرا کند (باید خالی باشد) ──'
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       CASE WHEN p.proacl IS NULL
            THEN 'پیش‌فرض: PUBLIC=EXECUTE (هرگز REVOKE نشده)'
            ELSE array_to_string(p.proacl, ' | ')
       END AS acl
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.prokind = 'f'
   AND (
        has_function_privilege('anon',          p.oid, 'EXECUTE')
     OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
   )
 ORDER BY 1;

\echo ''
\echo '── وضعیتِ توابعِ OTP (مهاجرت ۰۹۹) ──'
\echo '   هر پنج‌تا باید باشند، و هیچ‌کدام نباید برای anon باز باشند.'
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_can_run,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_can_run
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('bh_otp_issue', 'bh_otp_verify', 'bh_otp_mark_identity',
                     'bh_otp_state', 'bh_prune_otp', 'bh_log_error', 'bh_prune_errors')
 ORDER BY 1;

\echo ''
\echo '── شمارشِ کلیِ توابع ──'
SELECT count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')) AS open_to_anon,
       count(*) AS total_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.prokind = 'f';

\echo ''
\echo '── جدول‌های بدونِ RLS (حالا باید خالی باشد) ──'
SELECT c.relname AS table_without_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
 ORDER BY 1;
