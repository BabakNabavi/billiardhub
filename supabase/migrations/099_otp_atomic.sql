-- ─────────────────────────────────────────────────────────────
-- ۰۹۹ — OTP از Storage به دیتابیس: شمارشِ تلاشِ اتمیک
--
-- ⚠️ اجرا دستی و با تأییدِ صریح.
--
-- ── باگِ واقعی که این مهاجرت می‌بندد ──
-- `verifyOtp` در `lib/otp-server.ts` شمارنده‌ی تلاش را read-then-write
-- بالا می‌برد:
--
--     if (rec.tries >= MAX_TRIES) return …          -- خواندن
--     if (hash(code) !== rec.hash) {
--       await writeJson(path, { …rec, tries: rec.tries + 1 })   -- نوشتن
--
-- دو درخواستِ هم‌زمان هر دو `tries = 0` می‌خوانند و هر دو `1`
-- می‌نویسند. یعنی حمله‌کننده با فرستادنِ N درخواستِ موازی، N حدس
-- می‌زند که فقط یکی شمرده می‌شود — سقفِ پنج‌تایی عملا برداشته
-- می‌شود. کد پنج‌رقمی است (صد هزار حالت)، پس این سقف تنها چیزی
-- است که جلوی حدسِ انبوه را می‌گیرد.
--
-- راهِ درست، بررسی و افزایش در **یک دستورِ دیتابیس** است. همان
-- کاری که ۰۲۲ برای `bh_rate_hit` و ۰۹۸ برای `bh_log_error` کرد.
--
-- ── تصحیحِ یک ادعای قبلی ──
-- ⚠️ من پیش‌تر گفتم OTP «در فایلِ روی دیسک» است و مانعِ سرور دوم.
-- آن **غلط بود**: رکوردها در Supabase Storage اند (باکتِ خصوصی،
-- `social/otp/<mobile>.json`) که بینِ سرورها مشترک است و با ری‌استارت
-- هم از بین نمی‌رود. پس OTP هرگز مانعِ مقیاسِ افقی نبود. دلیلِ این
-- مهاجرت اتمیک‌بودن و پاک‌سازی است، نه مقیاس.
--
-- ── پاک‌سازی ──
-- هیچ‌جای پروژه فایلِ OTP را پاک نمی‌کرد، پس به ازای هر شماره‌ای که
-- تا امروز کد گرفته یک JSONِ مرده در باکت مانده. جدول `bh_prune_otp`
-- دارد.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.otp_codes (
  -- شماره‌ی نرمال‌شده (فقط رقم). کلیدِ اصلی، چون هر شماره یک کدِ فعال دارد.
  mobile      text        PRIMARY KEY,
  -- ⚠️ خودِ کد هرگز ذخیره نمی‌شود، فقط HMACش — همان قاعده‌ی امروز.
  code_hash   text        NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  tries       integer     NOT NULL DEFAULT 0,
  verified_at timestamptz,
  -- هشِ کد ملیِ استعلام‌شده (خودِ کد ملی نه) + زمانش
  id_hash     text,
  id_at       timestamptz
);

CREATE INDEX IF NOT EXISTS otp_codes_sent_idx ON public.otp_codes (sent_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.otp_codes FROM PUBLIC, anon, authenticated;

-- ── صدور ─────────────────────────────────────────────────────
-- فاصله‌ی ارسالِ مجدد هم همین‌جا سنجیده می‌شود، وگرنه دو درخواستِ
-- هم‌زمان هر دو «مجاز» می‌گرفتند و دو پیامک می‌رفت (هزینه‌ی واقعی).
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

-- ── راستی‌آزمایی ──────────────────────────────────────────────
-- بررسی و افزایشِ شمارنده در یک تراکنش. خروجی:
--   'ok' | 'none' | 'expired' | 'too_many' | 'wrong'
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

-- ── نشانِ «هویتش استعلام شد» ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_otp_mark_identity(
  p_mobile text,
  p_id_hash text
) RETURNS void
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  UPDATE public.otp_codes
     SET id_hash = p_id_hash, id_at = now()
   WHERE mobile = p_mobile;
$$;

-- ── خواندنِ وضعیت ─────────────────────────────────────────────
-- ⚠️ `code_hash` برنمی‌گردد. این تابع برای «آیا تأیید شده؟» است و
-- هیچ فراخوانی به هشِ کد نیاز ندارد.
CREATE OR REPLACE FUNCTION public.bh_otp_state(p_mobile text)
RETURNS TABLE (verified_at timestamptz, id_hash text, id_at timestamptz)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT o.verified_at, o.id_hash, o.id_at
    FROM public.otp_codes o
   WHERE o.mobile = p_mobile;
$$;

-- ── پاک‌سازی ──────────────────────────────────────────────────
-- کدِ کهنه ارزشِ نگه‌داشتن ندارد و شماره‌ی موبایل داده‌ی شخصی است.
-- یک ساعت از سقفِ هر پنجره‌ای (۵ دقیقه‌ی کد، ۳۰ دقیقه‌ی نشانِ تأیید)
-- بالاتر است.
CREATE OR REPLACE FUNCTION public.bh_prune_otp()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.otp_codes WHERE sent_at < now() - interval '1 hour';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.bh_otp_issue(text, text, integer)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_otp_verify(text, text, integer, integer)    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_otp_mark_identity(text, text)               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_otp_state(text)                             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_prune_otp()                                 FROM PUBLIC, anon, authenticated;

-- ⚠️ بدونِ این، کشِ اسکیمای PostgREST کهنه می‌ماند، هر فراخوان
-- PGRST202 می‌گیرد و کد بی‌صدا به همان مسیرِ غیراتمیکِ Storage
-- برمی‌گردد — یعنی اصلاح «دیپلوی‌شده» به نظر می‌رسد و نیست.
NOTIFY pgrst, 'reload schema';
