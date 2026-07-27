-- ═══════════════════════════════════════════════════════════════════
-- 005 — نشست‌های کاربر
--
-- امروز توکنِ هفت‌روزه صادر می‌شود و هیچ راهی برای ابطالش نیست؛ «خروج»
-- فقط localStorage را پاک می‌کند و توکنِ دزدیده‌شده تا انقضا کار می‌کند.
-- این جدول همان چیزِ گم‌شده است: هر نشست یک ردیف، قابلِ ابطال.
--
-- refresh_hash: هشِ HMACِ refresh tokenِ فعلی. با هر تازه‌سازی عوض
-- می‌شود (چرخش). اگر توکنی ارائه شود که با این هش نخواند یعنی یک
-- توکنِ قدیمیِ چرخیده دوباره استفاده شده ⇒ نشانه‌ی سرقت ⇒ کلِ نشست
-- باطل می‌شود.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL,
  refresh_hash   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_used_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz,
  revoked_reason text,
  user_agent     text,
  ip             text,
  /* از کجا ساخته شد: login | register | adopt (مهاجرتِ کاربرِ قدیمی) */
  origin         text NOT NULL DEFAULT 'login'
);

CREATE INDEX IF NOT EXISTS sessions_user_idx    ON public.sessions (user_id, revoked_at);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON public.sessions (expires_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

/* نشست‌های منقضی یا باطل‌شده‌ی قدیمی را جمع می‌کند.
   بی‌خطر است چون فقط ردیف‌های بی‌استفاده را پاک می‌کند. */
CREATE OR REPLACE FUNCTION public.bh_prune_sessions() RETURNS integer AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.sessions
   WHERE expires_at < now() - interval '7 days'
      OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '7 days');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;
