-- ─────────────────────────────────────────────────────────────
-- درخواستِ کلاس یا مشاوره از مربی — آذرِ ۱۴۰۵.
--
-- ── چرا جدولِ تازه و نه `coach_sessions` ──
-- `coach_sessions` (۰۹۱) جلسه با *زمانِ مشخص* است: `starts_at NOT NULL` و
-- تأیید/رد. مالک تصمیم گرفت شاگرد زمان تعیین نکند — درخواست می‌فرستد و
-- مربی برای هماهنگی تماس می‌گیرد (همان سازوکارِ سایت‌های معلم‌یابی). این
-- درخواست زمان ندارد و چرخه‌اش هم فرق دارد (تازه ⟵ تماس گرفته شد ⟵ بسته).
-- ردیف‌های قدیمیِ `coach_sessions` دست نمی‌خورند: صندوقِ قدیمیِ پنلِ مربی و
-- شرطِ امتیاز همچنان آن‌ها را می‌خوانند.
--
-- ── شماره‌ی شاگرد این‌جا ذخیره نمی‌شود ──
-- همان `users.phone` (تأییدشده با کد) هنگامِ نمایش به مربی خوانده می‌شود؛
-- نسخه‌ی دوم از شماره‌ی شخصی فقط یک جای دیگر برای نشت می‌ساخت.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coach_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  kind          text NOT NULL,
  discipline    text,
  level         text NOT NULL,
  availability  text[] NOT NULL DEFAULT '{}',
  message       text,
  status        text NOT NULL DEFAULT 'new',
  contacted_at  timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT coach_requests_kind_chk   CHECK (kind IN ('class','consult')),
  CONSTRAINT coach_requests_disc_chk   CHECK (discipline IS NULL OR discipline IN ('snooker','pocket','highball')),
  CONSTRAINT coach_requests_level_chk  CHECK (level IN ('beginner','intermediate','advanced')),
  CONSTRAINT coach_requests_avail_chk  CHECK (availability <@ ARRAY['morning','afternoon','evening','weekend']::text[]),
  CONSTRAINT coach_requests_msg_chk    CHECK (message IS NULL OR length(message) <= 300),
  CONSTRAINT coach_requests_status_chk CHECK (status IN ('new','contacted','closed','cancelled')),
  -- شرطِ نظر دادن روی contacted_at سوار است؛ وضعیتِ «تماس گرفته شد» بی‌زمانش
  -- (مثلا با اصلاحِ دستی) نباید ممکن باشد
  CONSTRAINT coach_requests_contacted_chk CHECK (status <> 'contacted' OR contacted_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS coach_requests_coach_idx ON public.coach_requests (coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coach_requests_user_idx  ON public.coach_requests (user_id, created_at DESC);

-- یک درخواستِ بی‌پاسخ برای هر شاگرد نزدِ هر مربی — کلیکِ دوباره یا
-- فرستادنِ پشتِ‌سرِ‌هم، پیامکِ دوم برای مربی نسازد.
CREATE UNIQUE INDEX IF NOT EXISTS coach_requests_open_uniq
  ON public.coach_requests (coach_id, user_id)
  WHERE status = 'new';

-- ── سقف‌ها داخلِ خودِ دیتابیس ──
-- هر درخواست یک پیامکِ پولی برای مربی است. شمارشِ سمتِ برنامه «بخوان، بعد
-- بنویس» است و چند درخواستِ هم‌زمان به مربی‌های مختلف همه از آن رد می‌شدند
-- (بازبینی). قفلِ مشورتیِ هر کاربر درج‌های هم‌زمانِ او را پشتِ‌سرِ‌هم می‌کند —
-- همان الگوی ۰۹۹ (OTP).
--   BH429: بیش از ۵ درخواست در ۲۴ ساعت
--   BH430: درخواستِ دوباره به همان مربی در ۲۴ ساعت (با هر وضعیتی) — بی‌این،
--          «بفرست، لغو کن، دوباره بفرست» هر بار پیامکِ تازه‌ای به همان مربی می‌زد
CREATE OR REPLACE FUNCTION public.bh_coach_request_quota() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('coach_req:' || NEW.user_id::text));
  IF EXISTS (SELECT 1 FROM public.coach_requests
             WHERE user_id = NEW.user_id AND coach_id = NEW.coach_id
               AND created_at > now() - interval '24 hours') THEN
    RAISE EXCEPTION 'coach_request_same_coach' USING ERRCODE = 'BH430';
  END IF;
  IF (SELECT count(*) FROM public.coach_requests
      WHERE user_id = NEW.user_id AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'coach_request_daily_limit' USING ERRCODE = 'BH429';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS coach_requests_quota ON public.coach_requests;
CREATE TRIGGER coach_requests_quota
BEFORE INSERT ON public.coach_requests
FOR EACH ROW EXECUTE FUNCTION public.bh_coach_request_quota();

ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;
-- خواندن/نوشتن فقط سرورساید با service-role — مثلِ بقیه‌ی جدول‌ها.

DROP TRIGGER IF EXISTS coach_requests_touch ON public.coach_requests;
CREATE TRIGGER coach_requests_touch
BEFORE UPDATE ON public.coach_requests
FOR EACH ROW EXECUTE FUNCTION public.bh_touch_updated_at();

NOTIFY pgrst, 'reload schema';
