-- ═════════════════════════════════════════════════════════════════════
-- 114 — پخش زنده‌ی حرفه‌ای (کانال، کلیدِ استریم، پخش، آرشیو)
--
-- ⚠️ دستی و با تأییدِ صریحِ مالک اجرا شود (deploy.sh مهاجرت نمی‌برد):
--   docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < 114_live_channels.sql
--
-- چه می‌سازد (هیچ جدولِ موجودی دست نمی‌خورد):
--   ۱) live_club_settings — سطحِ باشگاه (عادی/حرفه‌ای)، سقفِ کانال، و
--      مسدودیِ کلِ پخشِ باشگاه توسطِ مدیریت.
--   ۲) live_channels — هر کانال: باشگاه / یک میز / یک مسابقه. کلیدِ استریم
--      **رمزشده** (AES-256-GCM، کلید از JWT_SECRET) — دیتابیسِ نشت‌کرده
--      کلید را لو نمی‌دهد.
--   ۳) live_broadcasts — هر بار «شروعِ پخش» یک ردیف: زمانِ شروع و پایان،
--      اوجِ بیننده، ثانیه‌-بیننده، و لینکِ ضبط (آرشیو).
--
-- همه فقط از سرور (service_role) خوانده می‌شوند؛ کلیدِ عمومی هیچ.
-- برگشت‌پذیر: بخشِ ROLLBACK در انتهای فایل.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ۱) تنظیماتِ پخشِ هر باشگاه ───────────────────────────────────────
-- نبودِ ردیف = باشگاهِ عادی با یک کانال (پیش‌فرض در کد)
CREATE TABLE IF NOT EXISTS public.live_club_settings (
  club_id        uuid        PRIMARY KEY REFERENCES public.clubs(id) ON DELETE CASCADE,
  tier           text        NOT NULL DEFAULT 'standard',
  channel_limit  integer     NOT NULL DEFAULT 1,
  blocked        boolean     NOT NULL DEFAULT false,
  block_reason   text,
  blocked_at     timestamptz,
  blocked_by     uuid,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_club_tier_chk  CHECK (tier IN ('standard','pro')),
  CONSTRAINT live_club_limit_chk CHECK (channel_limit BETWEEN 1 AND 16)
);

-- ── ۲) کانال‌ها ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_channels (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id              uuid        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  kind                 text        NOT NULL DEFAULT 'club',
  tournament_id        uuid        REFERENCES public.tournaments(id) ON DELETE SET NULL,
  title                text        NOT NULL,
  table_label          text,
  access               text        NOT NULL DEFAULT 'public',
  record               boolean     NOT NULL DEFAULT true,
  provider             text        NOT NULL,
  provider_channel_id  text        NOT NULL,
  ingest_url           text        NOT NULL,
  stream_key_enc       text        NOT NULL,
  playback_url         text,
  -- «روی سایت زنده است» — با دکمه‌ی شروع/پایانِ باشگاه
  is_live              boolean     NOT NULL DEFAULT false,
  current_broadcast_id uuid,
  admin_blocked        boolean     NOT NULL DEFAULT false,
  block_reason         text,
  blocked_at           timestamptz,
  blocked_by           uuid,
  created_by           uuid        NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  archived_at          timestamptz,
  CONSTRAINT live_channel_kind_chk   CHECK (kind IN ('club','table','tournament')),
  -- «کانالِ مسابقه ⟺ tournament_id» عمداً CHECK نیست: حذفِ مسابقه
  -- tournament_id را NULL می‌کند و CHECK همان حذف را می‌شکست. در کد سنجیده می‌شود.
  CONSTRAINT live_channel_access_chk CHECK (access IN ('public','members'))
);

CREATE INDEX IF NOT EXISTS live_channels_club_idx ON public.live_channels (club_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS live_channels_live_idx ON public.live_channels (is_live) WHERE is_live;
-- هر مسابقه حداکثر یک کانالِ فعال
CREATE UNIQUE INDEX IF NOT EXISTS live_channels_one_per_tournament
  ON public.live_channels (tournament_id) WHERE tournament_id IS NOT NULL AND archived_at IS NULL;

-- ── ۳) پخش‌ها (برای ساعاتِ پخش، آمارِ بیننده و آرشیو) ───────────────
CREATE TABLE IF NOT EXISTS public.live_broadcasts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id        uuid        NOT NULL REFERENCES public.live_channels(id) ON DELETE CASCADE,
  club_id           uuid        NOT NULL,
  title             text        NOT NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  started_by        uuid,
  ended_reason      text,
  peak_viewers      integer     NOT NULL DEFAULT 0,
  viewer_seconds    bigint      NOT NULL DEFAULT 0,
  recording_url     text,
  recording_hidden  boolean     NOT NULL DEFAULT false,
  CONSTRAINT live_bc_reason_chk CHECK (ended_reason IS NULL OR ended_reason IN ('owner','admin','timeout','blocked'))
);

CREATE INDEX IF NOT EXISTS live_broadcasts_channel_idx ON public.live_broadcasts (channel_id, started_at DESC);
CREATE INDEX IF NOT EXISTS live_broadcasts_club_idx    ON public.live_broadcasts (club_id, started_at DESC);
-- هر کانال حداکثر یک پخشِ باز
CREATE UNIQUE INDEX IF NOT EXISTS live_broadcasts_one_open
  ON public.live_broadcasts (channel_id) WHERE ended_at IS NULL;

-- ── دسترسی: فقط سرور ─────────────────────────────────────────────────
ALTER TABLE public.live_club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_channels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_broadcasts    ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_club_settings FROM anon, authenticated;
REVOKE ALL ON public.live_channels      FROM anon, authenticated;
REVOKE ALL ON public.live_broadcasts    FROM anon, authenticated;

COMMIT;

-- PostgREST باید جدول‌های تازه را ببیند
NOTIFY pgrst, 'reload schema';

-- ── ROLLBACK (فقط در صورتِ نیاز، دستی) ────────────────────────────────
-- BEGIN;
--   DROP TABLE IF EXISTS public.live_broadcasts;
--   DROP TABLE IF EXISTS public.live_channels;
--   DROP TABLE IF EXISTS public.live_club_settings;
-- COMMIT;
-- NOTIFY pgrst, 'reload schema';
