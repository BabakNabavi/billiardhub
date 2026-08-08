-- ─────────────────────────────────────────────────────────────────
-- ۰۷۴ — لغوِ ثبت‌نام توسطِ خودِ بازیکن
--
-- ── چه چیزی کم بود ──
-- بازیکن ثبت‌نام می‌کرد و پول می‌داد، ولی هیچ راهی برای انصراف
-- نداشت. تنها گزینه این بود که به باشگاه زنگ بزند و از او بخواهد
-- بازپرداخت بزند — کاری که برای رزروِ میز از سالِ اول خودکار بود.
--
-- ── قاعده ──
-- تا **۴ ساعت پیش از پایانِ مهلتِ ثبت‌نام**، لغو آزاد است و مبلغ
-- کامل برمی‌گردد. بعد از آن نه.
--
-- چرا مهلتِ ثبت‌نام و نه زمانِ شروع: برگزارکننده بر اساسِ همان مهلت
-- جدول را می‌چیند و بای‌ها را تعیین می‌کند. انصرافِ بعد از چیدنِ
-- جدول یعنی یک جایگاهِ خالی که کسی جایش نیست — و آن‌جا دیگر باید
-- «باخت به‌خاطرِ عدمِ حضور» ثبت شود، نه بازپرداخت.
--
-- ۴ ساعت هم برای همین است: فاصله‌ای که باشگاه بتواند نفرِ بعدیِ صفِ
-- انتظار را خبر کند.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_tournament_self_cancel(
  p_registration uuid,
  p_user         uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r record; t record; v_deadline timestamptz; v_hours numeric;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations
   WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  /* فقط صاحبِ ثبت‌نام. ثبت‌نامِ حضوری `user_id` ندارد و از این مسیر
     لغو نمی‌شود — آن را باشگاه‌دار خودش برمی‌دارد. */
  IF r.user_id IS NULL OR r.user_id <> p_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_yours');
  END IF;

  IF r.status IN ('CANCELLED', 'REFUNDED', 'EXPIRED') THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  /* جدول که کشیده شد، جایگاه‌ها قطعی‌اند */
  IF EXISTS (SELECT 1 FROM public.tournament_matches WHERE tournament_id = t.id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bracket_drawn');
  END IF;

  /* مهلت نداشته باشد ⇒ زمانِ شروعِ مسابقه ملاک است */
  v_deadline := coalesce(t.registration_ends_at, t.starts_at);
  IF v_deadline IS NOT NULL THEN
    v_hours := extract(epoch FROM (v_deadline - now())) / 3600.0;
    IF v_hours < 4 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'too_late',
        'hoursLeft', round(v_hours, 1));
    END IF;
  END IF;

  /* پرداخت‌شده ⇒ بازپرداخت. پرداخت‌نشده ⇒ فقط لغو.
     پول این‌جا جابه‌جا نمی‌شود؛ فقط وضعیت ثبت می‌شود و انتقالِ
     واقعی در دستورِ پرداختِ پنلِ ادمین می‌آید — همان مسیری که
     بازپرداختِ رزرو دارد. */
  IF r.payment_status = 'PAID' THEN
    UPDATE public.tournament_registrations
       SET status = 'REFUNDED', payment_status = 'REFUNDED',
           refund_amount = r.amount, refunded_at = now(),
           cancel_reason = 'انصراف بازیکن', updated_at = now()
     WHERE id = p_registration;
    RETURN jsonb_build_object('ok', true, 'refunded', r.amount);
  END IF;

  UPDATE public.tournament_registrations
     SET status = 'CANCELLED', cancel_reason = 'انصراف بازیکن', updated_at = now()
   WHERE id = p_registration;
  RETURN jsonb_build_object('ok', true, 'refunded', 0);
END $$;

/* آیا این ثبت‌نام همین حالا قابلِ لغو است؟ — برای نمایش در رابط،
   تا دکمه‌ای که کار نمی‌کند نشان داده نشود. */
CREATE OR REPLACE FUNCTION public.bh_tournament_cancellable(p_registration uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE r record; t record; v_deadline timestamptz; v_hours numeric;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations WHERE id = p_registration;
  IF r.id IS NULL THEN RETURN jsonb_build_object('can', false, 'reason', 'not_found'); END IF;
  IF r.status IN ('CANCELLED','REFUNDED','EXPIRED') THEN
    RETURN jsonb_build_object('can', false, 'reason', 'already');
  END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id;
  IF EXISTS (SELECT 1 FROM public.tournament_matches WHERE tournament_id = t.id) THEN
    RETURN jsonb_build_object('can', false, 'reason', 'bracket_drawn');
  END IF;

  v_deadline := coalesce(t.registration_ends_at, t.starts_at);
  IF v_deadline IS NULL THEN RETURN jsonb_build_object('can', true); END IF;
  v_hours := extract(epoch FROM (v_deadline - now())) / 3600.0;
  IF v_hours < 4 THEN
    RETURN jsonb_build_object('can', false, 'reason', 'too_late', 'hoursLeft', round(v_hours, 1));
  END IF;
  RETURN jsonb_build_object('can', true, 'hoursLeft', round(v_hours, 1));
END $$;

REVOKE ALL ON FUNCTION public.bh_tournament_self_cancel(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_cancellable(uuid) FROM PUBLIC, anon, authenticated;

SELECT count(*) AS fns FROM pg_proc
 WHERE proname IN ('bh_tournament_self_cancel','bh_tournament_cancellable');
