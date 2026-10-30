-- ═════════════════════════════════════════════════════════════════════
-- 113 — اعمالِ وضعیتِ حساب (Account Enforcement) و مالکِ پلتفرم
--
-- ⚠️ دستی و با تأییدِ صریحِ مالک اجرا شود (deploy.sh مهاجرت نمی‌برد):
--   docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < 113_account_enforcement.sql
--
-- چه می‌سازد:
--   ۱) روی users: وضعیتِ حساب، انقضای اقدامِ موقت، قابلیت‌های بسته‌شده،
--      و پرچمِ «مالکِ پلتفرم» (حداکثر یک نفر).
--   ۲) account_enforcement_actions: تاریخچه‌ی کاملِ اقدام‌ها — فقط افزودنی؛
--      ویرایش و حذفش در خودِ دیتابیس ممنوع است.
--   ۳) محافظتِ مالک در سطحِ دیتابیس: هیچ درخواستی از راهِ API (نقشِ
--      service_role پشتِ PostgREST) نمی‌تواند وضعیتِ مالک را عوض کند، نقشِ
--      ادمینش را بگیرد، ردیفش را پاک کند، یا مالکِ دیگری بسازد. فقط خودِ
--      postgres (همین اجرای دستی) می‌تواند.
--   ۴) تعیینِ مالک: حسابِ ۰۹۱۲۱۳۲۷۲۸۳.
--
-- برگشت‌پذیر: ستون‌ها پیش‌فرضِ «active» دارند و رفتارِ فعلیِ هیچ حسابی را
-- عوض نمی‌کنند. برای برگرداندن: بخشِ ROLLBACK در انتهای فایل.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ۱) ستون‌های users ─────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_status       text        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_expires_at    timestamptz,
  ADD COLUMN IF NOT EXISTS feature_restrictions text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status_changed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS is_platform_owner    boolean     NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_account_status_chk') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_account_status_chk CHECK (account_status IN
      ('active','restricted','limited','suspended','banned','deactivated','deleted'));
  END IF;
END $$;

-- حداکثر یک مالک
CREATE UNIQUE INDEX IF NOT EXISTS users_single_platform_owner
  ON public.users (is_platform_owner) WHERE is_platform_owner;

-- جست‌وجوی سریعِ «کد ملیِ حسابِ مسدود» هنگامِ ثبت‌نام
CREATE INDEX IF NOT EXISTS users_national_id_status_idx
  ON public.users (national_id, account_status) WHERE national_id IS NOT NULL;

-- ── ۲) تاریخچه‌ی اقدام‌ها ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_enforcement_actions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action        text        NOT NULL,
  from_status   text,
  to_status     text,
  reason_code   text        NOT NULL,
  internal_note text,
  evidence_ref  text,
  restrictions  text[]      NOT NULL DEFAULT '{}',
  expires_at    timestamptz,
  actor_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  actor_role    text        NOT NULL DEFAULT 'platform_owner',
  details       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  ip            text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enforcement_user_idx
  ON public.account_enforcement_actions (user_id, created_at DESC);

-- فقط سرور (service_role) به آن دسترسی دارد؛ کلیدِ عمومی هیچ.
ALTER TABLE public.account_enforcement_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_enforcement_actions FROM anon, authenticated;

-- فقط افزودنی: ویرایش و حذف در خودِ دیتابیس رد می‌شود (حتی با service_role)
CREATE OR REPLACE FUNCTION public.bh_enforcement_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'account_enforcement_actions is append-only';
END $$;

DROP TRIGGER IF EXISTS enforcement_append_only ON public.account_enforcement_actions;
CREATE TRIGGER enforcement_append_only
  BEFORE UPDATE OR DELETE ON public.account_enforcement_actions
  FOR EACH ROW EXECUTE FUNCTION public.bh_enforcement_append_only();

-- ── ۳) محافظتِ مالک ───────────────────────────────────────────────────
-- ⚠️ session_user، نه current_user: داخلِ هر تابعِ SECURITY DEFINERِ متعلق به
-- postgres (مثلِ bh_sweep_stale_roles در ۰۶۲) current_user «postgres» می‌شود و
-- service_role از راهِ RPC همان را صدا می‌زند. session_user پشتِ PostgREST
-- «authenticator» است و SECURITY DEFINER عوضش نمی‌کند؛ فقط اتصالِ مستقیمِ
-- psql -U postgres (همین اجرای دستی) postgres است.
-- ⚠️ پس ویرایشِ ردیفِ مالک از Supabase Studio (که با supabase_admin وصل می‌شود)
-- هم رد می‌شود — عمدی است؛ برای تغییرِ مالک: docker exec … psql -U postgres.
CREATE OR REPLACE FUNCTION public.bh_protect_platform_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF session_user = 'postgres' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.is_platform_owner THEN
      RAISE EXCEPTION 'platform owner cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  -- هیچ‌کس از راهِ API مالک نمی‌سازد
  IF NEW.is_platform_owner AND (TG_OP = 'INSERT' OR NOT OLD.is_platform_owner) THEN
    RAISE EXCEPTION 'platform owner can only be assigned by a database administrator';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_platform_owner THEN
    IF NOT NEW.is_platform_owner THEN
      RAISE EXCEPTION 'platform owner flag cannot be removed via the application';
    END IF;
    IF NEW.account_status <> 'active' OR NEW.status_expires_at IS NOT NULL
       OR cardinality(NEW.feature_restrictions) > 0 THEN
      RAISE EXCEPTION 'platform owner cannot be restricted';
    END IF;
    IF NEW."isActive" IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'platform owner cannot be deactivated';
    END IF;
    -- همان قاعده‌ی isAdmin: ادمین در نقشِ اصلی یا فرعی. مالک می‌تواند نقشِ
    -- نمایشی‌اش را عوض کند (/api/roles/my ادمین را به secondaryRoles می‌برد)،
    -- ولی ادمین‌بودن را از دست نمی‌دهد.
    IF NEW."primaryRole" IS DISTINCT FROM 'admin'
       AND NOT ('admin' = ANY (COALESCE(NEW."secondaryRoles", '{}'))) THEN
      RAISE EXCEPTION 'platform owner cannot be downgraded';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_platform_owner ON public.users;
CREATE TRIGGER protect_platform_owner
  BEFORE INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.bh_protect_platform_owner();

-- ── ۴) تعیینِ مالک ────────────────────────────────────────────────────
DO $$
DECLARE n int;
BEGIN
  UPDATE public.users
     SET is_platform_owner = true, "isActive" = true,
         -- نقشِ فعلی دست نمی‌خورد؛ اگر ادمین در هیچ‌کدام نیست، به فرعی‌ها افزوده می‌شود
         "secondaryRoles" = CASE
           WHEN "primaryRole" = 'admin' OR 'admin' = ANY (COALESCE("secondaryRoles", '{}')) THEN "secondaryRoles"
           ELSE array_append(COALESCE("secondaryRoles", '{}'), 'admin') END,
         account_status = 'active', status_expires_at = NULL, feature_restrictions = '{}'
   WHERE phone = '09121327283';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'expected exactly one account with phone 09121327283, found %', n;
  END IF;
END $$;

-- PostgREST ستون‌های تازه را همین حالا بشناسد (وگرنه تا ری‌استارت «ستون نیست»)
NOTIFY pgrst, 'reload schema';

COMMIT;

-- بررسی پس از اجرا (باید یک ردیف با is_platform_owner = t بدهد):
--   SELECT id, phone, "primaryRole", account_status, is_platform_owner
--     FROM public.users WHERE is_platform_owner;

-- ── ROLLBACK (فقط در صورتِ نیاز، دستی) ─────────────────────────────────
-- BEGIN;
--   DROP TRIGGER IF EXISTS protect_platform_owner ON public.users;
--   DROP FUNCTION IF EXISTS public.bh_protect_platform_owner();
--   DROP TABLE IF EXISTS public.account_enforcement_actions;   -- ⚠️ تاریخچه از دست می‌رود
--   DROP FUNCTION IF EXISTS public.bh_enforcement_append_only();
--   DROP INDEX IF EXISTS public.users_single_platform_owner;
--   DROP INDEX IF EXISTS public.users_national_id_status_idx;
--   ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_account_status_chk;
--   ALTER TABLE public.users
--     DROP COLUMN IF EXISTS account_status, DROP COLUMN IF EXISTS status_expires_at,
--     DROP COLUMN IF EXISTS feature_restrictions, DROP COLUMN IF EXISTS status_changed_at,
--     DROP COLUMN IF EXISTS is_platform_owner;
-- COMMIT;
