-- ─────────────────────────────────────────────────────────────
-- `updated_at` نظرِ پروفایل را دیتابیس نگه می‌دارد.
--
-- ⚠️ چرا: مسیرِ ذخیره خودش `updated_at` می‌فرستاد، پس همان لحظه‌ی
-- *ساخت* هم با `created_at` چند میلی‌ثانیه فرق می‌کرد و نشانِ
-- «ویرایش‌شده» روی هر نظرِ نو می‌نشست. حالا فقط روی UPDATE ست می‌شود.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profile_reviews_touch ON public.profile_reviews;
CREATE TRIGGER profile_reviews_touch
BEFORE UPDATE ON public.profile_reviews
FOR EACH ROW EXECUTE FUNCTION public.bh_touch_updated_at();

NOTIFY pgrst, 'reload schema';
