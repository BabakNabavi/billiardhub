-- ─────────────────────────────────────────────────────────────
-- جلسه‌ی مربی.
--
-- ── چرا جدولِ جدا و نه `bookings` ──
-- `bookings` رزروِ *میز* است: `tableId`، `timeSlots`، کمیسیون و
-- تسویه‌ی باشگاه. جلسه‌ی مربی نه میز دارد نه سهمِ باشگاه؛ چپاندنش در
-- آن جدول یعنی نصفِ ستون‌ها همیشه NULL و منطقِ تسویه‌ی اشتباه.
--
-- ── چرا این جدول لازم شد ──
-- امتیازِ مربی تا امروز با «رزروِ میز در باشگاهی که مربی در آن ثبت
-- شده» سنجیده می‌شد — نزدیک‌ترین نشانه‌ای که وجود داشت، ولی نه دقیق:
-- کسی که میز رزرو کرده لزوماً سرِ کلاسِ آن مربی نرفته. با این جدول
-- نشانه دقیق می‌شود: جلسه‌ای که مربی تأیید کرده و زمانش گذشته.
--
-- ⚠️ چرا معیارِ «تأییدشده + زمانش گذشته» و نه «مربی گفت برگزار شد»:
-- اگر پایانِ جلسه دستِ خودِ مربی باشد، می‌تواند جلسه‌ی شاگردِ ناراضی
-- را «برگزارنشده» نگه دارد و امتیازش را ببندد. تأیید در ابتدا لازم
-- است و بعدش گذرِ زمان کارِ خودش را می‌کند.
--
-- ── پرداخت ──
-- نسخه‌ی اول عمداً پرداختِ درون‌سایتی ندارد: `price` مبلغِ توافقی است
-- و پرداخت حضوری. ستونِ `payment_id` از حالا هست تا وقتی درگاه وصل
-- شد، مهاجرتِ دیگری لازم نباشد.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  club_id       uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  starts_at     timestamptz NOT NULL,
  duration_min  integer NOT NULL DEFAULT 60,
  price         bigint  NOT NULL DEFAULT 0,
  note          text,
  status        text NOT NULL DEFAULT 'requested',
  payment_id    text,
  decided_at    timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT coach_sessions_status_chk CHECK (status IN ('requested','confirmed','rejected','cancelled')),
  CONSTRAINT coach_sessions_dur_chk    CHECK (duration_min BETWEEN 15 AND 480),
  CONSTRAINT coach_sessions_price_chk  CHECK (price >= 0 AND price <= 500000000),
  CONSTRAINT coach_sessions_note_chk   CHECK (note IS NULL OR length(note) <= 500)
);

CREATE INDEX IF NOT EXISTS coach_sessions_coach_idx ON public.coach_sessions (coach_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS coach_sessions_user_idx  ON public.coach_sessions (user_id, starts_at DESC);

-- یک درخواستِ باز برای هر شاگرد در هر زمان — کلیکِ دوباره درخواستِ
-- تازه نسازد.
CREATE UNIQUE INDEX IF NOT EXISTS coach_sessions_slot_uniq
  ON public.coach_sessions (coach_id, user_id, starts_at)
  WHERE status IN ('requested','confirmed');

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;
-- خواندن/نوشتن فقط سرورساید با service-role — مثلِ بقیه‌ی جدول‌ها.

DROP TRIGGER IF EXISTS coach_sessions_touch ON public.coach_sessions;
CREATE TRIGGER coach_sessions_touch
BEFORE UPDATE ON public.coach_sessions
FOR EACH ROW EXECUTE FUNCTION public.bh_touch_updated_at();

-- قیمت و مدتِ پیش‌فرضِ جلسه، روی خودِ پروفایلِ مربی
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS session_price bigint  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_min   integer NOT NULL DEFAULT 60;

NOTIFY pgrst, 'reload schema';
