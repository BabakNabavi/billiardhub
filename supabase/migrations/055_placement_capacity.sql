/* ═══════════════════════════════════════════════════════════════
   ظرفیتِ جایگاه — از «سقفِ نمایش» به «سقفِ فروش»
   ───────────────────────────────────────────────────────────────
   تا امروز `placements.capacity` فقط تعیین می‌کرد چند کمپین هم‌زمان
   *نمایش* داده شود. هیچ‌جا هنگام خرید بررسی نمی‌شد. یعنی روی جایگاهی
   با ظرفیت ۱ می‌شد بی‌نهایت کمپین فروخت؛ همه پول می‌دادند و فقط یکی
   دیده می‌شد.

   دو تابع اضافه می‌شود:

     · placement_availability — «چند جا آزاد است؟» برای نمایش پیش از
       خرید. فقط می‌خواند.

     · reserve_campaign_slot — شمردنِ ظرفیت و ساختِ کمپین در یک
       تراکنش، زیرِ قفلِ ردیفِ همان جایگاه. این تنها راهی است که دو
       خریدارِ هم‌زمان نتوانند آخرین جا را با هم بردارند: بررسی و
       درج نباید در دو رفت‌وبرگشتِ جدا باشند.

   ── چه چیزی «جا» را اشغال می‌کند؟ ──
   کمپین‌های PENDING_REVIEW، SCHEDULED و ACTIVE — یعنی پول داده شده
   یا در نوبتِ نمایش است.

   PENDING_PAYMENT هم جا می‌گیرد، ولی فقط تا مدتِ محدود. اگر برای
   همیشه جا می‌گرفت، هر کسی می‌توانست با شروعِ خریدِ ناتمام، جایگاه را
   قفل کند. اگر اصلاً جا نمی‌گرفت، چند نفر هم‌زمان به درگاه می‌رفتند و
   همه پرداخت موفق می‌داشتند در حالی که فقط یکی جا داشت.

   DRAFT، EXPIRED، REJECTED و CANCELLED جا نمی‌گیرند.

   ── پنجره‌ی زمانی ──
   ظرفیت «هم‌زمان» است، نه «کل». کمپینی که ماه بعد تمام می‌شود، جای
   کمپینی که ماه بعد شروع می‌شود را نمی‌گیرد. شرطِ هم‌پوشانی همان
   شرطِ استانداردِ بازه‌هاست: starts < other_ends AND ends > other_starts.

   ── ظرفیتِ صفر ──
   `capacity = 0` یعنی «نامحدود» (همان معنایی که در کدِ نمایش دارد:
   `shownCount` وقتی displayCount صفر است کلِ ظرفیت را نشان می‌دهد).
   برای بستنِ فروشِ یک جایگاه از `is_active = false` استفاده کنید.
   ═══════════════════════════════════════════════════════════════ */

/* ── ۱) شاخصِ هم‌پوشانی ──
   بدون این، هر بررسیِ ظرفیت کلِ جدولِ کمپین‌ها را می‌خواند. با رشدِ
   تبلیغ‌دهنده‌ها همان بررسی به گلوگاهِ خرید تبدیل می‌شد. */
CREATE INDEX IF NOT EXISTS campaigns_capacity_idx
  ON public.campaigns (placement_key, status, starts_at, ends_at);

/* ── ۲) چند جا آزاد است؟ ── */
CREATE OR REPLACE FUNCTION public.placement_availability(
  p_key           text,
  p_start         timestamptz DEFAULT now(),
  p_end           timestamptz DEFAULT now() + interval '30 days',
  p_hold_minutes  integer     DEFAULT 20
)
RETURNS TABLE (capacity integer, used integer, free integer, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.capacity,
    v.used::integer,
    /* ظرفیتِ صفر = نامحدود ⇒ «آزاد» عددِ بزرگی نیست، منفی هم نیست:
       ‎-1 یعنی «سقفی ندارد» و لایه‌ی بالاتر همین را نشان می‌دهد. */
    CASE WHEN p.capacity <= 0 THEN -1
         ELSE GREATEST(0, p.capacity - v.used)::integer END,
    p.is_active
  FROM public.placements p
  CROSS JOIN LATERAL (
    SELECT count(*) AS used
    FROM public.campaigns c
    WHERE c.placement_key = p.key
      AND c.starts_at < p_end
      AND c.ends_at   > p_start
      AND (
        c.status IN ('PENDING_REVIEW', 'SCHEDULED', 'ACTIVE')
        OR (c.status = 'PENDING_PAYMENT'
            AND c.created_at > now() - make_interval(mins => p_hold_minutes))
      )
  ) v
  WHERE p.key = p_key;
$$;

/* ── ۳) رزروِ اتمیک ──
   خطاها با کدِ کوتاه بالا می‌روند تا لایه‌ی برنامه پیامِ فارسیِ درست
   را بسازد؛ متنِ خطای دیتابیس هرگز مستقیم به کاربر نشان داده نمی‌شود. */
CREATE OR REPLACE FUNCTION public.reserve_campaign_slot(
  p_placement     text,
  p_user          uuid,
  p_advertiser    text,
  p_title         text,
  p_content       jsonb,
  p_starts        timestamptz,
  p_ends          timestamptz,
  p_hold_minutes  integer DEFAULT 20
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap    integer;
  v_active boolean;
  v_used   integer;
  v_id     uuid;
BEGIN
  IF p_ends <= p_starts THEN
    RAISE EXCEPTION 'BAD_WINDOW';
  END IF;

  /* قفلِ ردیفِ جایگاه. از این‌جا تا پایانِ تراکنش، هیچ رزروِ هم‌زمانِ
     دیگری روی همین جایگاه نمی‌تواند بشمارد — همان چیزی که جلوی
     برداشتنِ هم‌زمانِ آخرین جا را می‌گیرد. */
  SELECT p.capacity, p.is_active
    INTO v_cap, v_active
    FROM public.placements p
   WHERE p.key = p_placement
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLACEMENT_NOT_FOUND';
  END IF;
  IF NOT v_active THEN
    RAISE EXCEPTION 'PLACEMENT_INACTIVE';
  END IF;

  IF v_cap > 0 THEN
    SELECT count(*)
      INTO v_used
      FROM public.campaigns c
     WHERE c.placement_key = p_placement
       AND c.starts_at < p_ends
       AND c.ends_at   > p_starts
       AND (
         c.status IN ('PENDING_REVIEW', 'SCHEDULED', 'ACTIVE')
         OR (c.status = 'PENDING_PAYMENT'
             AND c.created_at > now() - make_interval(mins => p_hold_minutes))
       );

    IF v_used >= v_cap THEN
      RAISE EXCEPTION 'PLACEMENT_FULL';
    END IF;
  END IF;

  INSERT INTO public.campaigns
    (placement_key, user_id, advertiser, title, content,
     status, starts_at, ends_at, weight, sort_order)
  VALUES
    (p_placement, p_user, left(coalesce(p_advertiser, ''), 160),
     left(coalesce(p_title, ''), 160), coalesce(p_content, '{}'::jsonb),
     'PENDING_PAYMENT', p_starts, p_ends, 1, 0)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

/* هیچ‌کدام از این دو از مرورگر صدا زده نمی‌شوند؛ فقط سرور با
   service-role. `placement_availability` هم SECURITY DEFINER است و
   بدونِ این پس‌گرفتن، هر کسی می‌توانست وضعیتِ فروشِ جایگاه‌ها را
   بخواند. */
REVOKE ALL ON FUNCTION public.placement_availability(text, timestamptz, timestamptz, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_campaign_slot(text, uuid, text, text, jsonb, timestamptz, timestamptz, integer)
  FROM PUBLIC, anon, authenticated;

/* ── بررسی ── */
SELECT
  (SELECT count(*) FROM pg_proc WHERE proname = 'placement_availability') AS fn_availability,
  (SELECT count(*) FROM pg_proc WHERE proname = 'reserve_campaign_slot')  AS fn_reserve,
  (SELECT count(*) FROM pg_indexes WHERE indexname = 'campaigns_capacity_idx') AS idx;
