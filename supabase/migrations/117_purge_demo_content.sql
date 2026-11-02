-- ─────────────────────────────────────────────────────────────
-- 117 — حذفِ همه‌ی محتوای نمایشی (درخواستِ صریحِ مالک، ۱۱ آبانِ ۱۴۰۵)
--
-- فقط ردیف‌های `is_demo = true` در `profiles` (مربی، داور، فروشگاه،
-- تولیدکننده، خدمات فنی، بازیکن) و `clubs`. حساب‌های کاربری دست
-- نمی‌خورند.
--
-- ✅ اجرا شد روی پروداکشن، ۱۱ آبانِ ۱۴۰۵: ۳ باشگاه، ۰ پروفایل. اسکریپتِ
--    داده‌ی یک‌باره است نه تغییرِ اسکیما — دوباره‌اجرا کاری نمی‌کند.
--    پس از اجرا ۲۲ ستونِ club_id/clubId جست‌وجو شد: ۰ ردیفِ یتیم.
--
-- دو محافظ:
--   ۱. پیش از حذف: جدول‌های پول و رزرو کلیدِ خارجی به clubs ندارند، پس
--      ردیفشان با حذفِ باشگاه یتیم می‌ماند و شمارشی عوض نمی‌شود. هر ردیفی
--      در آن‌ها که به باشگاهِ نمایشی اشاره کند، اجرا را متوقف می‌کند.
--   ۲. پس از حذف: آبشارِ کلیدِ خارجی جدول‌به‌جدول نشان داده می‌شود و اگر
--      به جدولِ حساب، شخص یا پول برسد، همه‌چیز برمی‌گردد. ردیف‌هایی که
--      با ON DELETE SET NULL فقط ستونشان خالی می‌شود را نمی‌بیند.
--
-- پیش‌فرض پیش‌نمایش است (ROLLBACK)؛ ثبت فقط با `-v apply=1`:
--   scp -i C:/Users/bob/.ssh/billiardhub_parspack supabase/migrations/117_purge_demo_content.sql root@130.185.72.87:/tmp/117.sql
--   ssh -i C:/Users/bob/.ssh/billiardhub_parspack root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/117.sql"
-- ─────────────────────────────────────────────────────────────
\set ON_ERROR_STOP on
SET client_min_messages = notice;
BEGIN ISOLATION LEVEL REPEATABLE READ;

\echo ''
\echo '== demo profiles =='
SELECT kind, slug, coalesce(data->>'name', data->>'title', '-') AS name, created_at
  FROM public.profiles WHERE is_demo = true ORDER BY kind, created_at;

\echo '== demo clubs =='
SELECT id, name, city, "createdAt" FROM public.clubs WHERE is_demo = true ORDER BY "createdAt";

DO $$
DECLARE r record; n bigint; bad text := '';
BEGIN
  FOR r IN SELECT * FROM (VALUES
              ('bookings', 'clubId'), ('booking_slots', 'club_id'), ('payments', 'club_id'),
              ('ledger_entries', 'club_id'), ('club_accounts', 'club_id'), ('settlements', 'club_id'),
              ('club_bank_accounts', 'club_id'), ('commission_rules', 'club_id')) v(tbl, col) LOOP
    IF to_regclass('public.' || quote_ident(r.tbl)) IS NULL THEN
      RAISE EXCEPTION 'ABORT: table % not found - check the guard list', r.tbl;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IN (SELECT id FROM public.clubs WHERE is_demo = true)',
                   r.tbl, r.col) INTO n;
    IF n > 0 THEN bad := bad || format('%s.%s=%s ', r.tbl, r.col, n); END IF;
  END LOOP;
  IF bad <> '' THEN
    RAISE EXCEPTION 'ABORT: demo clubs are referenced by money/booking rows: % - nothing was changed', bad;
  END IF;
END $$;

CREATE TEMP TABLE _before (tbl regclass PRIMARY KEY, n bigint) ON COMMIT DROP;
DO $$
DECLARE r record; cnt bigint;
BEGIN
  FOR r IN SELECT oid::regclass AS tbl FROM pg_class
            WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p') LOOP
    EXECUTE format('SELECT count(*) FROM %s', r.tbl) INTO cnt;
    INSERT INTO _before VALUES (r.tbl, cnt);
  END LOOP;
END $$;

DO $$
DECLARE p bigint; c bigint;
BEGIN
  DELETE FROM public.profiles WHERE is_demo = true;
  GET DIAGNOSTICS p = ROW_COUNT;
  DELETE FROM public.clubs WHERE is_demo = true;
  GET DIAGNOSTICS c = ROW_COUNT;
  RAISE NOTICE 'profiles deleted: %, clubs deleted: %', p, c;
END $$;

CREATE TEMP TABLE _after (tbl regclass PRIMARY KEY, n bigint) ON COMMIT DROP;
DO $$
DECLARE r record; cnt bigint;
BEGIN
  FOR r IN SELECT tbl FROM _before LOOP
    EXECUTE format('SELECT count(*) FROM %s', r.tbl) INTO cnt;
    INSERT INTO _after VALUES (r.tbl, cnt);
  END LOOP;
END $$;

\echo '== row count change per table (only tables that changed) =='
SELECT b.tbl AS "table", b.n AS before, a.n AS after, a.n - b.n AS delta
  FROM _before b JOIN _after a USING (tbl) WHERE a.n <> b.n ORDER BY b.tbl::text;

DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(b.tbl::text, ', ') INTO bad
    FROM _before b JOIN _after a USING (tbl)
   WHERE a.n <> b.n
     AND b.tbl::text IN ('users', 'persons', 'bookings', 'booking_slots', 'payments', 'refunds',
                         'ledger_entries', 'club_accounts', 'club_bank_accounts', 'commission_rules',
                         'settlements', 'tournaments', 'tournament_registrations', 'products', 'orders');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'ABORT: demo content is tied to real data in: % - nothing was changed', bad;
  END IF;
  RAISE NOTICE 'post-checks passed';
END $$;

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
