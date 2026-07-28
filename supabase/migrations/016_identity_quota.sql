-- ─────────────────────────────────────────────────────────────────
-- ۰۱۶ — هویت (Person/Identity) و سهمیه‌ی آگهیِ رایگانِ شخص‌محور (فاز ۳)
--
-- اصل: سهمیه‌ی رایگان به «شخصِ حقیقی» تعلق دارد، نه به حساب و نه به
-- نقش. شخص با هَشِ کد ملی (HMAC-SHA256، محاسبه در لایه‌ی برنامه)
-- یکتا می‌شود؛ چند حساب می‌توانند به یک شخص وصل باشند و همگی از یک
-- سهمیه‌ی مشترک مصرف کنند.
--
-- تصمیم D2 (IMPLEMENTATION_PROGRESS.md): دو حسابِ موجود با کد ملیِ
-- مشترک، حساب‌های تستیِ مالک‌اند — این مایگریشن هیچ حسابی را حذف یا
-- Merge نمی‌کند؛ فقط ستونِ users.person_id اضافه می‌شود (بک‌فیل در
-- لایه‌ی برنامه انجام می‌شود چون کلیدِ HMAC در env است، نه در SQL).
-- اتصالِ هر دو حساب به یک ردیفِ persons «لینک» است نه Merge و با
-- NULL کردنِ person_id برگشت‌پذیر است.
--
-- مصرف در quota_consumptions ثبت می‌شود (دفترِ مصرف): حذف یا انقضای
-- آگهی، ردیفِ مصرف را پاک نمی‌کند ⇒ سهمیه در همان دوره‌ی ۳۰ روزه
-- برنمی‌گردد (ضدِ سوءاستفاده‌ی «ثبت→حذف→ثبت»).
-- ─────────────────────────────────────────────────────────────────

-- ── شخص (هویت واقعی) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.persons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- HMAC-SHA256 از کد ملیِ نرمال‌شده؛ خودِ کد ملی این‌جا ذخیره نمی‌شود
  national_id_hash text NOT NULL UNIQUE,
  -- پرچمِ حساب‌های تستیِ مالک (تصمیمش با مالک؛ منطق فعلاً استفاده نمی‌کند)
  is_test          boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- اتصالِ حساب‌ها به شخص — بدونِ هیچ تغییری در ردیف‌های موجود
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS person_id uuid;

DO $$ BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT users_person_fk
    FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS users_person_idx ON public.users(person_id);

-- ── دفترِ مصرفِ سهمیه ────────────────────────────────────────────
-- شمارشِ سهمیه از این دفتر است، نه از شمارشِ ردیف‌های زنده‌ی products؛
-- بنابراین حذف/انقضای آگهی هیچ سهمیه‌ای را برنمی‌گرداند.
CREATE TABLE IF NOT EXISTS public.quota_consumptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   uuid NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  -- کدام حساب مصرف کرد (اطلاعاتی — سهمیه به شخص است، نه حساب)
  user_id     uuid,
  kind        text NOT NULL DEFAULT 'ad' CHECK (kind IN ('ad', 'story')),
  -- شناسه‌ی آگهی (products.id)؛ صرفاً اطلاعاتی — با حذفِ آگهی پاک نمی‌شود
  ref_id      uuid,
  consumed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quota_consumptions_person_idx
  ON public.quota_consumptions(person_id, kind, consumed_at DESC);

ALTER TABLE public.persons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_consumptions ENABLE ROW LEVEL SECURITY;

-- ── مصرفِ اتمیک ──────────────────────────────────────────────────
-- قفل روی ردیفِ شخص، شمارش در پنجره‌ی لغزانِ p_window_days روزه،
-- و درج — همه در یک تراکنش؛ دو درخواستِ هم‌زمان نمی‌توانند از سقف
-- عبور کنند (حتی از دو حسابِ مختلفِ یک شخص).
-- p_limit <= 0 یعنی بدونِ سقف (فقط ثبتِ مصرف) — همان قراردادِ موجودِ
-- «صفر = نامحدود» در موتورِ سهمیه.
CREATE OR REPLACE FUNCTION public.bh_consume_quota(
  p_person_id   uuid,
  p_user_id     uuid,
  p_limit       integer,
  p_window_days integer,
  p_ref         uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_used integer;
  v_id   uuid;
BEGIN
  PERFORM 1 FROM public.persons WHERE id = p_person_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'person_not_found');
  END IF;

  SELECT count(*) INTO v_used
    FROM public.quota_consumptions
   WHERE person_id = p_person_id
     AND kind = 'ad'
     AND consumed_at > now() - make_interval(days => GREATEST(1, p_window_days));

  IF p_limit > 0 AND v_used >= p_limit THEN
    RETURN jsonb_build_object('ok', false, 'used', v_used, 'limit', p_limit);
  END IF;

  INSERT INTO public.quota_consumptions (person_id, user_id, kind, ref_id)
  VALUES (p_person_id, p_user_id, 'ad', p_ref)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'used', v_used + 1, 'limit', p_limit, 'consumption_id', v_id);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_consume_quota(uuid, uuid, integer, integer, uuid) FROM PUBLIC, anon, authenticated;

-- ── مقادیرِ پیش‌فرضِ سهمیه‌ی رایگان (بخشِ Quota Table فاز ۳) ─────
-- user/player/referee=۱ · technician/coach=۲ · club_owner/manufacturer/seller=۴
-- دوره: ۳۰ روز (month = ۳۰ روز در موتورِ سهمیه).
-- فقط یک‌بار اعمال می‌شود (مارکر) تا اجرای دوباره‌ی فایل، تنظیمی را که
-- ادمین بعداً از پنل ذخیره کرده بازنویسی نکند.
UPDATE public.app_settings
   SET value = '{
     "default": { "quota": 1, "period": "month" },
     "roles": {
       "user":         { "quota": 1, "period": "month" },
       "player":       { "quota": 1, "period": "month" },
       "referee":      { "quota": 1, "period": "month" },
       "technician":   { "quota": 2, "period": "month" },
       "coach":        { "quota": 2, "period": "month" },
       "club_owner":   { "quota": 4, "period": "month" },
       "manufacturer": { "quota": 4, "period": "month" },
       "seller":       { "quota": 4, "period": "month" }
     }
   }'::jsonb,
       updated_at = now()
 WHERE key = 'ads_free_quota'
   AND NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_016_data_done');

INSERT INTO public.app_settings (key, value)
SELECT 'ads_free_quota', '{
     "default": { "quota": 1, "period": "month" },
     "roles": {
       "user":         { "quota": 1, "period": "month" },
       "player":       { "quota": 1, "period": "month" },
       "referee":      { "quota": 1, "period": "month" },
       "technician":   { "quota": 2, "period": "month" },
       "coach":        { "quota": 2, "period": "month" },
       "club_owner":   { "quota": 4, "period": "month" },
       "manufacturer": { "quota": 4, "period": "month" },
       "seller":       { "quota": 4, "period": "month" }
     }
   }'::jsonb
 WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'ads_free_quota');

INSERT INTO public.app_settings (key, value)
VALUES ('mig_016_data_done', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
