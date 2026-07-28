-- ═══════════════════════════════════════════════════════════════════
-- 007 — بسته‌های آگهی و خریدشان
--
-- ادمین خودش پلن می‌سازد (سهمیه، بازه، مدتِ اعتبار، قیمت) و هر وقت
-- بخواهد قیمت یا تعداد را عوض می‌کند. کاربر پلن را می‌خرد، به درگاه
-- می‌رود و پس از پرداختِ موفق پلنش فعال می‌شود.
--
-- عمداً از مسیرِ مالیِ رزرو جدا است: آن مسیر پولِ باشگاه‌ها را جابه‌جا
-- می‌کند و توابعِ اتمیکش به booking_id گره خورده‌اند؛ دست‌زدن به آن
-- برای فروشِ پلن ریسکِ بی‌مورد بود.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ad_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  quota         integer     NOT NULL DEFAULT 0,        -- تعداد آگهی در هر بازه (۰ = نامحدود)
  period        text        NOT NULL DEFAULT 'week',   -- day | week | month
  duration_days integer     NOT NULL DEFAULT 30,       -- پلن چند روز اعتبار دارد
  price         bigint      NOT NULL DEFAULT 0,        -- تومان
  is_active     boolean     NOT NULL DEFAULT true,     -- به کاربر نشان داده شود؟
  sort_order    integer     NOT NULL DEFAULT 0,
  badge         text,                                   -- «پیشنهاد ما» و…
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_plans_period_chk CHECK (period IN ('day','week','month'))
);

CREATE INDEX IF NOT EXISTS ad_plans_active_idx ON public.ad_plans (is_active, sort_order);

-- ── سفارشِ خرید (مسیرِ درگاه) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_plan_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL,
  plan_id            uuid        NOT NULL REFERENCES public.ad_plans(id),
  amount             bigint      NOT NULL,
  status             text        NOT NULL DEFAULT 'PENDING',  -- PENDING | PAID | FAILED | CANCELED
  provider           text        NOT NULL DEFAULT 'mock',
  provider_authority text,
  provider_ref_id    text,
  /* عکسِ لحظه‌ای از پلن، تا تغییرِ بعدیِ قیمت روی سفارشِ قدیمی اثر نگذارد */
  snapshot           jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  paid_at            timestamptz,
  CONSTRAINT ad_plan_orders_status_chk CHECK (status IN ('PENDING','PAID','FAILED','CANCELED'))
);

CREATE INDEX IF NOT EXISTS ad_plan_orders_user_idx ON public.ad_plan_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_plan_orders_auth_idx ON public.ad_plan_orders (provider_authority);

-- ── پلنِ فعالِ کاربر ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_ad_plans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  plan_id    uuid        NOT NULL REFERENCES public.ad_plans(id),
  order_id   uuid        REFERENCES public.ad_plan_orders(id),
  quota      integer     NOT NULL,     -- کپی از پلن، تا تغییرِ بعدیِ پلن اثر نگذارد
  period     text        NOT NULL,
  status     text        NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | EXPIRED | CANCELED
  starts_at  timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_ad_plans_status_chk CHECK (status IN ('ACTIVE','EXPIRED','CANCELED'))
);

CREATE INDEX IF NOT EXISTS user_ad_plans_active_idx ON public.user_ad_plans (user_id, status, expires_at DESC);

ALTER TABLE public.ad_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_plan_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ad_plans  ENABLE ROW LEVEL SECURITY;

/* فعال‌سازیِ پلن پس از پرداختِ موفق — اتمیک، و ضدِ فعال‌سازیِ دوباره
   (کالبکِ تکراریِ درگاه نباید دو بار پلن بدهد). */
CREATE OR REPLACE FUNCTION public.bh_activate_ad_plan(p_order_id uuid, p_ref text)
RETURNS jsonb AS $$
DECLARE o record; p record; v_id uuid; v_expires timestamptz;
BEGIN
  SELECT * INTO o FROM public.ad_plan_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  /* قبلاً پرداخت شده ⇒ همان نتیجه، بدونِ اثرِ دوباره */
  IF o.status = 'PAID' THEN
    SELECT id INTO v_id FROM public.user_ad_plans WHERE order_id = p_order_id LIMIT 1;
    RETURN jsonb_build_object('already', true, 'subscription_id', v_id);
  END IF;

  SELECT * INTO p FROM public.ad_plans WHERE id = o.plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_not_found'; END IF;

  UPDATE public.ad_plan_orders
     SET status = 'PAID', provider_ref_id = p_ref, paid_at = now()
   WHERE id = p_order_id;

  /* پلنِ فعالِ قبلی جایش را به تازه می‌دهد */
  UPDATE public.user_ad_plans
     SET status = 'CANCELED'
   WHERE user_id = o.user_id AND status = 'ACTIVE';

  v_expires := now() + (p.duration_days || ' days')::interval;

  INSERT INTO public.user_ad_plans (user_id, plan_id, order_id, quota, period, expires_at)
  VALUES (o.user_id, o.plan_id, p_order_id, p.quota, p.period, v_expires)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('already', false, 'subscription_id', v_id, 'expires_at', v_expires);
END;
$$ LANGUAGE plpgsql;
