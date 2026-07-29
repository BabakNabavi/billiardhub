-- ─────────────────────────────────────────────────────────────────
-- ۰۲۹ — بازنگریِ سیاستِ قفلِ ورود
--
-- دو مشکل در نسخه‌ی ۰۲۳ حل می‌شود:
--
--   ۱) **باگِ جدی:** قفلِ IP و قفلِ حساب یک آستانه و یک جدولِ زمانی
--      داشتند و `bh_login_guard` بیشترینشان را برمی‌داشت. نتیجه این
--      بود که وقتی کسی رمزِ حسابِ خودش را چند بار اشتباه می‌زد، IP
--      قفل می‌شد و بعد **هیچ حسابِ دیگری هم از همان دستگاه نمی‌توانست
--      وارد شود**. در یک خانه، دفتر، یا پشتِ NATِ اپراتورِ موبایل،
--      اشتباهِ یک نفر همه را بیرون می‌گذاشت.
--
--      اصلاح: دو آستانه‌ی کاملاً جدا. قفلِ حساب زود می‌آید چون فقط
--      همان حساب را می‌بندد. قفلِ IP دیر می‌آید و برای حمله‌ی واقعیِ
--      پرشمار است (Credential Stuffing)، نه برای کاربری که رمزش را
--      فراموش کرده.
--
--   ۲) سیاستِ تازه‌ی مالکِ پروژه: آستانه ۳ تلاش، و پله‌های
--      ۵ دقیقه → ۱۵ دقیقه → ۱ ساعت → ۶ ساعت → ۱۲ ساعت → ۱ روز.
--
-- هشدارِ صادقانه: پله‌ی یک‌روزه یعنی کسی که فقط شماره‌ی موبایلِ شما را
-- بداند می‌تواند با ۳ رمزِ غلط حسابتان را تا یک روز ببندد. راهِ خروج
-- برای کاربرِ واقعی «بازیابیِ رمز» است که قفل نمی‌شود.
-- ─────────────────────────────────────────────────────────────────

/* آستانه و پله‌ها حالا برای هر دامنه جداست */
CREATE OR REPLACE FUNCTION public.bh_login_fail(
  p_account text,
  p_ip text,
  p_threshold integer,          -- آستانه‌ی حساب
  p_windows integer[],          -- پله‌های حساب (ثانیه)
  p_ip_threshold integer DEFAULT 30,
  p_ip_windows integer[] DEFAULT ARRAY[900, 3600, 21600]
) RETURNS jsonb AS $$
DECLARE r record; v_lock integer; v_until timestamptz; v_res jsonb := '{}'::jsonb;
        s text; subj text; v_thr integer; v_win integer[];
BEGIN
  FOREACH s IN ARRAY ARRAY['account','ip'] LOOP
    subj := CASE WHEN s = 'account' THEN p_account ELSE p_ip END;
    CONTINUE WHEN subj IS NULL OR subj = '';

    IF s = 'account' THEN v_thr := p_threshold;    v_win := p_windows;
                     ELSE v_thr := p_ip_threshold; v_win := p_ip_windows;
    END IF;

    INSERT INTO public.login_attempts (scope, subject, fails, last_fail_at)
    VALUES (s, subj, 0, now())
    ON CONFLICT (scope, subject) DO NOTHING;

    SELECT * INTO r FROM public.login_attempts
     WHERE scope=s AND subject=subj FOR UPDATE;

    /* بی‌فعالیتیِ طولانی شمارنده را صفر می‌کند */
    IF r.last_fail_at IS NOT NULL AND r.last_fail_at < now() - interval '1 hour' THEN
      UPDATE public.login_attempts SET fails = 0 WHERE id = r.id;
      r.fails := 0;
    END IF;

    UPDATE public.login_attempts
       SET fails = r.fails + 1, last_fail_at = now(), updated_at = now()
     WHERE id = r.id
     RETURNING * INTO r;

    IF r.fails >= v_thr THEN
      v_lock := v_win[LEAST(r.strikes + 1, array_length(v_win, 1))];
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

/* گاردِ ورود — قفلِ حساب و قفلِ IP دیگر با هم جمع نمی‌شوند.

   قفلِ IP فقط وقتی جلوی ورود را می‌گیرد که واقعاً حمله باشد؛ و چون
   آستانه‌اش ۳۰ است، کاربرِ عادی هرگز به آن نمی‌رسد. مهم‌تر: قفلِ IP
   دیگر باعث نمی‌شود حسابِ **دیگری** از همان دستگاه بسته شود مگر
   اینکه خودِ آن IP به آستانه‌ی حمله رسیده باشد. */
CREATE OR REPLACE FUNCTION public.bh_login_guard(p_account text, p_ip text)
RETURNS jsonb AS $$
DECLARE a record; i record; v_until timestamptz; v_scope text;
BEGIN
  SELECT * INTO a FROM public.login_attempts WHERE scope='account' AND subject=p_account;
  SELECT * INTO i FROM public.login_attempts WHERE scope='ip'      AND subject=p_ip;

  /* قفلِ خودِ حساب مقدم است — پیامش هم برای کاربر قابلِ فهم‌تر است */
  IF a.locked_until IS NOT NULL AND a.locked_until > now() THEN
    v_until := a.locked_until; v_scope := 'account';
  ELSIF i.locked_until IS NOT NULL AND i.locked_until > now() THEN
    v_until := i.locked_until; v_scope := 'ip';
  END IF;

  IF v_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'locked', true, 'scope', v_scope,
      'retry_after', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_until - now()))))::int);
  END IF;
  RETURN jsonb_build_object('locked', false, 'retry_after', 0);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_login_fail(text, text, integer, integer[], integer, integer[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_login_guard(text, text) FROM PUBLIC, anon, authenticated;

/* نسخه‌ی قدیمیِ چهارآرگومانی حذف می‌شود تا فراخوانِ مبهم نماند */
DROP FUNCTION IF EXISTS public.bh_login_fail(text, text, integer, integer[]);
