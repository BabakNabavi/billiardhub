-- ─────────────────────────────────────────────────────────────
-- ۱۰۱ — بستنِ اجرای توابع برای anon: نتیجهٔ ممیزی
--
-- ⚠️ اجرا دستی و با تأییدِ صریح.
--
-- ── یافته ──
-- بررسیِ `supabase/checks/function-grants.sql` روی سرور نشان داد
-- سیزده تابعِ پروژه صریحاً `anon=X` دارند. PostgREST هر تابعی که
-- anon بتواند اجرا کند را روی `/rest/v1/rpc/<name>` از اینترنت باز
-- می‌کند، و کلیدِ anon طبق طراحی در باندلِ مرورگر است.
--
-- بدترینشان:
--
--   bh_match_report(uuid, integer, integer)      ← نتیجهٔ بازی
--   bh_tournament_draw(uuid, boolean)            ← قرعه‌کشی
--   bh_tournament_reset_bracket(uuid)            ← پاک‌کردنِ جدول
--   bh_match_advance(uuid)
--   bh_bracket_advance_byes(uuid)
--
-- یعنی هرکسی روی اینترنت می‌توانست با یک POST نتیجهٔ هر بازیِ هر
-- مسابقه‌ای را عوض کند یا جدولِ مسابقه را از نو قرعه بکشد — بدونِ
-- ورود، و با دور زدنِ کاملِ لایهٔ احراز هویتِ اپ. `bh_match_report`
-- علاوه بر آن `SECURITY DEFINER` است، یعنی با دسترسیِ مالکِ تابع
-- اجرا می‌شود.
--
-- ── چرا این سوراخ باز ماند ──
-- مهاجرتِ ۰۲۲ دقیقا همین حلقه را داشت و درست بود، ولی **یک‌بار** و
-- در آن لحظه اجرا شد. مهاجرت‌های ۰۳۱ و ۰۷۶ بعد از آن تابع ساختند و
-- هیچ REVOKEای نداشتند؛ و ۰۷۷ که `bh_match_report` را
-- `CREATE OR REPLACE` کرد، فقط دو تابعِ *تازه*اش را REVOKE کرد —
-- چون `CREATE OR REPLACE` فهرستِ دسترسیِ قبلی را **حفظ می‌کند** و
-- تابعِ جایگزین‌شده همان دسترسیِ باز را از ۰۳۱ به ارث برد.
--
-- درسِ ماندگار: هر مهاجرتی که تابعِ `bh_*` می‌سازد باید REVOKEِ
-- خودش را داشته باشد. اجرای دوبارهٔ این فایل هر بار بی‌خطر است.
--
-- ── چرا توابعِ تریگر مستثنا شده‌اند ──
-- ⚠️ توابعی که `trigger` برمی‌گردانند اصلا از راهِ RPC در دسترس
-- نیستند (PostgREST نمایششان نمی‌دهد)، پس بخشی از سطحِ حمله
-- نیستند. در عوض دست‌زدن به دسترسیِ آن‌ها روی یک دیتابیسِ زنده
-- ریسکِ بی‌دلیل است. کنار گذاشته می‌شوند تا تغییر فقط همان چیزی
-- باشد که لازم است.
--
-- ── چرا توابعِ pg_trgm دست‌نخورده می‌مانند ──
-- ⚠️ سی‌ویک تابعِ دیگر هم برای PUBLIC بازند، ولی همه از افزونهٔ
-- `pg_trgm` اند (`similarity`, `word_similarity`, `gtrgm_*`, …).
-- آن‌ها محاسبهٔ خالصِ متن‌اند و به هیچ داده‌ای دسترسی ندارند؛
-- بیشترشان هم ورودیِ `internal` دارند و اصلا از SQL صدا زده
-- نمی‌شوند. REVOKE از PUBLIC روی آن‌ها می‌تواند خودِ کوئری‌های
-- جست‌وجوی سایت را بشکند. راهِ درستش نصبِ افزونه در اسکیمای جدا
-- است، نه REVOKE — و آن کارِ این مهاجرت نیست.
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  f record;
  n integer := 0;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n2 ON n2.oid = p.pronamespace
     WHERE n2.nspname = 'public'
       AND p.proname LIKE 'bh\_%'
       -- توابعِ تریگر کنار می‌مانند؛ دلیلش بالا
       AND p.prorettype <> 'pg_catalog.trigger'::regtype
       -- فقط آن‌هایی که واقعا باز مانده‌اند
       AND (
            has_function_privilege('anon',          p.oid, 'EXECUTE')
         OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
       )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    n := n + 1;
    RAISE NOTICE 'بسته شد: %', f.sig;
  END LOOP;

  RAISE NOTICE 'جمعا % تابع بسته شد.', n;
END $$;

-- ⚠️ بدونِ این، کشِ اسکیمای PostgREST همچنان تابع‌ها را به‌عنوان
-- نقطهٔ پایانیِ در دسترسِ anon نگه می‌دارد.
NOTIFY pgrst, 'reload schema';
