-- ─────────────────────────────────────────────────────────────────
-- ۰۸۱ — نوعِ «درآمدِ ارتقای آگهی» در دفترِ مالی
--
-- ── چه شد ──
-- فروشنده پولِ ارتقای آگهی را داد، درگاه پرداخت را تأیید کرد، و بعد
-- پیام گرفت: «پرداخت انجام شد ولی ارتقا اعمال نشد».
--
-- ── چرا ──
-- `bh_boost_apply` (مهاجرتِ ۰۷۹) در آخرین قدمش یک سطرِ درآمد در دفتر
-- می‌نویسد با نوعِ `AD_BOOST_REVENUE`. ولی قیدِ `ledger_type_chk` —
-- که در مهاجرتِ ۰۵۸ نوشته شده — این نوع را نمی‌شناسد. یعنی درج
-- شکست می‌خورد، **کلِ تراکنش برمی‌گردد**، و همراهش `bumped_at` و
-- `applied_at` هم پاک می‌شوند. سفارش `PENDING` می‌ماند در حالی که
-- پولش گرفته شده.
--
-- مهاجرتِ ۰۷۹ نوعِ تازه‌ای به دفتر اضافه کرد و قید را به‌روز نکرد.
-- همان الگوی همیشگی: دو جا که باید با هم بخوانند و یکی‌شان عقب ماند.
--
-- ── چرا نوعِ جدا و نه همان `AD_REVENUE` ──
-- `/api/admin/finance` این دو را جدا گزارش می‌کند: درآمدِ کمپینِ
-- تبلیغاتی در برابر درآمدِ ارتقای آگهی. یکی‌کردنشان یعنی از فردا
-- نمی‌شود فهمید کدام محصول چقدر فروخته.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_type_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_type_chk CHECK (type IN (
    'BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION','CLUB_EARNING',
    'CLUB_EARNING_REVERSAL','REFUND','CANCELLATION_FEE','SETTLEMENT',
    'SETTLEMENT_REVERSAL','ADJUSTMENT','AD_REVENUE','AD_REFUND',
    'AD_BOOST_REVENUE'));

/* درآمد است، پس مثبت — همان قاعده‌ی علامتیِ بقیه‌ی دفتر */
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_sign_chk;
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_sign_chk CHECK (
    CASE
      WHEN type IN ('BOOKING_PAYMENT','TOURNAMENT_PAYMENT','PLATFORM_COMMISSION',
                    'CLUB_EARNING','CANCELLATION_FEE','SETTLEMENT_REVERSAL',
                    'AD_REVENUE','AD_BOOST_REVENUE')
        THEN amount >= 0
      WHEN type IN ('REFUND','SETTLEMENT','CLUB_EARNING_REVERSAL','AD_REFUND')
        THEN amount <= 0
      ELSE true
    END);

-- ── بررسی ──
-- باید هر دو `t` بدهند.
SELECT
  (SELECT pg_get_constraintdef(oid) LIKE '%AD_BOOST_REVENUE%'
     FROM pg_constraint WHERE conname = 'ledger_type_chk') AS type_ok,
  (SELECT pg_get_constraintdef(oid) LIKE '%AD_BOOST_REVENUE%'
     FROM pg_constraint WHERE conname = 'ledger_sign_chk') AS sign_ok;
