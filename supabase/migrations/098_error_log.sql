-- ─────────────────────────────────────────────────────────────
-- ۰۹۸ — ژورنالِ خطا: دیدنِ خطاهایی که تا امروز فقط کاربر می‌دید
--
-- ⚠️ این مهاجرت **اجرا نشده**. اجرا دستی و با تأییدِ صریح.
--
-- ── چرا نه Sentry ──
-- سرور و مخاطب هر دو ایرانند. sentry.io از این‌جا قابلِ اتکا نیست و
-- یک سرویسِ پایشی که خودش قطع شود از نبودنش بدتر است، چون آدم فکر
-- می‌کند پوشش دارد. سِلف‌هاستش هم یک استکِ کامل (Kafka، ClickHouse،
-- Redis) روی همین یک VPS می‌خواهد که خودش منبعِ قطعی می‌شود. این
-- جدول همان ۹۰٪ِ فایده را با صفر وابستگیِ تازه می‌دهد.
--
-- ── ضدِ سیل ──
-- مسیرِ ثبتِ خطای مرورگر **بدونِ ورود** است (باید باشد: مهم‌ترین
-- خطاها سرِ کاربرِ واردنشده می‌افتند). پس باید فرض کرد که یک نفر
-- عمدا سیل می‌فرستد:
--   ۱) ردیف‌ها بر پایه‌ی اثرانگشت تجمیع می‌شوند — هزار رخدادِ یک
--      خطا یک ردیف است.
--   ۲) سقفِ کلیِ ردیف: بالای MAX_ROWS، اثرانگشتِ *تازه* پذیرفته
--      نمی‌شود ولی شمارشِ خطاهای موجود ادامه پیدا می‌کند. یعنی
--      حمله‌کننده می‌تواند جدول را پر کند ولی نه دیسک را، و
--      خطاهای واقعیِ ثبت‌شده همچنان شمرده می‌شوند.
--   ۳) نگه‌داریِ محدود: ردیفِ رسیدگی‌شده‌ی قدیمی پاک می‌شود.
--
-- ⚠️ نه RLS و نه GRANT به anon: نوشتن فقط از راهِ route handlerِ
-- خودمان با کلیدِ سرویس.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_errors (
  id           bigserial PRIMARY KEY,
  -- هشِ منبع + پیام + اولین قابِ پشته + مسیر (بدونِ کوئری‌استرینگ).
  -- ⚠️ `source` عمدا جزءِ کلید است: خطای سرور و خطای مرورگر با پیامِ
  -- یکسان دو چیزند، و بدونِ آن ردیفِ اول فیلدهای ردیفِ دوم را برای
  -- همیشه قفل می‌کرد (ستون‌ها در ON CONFLICT به‌روز نمی‌شوند).
  fingerprint  text        NOT NULL,
  source       text        NOT NULL CHECK (source IN ('client', 'server')),
  message      text        NOT NULL,
  stack        text,
  -- فقط مسیر. کوئری‌استرینگ هرگز این‌جا نمی‌آید: کالبکِ درگاه‌ها
  -- شناسه‌ی پرداخت را همان‌جا حمل می‌کنند.
  url          text,
  user_agent   text,
  user_id      uuid,
  -- کدام نسخه‌ی کد. بدونِ این، «این خطا بعد از کدام دیپلوی آمد؟»
  -- جوابی ندارد.
  release      text,
  hits         integer     NOT NULL DEFAULT 1,
  first_seen   timestamptz NOT NULL DEFAULT now(),
  last_seen    timestamptz NOT NULL DEFAULT now(),
  resolved     boolean     NOT NULL DEFAULT false,
  resolved_at  timestamptz,
  UNIQUE (fingerprint)
);

-- پرتکرارترین‌های حل‌نشده — پرس‌وجوی پیش‌فرضِ صفحه‌ی ادمین
CREATE INDEX IF NOT EXISTS app_errors_open_idx
  ON public.app_errors (resolved, last_seen DESC);
-- شاخه‌ی «همه» که فیلترِ resolved ندارد
CREATE INDEX IF NOT EXISTS app_errors_recent_idx
  ON public.app_errors (last_seen DESC);

ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_errors FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.app_errors_id_seq FROM anon, authenticated;

-- ── ثبتِ اتمیک ────────────────────────────────────────────────
-- ⚠️ read-then-update نه: دو رخدادِ هم‌زمانِ یک خطا شمارنده را گم
-- می‌کردند. `ON CONFLICT` کلِ کار را در یک دستور انجام می‌دهد.
--
-- ⚠️ بدونِ SECURITY DEFINER. تنها فراخوانش route handler با
-- `service_role` است که خودش دسترسیِ جدول را دارد؛ definer فقط
-- یک تابعِ superuser-ownedِ بی‌مصرف می‌ساخت.
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

REVOKE ALL ON FUNCTION public.bh_log_error(text, text, text, text, text, text, uuid, text)
  FROM PUBLIC, anon, authenticated;

-- ── نگه‌داری ──────────────────────────────────────────────────
-- ردیفِ رسیدگی‌شده‌ی کهنه ارزشِ نگه‌داشتن ندارد. کرونِ سرور این را
-- صدا بزند، یا دستی هر چند وقت.
CREATE OR REPLACE FUNCTION public.bh_prune_errors()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.app_errors
   WHERE resolved AND last_seen < now() - interval '30 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.bh_prune_errors() FROM PUBLIC, anon, authenticated;
