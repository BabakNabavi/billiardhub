-- ═══════════════════════════════════════════════════════════════════
-- 006 — آگهی‌های بیلیارد بازار روی سرور
--
-- تا امروز فرمِ ثبتِ آگهی نتیجه را فقط در localStorageِ مرورگرِ خودِ
-- کاربر می‌نوشت. یعنی آگهی را هیچ‌کسِ دیگری نمی‌دید، با پاک‌شدنِ حافظه‌ی
-- مرورگر از بین می‌رفت، و مهم‌تر: سرور نمی‌دانست کاربر چند آگهی گذاشته،
-- پس هیچ سهمیه‌ای قابلِ اعمال نبود.
--
-- جدولِ products از قبل بود ولی فیلدهای فرمِ آگهی را نداشت.
-- اجرای دوباره‌ی این فایل بی‌خطر است.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS "province"     text,
  ADD COLUMN IF NOT EXISTS "brand"        text,
  ADD COLUMN IF NOT EXISTS "model"        text,
  ADD COLUMN IF NOT EXISTS "type"         text,
  ADD COLUMN IF NOT EXISTS "specs"        jsonb,
  ADD COLUMN IF NOT EXISTS "section"      text,      -- weekly | party | newest
  ADD COLUMN IF NOT EXISTS "sellerName"   text,
  ADD COLUMN IF NOT EXISTS "sellerPhone"  text,
  ADD COLUMN IF NOT EXISTS "sellerWhatsapp" text,
  ADD COLUMN IF NOT EXISTS "address"      text,
  ADD COLUMN IF NOT EXISTS "storeSlug"    text,      -- اگر آگهی‌دهنده فروشگاه دارد
  ADD COLUMN IF NOT EXISTS "expiresAt"    timestamptz;

CREATE INDEX IF NOT EXISTS products_seller_idx  ON public.products ("sellerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS products_status_idx  ON public.products (status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category) WHERE status = 'active';

COMMENT ON COLUMN public.products."storeSlug" IS 'آگهیِ فروشگاه‌دار به صفحه‌ی فروشگاهش وصل می‌شود؛ آگهیِ شخصی این را ندارد';

-- ── تنظیماتِ عمومیِ پلتفرم ───────────────────────────────────────────
-- هرچه باید «آماده ولی خاموش» بماند از این‌جا کنترل می‌شود: سهمیه‌ی
-- آگهی، جایگاه‌های تبلیغاتی، حسابِ مقصدِ فروشِ پلن و…
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

/* مقادیرِ اولیه — همه خاموش، تا هر وقت خودِ ادمین روشن کند */
INSERT INTO public.app_settings (key, value) VALUES
  ('ads_quota_enabled', 'false'::jsonb),
  ('ads_free_quota',    '{"quota": 3, "period": "week"}'::jsonb),
  ('ad_slots_enabled',  'false'::jsonb),
  ('platform_bank',     '{"iban": "", "cardNumber": "", "ownerName": "", "bankName": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
