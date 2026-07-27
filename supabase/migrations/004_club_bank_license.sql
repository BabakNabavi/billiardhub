-- ═══════════════════════════════════════════════════════════════════
-- 004 — شبای باشگاه و شماره‌ی جواز کسب
-- شبا برای تسویه‌ی درآمدِ رزرو لازم است؛ شماره‌ی جواز برای استعلامِ
-- اعتبارِ مجوزِ شغلی و صدورِ تیکِ تأیید.
-- اجرای دوباره‌ی این فایل بی‌خطر است.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "iban"                text,
  ADD COLUMN IF NOT EXISTS "ibanVerified"        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ibanOwnerName"       text,
  ADD COLUMN IF NOT EXISTS "licenseNumber"       text,
  ADD COLUMN IF NOT EXISTS "licenseVerified"     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "licenseCheckedAt"    timestamptz;

COMMENT ON COLUMN public.clubs."iban"          IS 'شبای صاحب باشگاه — مقصدِ تسویه‌ی درآمد رزرو';
COMMENT ON COLUMN public.clubs."ibanVerified"  IS 'نامِ دارنده‌ی شبا با هویتِ صاحب باشگاه تطبیق داده شده';
COMMENT ON COLUMN public.clubs."licenseNumber" IS 'شماره‌ی جواز کسب برای استعلامِ اعتبارِ مجوزِ شغلی';
