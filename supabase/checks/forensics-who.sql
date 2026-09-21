-- ─────────────────────────────────────────────────────────────
-- آخرین پرسش: آن سیزده ثبت‌نام کارِ چه کسی بود؟
--
-- ── چرا این پرسش تعیین‌کننده است ──
-- سیزده ثبت‌نامِ ۱۰۰۰ تومانیِ ۱۷ مرداد «پرداخت‌شده» علامت خورده‌اند
-- ولی هیچ ردیفِ پرداختی پشتشان نیست. دو تفسیر دارد:
--
--   الف) خودِ مالک داشته جریانِ مسابقه را تست می‌کرده
--   ب)  کسی از بیرون `bh_tournament_confirm` را صدا زده
--
-- از خودِ ردیف‌ها نمی‌شود فهمید. ولی `user_id` می‌گوید: اگر هر
-- سیزده‌تا مالِ حسابِ خودِ مالک یا چند حسابِ آزمایشی باشند، پرونده
-- بسته است. اگر مالِ کاربرانِ واقعی و متفاوت باشند، باید جدی گرفت.
--
-- ── چرا از خودِ داده نمی‌شود قطعی گفت ──
-- ⚠️ مسیرِ عادیِ ثبت‌نام (`/api/tournaments/[id]/register`) هنگام
-- باز کردنِ درگاه `provider` را پر می‌کند. این سیزده‌تا `provider`
-- خالی دارند، یعنی از آن مسیر **نیامده‌اند** — ولی این هم می‌تواند
-- نسخه‌ی قدیمی‌ترِ کد باشد، هم آپدیتِ دستی حینِ توسعه، هم سوءاستفاده.
--
-- این فایل فقط می‌خواند.
-- ─────────────────────────────────────────────────────────────

\echo '── ۱) هر ثبت‌نام مالِ کدام کاربر، و آن کاربر کیست ──'
SELECT r.created_at, r.status, r.payment_status,
       r.user_id,
       u."firstName" || ' ' || u."lastName" AS who,
       u."primaryRole",
       u."createdAt" AS user_created
  FROM public.tournament_registrations r
  LEFT JOIN public.users u ON u.id = r.user_id
 WHERE r.tournament_id = '61f044da-d7b6-409e-a673-60b8ace3b6ed'
 ORDER BY r.created_at;

\echo ''
\echo '── ۲) چند کاربرِ متمایز؟ ──'
\echo '   یک یا دو ⇒ تستِ خودی. سیزده کاربرِ واقعی ⇒ باید جدی گرفت.'
SELECT count(DISTINCT r.user_id) AS distinct_users,
       count(*)                  AS registrations
  FROM public.tournament_registrations r
 WHERE r.tournament_id = '61f044da-d7b6-409e-a673-60b8ace3b6ed';

\echo ''
\echo '── ۳) در همان بازه، audit_logs چه ثبت کرده ──'
SELECT a.created_at, a.action, a.actor_role, a.entity_type
  FROM public.audit_logs a
 WHERE a.created_at BETWEEN '2026-08-07 10:00:00+00' AND '2026-08-07 20:00:00+00'
 ORDER BY a.created_at
 LIMIT 60;
