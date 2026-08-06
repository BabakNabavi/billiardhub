-- ═══════════════════════════════════════════════════════════════════════════
-- ۰۶۷ — بازپرداختِ تبلیغات: «تصمیم گرفتیم» با «پول را دادیم» یکی نبود
--
-- ── شکاف ──
-- `bh_refund_ad_order` (مهاجرتِ ۰۵۸) وقتی ادمین بازپرداختی را تأیید می‌کند
-- سه کار می‌کند: وضعیتِ سفارش را `REFUNDED` می‌کند، کمپین را می‌خواباند، و
-- یک ردیفِ `AD_REFUND` در دفتر می‌زند.
--
-- ولی هیچ‌کدامِ این‌ها یعنی **پول به آگهی‌دهنده رسیده**. `refunded_at`
-- لحظه‌ی تصمیم است، نه لحظه‌ی واریز. یعنی بدهی در دفتر ثبت می‌شد و بعد
-- هیچ‌جا فهرست نمی‌شد: نه در جدولِ `refunds` (آن فقط بازپرداختِ رزرو است)
-- و نه در صفحه‌ی «دستور پرداخت».
--
-- نتیجه‌اش بدهیِ نامرئی بود — پولی که باید برود ولی هیچ صفحه‌ای یادآوری‌اش
-- نمی‌کند.
--
-- این دو ستون همان تفکیک را می‌سازند: `refunded_at` = تصمیم،
-- `refund_paid_at` = واریز. تا وقتی دومی خالی است، سفارش در فهرستِ
-- پرداختنی می‌ماند.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.campaign_orders
  ADD COLUMN IF NOT EXISTS refund_paid_at    timestamptz,
  ADD COLUMN IF NOT EXISTS refund_reference  text;

-- فهرستِ «پرداخت‌نشده‌ها» پرس‌وجوی همیشگیِ صفحه‌ی مالی است
CREATE INDEX IF NOT EXISTS campaign_orders_refund_unpaid_idx
  ON public.campaign_orders (refunded_at)
  WHERE status = 'REFUNDED' AND refund_paid_at IS NULL;

COMMIT;

-- ── بررسی ──
-- انتظار: cols = ۲ · unpaid = تعدادِ بازپرداخت‌های تبلیغاتیِ هنوز واریزنشده
SELECT
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema='public' AND table_name='campaign_orders'
       AND column_name IN ('refund_paid_at','refund_reference'))          AS cols,
  (SELECT count(*) FROM public.campaign_orders
     WHERE status='REFUNDED' AND refund_paid_at IS NULL)                  AS unpaid;
