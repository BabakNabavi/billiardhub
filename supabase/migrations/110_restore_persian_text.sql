-- ─────────────────────────────────────────────────────────────
-- ۱۱۰ — بازگرداندنِ متنِ فارسیِ پنج تابع
--
-- خودآزماییِ ۱۰۹ نشان داد بدنه‌ی ذخیره‌شده‌ی این توابع «????» دارد در
-- حالی که فایلِ منبعشان ندارد: مهاجرت‌های ۰۹۸، ۰۹۹، ۱۰۲ و ۱۰۵ با
-- `Get-Content | ssh` اجرا شده بودند و PowerShell 5.1 در لوله هر حرفِ
-- فارسی را «?» می‌کند.
--
-- اثرِ کارکردی نداشت: در ۰۹۸/۰۹۹ فارسی فقط در کامنت بود، در ۱۰۲ متنِ
-- NOTICE و در ۱۰۵ متنِ خطای ورودیِ نامعتبر. این فایل فقط متن را
-- برمی‌گرداند — هر تابع **عینا** از تنها فایلِ تعریف‌کننده‌اش (مولّد
-- بررسی کرده که هیچ مهاجرتِ دیگری بازتعریفشان نکرده). دسترسی‌ها با
-- CREATE OR REPLACE دست نمی‌خورند.
--
-- ── اجرا (تک‌خطی، با scp — نه لوله) ──
--   scp -i "$env:USERPROFILE\.ssh\billiardhub_parspack" supabase/migrations/110_restore_persian_text.sql root@130.185.72.87:/tmp/110.sql
--   ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/110.sql"
--
-- اجرای دوباره بی‌خطر است.
-- ─────────────────────────────────────────────────────────────

SET lock_timeout = '3s';

BEGIN;

-- ── bh_log_error — عینا از 098_error_log.sql ──
CREATE OR REPLACE FUNCTION public.bh_log_error(
  p_fingerprint text,
  p_source      text,
  p_message     text,
  p_stack       text DEFAULT NULL,
  p_url         text DEFAULT NULL,
  p_user_agent  text DEFAULT NULL,
  p_user_id     uuid DEFAULT NULL,
  p_release     text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  -- سقفِ اثرانگشت‌های متمایز. عددِ واقعیِ باگ‌های یک سایت خیلی
  -- کمتر از این است؛ رسیدن به آن یعنی یا سیل است یا اثرانگشت خراب.
  max_rows constant integer := 5000;
  is_new   boolean;
BEGIN
  IF p_source NOT IN ('client', 'server') THEN
    RETURN;
  END IF;

  SELECT NOT EXISTS (SELECT 1 FROM public.app_errors WHERE fingerprint = p_fingerprint)
    INTO is_new;

  -- جدول پر است و این یک خطای تازه است ⇒ رد. خطاهای موجود همچنان
  -- شمرده می‌شوند، پس پایشِ چیزی که از قبل می‌شناسیم نمی‌میرد.
  IF is_new AND (SELECT count(*) FROM public.app_errors) >= max_rows THEN
    RETURN;
  END IF;

  INSERT INTO public.app_errors AS e
    (fingerprint, source, message, stack, url, user_agent, user_id, release)
  VALUES
    (p_fingerprint, left(p_source, 10), left(p_message, 2000), left(p_stack, 8000),
     left(p_url, 500), left(p_user_agent, 300), p_user_id, left(p_release, 80))
  ON CONFLICT (fingerprint) DO UPDATE
     SET hits      = e.hits + 1,
         last_seen = now(),
         -- ⚠️ «رسیدگی‌شده» بی‌قیدوشرط باز نمی‌شود: چون ثبت بدونِ
         -- ورود است، هرکس می‌توانست با تکرارِ همان پیام، دکمه‌ی
         -- «رسیدگی شد» را برای همیشه بی‌اثر کند. فقط اگر خطا بعد از
         -- یک روز از رسیدگی دوباره برگردد، واقعا برنگشته است.
         resolved  = CASE
                       WHEN e.resolved AND e.resolved_at > now() - interval '1 day'
                         THEN true
                       ELSE false
                     END;
END;
$$;

-- ── bh_otp_issue — عینا از 099_otp_atomic.sql ──
CREATE OR REPLACE FUNCTION public.bh_otp_issue(
  p_mobile    text,
  p_hash      text,
  p_resend_ms integer
) RETURNS TABLE (allowed boolean, wait_sec integer)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  prev public.otp_codes%ROWTYPE;
  gap  interval := make_interval(secs => p_resend_ms / 1000.0);
BEGIN
  -- ⚠️ قفلِ مشورتی، نه FOR UPDATE. `FOR UPDATE` روی ردیفی که هنوز
  -- وجود ندارد هیچ‌چیز قفل نمی‌کند: برای شماره‌ای که اولین بار کد
  -- می‌گیرد (یا بعد از bh_prune_otp) هر دو درخواستِ هم‌زمان از گاردِ
  -- فاصله رد می‌شدند، هر دو upsert می‌کردند و **دو پیامک** می‌رفت —
  -- دقیقا همان هزینه‌ای که این تابع برای جلوگیری‌اش نوشته شده. قفلِ
  -- مشورتی به وجودِ ردیف وابسته نیست و با پایانِ تراکنش آزاد می‌شود.
  PERFORM pg_advisory_xact_lock(hashtext(p_mobile));

  SELECT * INTO prev FROM public.otp_codes WHERE mobile = p_mobile;

  IF FOUND AND now() - prev.sent_at < gap THEN
    RETURN QUERY SELECT false,
      GREATEST(1, ceil(EXTRACT(epoch FROM (gap - (now() - prev.sent_at))))::integer);
    RETURN;
  END IF;

  INSERT INTO public.otp_codes AS o (mobile, code_hash, sent_at, tries)
  VALUES (p_mobile, p_hash, now(), 0)
  ON CONFLICT (mobile) DO UPDATE
     SET code_hash   = EXCLUDED.code_hash,
         sent_at     = now(),
         tries       = 0,
         -- کدِ تازه یعنی تأییدِ قبلی دیگر معتبر نیست
         verified_at = NULL,
         id_hash     = NULL,
         id_at       = NULL;

  RETURN QUERY SELECT true, 0;
END;
$$;

-- ── bh_otp_verify — عینا از 099_otp_atomic.sql ──
CREATE OR REPLACE FUNCTION public.bh_otp_verify(
  p_mobile    text,
  p_hash      text,
  p_ttl_ms    integer,
  p_max_tries integer
) RETURNS text
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  rec public.otp_codes%ROWTYPE;
BEGIN
  -- ⚠️ این دو خط همان چیزی‌اند که کلِ مهاجرت برایشان نوشته شده:
  -- درخواستِ دوم تا پایانِ این تراکنش پشتِ در می‌ماند، پس دو حدسِ
  -- هم‌زمان دو بار شمرده می‌شوند نه یک بار. قفلِ مشورتی هم هست تا
  -- رفتار با bh_otp_issue یکسان باشد و به وجودِ ردیف بند نباشد.
  PERFORM pg_advisory_xact_lock(hashtext(p_mobile));
  SELECT * INTO rec FROM public.otp_codes WHERE mobile = p_mobile FOR UPDATE;

  IF NOT FOUND THEN RETURN 'none'; END IF;
  IF now() - rec.sent_at > make_interval(secs => p_ttl_ms / 1000.0) THEN RETURN 'expired'; END IF;
  IF rec.tries >= p_max_tries THEN RETURN 'too_many'; END IF;

  IF rec.code_hash <> p_hash THEN
    UPDATE public.otp_codes SET tries = tries + 1 WHERE mobile = p_mobile;
    RETURN 'wrong';
  END IF;

  -- مصرف‌شده: با یک‌بار بالا بردنِ tries از سقف، همان کد دوباره
  -- پذیرفته نمی‌شود.
  UPDATE public.otp_codes
     SET tries = p_max_tries + 1, verified_at = now()
   WHERE mobile = p_mobile;
  RETURN 'ok';
END;
$$;

-- ── bh_lock_new_functions — عینا از 102_lock_new_functions.sql ──
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

-- ── bh_prune_audit — عینا از 105_prune_audit.sql ──
CREATE OR REPLACE FUNCTION public.bh_prune_audit(p_days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE n integer;
BEGIN
  -- ⚠️ کفِ ایمنی. بدونِ این، `bh_prune_audit(0)` — یک اشتباهِ تایپیِ
  -- ساده — کلِ تاریخچه‌ی تلاش‌های ورود را در یک لحظه می‌برد.
  IF p_days IS NULL OR p_days < 30 THEN
    RAISE EXCEPTION 'bh_prune_audit: p_days باید دستِ‌کم ۳۰ باشد (داده شد: %)', p_days;
  END IF;

  -- فهرستِ سفید. هر کنشِ دیگری — مالی، ادمین، رزرو — دست‌نخورده
  -- می‌ماند، در هر سنی.
  -- ⚠️ فقط کنشی این‌جا بیاید که *مهاجم* بتواند بسازد. رویدادی که
  -- نتیجه‌ی کارِ انسانِ واقعی است رشدش کرانه‌دار است و پاک‌کردنش فقط
  -- ضرر دارد.
  DELETE FROM public.audit_logs
   WHERE action IN ('LOGIN_FAILED', 'PAYMENT_AUTHORITY_MISMATCH')
     AND created_at < now() - make_interval(days => p_days);

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- خودآزمایی — هر پنج تابع باید فارسی داشته باشند و «????» نه.
-- بازه‌ی فارسی از کدِ نویسه‌ها ساخته می‌شود تا انتقالِ خراب آزمون را
-- دروغی سبز نکند.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE f text; fa text := '[' || chr(1536) || '-' || chr(1791) || ']';
BEGIN
  FOREACH f IN ARRAY ARRAY['bh_log_error','bh_otp_issue','bh_otp_verify','bh_lock_new_functions','bh_prune_audit']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = f AND pronamespace = 'public'::regnamespace) THEN
      RAISE EXCEPTION 'ABORT: function % missing', f;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = f AND pronamespace = 'public'::regnamespace
                AND prosrc LIKE '%????%') THEN
      RAISE EXCEPTION 'ABORT: % still contains "????" - run via scp, not a PowerShell pipe', f;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = f AND pronamespace = 'public'::regnamespace
                    AND prosrc ~ fa) THEN
      RAISE EXCEPTION 'ABORT: % has no Persian text after restore', f;
    END IF;
  END LOOP;
  RAISE NOTICE '110 self-test passed: 5 functions restored';
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
