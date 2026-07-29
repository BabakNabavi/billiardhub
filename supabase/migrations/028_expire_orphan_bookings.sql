-- ─────────────────────────────────────────────────────────────────
-- ۰۲۸ — رزروهای معلقی که هیچ‌وقت منقضی نمی‌شدند
--
-- نسخه‌ی قبلیِ `bh_expire_bookings` فقط ردیف‌هایی را می‌گرفت که
-- `expires_at IS NOT NULL AND expires_at < now()`. ولی ۲۵ رزروِ قدیمی
-- `expires_at` خالی داشتند (ساخته‌شده پیش از افزودنِ آن ستون، یا از
-- مسیری که مقدارش را نمی‌گذاشت). نتیجه: تا ابد `PENDING_PAYMENT`
-- می‌ماندند و ساعتشان را اشغال می‌کردند.
--
-- دو شرطِ تازه اضافه می‌شود:
--   • `expires_at` خالی + ساخته‌شده بیش از دو ساعت پیش
--   • تاریخِ خودِ رزرو گذشته باشد (به وقتِ تهران)
--
-- تابع Idempotent است و اجرای دوباره چیزی را خراب نمی‌کند.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_expire_bookings()
RETURNS integer AS $$
DECLARE n int;
BEGIN
  WITH expired AS (
    UPDATE public.bookings
       SET booking_status = 'EXPIRED', status = 'cancelled', "updatedAt" = now()
     WHERE booking_status = 'PENDING_PAYMENT'
       AND (
            /* مهلتِ صریح گذشته */
            (expires_at IS NOT NULL AND expires_at < now())
            /* یا مهلتی ثبت نشده و سفارش کهنه است */
         OR (expires_at IS NULL AND "createdAt" < now() - interval '2 hours')
            /* یا اصلاً روزِ رزرو گذشته است */
         OR ("bookingDate" IS NOT NULL
             AND "bookingDate"::date < (now() AT TIME ZONE 'Asia/Tehran')::date)
       )
     RETURNING id)
  DELETE FROM public.booking_slots s USING expired e WHERE s.booking_id = e.id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_expire_bookings() FROM PUBLIC, anon, authenticated;
