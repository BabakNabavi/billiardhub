-- ─────────────────────────────────────────────────────────────
-- ۱۰۸ — پاک‌سازیِ داده‌ی تستی: ۲۰ حسابِ آزمایشی و کلِ تاریخچه‌ی رزرو
--
-- ⚠️ این مهاجرت **داده** پاک می‌کند، نه اسکیما. به درخواستِ صریحِ
-- مالک (۷ مهر ۱۴۰۵):
--   ۱) از ۲۲ کاربر، ۲۰ تا آزمایشی‌اند و باید کاملا پاک شوند. فقط
--      ۰۹۰۰۱۳۲۷۲۸۳ و ۰۹۱۲۱۳۲۷۲۸۳ واقعی‌اند و دست نمی‌خورند.
--   ۲) تاریخچه‌ی رزروها همه تستی بوده و باید پاک شود.
--
-- ── ۱) کاربران ──
-- سیاهه‌ی فقط‌خواندنی پیش از نوشتنِ این فایل (۷ مهر) نشان داد این ۲۰
-- حساب تقریبا هیچ ردیفی ندارند: ۲ نشست و ۲۸ ردیفِ ژورنال. در هیچ
-- جدولِ دارای کلیدِ خارجی (رزرو، پرداخت، باشگاه، محصول، ...) صفر.
--
-- ⚠️ حذف **با فهرستِ صریحِ شناسه‌ها**، نه با «هرکه جز این دو شماره».
-- دومی هر کاربرِ واقعی‌ای را که بینِ نوشتن و اجرای این فایل ثبت‌نام
-- کرده باشد هم پاک می‌کرد. این‌طور فقط همان ۲۰ حسابی پاک می‌شود که
-- دیده شده‌اند.
--
-- ⚠️ `audit_logs` **نگه داشته می‌شود**. ژورنال سابقه‌ی آن‌چه رخ داده
-- است و بازنویسی‌اش کارِ این مهاجرت نیست؛ ۲۸ ردیفِ آن حساب‌ها با
-- شناسه‌ی بی‌صاحب باقی می‌مانند و `bh_prune_audit` در موعدش
-- برمی‌داردشان.
--
-- ── ۲) رزروها ──
-- ۲۷ رزرو، همه برای یک باشگاه («آرتا کلاب»، مالک ۰۹۰۰…۲۸۳)، همه
-- توسطِ همان دو حسابِ واقعی. ۶ پرداختِ واقعیِ پی‌پینگ (جمعا ۸٬۴۰۰
-- تومان) که ۲ تایش برگشت خورده.
--
-- ⚠️ ردِ مالی هم پاک می‌شود — پرداخت، برگشت، و ردیف‌های دفتر. اگر
-- فقط رزروها پاک می‌شدند:
--   • ۲۵ پرداخت به رزروی اشاره می‌کردند که وجود ندارد،
--   • پنلِ مالی ۱۱٬۱۰۰ تومان «درآمدِ رزرو» نشان می‌داد برای هیچ رزروی،
--   • و `club_accounts` ۷٬۵۰۵ تومان طلبِ باشگاه برای رزروهای ناموجود
--     نگه می‌داشت که روزی به‌عنوانِ تسویه پرداخت می‌شد.
-- رکوردهای خودِ پی‌پینگ دست نمی‌خورند.
--
-- ⚠️ دفتر (`ledger_entries`) با تریگرِ `ledger_append_only` (۰۴۰)
-- حذف‌ناپذیر است. این فایل آن تریگر را **فقط داخلِ همین تراکنش**
-- خاموش و بلافاصله روشن می‌کند، و پیش از COMMIT روشن‌بودنش را
-- بررسی می‌کند. اگر هرجا خطا بدهد، ROLLBACK خاموش‌کردن را هم
-- برمی‌گرداند — تریگر هرگز خاموش نمی‌ماند.
--
-- ردیف‌های دفترِ مسابقه (treg) و تبلیغات (adorder/boost) دست
-- نمی‌خورند. `club_accounts` بعد از حذف از روی دفتر بازساخته می‌شود.
--
-- ── ایمنی ──
-- هر فرضی که این فایل بر آن بنا شده، اول چک می‌شود و اگر دیتابیس از
-- سیاهه فاصله گرفته باشد کل کار متوقف می‌شود: تعدادِ دقیقِ ۲۰، وجودِ
-- هر دو حسابِ واقعی، صفر بودنِ دارایی‌های مالیِ آن ۲۰، ۲۷ رزرو،
-- و نبودِ هیچ تسویه‌ای (تسویه یعنی پولِ واقعی به باشگاه رفته و این
-- ردیف‌ها دیگر «تستی» نیستند).
--
-- ── اجرا ──
-- ⚠️ پیش‌فرض **پیش‌نمایش** است: همه‌ی کار انجام می‌شود، عددها چاپ
-- می‌شوند، و در آخر ROLLBACK. برای ثبتِ واقعی باید صریحا
-- `-v apply=1` داد. پیام‌ها عمدا انگلیسی‌اند تا در کنسولِ PowerShell
-- خوانا بمانند. فایل با scp کپی و روی خودِ سرور اجرا می‌شود — همان
-- روشِ ۱۰۹ — تا هیچ لوله‌ی PowerShellی متن را دست نزند.
--
--   scp -i "$env:USERPROFILE\.ssh\billiardhub_parspack" supabase/migrations/108_cleanup_test_data.sql root@130.185.72.87:/tmp/108.sql
--   پیش‌نمایش:
--     ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/108.sql"
--   ثبت:
--     ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -v apply=1 < /tmp/108.sql"
--
--   (هر کدام تک‌خطی. `--single-transaction` عمدا نیست: فایل خودش
--   BEGIN/COMMIT/ROLLBACK دارد.)
--
-- ⚠️ DISABLE TRIGGER تا COMMIT قفلِ SHARE ROW EXCLUSIVE روی
-- ledger_entries نگه می‌دارد؛ هر تأییدِ پرداختی تا پایانِ اجرا منتظر
-- می‌ماند. اجرا چند ثانیه است، ولی ساعتِ کم‌ترافیک بهتر است.
--
-- اجرای دوباره بی‌خطر است: بعد از ثبت، آن ۲۰ حساب دیگر وجود ندارند و
-- اولین نگهبان کار را متوقف می‌کند.
-- ─────────────────────────────────────────────────────────────

SET lock_timeout = '3s';
SET client_min_messages = notice;

BEGIN;

-- ── فهرستِ صریحِ حساب‌های آزمایشی (از سیاهه‌ی ۷ مهر) ──
CREATE TEMP TABLE _doomed (id uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _doomed (id) VALUES
  ('2f13abcb-3440-41ea-a862-817cf9c42c66'),  -- 0910***096  user        2026-06-21
  ('6fff5da1-4c22-47e6-be96-111a22c23cb8'),  -- 0935***220  user        2026-06-22
  ('a8a1c534-df17-4bcf-9740-c7a6439bd03d'),  -- 0935***200  user        2026-06-22
  ('49706290-1667-4f11-a478-36a92213471a'),  -- 0912***000  user        2026-06-22
  ('be341132-3e2e-4c70-96af-23d00fc3c565'),  -- 0912***001  club_owner  2026-06-22
  ('25aa01c7-0ca3-4477-be31-f11f1224e84b'),  -- 0912***003  user        2026-06-23
  ('e9704d9e-b615-4b5e-b1af-9bb1c6581170'),  -- 0912***004  user        2026-06-23
  ('a27e4440-eaae-40e4-be2c-a245b674bcaf'),  -- 0912***005  user        2026-06-24
  ('163efc99-aff4-4db9-814a-63765749740d'),  -- 0912***006  user        2026-06-24
  ('88c520e5-52a9-47f7-8731-d9f6b2e52ec8'),  -- 0912***007  club_owner  2026-06-25
  ('5749f25e-f953-45eb-ab6f-a5a14ddcde1e'),  -- 0912***008  user        2026-06-26
  ('f21b36e1-e5e7-465f-b4f0-0d3f80d215db'),  -- 0912***010  user        2026-06-28
  ('e59691e7-c83a-4a5e-bc71-57b89340c852'),  -- 0912***011  user        2026-06-28
  ('2015b625-7fc4-4a73-8bfb-5bb4552b2d96'),  -- 0912***013  user        2026-06-28
  ('ed031289-201e-46e8-b28a-a0aac34831b4'),  -- 0912***015  club_owner  2026-06-28
  ('e31dd4b4-0568-428c-938a-257b22fbcb2d'),  -- 0912***979  club_owner  2026-07-02
  ('d86acdb4-66cc-4247-9f2d-e919f1544c0b'),  -- 0912***016  user        2026-07-23
  ('c989fe32-8af3-4c2b-b709-1b300bf18bd2'),  -- 0912***018  user        2026-07-23
  ('ec4e070e-caff-41a0-9ce7-0beabf651007'),  -- 0912***007  user        2026-07-29
  ('eb1033bc-0350-4cf0-9ed4-75d8db079027');  -- 0999***191  user        2026-08-04

-- ── رزروها و پرداخت‌هایشان، همان‌طور که الان هستند ──
CREATE TEMP TABLE _b ON COMMIT DROP AS
  SELECT id, "clubId" AS club_id FROM public.bookings;
CREATE TEMP TABLE _p ON COMMIT DROP AS
  SELECT id FROM public.payments WHERE booking_id IN (SELECT id FROM _b);

-- ─────────────────────────────────────────────────────────────
-- نگهبان‌ها — هرکدام نخواند، کل کار متوقف می‌شود
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.users u JOIN _doomed d USING (id);
  IF n <> 20 THEN
    RAISE EXCEPTION 'ABORT: expected exactly 20 test users, found % (already applied, or data drifted)', n;
  END IF;

  SELECT count(*) INTO n FROM public.users u JOIN _doomed d USING (id)
   WHERE u.phone IN ('09001327283', '09121327283');
  IF n <> 0 THEN RAISE EXCEPTION 'ABORT: a real account is in the delete list'; END IF;

  SELECT count(*) INTO n FROM public.users
   WHERE phone IN ('09001327283', '09121327283')
     AND id NOT IN (SELECT id FROM _doomed);
  IF n <> 2 THEN RAISE EXCEPTION 'ABORT: expected 2 real accounts, found %', n; END IF;

  /* آن ۲۰ حساب نباید هیچ دارایی‌ای داشته باشند — سیاهه صفر گفت */
  SELECT (SELECT count(*) FROM public.bookings        WHERE "userId"  IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.payments        WHERE user_id   IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.ledger_entries  WHERE user_id   IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.clubs           WHERE "ownerId" IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.products        WHERE "sellerId" IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.tournament_registrations WHERE user_id IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.tournaments     WHERE created_by IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.club_accounts   WHERE owner_id  IN (SELECT id FROM _doomed))
    INTO n;
  IF n <> 0 THEN
    RAISE EXCEPTION 'ABORT: test users now own % money/club/product rows - re-inventory first', n;
  END IF;

  SELECT count(*) INTO n FROM _b;
  IF n <> 27 THEN
    RAISE EXCEPTION 'ABORT: expected 27 bookings, found % - a new booking may be real', n;
  END IF;

  SELECT count(*) INTO n FROM public.settlements;
  IF n <> 0 THEN
    RAISE EXCEPTION 'ABORT: % settlement(s) exist - real money was paid out, bookings are not test-only', n;
  END IF;

  SELECT count(*) INTO n FROM public.bookings WHERE settled_in IS NOT NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'ABORT: % booking(s) already settled', n; END IF;

  SELECT count(*) INTO n FROM public.payments
   WHERE id IN (SELECT id FROM _p) AND tournament_registration_id IS NOT NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'ABORT: % booking payment(s) also linked to a tournament', n; END IF;
END $$;

/* ⚠️ آبشارِ کلیدِ خارجی. حذفِ کاربر می‌تواند از راهِ ON DELETE CASCADE
   ردیف‌هایی را هم ببرد که هیچ‌جای این فایل نامشان را نبرده (علاقه‌مندی،
   نظر، لایک، جلسه‌ی مربی، …). سیاهه‌ی ۷ مهر در همه صفر بود، ولی این
   نگهبان آن را در لحظه‌ی اجرا دوباره می‌سنجد: هر کلیدِ خارجی‌ای که به
   users اشاره می‌کند شمرده می‌شود و اگر ردیفی از این ۲۰ حساب داشته
   باشد، کل کار متوقف می‌شود. `sessions` تنها استثناست — صریحا پایین
   پاک می‌شود. */
DO $$
DECLARE fk record; n bigint;
BEGIN
  FOR fk IN
    SELECT c.conrelid::regclass AS tbl, a.attname AS col
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
     WHERE c.contype = 'f'
       AND c.confrelid = 'public.users'::regclass
       AND array_length(c.conkey, 1) = 1
       /* فقط کلیدهایی که به users.id اشاره می‌کنند؛ مقایسه با شناسه‌ی
          uuid روی ستونِ دیگری خطای نوع می‌داد */
       AND c.confkey[1] = (SELECT attnum FROM pg_attribute
                            WHERE attrelid = 'public.users'::regclass AND attname = 'id')
  LOOP
    CONTINUE WHEN fk.tbl = 'public.sessions'::regclass;
    EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT id FROM _doomed)', fk.tbl, fk.col)
      INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'ABORT: %.% has % row(s) for the test users - deleting would cascade into data this file does not list',
        fk.tbl, fk.col, n;
    END IF;
  END LOOP;
END $$;

-- ── گزارشِ پیش از حذف ──
\echo ''
\echo '== triggers on affected tables (anything besides ledger_append_only is unexpected) =='
SELECT c.relname AS "table", t.tgname AS "trigger", t.tgenabled AS enabled
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
 WHERE NOT t.tgisinternal
   AND c.relnamespace = 'public'::regnamespace
   AND c.relname IN ('users','sessions','bookings','booking_slots','payments',
                     'refunds','ledger_entries','club_accounts')
 ORDER BY 1, 2;

\echo '== ledger totals by type, BEFORE =='
SELECT type, count(*) AS n, sum(amount) AS total
  FROM public.ledger_entries GROUP BY type ORDER BY type;

-- ─────────────────────────────────────────────────────────────
-- ۲) تاریخچه‌ی رزرو + ردِ مالی‌اش
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.ledger_entries DISABLE TRIGGER ledger_append_only;

DO $$
DECLARE n bigint;
BEGIN
  DELETE FROM public.ledger_entries
   WHERE booking_id IN (SELECT id FROM _b) OR payment_id IN (SELECT id FROM _p);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'ledger_entries deleted: %', n;
END $$;

ALTER TABLE public.ledger_entries ENABLE TRIGGER ledger_append_only;

DO $$
DECLARE n bigint;
BEGIN
  DELETE FROM public.refunds
   WHERE booking_id IN (SELECT id FROM _b) OR payment_id IN (SELECT id FROM _p);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'refunds deleted:        %', n;

  DELETE FROM public.payments WHERE id IN (SELECT id FROM _p);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'payments deleted:       %', n;

  DELETE FROM public.booking_slots WHERE booking_id IN (SELECT id FROM _b);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'booking_slots deleted:  %', n;

  DELETE FROM public.bookings WHERE id IN (SELECT id FROM _b);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'bookings deleted:       %', n;
END $$;

/* کَشِ موجودیِ باشگاه از روی دفترِ تازه بازساخته شود */
SELECT r.club_id, r.available_balance, r.total_earnings, r.total_commission
  FROM (SELECT DISTINCT club_id FROM _b WHERE club_id IS NOT NULL) x,
       LATERAL public.bh_reconcile_club_account(x.club_id) r;

-- ─────────────────────────────────────────────────────────────
-- ۱) حساب‌های آزمایشی
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE n bigint;
BEGIN
  DELETE FROM public.sessions WHERE user_id IN (SELECT id FROM _doomed);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'sessions deleted:       %', n;

  DELETE FROM public.users WHERE id IN (SELECT id FROM _doomed);
  GET DIAGNOSTICS n = ROW_COUNT;  RAISE NOTICE 'users deleted:          %', n;
  IF n <> 20 THEN RAISE EXCEPTION 'ABORT: deleted % users, expected 20', n; END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- بررسیِ پایانی — پیش از COMMIT
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE n bigint; st "char";
BEGIN
  SELECT t.tgenabled INTO st FROM pg_trigger t
   WHERE t.tgname = 'ledger_append_only' AND t.tgrelid = 'public.ledger_entries'::regclass;
  IF st IS DISTINCT FROM 'O' THEN
    RAISE EXCEPTION 'ABORT: ledger_append_only is not enabled (state=%)', st;
  END IF;

  SELECT count(*) INTO n FROM public.users
   WHERE phone IN ('09001327283', '09121327283');
  IF n <> 2 THEN RAISE EXCEPTION 'ABORT: real accounts after cleanup = %', n; END IF;

  SELECT count(*) INTO n FROM public.bookings;
  IF n <> 0 THEN RAISE EXCEPTION 'ABORT: % bookings remain', n; END IF;

  SELECT count(*) INTO n FROM public.ledger_entries
   WHERE booking_id IS NOT NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'ABORT: % ledger rows still point at bookings', n; END IF;

  SELECT count(*) INTO n FROM public.payments WHERE booking_id IS NOT NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'ABORT: % payments still point at bookings', n; END IF;

  RAISE NOTICE 'all post-checks passed; ledger_append_only is enabled';
END $$;

\echo '== ledger totals by type, AFTER =='
SELECT type, count(*) AS n, sum(amount) AS total
  FROM public.ledger_entries GROUP BY type ORDER BY type;

\echo '== remaining users =='
SELECT count(*) AS users_left FROM public.users;

-- ⚠️ دو لایه: `:{?apply}` فقط «تعریف شده؟» را می‌پرسد، پس `-v apply=0`
-- هم ثبت می‌کرد. لایه‌ی دوم خودِ مقدار را می‌سنجد.
\if :{?apply}
\if :apply
COMMIT;
\echo '>>> APPLIED. Changes are committed.'
\else
ROLLBACK;
\echo '>>> PREVIEW ONLY - apply was set but not true. Nothing was changed.'
\endif
\else
ROLLBACK;
\echo '>>> PREVIEW ONLY - nothing was changed. Re-run with -v apply=1 to commit.'
\endif
