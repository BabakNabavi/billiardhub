-- ─────────────────────────────────────────────────────────────
-- ۱۱۶ — حذفِ کاملِ چهار حساب از دیتابیس (درخواستِ صریحِ مالک، ۱۱ آبانِ ۱۴۰۵)
--
--   زهره امینی          09936333087   (ثبت‌نام با تاریخ تولدِ تأییدنشده)
--   آزمونِ اعمال الف    09000000101   (حساب‌های scripts/test-enforcement-live.mjs)
--   آزمونِ اعمال ب      09000000102
--   آزمونِ اعمال پ      09000000103   (ادمینِ آزمونی با مجوزِ users — عمدا مجاز)
--
-- ⚠️ این فایل **داده** پاک می‌کند، نه اسکیما. فایل‌های Storage این‌جا نیستند —
-- apps/web/scripts/purge-users.mjs. ترتیبِ درست:
--   ۱) پیش‌نمایشِ همین فایل (باید بی‌خطا تمام شود)
--   ۲) پیش‌نمایش و اجرای اسکریپتِ Storage (به ردیفِ users نیاز دارد)
--   ۳) اجرای همین فایل با apply=1
--
-- ── سه دسته ستون ──
-- هر ستونِ uuid در هر جدولِ public که به این حساب‌ها می‌خورد پیدا می‌شود و:
--   • ستونِ مالکیت (user_id، owner_id، userId، reporter_id، …) ⟵ ردیف پاک می‌شود
--     (پروفایل، نقش، عضویت، نظر، علاقه‌مندی، نشست، مجوزِ ادمین، تاریخچه‌ی اعمال)
--   • ستونِ نقشِ فرعی (*_by، actor_id، admin_id، author_id، player_id) روی
--     ردیفِ دیگران ⟵ فقط همان ستون NULL می‌شود؛ ردیف می‌ماند (تیکتی که C رسیدگی
--     کرد، تنظیمی که به‌روز کرد، رنکینگِ فدراسیون). اگر ستون NOT NULL باشد کار
--     می‌ایستد. استثنا: audit_logs.actor_id — کارهای خودِ این حساب‌ها — پاک می‌شود.
--   • هر ستونِ دیگر ⟵ کار متوقف می‌شود و نامِ جدول و ستون چاپ می‌شود
--
-- ── شمارشِ همه‌ی جدول‌ها، پیش و پس ──
-- آبشارِ ON DELETE CASCADE ردیف‌هایی می‌برد که هیچ‌جا نامشان نیامده. پس تعدادِ
-- ردیفِ **همه‌ی** جدول‌های public پیش و پس شمرده و چاپ می‌شود، و اگر جدولی
-- بیش از آنچه پیش‌بینی شده کم شده باشد کار متوقف می‌شود. تراکنش REPEATABLE READ
-- است تا نوشتنِ هم‌زمانِ سایت شمارش را به هم نزند.
--
-- ⚠️ `account_enforcement_actions` فقط‌افزودنی است (۱۱۳). تریگرش فقط داخلِ همین
-- تراکنش خاموش و بلافاصله روشن می‌شود و پیش از COMMIT روشن‌بودنش سنجیده
-- می‌شود. پیامد: کد ملیِ «زهره امینی» دیگر «مسدود» شمرده نمی‌شود و با تأییدِ
-- درستِ ثبت‌احوال می‌تواند دوباره ثبت‌نام کند.
--
-- ⚠️ `audit_logs.entity_id` متنی است: اقدام‌های مالک روی این حساب‌ها در ژورنال
-- می‌مانند (فقط گزارش می‌شوند). ستون‌های uuid[] و jsonb پیمایش نمی‌شوند.
--
-- ── اجرا ── (هر کدام تک‌خطی، در PowerShell، از ریشه‌ی مخزن)
--   scp -i "$env:USERPROFILE\.ssh\billiardhub_parspack" supabase/migrations/116_purge_listed_users.sql root@130.185.72.87:/tmp/116.sql
--   پیش‌نمایش (هیچ چیز عوض نمی‌شود):
--     ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/116.sql"
--   ثبت:
--     ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -v apply=1 < /tmp/116.sql"
--
-- اجرای دوباره بی‌خطر است: بعد از ثبت، آن ۴ حساب وجود ندارند و اولین نگهبان
-- متوقف می‌کند. پیام‌ها انگلیسی‌اند تا در کنسولِ PowerShell خوانا بمانند.
-- ─────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on
SET lock_timeout = '3s';
SET client_min_messages = notice;

BEGIN ISOLATION LEVEL REPEATABLE READ;

CREATE TEMP TABLE _phones (phone text PRIMARY KEY, admin_ok boolean NOT NULL DEFAULT false) ON COMMIT DROP;
INSERT INTO _phones (phone, admin_ok) VALUES
  ('09936333087', false),   -- زهره امینی
  ('09000000101', false),   -- آزمونِ اعمال الف
  ('09000000102', false),   -- آزمونِ اعمال ب
  ('09000000103', true);    -- آزمونِ اعمال پ — ادمینِ آزمونی

CREATE TEMP TABLE _doomed ON COMMIT DROP AS
  SELECT u.id, u.phone, u.person_id
    FROM public.users u
   WHERE u.phone IN (SELECT phone FROM _phones);

CREATE TEMP TABLE _keys ON COMMIT DROP AS
  SELECT id::text AS k FROM _doomed UNION SELECT phone FROM _phones;

\echo ''
\echo '== accounts to delete =='
SELECT u.id, u.phone, u."firstName", u."lastName", u."primaryRole", u."secondaryRoles",
       u.account_status, u.national_id_verified, u."createdAt"
  FROM public.users u JOIN _doomed d USING (id) ORDER BY u.phone;

-- ─────────────────────────────────────────────────────────────
-- نگهبان‌ها
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE cnt bigint; missing text;
BEGIN
  SELECT string_agg(p.phone, ', ') INTO missing
    FROM _phones p WHERE p.phone NOT IN (SELECT phone FROM _doomed);
  SELECT count(*) INTO cnt FROM _doomed;
  IF cnt <> 4 THEN
    RAISE EXCEPTION 'ABORT: expected exactly 4 accounts, found % (missing: %) - already applied, or data drifted', cnt, coalesce(missing, '-');
  END IF;

  SELECT count(*) INTO cnt FROM public.users u JOIN _doomed d USING (id) WHERE u.is_platform_owner;
  IF cnt <> 0 THEN RAISE EXCEPTION 'ABORT: the platform owner is in the list'; END IF;

  /* ادمین فقط همان حسابِ آزمونیِ C */
  SELECT count(*) INTO cnt
    FROM public.users u JOIN _doomed d USING (id) JOIN _phones p ON p.phone = u.phone
   WHERE (u."primaryRole" = 'admin' OR 'admin' = ANY (coalesce(u."secondaryRoles", '{}')))
     AND NOT p.admin_ok;
  IF cnt <> 0 THEN RAISE EXCEPTION 'ABORT: % unexpected admin account(s) in the list', cnt; END IF;

  /* پول، دارایی، مسابقه — این‌ها حذفِ بی‌تصمیم نمی‌خورند */
  SELECT (SELECT count(*) FROM public.bookings        WHERE "userId"   IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.payments        WHERE user_id    IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.refunds         WHERE user_id    IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.ledger_entries  WHERE user_id    IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.club_accounts   WHERE owner_id   IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.clubs           WHERE "ownerId"  IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.products        WHERE "sellerId" IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.tournaments     WHERE created_by IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.tournament_registrations WHERE user_id IN (SELECT id FROM _doomed))
       + (SELECT count(*) FROM public.settlements     WHERE admin_id   IN (SELECT id FROM _doomed))
    INTO cnt;
  IF cnt <> 0 THEN
    RAISE EXCEPTION 'ABORT: the listed accounts touch % money/club/product/tournament/settlement row(s) - needs a decision, not a blind delete', cnt;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- سیاهه و دسته‌بندیِ ستون‌ها
-- ─────────────────────────────────────────────────────────────
CREATE TEMP TABLE _hits (tbl regclass, col name, kind text, n bigint) ON COMMIT DROP;
DO $$
DECLARE c record; cnt bigint; k text;
BEGIN
  FOR c IN
    SELECT a.attrelid::regclass AS tbl, r.relname AS rel, a.attname AS col
      FROM pg_attribute a
      JOIN pg_class r ON r.oid = a.attrelid
     WHERE r.relnamespace = 'public'::regnamespace AND r.relkind IN ('r', 'p')
       AND a.attnum > 0 AND NOT a.attisdropped
       AND a.atttypid = 'uuid'::regtype
       AND r.oid <> 'public.users'::regclass
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT id FROM _doomed)', c.tbl, c.col) INTO cnt;
    CONTINUE WHEN cnt = 0;
    k := CASE
      WHEN c.rel = 'audit_logs' AND c.col = 'actor_id' THEN 'delete'
      WHEN c.col IN ('user_id', 'owner_id', 'userId', 'ownerId', 'reporter_id', 'member_id',
                     'sender_id', 'recipient_id', 'buyer_id', 'from_user', 'to_user', 'follower_id') THEN 'delete'
      WHEN c.col LIKE '%\_by' OR c.col IN ('actor_id', 'admin_id', 'author_id', 'player_id',
                                           'assigned_to', 'approved_by', 'reviewer_id') THEN 'nullify'
      ELSE 'unknown'
    END;
    INSERT INTO _hits VALUES (c.tbl, c.col, k, cnt);
  END LOOP;
END $$;

\echo '== rows that point at these accounts (delete = whole row goes, nullify = only that column is cleared) =='
SELECT tbl AS "table", col AS "column", kind, n AS "rows" FROM _hits ORDER BY kind, 1, 2;

DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(format('%s.%s (%s rows)', tbl, col, n), ', ') INTO bad FROM _hits WHERE kind = 'unknown';
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'ABORT: unclassified reference column(s): % - decide delete or nullify, then add to the lists', bad;
  END IF;
END $$;

\echo '== text columns equal to these phones/ids (REPORT ONLY, not touched) =='
CREATE TEMP TABLE _text_hits (tbl regclass, col name, n bigint) ON COMMIT DROP;
DO $$
DECLARE c record; cnt bigint;
BEGIN
  FOR c IN
    SELECT a.attrelid::regclass AS tbl, a.attname AS col
      FROM pg_attribute a
      JOIN pg_class r ON r.oid = a.attrelid
     WHERE r.relnamespace = 'public'::regnamespace AND r.relkind IN ('r', 'p')
       AND a.attnum > 0 AND NOT a.attisdropped
       AND a.atttypid IN ('text'::regtype, 'varchar'::regtype)
       AND r.oid <> 'public.users'::regclass
       AND r.relname NOT IN ('otp_codes', 'login_attempts', 'rate_hits', 'phone_changes',
                             'club_sms_recipients', 'ad_requests', 'support_tickets')
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT k FROM _keys)', c.tbl, c.col) INTO cnt;
    IF cnt > 0 THEN INSERT INTO _text_hits VALUES (c.tbl, c.col, cnt); END IF;
  END LOOP;
END $$;
SELECT tbl AS "table", col AS "column", n AS "rows" FROM _text_hits ORDER BY 1, 2;

-- ─────────────────────────────────────────────────────────────
-- شمارشِ پیش‌بینی‌شده و شمارشِ «پیش»ِ همه‌ی جدول‌ها
-- ─────────────────────────────────────────────────────────────
CREATE TEMP TABLE _expect (tbl regclass PRIMARY KEY, n bigint NOT NULL) ON COMMIT DROP;
DO $$
DECLARE t record; cnt bigint;
BEGIN
  /* هر جدول با چند ستونِ مالکیت: ردیفِ یکتا، نه جمعِ ستون‌ها */
  FOR t IN
    SELECT tbl, string_agg(format('%I IN (SELECT id FROM _doomed)', col), ' OR ') AS cond
      FROM _hits WHERE kind = 'delete' GROUP BY tbl
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %s', t.tbl, t.cond) INTO cnt;
    INSERT INTO _expect VALUES (t.tbl, cnt);
  END LOOP;

  INSERT INTO _expect VALUES ('public.users'::regclass, 4)
    ON CONFLICT (tbl) DO UPDATE SET n = _expect.n + 4;
  SELECT count(*) INTO cnt FROM public.persons p
   WHERE p.id IN (SELECT person_id FROM _doomed WHERE person_id IS NOT NULL)
     AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.person_id = p.id AND u.id NOT IN (SELECT id FROM _doomed));
  INSERT INTO _expect VALUES ('public.persons'::regclass, cnt)
    ON CONFLICT (tbl) DO UPDATE SET n = _expect.n + EXCLUDED.n;
  /* «شخص» با آبشار سهمیه‌ی مصرف‌شده‌اش را هم می‌برد */
  IF to_regclass('public.quota_consumptions') IS NOT NULL THEN
    SELECT count(*) INTO cnt FROM public.quota_consumptions q
     WHERE q.person_id IN (SELECT person_id FROM _doomed WHERE person_id IS NOT NULL)
       AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.person_id = q.person_id AND u.id NOT IN (SELECT id FROM _doomed))
       AND NOT (q.user_id IS NOT NULL AND q.user_id IN (SELECT id FROM _doomed));
    INSERT INTO _expect VALUES ('public.quota_consumptions'::regclass, cnt)
      ON CONFLICT (tbl) DO UPDATE SET n = _expect.n + EXCLUDED.n;
  END IF;
END $$;

/* شماره‌محورها */
CREATE TEMP TABLE _phone_del (tbl text PRIMARY KEY, cond text NOT NULL) ON COMMIT DROP;
INSERT INTO _phone_del VALUES
  ('otp_codes',           'mobile IN (SELECT phone FROM _phones)'),
  ('login_attempts',      'subject IN (SELECT phone FROM _phones)'),
  ('rate_hits',           'EXISTS (SELECT 1 FROM _keys k WHERE key LIKE ''%:'' || k.k)'),   -- action:ip:target
  ('phone_changes',       'old_phone IN (SELECT phone FROM _phones) OR new_phone IN (SELECT phone FROM _phones)'),
  ('club_sms_recipients', 'mobile IN (SELECT phone FROM _phones)'),
  ('ad_requests',         'phone IN (SELECT phone FROM _phones)'),
  ('support_tickets',     'phone IN (SELECT phone FROM _phones)');
DELETE FROM _phone_del WHERE to_regclass('public.' || tbl) IS NULL;
DO $$
DECLARE t record; cnt bigint;
BEGIN
  FOR t IN SELECT * FROM _phone_del LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %s', t.tbl, t.cond) INTO cnt;
    INSERT INTO _expect VALUES (('public.' || t.tbl)::regclass, cnt)
      ON CONFLICT (tbl) DO UPDATE SET n = _expect.n + EXCLUDED.n;   -- سقفِ بالا؛ هم‌پوشانی با uuid فقط کمترش می‌کند
  END LOOP;
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

-- ─────────────────────────────────────────────────────────────
-- حذف
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.account_enforcement_actions DISABLE TRIGGER enforcement_append_only;

/* ۱) ردیف‌های مالکیت — چند دور، هر حذف در زیرتراکنشِ خودش؛ حذفی که به‌خاطرِ
      ارجاعِ جدولِ دیگری رد شد دورِ بعد دوباره امتحان می‌شود */
DO $$
DECLARE h record; cnt bigint; pass int; left_ bigint := 0;
BEGIN
  FOR pass IN 1..6 LOOP
    FOR h IN SELECT x.tbl, x.col FROM _hits x WHERE x.kind = 'delete' AND x.n > 0 LOOP
      BEGIN
        EXECUTE format('DELETE FROM %s WHERE %I IN (SELECT id FROM _doomed)', h.tbl, h.col);
        GET DIAGNOSTICS cnt = ROW_COUNT;
        RAISE NOTICE 'pass %: %.% deleted %', pass, h.tbl, h.col, cnt;
        UPDATE _hits x SET n = 0 WHERE x.tbl = h.tbl AND x.col = h.col;
      EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'pass %: %.% deferred (referenced elsewhere)', pass, h.tbl, h.col;
      END;
    END LOOP;
    FOR h IN SELECT x.tbl, x.col FROM _hits x WHERE x.kind = 'delete' AND x.n > 0 LOOP
      EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT id FROM _doomed)', h.tbl, h.col) INTO cnt;
      UPDATE _hits x SET n = cnt WHERE x.tbl = h.tbl AND x.col = h.col;
    END LOOP;
    SELECT count(*) INTO left_ FROM _hits x WHERE x.kind = 'delete' AND x.n > 0;
    EXIT WHEN left_ = 0;
  END LOOP;
  IF left_ > 0 THEN
    RAISE EXCEPTION 'ABORT: % owner column(s) still reference the accounts after 6 passes', left_;
  END IF;
END $$;

ALTER TABLE public.account_enforcement_actions ENABLE TRIGGER enforcement_append_only;

/* ۲) نقشِ فرعی روی ردیفِ دیگران — فقط ستون خالی می‌شود */
DO $$
DECLARE h record; cnt bigint;
BEGIN
  FOR h IN SELECT x.tbl, x.col FROM _hits x WHERE x.kind = 'nullify' LOOP
    BEGIN
      EXECUTE format('UPDATE %s SET %I = NULL WHERE %I IN (SELECT id FROM _doomed)', h.tbl, h.col, h.col);
      GET DIAGNOSTICS cnt = ROW_COUNT;
      RAISE NOTICE 'nullified %.%: %', h.tbl, h.col, cnt;
    EXCEPTION WHEN not_null_violation THEN
      RAISE EXCEPTION 'ABORT: %.% is NOT NULL - rows of other accounts reference these accounts there; decide first', h.tbl, h.col;
    END;
  END LOOP;
END $$;

/* ۳) شماره‌محورها */
DO $$
DECLARE t record; cnt bigint;
BEGIN
  FOR t IN SELECT * FROM _phone_del LOOP
    EXECUTE format('DELETE FROM public.%I WHERE %s', t.tbl, t.cond);
    GET DIAGNOSTICS cnt = ROW_COUNT;
    RAISE NOTICE '% deleted: %', t.tbl, cnt;
  END LOOP;
END $$;

/* ۴) خودِ حساب‌ها و «شخص»ِ بی‌حساب */
DO $$
DECLARE cnt bigint;
BEGIN
  DELETE FROM public.users WHERE id IN (SELECT id FROM _doomed);
  GET DIAGNOSTICS cnt = ROW_COUNT;  RAISE NOTICE 'users deleted: %', cnt;
  IF cnt <> 4 THEN RAISE EXCEPTION 'ABORT: deleted % users, expected 4', cnt; END IF;

  DELETE FROM public.persons p
   WHERE p.id IN (SELECT person_id FROM _doomed WHERE person_id IS NOT NULL)
     AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.person_id = p.id);
  GET DIAGNOSTICS cnt = ROW_COUNT;  RAISE NOTICE 'persons deleted: %', cnt;
END $$;

-- ─────────────────────────────────────────────────────────────
-- شمارشِ «پس» و مقایسه — آبشارِ پیش‌بینی‌نشده کار را متوقف می‌کند
-- ─────────────────────────────────────────────────────────────
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
SELECT b.tbl AS "table", b.n AS before, a.n AS after, b.n - a.n AS lost, coalesce(e.n, 0) AS expected_max
  FROM _before b JOIN _after a USING (tbl) LEFT JOIN _expect e USING (tbl)
 WHERE b.n <> a.n ORDER BY 1;

DO $$
DECLARE bad text; st "char"; cnt bigint; c record;
BEGIN
  SELECT string_agg(format('%s (lost %s, expected <= %s)', b.tbl, b.n - a.n, coalesce(e.n, 0)), ', ') INTO bad
    FROM _before b JOIN _after a USING (tbl) LEFT JOIN _expect e USING (tbl)
   WHERE b.n - a.n > coalesce(e.n, 0);
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'ABORT: unexpected rows disappeared (cascade?): %', bad;
  END IF;

  SELECT t.tgenabled INTO st FROM pg_trigger t
   WHERE t.tgname = 'enforcement_append_only' AND t.tgrelid = 'public.account_enforcement_actions'::regclass;
  IF st IS DISTINCT FROM 'O' THEN
    RAISE EXCEPTION 'ABORT: enforcement_append_only is not enabled (state=%)', st;
  END IF;

  SELECT count(*) INTO cnt FROM public.users WHERE phone IN (SELECT phone FROM _phones);
  IF cnt <> 0 THEN RAISE EXCEPTION 'ABORT: % listed account(s) still exist', cnt; END IF;

  SELECT count(*) INTO cnt FROM public.users WHERE is_platform_owner;
  IF cnt < 1 THEN RAISE EXCEPTION 'ABORT: platform owner missing after cleanup'; END IF;

  FOR c IN SELECT tbl, col FROM _hits LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT id FROM _doomed)', c.tbl, c.col) INTO cnt;
    IF cnt > 0 THEN RAISE EXCEPTION 'ABORT: %.% still has % row(s)', c.tbl, c.col, cnt; END IF;
  END LOOP;

  RAISE NOTICE 'all post-checks passed; enforcement_append_only is enabled';
END $$;

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
