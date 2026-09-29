-- ─────────────────────────────────────────────────────────────
-- ۱۰۷ — `bh_expire_bookings` عددِ اشتباه برمی‌گرداند
--
-- ── مسئله ──
-- نسخه‌ی مستقر (مهاجرتِ ۰۲۸) این‌طور تمام می‌شود:
--
--     DELETE FROM booking_slots s USING expired e WHERE s.booking_id = e.id;
--     GET DIAGNOSTICS n = ROW_COUNT;
--     RETURN n;
--
-- ⚠️ `GET DIAGNOSTICS` بعد از `DELETE` است، پس `n` تعدادِ **اسلاتِ
-- پاک‌شده** را می‌شمارد نه تعدادِ **رزروِ منقضی‌شده**. یک رزروِ
-- سه‌ساعته عدد ۳ می‌دهد.
--
-- کرونِ `expire-bookings` همین را به‌عنوان تعدادِ رزرو گزارش می‌کند و
-- در `audit_logs` می‌نویسد. هیچ منطقی به مقدارش وابسته نیست، پس این
-- اصلاحِ گزارش است نه رفتار — ولی عددی که در ژورنال می‌نشیند و کسی
-- بعدا رویش حساب می‌کند باید درست باشد.
--
-- ── ⚠️ بدنه عینا از ۰۲۸ کپی شده، نه از ۰۰۱ ──
-- نسخه‌ی اولِ این مهاجرت را روی ۰۰۱ ساخته بودم و دو چیز را خراب
-- می‌کرد — هر دو را بازبینی گرفت:
--
--   ۱) ستونِ زمانِ `bookings` نامش **`"updatedAt"`** است نه
--      `updated_at`. مهاجرتِ ۰۰۲ *فقط* برای همین نوشته شده. چون
--      اعتبارسنجِ plpgsql نحوی است، `CREATE OR REPLACE` موفق می‌شد و
--      تابع در **اولین فراخوانی** می‌مُرد — و چون `bh_create_booking`
--      اول همین را صدا می‌زند، هر ثبتِ رزرو می‌شکست. بدتر: پیامِ خطا
--      «does not exist» دارد و مسیرِ رزرو آن را به ۵۰۳ «مایگریشن اجرا
--      نشده» ترجمه می‌کند، یعنی به علتِ غلط اشاره می‌کرد.
--
--   ۲) ۰۲۸ **سه** شرطِ انقضا دارد نه یکی. نسخه‌ی اولِ من دو تای آخر را
--      می‌انداخت و همان باگی را برمی‌گرداند که ۰۲۸ برایش نوشته شده
--      بود: رزروِ بدونِ `expires_at` و رزروی که روزش گذشته، تا ابد
--      `PENDING_PAYMENT` می‌ماندند و ساعتشان قفل.
--
-- درسِ ماندگار: پیش از `CREATE OR REPLACE`، **نسخه‌ی مستقر** را پیدا
-- کن، نه اولین تعریف را. `grep -rln '<نامِ تابع>' supabase/migrations/`
--
-- ── اجرا ──
-- با `--single-transaction`.
-- ─────────────────────────────────────────────────────────────

SET lock_timeout = '3s';

CREATE OR REPLACE FUNCTION public.bh_expire_bookings()
RETURNS integer
LANGUAGE plpgsql
AS $$
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
     RETURNING id
  ),
  /* ⚠️ این CTE در پرس‌وجوی اصلی ارجاع داده نمی‌شود ولی **اجرا
     می‌شود**: پستگرس هر CTEی داده‌تغییرده را بی‌قیدوشرط و دقیقا یک بار
     اجرا می‌کند. اسلات‌ها عینا مثل ۰۲۸ آزاد می‌شوند. */
  freed AS (
    DELETE FROM public.booking_slots s USING expired e WHERE s.booking_id = e.id
    RETURNING s.id
  )
  /* تنها تفاوت با ۰۲۸: شمارش از `expired` می‌آید نه از ROW_COUNTِ حذف. */
  SELECT count(*) INTO n FROM expired;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.bh_expire_bookings() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
