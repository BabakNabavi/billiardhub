-- ═══════════════════════════════════════════════════════════════════
-- 013 — بسته‌های استوری
--
-- آینه‌ی دقیقِ بسته‌های آگهی (مایگریشن ۰۰۷)، ولی جدولِ جدا: سهمیه‌ی
-- استوری و سهمیه‌ی آگهی دو چیزِ متفاوت‌اند و کاربر باید بتواند فقط
-- یکی را بخرد.
--
-- عمداً جدا از ad_plans است، نه یک ستونِ «نوع» رویش: با ستونِ نوع،
-- هر کوئریِ سهمیه باید فیلتر می‌شد و یک فیلترِ فراموش‌شده یعنی
-- بسته‌ی آگهی سهمیه‌ی استوری می‌داد.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.story_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  quota         integer     NOT NULL DEFAULT 0,        -- تعداد استوری در هر بازه (۰ = نامحدود)
  period        text        NOT NULL DEFAULT 'day',    -- day | week | month
  duration_days integer     NOT NULL DEFAULT 30,
  price         bigint      NOT NULL DEFAULT 0,        -- تومان
  is_active     boolean     NOT NULL DEFAULT true,
  sort_order    integer     NOT NULL DEFAULT 0,
  badge         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT story_plans_period_chk CHECK (period IN ('day','week','month'))
);

CREATE INDEX IF NOT EXISTS story_plans_active_idx ON public.story_plans (is_active, sort_order);

CREATE TABLE IF NOT EXISTS public.story_plan_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL,
  plan_id            uuid        NOT NULL REFERENCES public.story_plans(id),
  amount             bigint      NOT NULL,
  status             text        NOT NULL DEFAULT 'PENDING',
  provider           text        NOT NULL DEFAULT 'mock',
  provider_authority text,
  provider_ref_id    text,
  snapshot           jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  paid_at            timestamptz,
  CONSTRAINT story_plan_orders_status_chk CHECK (status IN ('PENDING','PAID','FAILED','CANCELED'))
);

CREATE INDEX IF NOT EXISTS story_plan_orders_user_idx ON public.story_plan_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS story_plan_orders_auth_idx ON public.story_plan_orders (provider_authority);

CREATE TABLE IF NOT EXISTS public.user_story_plans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  plan_id    uuid        NOT NULL REFERENCES public.story_plans(id),
  order_id   uuid        REFERENCES public.story_plan_orders(id),
  quota      integer     NOT NULL,
  period     text        NOT NULL,
  status     text        NOT NULL DEFAULT 'ACTIVE',
  starts_at  timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_story_plans_status_chk CHECK (status IN ('ACTIVE','EXPIRED','CANCELED'))
);

CREATE INDEX IF NOT EXISTS user_story_plans_active_idx ON public.user_story_plans (user_id, status, expires_at DESC);

ALTER TABLE public.story_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_plan_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_story_plans  ENABLE ROW LEVEL SECURITY;

/* فعال‌سازیِ بسته پس از پرداختِ موفق — اتمیک و ضدِ فعال‌سازیِ دوباره */
CREATE OR REPLACE FUNCTION public.bh_activate_story_plan(p_order_id uuid, p_ref text)
RETURNS jsonb AS $$
DECLARE o record; p record; v_id uuid; v_expires timestamptz;
BEGIN
  SELECT * INTO o FROM public.story_plan_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  IF o.status = 'PAID' THEN
    SELECT id INTO v_id FROM public.user_story_plans WHERE order_id = p_order_id LIMIT 1;
    RETURN jsonb_build_object('already', true, 'subscription_id', v_id);
  END IF;

  SELECT * INTO p FROM public.story_plans WHERE id = o.plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'plan_not_found'; END IF;

  UPDATE public.story_plan_orders
     SET status = 'PAID', provider_ref_id = p_ref, paid_at = now()
   WHERE id = p_order_id;

  UPDATE public.user_story_plans
     SET status = 'CANCELED'
   WHERE user_id = o.user_id AND status = 'ACTIVE';

  v_expires := now() + (p.duration_days || ' days')::interval;

  INSERT INTO public.user_story_plans (user_id, plan_id, order_id, quota, period, expires_at)
  VALUES (o.user_id, o.plan_id, p_order_id, p.quota, p.period, v_expires)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('already', false, 'subscription_id', v_id, 'expires_at', v_expires);
END;
$$ LANGUAGE plpgsql;

/* کلیدها — مثل آگهی، خاموش تا وقتی ادمین روشن کند.
   سهمیه‌ی پیش‌فرضِ رایگان همان اعدادِ هاردکدِ قبلیِ /api/social/stories است
   تا رفتارِ امروزِ سایت عوض نشود. */
INSERT INTO public.app_settings (key, value) VALUES
  ('stories_quota_enabled', 'false'::jsonb),
  ('stories_free_quota', '{
     "default": {"quota": 2, "period": "day"},
     "roles": {
       "user":         {"quota": 0, "period": "day"},
       "player":       {"quota": 2, "period": "day"},
       "coach":        {"quota": 2, "period": "day"},
       "referee":      {"quota": 1, "period": "day"},
       "technician":   {"quota": 2, "period": "day"},
       "seller":       {"quota": 4, "period": "day"},
       "manufacturer": {"quota": 2, "period": "day"},
       "club_owner":   {"quota": 3, "period": "day"}
     }
   }'::jsonb),
  ('story_platform_bank', '{"iban": "", "cardNumber": "", "ownerName": "", "bankName": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
