-- ═══════════════════════════════════════════════════════════════════════════
-- ۰۶۳ — پیامک باشگاه به اعضا
--
-- باشگاه‌دار یکی از متن‌های آماده را انتخاب می‌کند، مقدارها را پر می‌کند،
-- هزینه را می‌بیند، پرداخت می‌کند، و پیامک به همه‌ی اعضای باشگاه می‌رود.
--
-- چرا جدول جدا و نه استفاده از `payments`:
-- جدول `payments` حولِ `booking_id` ساخته شده و ستون‌هایش (کمیسیون، سهم
-- باشگاه، تسویه) برای رزرو معنا دارند. چپاندنِ کمپینِ پیامک در آن یعنی
-- نصفِ ستون‌ها همیشه خالی و گزارش‌های مالی آلوده.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- ۱) کمپین
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_sms_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL,

  -- کلیدِ متنِ آماده (کدِ ملی‌پیامکش در app_settings.sms_body_ids است)
  template_key    text NOT NULL,
  -- مقدارهایی که باشگاه‌دار پر کرده — جای {1} به بعد. {0} همیشه نامِ گیرنده است.
  args            jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- عکسِ لحظه‌ی خرید. تعداد اعضا فردا عوض می‌شود؛ فاکتور نباید عوض شود.
  recipient_count int    NOT NULL,
  unit_price      bigint NOT NULL,   -- تومان، به ازای هر گیرنده
  setup_fee       bigint NOT NULL,   -- تومان، هزینه‌ی ثابت
  total_amount    bigint NOT NULL,

  status          text NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_id      uuid,
  provider        text,
  provider_ref    text,

  -- نتیجه‌ی ارسال
  sent_count      int NOT NULL DEFAULT 0,
  failed_count    int NOT NULL DEFAULT 0,
  sent_at         timestamptz,
  error_note      text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT club_sms_status_chk CHECK (
    status IN ('PENDING_PAYMENT', 'PAID', 'SENDING', 'SENT', 'FAILED', 'CANCELED')
  ),
  -- کمپینِ بی‌گیرنده یا با مبلغِ منفی نباید ساخته شود
  CONSTRAINT club_sms_count_chk  CHECK (recipient_count > 0),
  CONSTRAINT club_sms_amount_chk CHECK (total_amount >= 0 AND unit_price >= 0 AND setup_fee >= 0)
);

CREATE INDEX IF NOT EXISTS club_sms_club_idx   ON public.club_sms_campaigns (club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS club_sms_status_idx ON public.club_sms_campaigns (status);

-- پرداختِ باز برای هر باشگاه فقط یکی — جلوی صفِ کمپینِ نیمه‌کاره را می‌گیرد
CREATE UNIQUE INDEX IF NOT EXISTS club_sms_one_open_idx
  ON public.club_sms_campaigns (club_id)
  WHERE status = 'PENDING_PAYMENT';

ALTER TABLE public.club_sms_campaigns ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- ۲) گیرنده‌ها — چه کسی، چه شد
--
-- چرا ردیف‌به‌ردیف: بدونِ آن، «۴۰ تا رفت» یک عدد است و اگر باشگاه‌دار
-- بپرسد «پس چرا فلانی نگرفت؟» هیچ جوابی نیست. کلیدِ مرکب هم یعنی یک
-- گیرنده در یک کمپین بیش از یک‌بار پیامک نمی‌گیرد، حتی اگر ارسال دوباره
-- اجرا شود.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_sms_recipients (
  campaign_id uuid NOT NULL REFERENCES public.club_sms_campaigns(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  mobile      text NOT NULL,
  ok          boolean,
  note        text,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS club_sms_rcpt_camp_idx ON public.club_sms_recipients (campaign_id);
ALTER TABLE public.club_sms_recipients ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- ۳) انصراف عضو از پیامکِ باشگاه
--
-- عضو باید بتواند نه بگوید. بدونِ این، تنها راهِ نگرفتنِ پیامک ترکِ
-- باشگاه است — که یعنی عدد اعضای باشگاه هم می‌پرد.
--
-- پیش‌فرض «می‌خواهم» است (نبودِ ستون = true) تا رفتار امروز عوض نشود.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.club_members
  ADD COLUMN IF NOT EXISTS sms_opt_out boolean NOT NULL DEFAULT false;

-- ───────────────────────────────────────────────────────────────────────────
-- ۴) نرخ‌نامه — در تنظیمات، نه در کد
--
-- قیمت چیزی است که خودِ ادمین عوض می‌کند و نباید دیپلوی بخواهد.
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('club_sms_pricing',
        '{"unitPrice": 200, "setupFee": 2500, "enabled": true}'::jsonb,
        now())
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- بررسی
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema='public' AND table_name='club_sms_campaigns')  AS t_campaigns,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema='public' AND table_name='club_sms_recipients') AS t_recipients,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='club_members'
      AND column_name='sms_opt_out')                                  AS col_opt_out,
  (SELECT count(*) FROM public.app_settings WHERE key='club_sms_pricing') AS pricing_row;
