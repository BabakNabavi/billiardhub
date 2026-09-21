-- ─────────────────────────────────────────────────────────────
-- بررسیِ پس‌رویداد — نسخه‌ی اصلاح‌شده‌ی ثبت‌نامِ مسابقات
--
-- ⚠️ کوئریِ قبلی در `forensics-finance.sql` (بخشِ ۳) **غلط بود** و
-- سیزده ردیفِ بی‌گناه را مشکوک نشان داد. روی
-- `payments.booking_id = registration.id` جوین می‌زد، در حالی که
-- جدولِ `tournament_registrations` ستونِ `payment_id` خودش را دارد
-- (مهاجرتِ ۰۲۶، خط ۶۹) و پرداخت از همان‌جا وصل می‌شود.
--
-- ── پرسشِ درست ──
-- «CONFIRMEDِ بدونِ پرداخت» به‌تنهایی هیچ معنایی ندارد: مسابقه‌ی
-- رایگان (`amount = 0`) دقیقا همین شکل است، و تأییدِ دستیِ
-- باشگاه‌دار از پنل هم همین‌طور.
--
-- چیزی که واقعا نشانه‌ی سوءاستفاده از `bh_tournament_confirm` است،
-- این است: ثبت‌نامی که **پولی** بوده (`amount > 0`)، **پرداخت‌شده**
-- علامت خورده، ولی هیچ ردیفِ پرداختِ واقعی پشتش نیست.
--
-- این فایل فقط می‌خواند.
-- ─────────────────────────────────────────────────────────────

\echo '── ۱) مسابقه‌ها و ورودیِ هرکدام ──'
\echo '   اگر amount صفر باشد، «تأییدشده بدونِ پرداخت» کاملا عادی است.'
SELECT t.id, t.status,
       count(r.id)                                   AS registrations,
       count(*) FILTER (WHERE r.amount > 0)          AS paid_tier,
       count(*) FILTER (WHERE r.amount = 0)          AS free_tier
  FROM public.tournaments t
  LEFT JOIN public.tournament_registrations r ON r.tournament_id = t.id
 GROUP BY t.id, t.status
 ORDER BY registrations DESC;

\echo ''
\echo '── ۲) نشانه‌ی واقعیِ سوءاستفاده ──'
\echo '   پولی + پرداخت‌شده + بدونِ ردیفِ پرداختِ واقعی. باید خالی باشد.'
SELECT r.id, r.tournament_id, r.amount, r.status, r.payment_status,
       r.provider, r.provider_ref_id, r.paid_at
  FROM public.tournament_registrations r
 WHERE r.amount > 0
   AND (r.payment_status = 'PAID' OR r.paid_at IS NOT NULL)
   AND NOT EXISTS (
     SELECT 1 FROM public.payments p
      WHERE p.id = r.payment_id AND p.status = 'PAID'
   )
 ORDER BY r.created_at DESC;

\echo ''
\echo '── ۳) همان سیزده ردیف، این‌بار با ستون‌های درست ──'
SELECT r.id, r.amount, r.status, r.payment_status,
       r.payment_id IS NOT NULL AS has_payment_id,
       r.provider_ref_id, r.created_at
  FROM public.tournament_registrations r
 ORDER BY r.created_at DESC
 LIMIT 20;

\echo ''
\echo '── ۴) شش پرداختِ موفقِ سیستم به چه چیزی وصل‌اند ──'
SELECT p.id, p.amount, p.status, p.provider, p.booking_id IS NOT NULL AS has_booking, p.created_at
  FROM public.payments p
 WHERE p.status = 'PAID'
 ORDER BY p.created_at DESC;
