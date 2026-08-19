-- ─────────────────────────────────────────────────────────────
-- امتیاز و نظر برای پروفایل‌ها (فعلاً مربی).
--
-- ── چرا جدولِ تازه و نه ستونِ دستی ──
-- کارتِ مربی در صفحه‌ی باشگاه یک فیلدِ «امتیاز» داشت که خودِ باشگاه‌دار
-- تایپ می‌کرد. عددی که صاحبِ کسب‌وکار درباره‌ی خودش می‌نویسد امتیاز
-- نیست. یا باید برداشته شود یا پشتش داده‌ی واقعی باشد.
--
-- ── چرا کپیِ `club_reviews` نه، بلکه همان الگو ──
-- سیستمِ نظرِ باشگاه از قبل هست و خوب کار می‌کند: یک نظر برای هر
-- کاربر، پنهان‌کردن بدونِ حذفِ امتیاز، و میانگینی که تریگر نگه
-- می‌دارد. همان ساختار این‌جا تکرار می‌شود با یک تفاوت: کلید
-- «نوعِ پروفایل + شناسه»، تا داور و خدماتِ فنی هم بعداً بدونِ جدولِ
-- سومی اضافه شوند.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profile_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  rating      smallint NOT NULL,
  comment     text,
  /* نظر می‌تواند پنهان شود (گزارشِ کاربران) بدونِ حذفِ امتیاز */
  is_hidden   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profile_reviews_rating_chk  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT profile_reviews_comment_chk CHECK (comment IS NULL OR length(comment) <= 1000),
  CONSTRAINT profile_reviews_one_per_user UNIQUE (profile_id, user_id)
);

CREATE INDEX IF NOT EXISTS profile_reviews_profile_idx ON public.profile_reviews (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_reviews_user_idx    ON public.profile_reviews (user_id);

ALTER TABLE public.profile_reviews ENABLE ROW LEVEL SECURITY;
-- خواندن/نوشتن فقط سرورساید با service-role — مثلِ `club_reviews`.

-- ستون‌های تجمیعی روی خودِ پروفایل: کارت و فهرست بدونِ join می‌خوانند
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rating_avg   numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer      NOT NULL DEFAULT 0;

-- تریگر: میانگین همیشه با واقعیتِ جدولِ نظرها می‌خواند.
-- نظرِ پنهان‌شده در میانگین حساب نمی‌شود.
CREATE OR REPLACE FUNCTION public.bh_profile_rating_refresh()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile uuid;
BEGIN
  v_profile := COALESCE(NEW.profile_id, OLD.profile_id);
  UPDATE profiles p
     SET rating_count = sub.n,
         rating_avg   = COALESCE(sub.avg, 0)
    FROM (
      SELECT count(*)::int AS n, round(avg(rating)::numeric, 2) AS avg
        FROM profile_reviews
       WHERE profile_id = v_profile AND is_hidden = false
    ) sub
   WHERE p.id = v_profile;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS profile_reviews_agg ON public.profile_reviews;
CREATE TRIGGER profile_reviews_agg
AFTER INSERT OR UPDATE OR DELETE ON public.profile_reviews
FOR EACH ROW EXECUTE FUNCTION public.bh_profile_rating_refresh();

-- بدونِ این، PostgREST تا ری‌استارتِ بعدی جدول و ستون‌های تازه را
-- نمی‌شناسد و مسیرِ امتیاز بی‌صدا ۴۰۴/۲۰۰ِ ناقص می‌دهد.
NOTIFY pgrst, 'reload schema';
