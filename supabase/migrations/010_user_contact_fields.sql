-- ═══════════════════════════════════════════════════════════════════
-- 010 — فیلدهای تماسِ قابلِ ویرایشِ کاربر
--
-- اطلاعاتِ هویتی (نام، کد ملی، تاریخ تولد) یک‌بار استعلام شده‌اند و
-- دیگر تغییر نمی‌کنند؛ ولی نشانی و تلفنِ محلِ کار چیزهایی هستند که
-- کاربر باید بتواند هر وقت خواست عوض کند.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address    text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS work_phone text;

/* تاریخچه‌ی تغییرِ شماره — شماره‌ی قبلی پاک می‌شود ولی باید بدانیم
   چه شماره‌ای، کِی و به چه شماره‌ای عوض شده است. */
CREATE TABLE IF NOT EXISTS public.phone_changes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  old_phone  text        NOT NULL,
  new_phone  text        NOT NULL,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_changes_user_idx ON public.phone_changes (user_id, created_at DESC);

ALTER TABLE public.phone_changes ENABLE ROW LEVEL SECURITY;
