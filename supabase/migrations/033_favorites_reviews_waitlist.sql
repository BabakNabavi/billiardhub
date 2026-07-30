-- ─────────────────────────────────────────────────────────────
-- سه زیرسیستمی که در ممیزیِ فاز ۸ معلوم شد اصلاً ساخته نشده‌اند:
--   ۱) علاقه‌مندی‌ها
--   ۲) امتیاز و نظرِ باشگاه
--   ۳) لیستِ انتظارِ مسابقه
-- ─────────────────────────────────────────────────────────────


-- ══════════════ ۱) علاقه‌مندی‌ها ══════════════
--
-- عمداً عمومی است (entity_type) نه فقط باشگاه: صفحه‌های مربی، فروشگاه
-- و محصول هم دکمه‌ی قلب دارند و ساختنِ سه جدولِ هم‌شکل بی‌دلیل است.
--
-- FK به کاربر آبشاری است؛ به موجودیت عمداً نیست، چون entity_id به
-- جدول‌های مختلف اشاره می‌کند و یک FK نمی‌تواند چندمقصدی باشد.
-- پاک‌سازیِ رکوردهای یتیم در خواندن انجام می‌شود (JOIN با جدولِ مقصد).
CREATE TABLE IF NOT EXISTS public.favorites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type  text NOT NULL,
  entity_id    uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT favorites_type_chk CHECK (entity_type IN ('club','coach','referee','seller','product')),
  CONSTRAINT favorites_uniq UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx   ON public.favorites (user_id, entity_type);
CREATE INDEX IF NOT EXISTS favorites_entity_idx ON public.favorites (entity_type, entity_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
-- خواندن/نوشتن فقط سرورساید با service-role؛ هیچ policyِ عمومی‌ای نیست.


-- ══════════════ ۲) امتیاز و نظرِ باشگاه ══════════════
--
-- ضدِ تقلب، سه لایه:
--   • هر کاربر فقط یک نظر برای هر باشگاه (UNIQUE)
--   • فقط کسی که واقعاً در آن باشگاه رزروِ قطعی داشته (چک در API)
--   • مالکِ باشگاه به باشگاهِ خودش امتیاز نمی‌دهد (چک در API)
--
-- میانگین روی خودِ `clubs` نگه داشته می‌شود، نه محاسبه‌ی هر بار: فهرستِ
-- باشگاه‌ها امتیاز را نشان می‌دهد و محاسبه‌ی زنده یعنی یک کوئریِ
-- تجمیعی به‌ازای هر کارت (N+1).
CREATE TABLE IF NOT EXISTS public.club_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating      smallint NOT NULL,
  comment     text,
  /* نظر می‌تواند پنهان شود (گزارشِ کاربران) بدونِ حذفِ امتیاز */
  is_hidden   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT club_reviews_rating_chk  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT club_reviews_comment_chk CHECK (comment IS NULL OR length(comment) <= 1000),
  CONSTRAINT club_reviews_one_per_user UNIQUE (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS club_reviews_club_idx ON public.club_reviews (club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS club_reviews_user_idx ON public.club_reviews (user_id);

ALTER TABLE public.club_reviews ENABLE ROW LEVEL SECURITY;

-- ستون‌های تجمیعی روی باشگاه
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "ratingAvg"   numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratingCount" integer      NOT NULL DEFAULT 0;

-- تریگر: میانگین همیشه با واقعیتِ جدولِ نظرها می‌خواند.
-- نظرِ پنهان‌شده در میانگین حساب نمی‌شود.
CREATE OR REPLACE FUNCTION public.bh_club_rating_refresh()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_club uuid;
BEGIN
  v_club := COALESCE(NEW.club_id, OLD.club_id);
  UPDATE clubs c
     SET "ratingCount" = sub.n,
         "ratingAvg"   = COALESCE(sub.avg, 0)
    FROM (
      SELECT count(*)::int AS n, round(avg(rating)::numeric, 2) AS avg
        FROM club_reviews
       WHERE club_id = v_club AND is_hidden = false
    ) sub
   WHERE c.id = v_club;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS club_reviews_agg ON public.club_reviews;
CREATE TRIGGER club_reviews_agg
AFTER INSERT OR UPDATE OR DELETE ON public.club_reviews
FOR EACH ROW EXECUTE FUNCTION public.bh_club_rating_refresh();


-- ══════════════ ۳) لیستِ انتظارِ مسابقه ══════════════
--
-- تا امروز ثبت‌نام در مسابقه‌ی پر فقط رد می‌شد و کاربر باید دستی
-- سر می‌زد ببیند جا باز شده یا نه.

ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS waitlist_position integer,
  ADD COLUMN IF NOT EXISTS waitlisted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS promoted_at       timestamptz;

-- 'WAITLIST' به واژگانِ وضعیت اضافه می‌شود
ALTER TABLE public.tournament_registrations DROP CONSTRAINT IF EXISTS treg_status_chk;
ALTER TABLE public.tournament_registrations ADD CONSTRAINT treg_status_chk
  CHECK (status IN ('PENDING_PAYMENT','CONFIRMED','CANCELLED','REFUNDED','EXPIRED','WAITLIST'));

-- ترتیبِ صف در هر مسابقه یکتا بماند
CREATE UNIQUE INDEX IF NOT EXISTS treg_waitlist_pos_uniq
  ON public.tournament_registrations (tournament_id, waitlist_position)
  WHERE status = 'WAITLIST';


-- ── پیوستن به صفِ انتظار ──
-- اتمیک است چون «آخرین شماره + ۱» بینِ دو درخواستِ همزمان مسابقه‌ای
-- است: بدونِ قفل، هر دو یک شماره می‌گیرند و ایندکسِ یکتا یکی را
-- می‌شکند — به‌جای اینکه هر دو در صف بنشینند.
CREATE OR REPLACE FUNCTION public.bh_tournament_waitlist_join(
  p_tournament uuid,
  p_user       uuid,
  p_name       text,
  p_phone      text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t   record;
  v_ex  record;
  v_pos integer;
BEGIN
  SELECT id, status, max_players INTO v_t FROM tournaments WHERE id = p_tournament FOR UPDATE;
  IF v_t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'مسابقه یافت نشد');
  END IF;

  IF v_t.status NOT IN ('published','registration_open') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'closed',
      'message', 'ثبت‌نامِ این مسابقه باز نیست');
  END IF;

  /* رکوردِ قبلیِ همین کاربر — RECORD کامل NULL نیست حتی وقتی ردیف
     پیدا نشود، پس باید روی یک ستونِ NOT NULL بررسی شود. */
  SELECT id, status INTO v_ex
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND user_id = p_user;

  IF v_ex.id IS NOT NULL THEN
    IF v_ex.status = 'WAITLIST' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'already_waiting',
        'message', 'شما از قبل در لیستِ انتظار هستید');
    END IF;
    IF v_ex.status IN ('CONFIRMED','PENDING_PAYMENT') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'already_registered',
        'message', 'شما قبلاً در این مسابقه ثبت‌نام کرده‌اید');
    END IF;
    /* لغوشده/منقضی ⇒ همان رکورد به صف برمی‌گردد */
    SELECT COALESCE(max(waitlist_position), 0) + 1 INTO v_pos
      FROM tournament_registrations
     WHERE tournament_id = p_tournament AND status = 'WAITLIST';

    UPDATE tournament_registrations
       SET status = 'WAITLIST', waitlist_position = v_pos, waitlisted_at = now(),
           promoted_at = NULL, cancel_reason = NULL, updated_at = now(),
           player_name = COALESCE(NULLIF(btrim(p_name), ''), player_name),
           contact_phone = COALESCE(NULLIF(btrim(p_phone), ''), contact_phone)
     WHERE id = v_ex.id;

    RETURN jsonb_build_object('ok', true, 'registrationId', v_ex.id, 'position', v_pos);
  END IF;

  SELECT COALESCE(max(waitlist_position), 0) + 1 INTO v_pos
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND status = 'WAITLIST';

  INSERT INTO tournament_registrations
    (tournament_id, user_id, player_name, contact_phone, status, payment_status,
     amount, waitlist_position, waitlisted_at)
  VALUES
    (p_tournament, p_user, NULLIF(btrim(p_name), ''), NULLIF(btrim(p_phone), ''),
     'WAITLIST', 'UNPAID', 0, v_pos, now());

  RETURN jsonb_build_object('ok', true, 'position', v_pos);
END $$;


-- ── ترکِ صف ──
CREATE OR REPLACE FUNCTION public.bh_tournament_waitlist_leave(
  p_tournament uuid,
  p_user       uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pos integer;
BEGIN
  SELECT waitlist_position INTO v_pos
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND user_id = p_user AND status = 'WAITLIST';

  IF v_pos IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_waiting',
      'message', 'شما در لیستِ انتظارِ این مسابقه نیستید');
  END IF;

  UPDATE tournament_registrations
     SET status = 'CANCELLED', waitlist_position = NULL, updated_at = now()
   WHERE tournament_id = p_tournament AND user_id = p_user;

  /* صف نباید سوراخ بماند — نفراتِ بعدی یک پله بالا می‌آیند */
  UPDATE tournament_registrations
     SET waitlist_position = waitlist_position - 1, updated_at = now()
   WHERE tournament_id = p_tournament AND status = 'WAITLIST' AND waitlist_position > v_pos;

  RETURN jsonb_build_object('ok', true);
END $$;


-- ── ارتقای نفرِ اولِ صف وقتی جا باز می‌شود ──
--
-- مسابقه‌ی رایگان ⇒ مستقیم CONFIRMED.
-- مسابقه‌ی پولی ⇒ PENDING_PAYMENT با مهلت؛ پول را خودش باید بدهد و
-- تا آن موقع صندلی برایش نگه داشته می‌شود.
CREATE OR REPLACE FUNCTION public.bh_tournament_promote_waitlist(
  p_tournament uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t     record;
  v_taken integer;
  v_next  record;
BEGIN
  SELECT id, max_players, entry_fee, status INTO v_t
    FROM tournaments WHERE id = p_tournament FOR UPDATE;
  IF v_t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  IF v_t.status NOT IN ('published','registration_open') THEN
    RETURN jsonb_build_object('ok', true, 'promoted', 0, 'reason', 'closed');
  END IF;

  SELECT count(*)::int INTO v_taken
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND status IN ('CONFIRMED','PENDING_PAYMENT');

  IF v_taken >= v_t.max_players THEN
    RETURN jsonb_build_object('ok', true, 'promoted', 0, 'reason', 'still_full');
  END IF;

  SELECT id, user_id INTO v_next
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND status = 'WAITLIST'
   ORDER BY waitlist_position
   LIMIT 1;

  IF v_next.id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'promoted', 0, 'reason', 'empty');
  END IF;

  UPDATE tournament_registrations
     SET status = CASE WHEN v_t.entry_fee > 0 THEN 'PENDING_PAYMENT' ELSE 'CONFIRMED' END,
         amount = v_t.entry_fee,
         waitlist_position = NULL,
         promoted_at = now(),
         updated_at = now()
   WHERE id = v_next.id;

  /* بقیه یک پله بالا می‌آیند */
  UPDATE tournament_registrations
     SET waitlist_position = waitlist_position - 1, updated_at = now()
   WHERE tournament_id = p_tournament AND status = 'WAITLIST';

  RETURN jsonb_build_object('ok', true, 'promoted', 1,
    'registrationId', v_next.id, 'userId', v_next.user_id,
    'needsPayment', v_t.entry_fee > 0);
END $$;

REVOKE ALL ON FUNCTION public.bh_tournament_waitlist_join(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_waitlist_leave(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_promote_waitlist(uuid) FROM PUBLIC, anon, authenticated;
