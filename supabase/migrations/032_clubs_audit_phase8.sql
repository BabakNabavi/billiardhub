-- ─────────────────────────────────────────────────────────────
-- PHASE 8 — ممیزیِ ماژولِ باشگاه‌ها
--
-- ۱) علتِ رد + تاریخچه‌ی بازبینی
-- ۲) FKهای غایب (یتیم‌شدنِ خاموشِ رکوردها)
-- ۳) ایندکس‌های لازم برای فیلترهای سمتِ سرور
-- ۴) پاک‌سازیِ داده‌ی قدیمی که وضعیتش با دیده‌شدنش نمی‌خواند
-- ─────────────────────────────────────────────────────────────

-- ══ ۱) علتِ رد ══
-- ادمین «رد» را می‌زد ولی هیچ جایی برای نوشتنِ علت نبود، پس مالکِ
-- باشگاه فقط می‌دید «رد شد» و نمی‌دانست چه چیزی را اصلاح کند.
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "rejectionReason" text,
  ADD COLUMN IF NOT EXISTS "reviewedAt"      timestamptz,
  ADD COLUMN IF NOT EXISTS "reviewedBy"      uuid,
  -- شمارنده‌ی ارسالِ دوباره: مالک بعد از اصلاح دوباره می‌فرستد
  ADD COLUMN IF NOT EXISTS "submissionCount" integer NOT NULL DEFAULT 1;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_verification_chk') THEN
    ALTER TABLE public.clubs ADD CONSTRAINT clubs_verification_chk
      CHECK ("verificationStatus" IN ('pending','verified','rejected','unverified'));
  END IF;
END $$;

-- ══ ۲) FKهای غایب ══
-- بدونِ این‌ها، حذفِ یک باشگاه رکوردهای وابسته را یتیم می‌گذاشت و
-- هیچ خطایی هم نمی‌داد — بدترین حالت: داده‌ی نامعتبرِ خاموش.

-- مسابقه بدونِ باشگاه بی‌معنی است ⇒ با حذفِ باشگاه می‌رود.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_club_fk') THEN
    DELETE FROM public.tournaments t
     WHERE NOT EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = t.club_id);
    ALTER TABLE public.tournaments
      ADD CONSTRAINT tournaments_club_fk FOREIGN KEY (club_id)
      REFERENCES public.clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_bank_club_fk') THEN
    DELETE FROM public.club_bank_accounts a
     WHERE NOT EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = a.club_id);
    ALTER TABLE public.club_bank_accounts
      ADD CONSTRAINT club_bank_club_fk FOREIGN KEY (club_id)
      REFERENCES public.clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_members_club_fk') THEN
    DELETE FROM public.club_members m
     WHERE NOT EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = m.club_id);
    ALTER TABLE public.club_members
      ADD CONSTRAINT club_members_club_fk FOREIGN KEY (club_id)
      REFERENCES public.clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ══ ۳) ایندکس‌های فیلترِ سمتِ سرور ══
-- فهرستِ عمومی حالا روی (isActive, verificationStatus) و شهر فیلتر
-- می‌کند؛ بدونِ ایندکس هر جستجو یک Seq Scan است.
CREATE INDEX IF NOT EXISTS clubs_public_idx
  ON public.clubs ("isActive", "verificationStatus");
CREATE INDEX IF NOT EXISTS clubs_city_idx     ON public.clubs (city);
CREATE INDEX IF NOT EXISTS clubs_province_idx ON public.clubs (province);
CREATE INDEX IF NOT EXISTS clubs_owner_idx    ON public.clubs ("ownerId");

-- ══ ۴) داده‌ی قدیمیِ ناسازگار ══
-- هشت باشگاه با وضعیتِ pending/unverified همچنان `isActive=true` بودند
-- و در فهرستِ عمومی دیده می‌شدند. حالا که فهرست هر دو ستون را می‌خواند
-- خودبه‌خود پنهان می‌شوند؛ ولی وضعیتِ ذخیره‌شده هم باید با واقعیت بخواند
-- تا در صفِ تأییدِ ادمین درست دسته‌بندی شوند.
--
-- عمداً حذف یا تأیید نمی‌شوند — فقط به صفِ بررسی می‌روند.
UPDATE public.clubs
   SET "isActive" = false
 WHERE "isActive" = true
   AND "verificationStatus" IS DISTINCT FROM 'verified';

-- باشگاهی که هیچ وضعیتی ندارد، «در انتظار» است نه «بدون مدرک»
UPDATE public.clubs
   SET "verificationStatus" = 'pending'
 WHERE "verificationStatus" IS NULL;
