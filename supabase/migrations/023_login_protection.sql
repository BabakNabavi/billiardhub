-- ─────────────────────────────────────────────────────────────────
-- ۰۲۳ — محافظت از ورود در برابر حدسِ رمز (فاز ۸)
--
-- سه اصل که شکلِ این جدول را تعیین کرده‌اند:
--
--   ۱) شمارنده‌ی «حساب» و «IP» جدا هستند. اگر فقط IP بشماریم، مهاجم با
--      چرخاندنِ IP رد می‌شود؛ اگر فقط حساب بشماریم، هر کسی می‌تواند با
--      چند تلاشِ عمدی حسابِ قربانی را قفل کند (DoS).
--
--   ۲) قفلِ حساب **تدریجی و موقت** است، نه دائمی: ۵ دقیقه، بعد ۳۰
--      دقیقه، بعد یک ساعت و در نهایت چند ساعت. هیچ‌وقت به «قفلِ همیشگی»
--      نمی‌رسد تا سلاحِ DoS علیه کاربر نشود.
--
--   ۳) شمارش و تصمیم در یک تابعِ اتمیک با قفلِ ردیف انجام می‌شود، پس دو
--      تلاشِ هم‌زمان نمی‌توانند از سقف رد شوند.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id            bigserial PRIMARY KEY,
  scope         text        NOT NULL,          -- 'account' | 'ip'
  subject       text        NOT NULL,          -- شماره‌ی موبایل یا IP
  fails         integer     NOT NULL DEFAULT 0,
  strikes       integer     NOT NULL DEFAULT 0,-- چند بار تا حالا قفل شده
  locked_until  timestamptz,
  last_fail_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, subject)
);

CREATE INDEX IF NOT EXISTS login_attempts_locked_idx ON public.login_attempts (locked_until);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.login_attempts FROM anon, authenticated;

/* بررسیِ وضعیت پیش از پذیرشِ تلاش. فقط می‌خواند. */
CREATE OR REPLACE FUNCTION public.bh_login_guard(p_account text, p_ip text)
RETURNS jsonb AS $$
DECLARE a record; i record; v_until timestamptz;
BEGIN
  SELECT * INTO a FROM public.login_attempts WHERE scope='account' AND subject=p_account;
  SELECT * INTO i FROM public.login_attempts WHERE scope='ip'      AND subject=p_ip;

  v_until := GREATEST(COALESCE(a.locked_until, 'epoch'::timestamptz),
                      COALESCE(i.locked_until, 'epoch'::timestamptz));

  IF v_until > now() THEN
    RETURN jsonb_build_object('locked', true,
                              'retry_after', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_until - now()))))::int);
  END IF;
  RETURN jsonb_build_object('locked', false, 'retry_after', 0);
END;
$$ LANGUAGE plpgsql;

/* ثبتِ تلاشِ ناموفق و اعمالِ قفلِ تدریجی — اتمیک با قفلِ ردیف.
   آستانه و مدت‌ها پارامتر هستند تا در کد قابلِ تنظیم بمانند. */
CREATE OR REPLACE FUNCTION public.bh_login_fail(
  p_account text,
  p_ip text,
  p_threshold integer,
  p_windows integer[]        -- ثانیه، به‌ترتیبِ شدت
) RETURNS jsonb AS $$
DECLARE r record; v_lock integer; v_until timestamptz; v_res jsonb := '{}'::jsonb;
        s text; subj text;
BEGIN
  FOREACH s IN ARRAY ARRAY['account','ip'] LOOP
    subj := CASE WHEN s = 'account' THEN p_account ELSE p_ip END;
    CONTINUE WHEN subj IS NULL OR subj = '';

    INSERT INTO public.login_attempts (scope, subject, fails, last_fail_at)
    VALUES (s, subj, 0, now())
    ON CONFLICT (scope, subject) DO NOTHING;

    SELECT * INTO r FROM public.login_attempts
     WHERE scope=s AND subject=subj FOR UPDATE;

    /* پنجره‌ی شمارش: بی‌فعالیتیِ طولانی شمارنده را صفر می‌کند تا
       تلاش‌های پراکنده‌ی یک کاربرِ فراموش‌کار انباشته نشود */
    IF r.last_fail_at IS NOT NULL AND r.last_fail_at < now() - interval '1 hour' THEN
      UPDATE public.login_attempts SET fails = 0 WHERE id = r.id;
      r.fails := 0;
    END IF;

    UPDATE public.login_attempts
       SET fails = r.fails + 1, last_fail_at = now(), updated_at = now()
     WHERE id = r.id
     RETURNING * INTO r;

    IF r.fails >= p_threshold THEN
      v_lock := p_windows[LEAST(r.strikes + 1, array_length(p_windows, 1))];
      v_until := now() + make_interval(secs => v_lock);
      UPDATE public.login_attempts
         SET locked_until = v_until, strikes = r.strikes + 1, fails = 0, updated_at = now()
       WHERE id = r.id;
      v_res := v_res || jsonb_build_object(s, jsonb_build_object('locked', true, 'seconds', v_lock));
    ELSE
      v_res := v_res || jsonb_build_object(s, jsonb_build_object('locked', false, 'fails', r.fails));
    END IF;
  END LOOP;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql;

/* ورودِ موفق ⇒ شمارنده‌ی همان حساب صفر می‌شود.
   شمارنده‌ی IP عمداً دست‌نخورده می‌ماند: یک ورودِ موفق نباید سابقه‌ی
   حمله از همان IP را پاک کند. */
CREATE OR REPLACE FUNCTION public.bh_login_ok(p_account text)
RETURNS void AS $$
BEGIN
  UPDATE public.login_attempts
     SET fails = 0, strikes = 0, locked_until = NULL, updated_at = now()
   WHERE scope = 'account' AND subject = p_account;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_login_guard(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_login_fail(text, text, integer, integer[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_login_ok(text) FROM PUBLIC, anon, authenticated;
