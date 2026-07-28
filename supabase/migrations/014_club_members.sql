-- ═══════════════════════════════════════════════════════════════════
-- 014 — عضویتِ کاربران در باشگاه
--
-- «تعداد اعضای باشگاه» عمداً یک شمارنده‌ی ساده روی جدولِ clubs نیست:
-- شمارنده با هر بار انتخابِ دوباره‌ی همان باشگاه بالا می‌رفت و عددش
-- بی‌معنا می‌شد. این‌جا هر عضویت یک ردیف است و تعداد از روی همان
-- شمرده می‌شود؛ پس انتخابِ تکراری اثری ندارد و جابه‌جایی بینِ دو
-- باشگاه هم خودبه‌خود درست حساب می‌شود.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.club_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id   uuid        NOT NULL,
  user_id   uuid        NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_members_uniq UNIQUE (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS club_members_club_idx ON public.club_members (club_id);
CREATE INDEX IF NOT EXISTS club_members_user_idx ON public.club_members (user_id);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

/* کاربرانی که از قبل باشگاهشان را انتخاب کرده‌اند، عضو حساب شوند */
INSERT INTO public.club_members (club_id, user_id)
SELECT u.club_id, u.id
  FROM public.users u
  JOIN public.clubs c ON c.id = u.club_id
 WHERE u.club_id IS NOT NULL
ON CONFLICT (club_id, user_id) DO NOTHING;
