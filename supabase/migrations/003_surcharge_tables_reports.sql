-- ═══════════════════════════════════════════════════════════════════
-- 003 — تنظیمِ هزینه‌ی بازیکنِ اضافه، تکمیلِ جدولِ میزها، و گزارشِ تخلف
-- اجرای دوباره‌ی این فایل بی‌خطر است (همه‌چیز IF NOT EXISTS است).
-- ═══════════════════════════════════════════════════════════════════

-- ── ۱) هزینه‌ی بازیکنِ اضافه — قابلِ تنظیم توسطِ خودِ باشگاه ──────────
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "playerSurchargeEnabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "playerSurchargePercent" integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS "playerSurchargeFrom"    integer NOT NULL DEFAULT 2;

COMMENT ON COLUMN public.clubs."playerSurchargePercent" IS 'درصدِ افزایش به ازای هر بازیکنِ اضافه';
COMMENT ON COLUMN public.clubs."playerSurchargeFrom"    IS 'از این تعداد بازیکن به بالا، هر نفر درصد اضافه می‌شود';

-- ── ۲) میزها: منبعِ حقیقتِ میزهای قابلِ رزرو ─────────────────────────
-- تا امروز میزها فقط در localStorageِ مرورگرِ باشگاه‌دار بودند.
CREATE TABLE IF NOT EXISTS public.tables (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clubId"       uuid        NOT NULL,
  "number"       integer,
  "name"         text,
  "type"         text        NOT NULL DEFAULT 'snooker',
  "brand"        text,
  "model"        text,
  "description"  text,
  "pricePerHour" numeric(12,2) NOT NULL DEFAULT 0,
  "isActive"     boolean     NOT NULL DEFAULT true,
  "createdAt"    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS "name"            text,
  ADD COLUMN IF NOT EXISTS "description"     text,
  ADD COLUMN IF NOT EXISTS "morningDiscount" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discountRules"   jsonb,
  ADD COLUMN IF NOT EXISTS "photoDataUrl"    text;

-- نوعِ میز به text تبدیل می‌شود تا نوع‌های جدید (ایرهاکی و…) هم بپذیرد
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tables'
      AND column_name = 'type' AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.tables ALTER COLUMN "type" TYPE text USING "type"::text;
  END IF;
END $$;

-- نام و شماره اختیاری‌اند (باشگاه‌دار همیشه واردشان نمی‌کند)
ALTER TABLE public.tables ALTER COLUMN "name"   DROP NOT NULL;
ALTER TABLE public.tables ALTER COLUMN "number" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS tables_club_active_idx ON public.tables ("clubId") WHERE "isActive";

-- ── ۳) گزارشِ تخلف (آگهی‌های بیلیارد بازار و سایر محتوا) ─────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type    text        NOT NULL,             -- product | club | user | media | ad
  target_id      text        NOT NULL,
  target_title   text,
  target_url     text,
  reason_code    text        NOT NULL,
  reason_label   text        NOT NULL,
  details        text,
  reporter_id    uuid,
  reporter_name  text,
  reporter_phone text,
  status         text        NOT NULL DEFAULT 'OPEN',   -- OPEN | REVIEWING | RESOLVED | REJECTED
  admin_note     text,
  ip             text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  CONSTRAINT reports_status_chk CHECK (status IN ('OPEN','REVIEWING','RESOLVED','REJECTED'))
);

CREATE INDEX IF NOT EXISTS reports_status_idx  ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_idx  ON public.reports (target_type, target_id);

-- جلوگیری از اسپم: هر کاربر روی هر آگهی فقط یک گزارشِ باز
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_open_per_user_idx
  ON public.reports (target_type, target_id, reporter_id)
  WHERE status = 'OPEN' AND reporter_id IS NOT NULL;

-- به‌روزرسانیِ خودکارِ updated_at
CREATE OR REPLACE FUNCTION public.bh_touch_reports() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_touch ON public.reports;
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.bh_touch_reports();

-- فقط سرویس‌رول (سمتِ سرور) به گزارش‌ها دسترسی دارد
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
