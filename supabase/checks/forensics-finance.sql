-- ─────────────────────────────────────────────────────────────
-- بررسیِ پس‌رویداد: آیا از آن درِ باز استفاده شده بود؟
--
-- ── چرا ──
-- تا پیش از مهاجرتِ ۱۰۱، بیست تابعِ `bh_*` از اینترنت قابلِ صدا زدن
-- بودند — از جمله توابعِ مالی:
--
--   bh_create_settlement   ← ساختِ تسویه با باشگاه (خروجِ پول)
--   bh_complete_refund     ← تمام‌شده اعلام‌کردنِ بازپرداخت
--   bh_fail_settlement
--   bh_tournament_confirm  ← تأییدِ پرداختِ ثبت‌نامِ مسابقه
--   bh_complete_booking    ← تبدیلِ رزرو به طلبِ باشگاه
--   bh_finance_totals      ← خواندنِ کلِ ارقامِ مالی
--
-- در بسته‌شدنِ یک در، «بستیم» کافی نیست؛ باید پرسید «قبلش چه شد؟».
-- این فایل فقط **می‌خواند** و هیچ‌چیز را عوض نمی‌کند.
--
-- ── چه چیزی مشکوک است ──
-- هر رکوردِ مالی که از مسیرِ اپ نیامده باشد، `audit_logs` ندارد:
-- مسیرهای اپ همیشه `audit()` را صدا می‌زنند. پس «تسویه‌ای که هیچ
-- ردی در audit ندارد» دقیقا همان الگویی است که دنبالش می‌گردیم.
--
-- ⚠️ نبودِ رکوردِ مشکوک اثباتِ قطعیِ «استفاده نشده» نیست، ولی
-- محتمل‌ترین اثر را پوشش می‌دهد.
-- ─────────────────────────────────────────────────────────────

\echo '── ۱) تسویه‌ها: همه باید ردِ audit داشته باشند ──'
SELECT s.id, s.club_id, s.amount, s.status, s.created_at,
       EXISTS (SELECT 1 FROM public.audit_logs a
                WHERE a.entity_id = s.id::text) AS has_audit
  FROM public.settlements s
 ORDER BY s.created_at DESC
 LIMIT 50;

\echo ''
\echo '── ۲) بازپرداخت‌ها ──'
SELECT r.id, r.status, r.created_at,
       EXISTS (SELECT 1 FROM public.audit_logs a
                WHERE a.entity_id = r.id::text) AS has_audit
  FROM public.refunds r
 ORDER BY r.created_at DESC
 LIMIT 50;

\echo ''
\echo '── ۳) ثبت‌نامِ مسابقه‌ی «پرداخت‌شده» بدونِ ردیفِ پرداخت ──'
\echo '   (bh_tournament_confirm از بیرون یعنی ثبت‌نامِ رایگان)'
SELECT tr.id, tr.tournament_id, tr.status, tr.created_at
  FROM public.tournament_registrations tr
 WHERE tr.status IN ('CONFIRMED', 'PAID')
   AND NOT EXISTS (
     SELECT 1 FROM public.payments p
      WHERE p.status = 'PAID'
        AND (p.booking_id = tr.id OR p.id::text = tr.id::text)
   )
 ORDER BY tr.created_at DESC
 LIMIT 50;

\echo ''
\echo '── ۴) نتیجه‌ی بازی‌هایی که بعد از پایانِ مسابقه عوض شده‌اند ──'
SELECT m.id, m.tournament_id, m.updated_at, t.status AS tournament_status
  FROM public.tournament_matches m
  JOIN public.tournaments t ON t.id = m.tournament_id
 WHERE t.status = 'COMPLETED'
   AND m.updated_at > t.updated_at
 ORDER BY m.updated_at DESC
 LIMIT 50;

\echo ''
\echo '── ۵) خلاصه ──'
SELECT
  (SELECT count(*) FROM public.settlements) AS settlements,
  (SELECT count(*) FROM public.refunds)     AS refunds,
  (SELECT count(*) FROM public.payments WHERE status = 'PAID') AS paid_payments;
