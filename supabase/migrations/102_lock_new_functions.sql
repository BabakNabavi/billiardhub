-- ─────────────────────────────────────────────────────────────
-- ۱۰۲ — قفلِ خودکارِ توابعِ تازه
--
-- ⚠️ اجرا دستی و با تأییدِ صریح.
--
-- ── چرا ──
-- ممیزی نشان داد بیست تابعِ `bh_*` از اینترنت قابلِ صدا زدن بودند،
-- از جمله توابعِ مالی. علتش یک قاعده بود که فقط *یک‌بار* اعمال شده
-- بود: مهاجرتِ ۰۲۲ همه را بست، و هر تابعی که بعدش ساخته شد به
-- یادِ نویسنده‌اش وابسته ماند.
--
-- بدتر از آن، مهاجرتِ ۰۴۱ **نوشته بود**:
--
--     REVOKE ALL ON FUNCTION … FROM anon, authenticated;
--
-- بدونِ `PUBLIC`. پستگرس EXECUTE را به‌طور پیش‌فرض به PUBLIC
-- می‌دهد و anon از PUBLIC ارث می‌برد، پس آن خط **هیچ اثری نداشت**.
-- شش هفته حفاظتِ ظاهری بود و هیچ‌کس نفهمید — چون چیزی نبود که
-- بفهماند.
--
-- یادآوری و چک‌لیست این را حل نمی‌کند. چیزی که حل می‌کند، قاعده‌ای
-- است که خودش اجرا شود.
--
-- ── این تریگر چه می‌کند ──
-- بعد از هر `CREATE FUNCTION`، اگر تابع در اسکیمای `public` باشد و
-- نامش با `bh_` شروع شود، دسترسیِ اجرا از PUBLIC و anon و
-- authenticated گرفته می‌شود. `service_role` دست‌نخورده می‌ماند،
-- پس هیچ مسیرِ اپی نمی‌شکند.
--
-- از این پس نویسنده‌ی مهاجرت می‌تواند REVOKE را فراموش کند و
-- چیزی باز نماند.
--
-- ⚠️ توابعِ تریگر کنار گذاشته می‌شوند: از راهِ RPC در دسترس نیستند
-- و دست‌زدن به دسترسی‌شان ریسکِ بی‌دلیل است.
--
-- ⚠️ تریگر عمدا هیچ خطایی بالا نمی‌دهد. یک تریگرِ رویدادی که throw
-- کند، **هر** CREATE FUNCTIONی را در کلِ دیتابیس می‌شکند — یعنی
-- ابزارِ ایمنی خودش می‌شود قفلِ مهاجرت‌ها. در بدترین حالت سکوت
-- می‌کند و همان وضعِ امروز برقرار می‌ماند.
--
-- برای برداشتن:  DROP EVENT TRIGGER bh_lock_new_functions_trg;
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_lock_new_functions()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cmd  record;
  fn   record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    CONTINUE WHEN cmd.schema_name IS DISTINCT FROM 'public';

    SELECT p.proname, p.prorettype, p.oid
      INTO fn
      FROM pg_proc p
     WHERE p.oid = cmd.objid;

    CONTINUE WHEN NOT FOUND;
    CONTINUE WHEN fn.proname NOT LIKE 'bh\_%';
    -- توابعِ تریگر از راهِ RPC در دسترس نیستند
    CONTINUE WHEN fn.prorettype = 'pg_catalog.trigger'::regtype;

    BEGIN
      EXECUTE format(
        'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        fn.oid::regprocedure
      );
      RAISE NOTICE '[bh] دسترسیِ عمومیِ % بسته شد', fn.oid::regprocedure;
    EXCEPTION WHEN OTHERS THEN
      -- ⚠️ هرگز DDL را نمی‌شکنیم؛ دلیلش بالای فایل
      RAISE NOTICE '[bh] بستنِ % ممکن نشد: %', fn.proname, SQLERRM;
    END;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS bh_lock_new_functions_trg;

CREATE EVENT TRIGGER bh_lock_new_functions_trg
  ON ddl_command_end
  WHEN TAG IN ('CREATE FUNCTION')
  EXECUTE FUNCTION public.bh_lock_new_functions();

REVOKE ALL ON FUNCTION public.bh_lock_new_functions() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
