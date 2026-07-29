-- ─────────────────────────────────────────────────────────────────
-- ۰۲۲ — سخت‌سازیِ امنیتی (فاز ۷A)
--
--   ۱) جدول و تابعِ محدودیتِ نرخ (مشترک بینِ نمونه‌های سرورلس)
--   ۲) REVOKE اجرای توابعِ حساس از anon/authenticated/PUBLIC
--   ۳) پاک‌سازیِ گرنت‌های غیرضروریِ anon/authenticated روی جدول‌ها
--
-- هیچ‌کدام از این‌ها رفتارِ سرورساید را عوض نمی‌کند: کلِ اپ با نقشِ
-- service_role کار می‌کند که از این محدودیت‌ها مستثناست.
-- ─────────────────────────────────────────────────────────────────

-- ── ۱) محدودیتِ نرخ ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_hits (
  id         bigserial PRIMARY KEY,
  key        text        NOT NULL,
  at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_hits_key_at_idx ON public.rate_hits (key, at DESC);

ALTER TABLE public.rate_hits ENABLE ROW LEVEL SECURITY;

/* یک رفت‌وبرگشت: هرس، شمارش، تصمیم و ثبت. اگر شمارش به سقف رسیده
   باشد ردیفِ تازه ثبت نمی‌شود تا حمله‌ی سیل‌آسا جدول را باد نکند. */
CREATE OR REPLACE FUNCTION public.bh_rate_hit(
  p_key text,
  p_window_start timestamptz,
  p_max integer
) RETURNS jsonb AS $$
DECLARE v_count integer; v_oldest timestamptz;
BEGIN
  DELETE FROM public.rate_hits WHERE at < now() - interval '24 hours';

  SELECT count(*), min(at) INTO v_count, v_oldest
    FROM public.rate_hits
   WHERE key = p_key AND at >= p_window_start;

  IF v_count >= p_max THEN
    RETURN jsonb_build_object('allowed', false, 'count', v_count, 'oldest', v_oldest);
  END IF;

  INSERT INTO public.rate_hits (key) VALUES (p_key);
  RETURN jsonb_build_object('allowed', true, 'count', v_count + 1, 'oldest', COALESCE(v_oldest, now()));
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_rate_hit(text, timestamptz, integer) FROM PUBLIC, anon, authenticated;

-- ── ۲) REVOKE توابعِ حساس ───────────────────────────────────────
-- هیچ‌کدام از این‌ها از مرورگر صدا زده نمی‌شوند؛ همه از مسیرهای
-- سرورساید با نقشِ service_role اجرا می‌شوند. پس anon/authenticated
-- هیچ دلیلی برای اجرایشان ندارند (اصلِ کمترین دسترسی).
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname LIKE 'bh\_%'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END $$;

-- ── ۳) پاک‌سازیِ گرنت‌های جدول‌ها ────────────────────────────────
-- RLS از قبل همه‌چیز را می‌بندد، ولی این گرنت‌ها یعنی اگر روزی کسی
-- یک policy اضافه کند، در همان لحظه نوشتن هم برای anon باز می‌شود.
-- تنها استثنا products است که کاتالوگِ عمومی است و policyِ خواندن دارد.
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
       AND c.relname <> 'products'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.relname);
  END LOOP;

  /* کاتالوگِ عمومی: فقط خواندن، نه نوشتن */
  EXECUTE 'REVOKE ALL ON TABLE public.products FROM anon, authenticated';
  EXECUTE 'GRANT SELECT ON TABLE public.products TO anon, authenticated';
END $$;
