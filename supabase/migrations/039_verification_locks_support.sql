-- ═══════════════════════════════════════════════════════════════════
-- قفلِ استعلام‌های پولی + مسیرِ واقعیِ تیکتِ پشتیبانی
--
-- انگیزه: هر استعلامِ کد پستی و هر تطبیقِ کارت، اعتبارِ سرویسِ بیرونی
-- را مصرف می‌کند و برای ما هزینه دارد. تا امروز کاربر می‌توانست بی‌شمار
-- بار کد پستی عوض کند و دوباره استعلام بگیرد؛ قفلی که در UI بود، حالتِ
-- ری‌اکت بود و با یک رفرش از بین می‌رفت — و سمتِ سرور هیچ قفلی نبود.
--
-- از این پس یک استعلامِ موفق = قفل. تغییر فقط از راه تیکتِ پشتیبانی و
-- بازکردنِ آگاهانه‌ی ادمین.
--
-- چرا جدولِ تیکت هم این‌جاست: فرمِ «تماس با ما» به بک‌اندِ مرده‌ی
-- NestJS پست می‌کرد و در شکست، پیام را در localStorageی خودِ کاربر
-- می‌گذاشت — یعنی هیچ‌کس هرگز آن را نمی‌دید. قفل‌کردنِ کاربر و ارجاعش
-- به فرمی که پیام را دور می‌ریزد، یعنی بن‌بست.
-- ═══════════════════════════════════════════════════════════════════

-- ── ۱) قفلِ کد پستیِ باشگاه ───────────────────────────────────────
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "postalCodeVerified" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "postalCodeVerifiedAt" timestamptz;

COMMENT ON COLUMN public.clubs."postalCodeVerified" IS
  'کد پستی یک بار با موفقیت استعلام شده؛ استعلامِ دوباره تا بازکردنِ ادمین مسدود است';

-- ── ۲) قفلِ کارتِ بانکیِ کاربر ──────────────────────────────────
-- (باشگاه از قبل "ibanVerified" و "bankCardVerified" دارد — مهاجرت‌های ۰۰۴ و ۰۲۴)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bank_card_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_card_verified_at timestamptz;

COMMENT ON COLUMN public.users.bank_card_verified IS
  'کارت یک بار با CardMatch تأیید شده؛ ثبتِ کارتِ تازه تا بازکردنِ ادمین مسدود است';

-- ── ۳) بک‌فیل ───────────────────────────────────────────────────
-- هرکس امروز کارت یا کد پستیِ ذخیره‌شده دارد، استعلامش قبلاً موفق بوده.
-- بدونِ این، همه‌ی کاربرانِ فعلی یک استعلامِ رایگانِ اضافه می‌گرفتند.
UPDATE public.users
   SET bank_card_verified = true,
       bank_card_verified_at = COALESCE(bank_card_verified_at, now())
 WHERE bank_card IS NOT NULL AND bank_card <> '' AND bank_card_verified = false;

UPDATE public.clubs
   SET "postalCodeVerified" = true,
       "postalCodeVerifiedAt" = COALESCE("postalCodeVerifiedAt", now())
 WHERE "postalCode" ~ '^[0-9]{10}$' AND "postalCodeVerified" = false;

-- ── ۴) تیکتِ پشتیبانی ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- کاربرِ واردشده اگر بود؛ فرمِ تماس برای مهمان هم باز است
  user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name        text NOT NULL,
  email       text,
  phone       text,
  subject     text NOT NULL,
  message     text NOT NULL,
  -- باشگاهی که تیکت درباره‌ی آن است (برای درخواستِ تغییر کد پستی)
  club_id     uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved', 'rejected')),
  -- یادداشتِ داخلیِ ادمین؛ به کاربر نشان داده نمی‌شود
  admin_note  text,
  handled_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  handled_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- صفحه‌ی ادمین همیشه «بازها، تازه‌ترین اول» را می‌خواهد
CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx
  ON public.support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_user_idx
  ON public.support_tickets (user_id);

COMMENT ON TABLE public.support_tickets IS
  'پیام‌های فرمِ تماس با ما + درخواست‌های تغییر کد پستی و اطلاعات بانکی';

-- نوشتن فقط از سرور (service-role) انجام می‌شود
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
