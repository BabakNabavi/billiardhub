-- ─────────────────────────────────────────────────────────────────
-- ۰۷۰ — «رویداد اصلی» را ادمین انتخاب می‌کند
--
-- ── مشکلی که این حل می‌کند ──
-- صفحه‌ی مسابقات یک بیلبوردِ بزرگ به نامِ «رویداد اصلی» دارد. تا
-- امروز محتوایش این‌طور انتخاب می‌شد:
--
--     all.find(t => t.status === 'registration_open')
--
-- یعنی **اولین مسابقه‌ای که در فهرست می‌آمد** — و ترتیبِ فهرست هم بر
-- اساسِ تاریخِ شروع بود. پس هر باشگاهی که مسابقه‌اش زودتر برگزار
-- می‌شد، بی‌آنکه کسی تصمیم بگیرد، بزرگ‌ترین جای صفحه‌ی اصلی را
-- می‌گرفت. با زیادشدنِ باشگاه‌ها این یعنی جایگاهی که ارزشِ تبلیغاتی
-- دارد، قرعه‌کشی باشد.
--
-- حالا یک پرچمِ صریح است که فقط ادمینِ سیستم می‌تواند بزند.
--
-- ── چرا فقط یکی ──
-- ایندکسِ یکتای جزئی تضمین می‌کند در هر لحظه حداکثر یک مسابقه
-- «اصلی» باشد. بدونِ آن، دو ادمین می‌توانستند دو مسابقه را هم‌زمان
-- علامت بزنند و صفحه یکی را دلبخواهی نشان می‌داد.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS featured_at timestamptz;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS featured_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS tournaments_one_featured_idx
  ON public.tournaments ((is_featured))
  WHERE is_featured;

/* ── انتخابِ رویداد اصلی — اتمیک ──
   برداشتنِ پرچمِ قبلی و زدنِ پرچمِ تازه باید یک عمل باشد؛ وگرنه بینِ
   دو دستور، ایندکسِ یکتا یکی از آن‌ها را رد می‌کند و صفحه لحظه‌ای
   بدونِ رویداد اصلی می‌ماند. */
CREATE OR REPLACE FUNCTION public.bh_set_featured_tournament(
  p_tournament uuid,     -- NULL یعنی «هیچ رویداد اصلی‌ای نباشد»
  p_actor      uuid
) RETURNS jsonb AS $$
DECLARE t record;
BEGIN
  UPDATE public.tournaments
     SET is_featured = false, featured_at = NULL, featured_by = NULL
   WHERE is_featured;

  IF p_tournament IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'featured', NULL);
  END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  /* پیش‌نویس یا لغوشده روی صفحه‌ی اصلی معنی ندارد */
  IF t.status NOT IN ('published','registration_open','registration_closed','ongoing') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_public', 'status', t.status);
  END IF;

  UPDATE public.tournaments
     SET is_featured = true, featured_at = now(), featured_by = p_actor
   WHERE id = p_tournament;

  RETURN jsonb_build_object('ok', true, 'featured', p_tournament);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_set_featured_tournament(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

-- ── بررسی ──
-- انتظار: col=1 · idx=1 · fn=1
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'is_featured')      AS col,
  (SELECT count(*) FROM pg_indexes
    WHERE indexname = 'tournaments_one_featured_idx')                      AS idx,
  (SELECT count(*) FROM pg_proc
    WHERE proname = 'bh_set_featured_tournament')                          AS fn;
