/* ═══════════════════════════════════════════════════════════════
   نقش‌ها — انتخاب، تکمیل، تأیید
   ───────────────────────────────────────────────────────────────
   مدلی که تا امروز پیاده بود با آنچه باید می‌بود فرق داشت:

   ── آنچه بود ──
   کاربر نقش را انتخاب می‌کرد و همان لحظه یک درخواستِ `pending` روی
   میزِ ادمین می‌نشست — خالی، بی‌مدرک، بی‌پروفایل. ادمین چیزی برای
   تأیید یا رد کردن نداشت. با بیست کاربر، شصت ردیفِ بی‌معنی.

   ── آنچه باید باشد ──
   انتخابِ نقش خودش کاری نمی‌خواهد: کاربر نقش را می‌گیرد و می‌تواند
   شروع کند (باشگاه‌دار باشگاهش را بسازد). تا وقتی پروفایلش را تکمیل
   نکرده، عملاً کاربرِ عادی است و ضرری ندارد.

   میزِ ادمین فقط وقتی پر می‌شود که کاربر پروفایلش را کامل کند و
   «ثبت نهایی» بزند.

   ── وضعیتِ تازه: draft ──
   ردیفِ `draft` یعنی «نقش داده شده، پروفایل هنوز نیامده». روی میزِ
   ادمین دیده نمی‌شود (آن صفحه فقط `pending` را می‌خواند) و فقط
   نگهبانِ زمان است.

   ── ممیزیِ ۷۲ ساعت ──
   نقشی که انتخاب شده و ۷۲ ساعت تکمیل نشده پس گرفته می‌شود. کاربر
   می‌تواند دوباره انتخابش کند. بدونِ این، فهرستِ نقش‌های هر کاربر
   پر می‌شود از نقش‌هایی که هرگز استفاده نکرده.

   ── مدرک ──
   مدرک **اجباری نیست**. نبودنش یعنی «تأیید بدونِ تیک آبی»، نه «رد».
   تیکِ آبی معیارِ خودش را دارد:
     داور        → آخرین مدرک داوری
     مربی        → آخرین مدرک مربیگری
     باشگاه‌دار، فروشگاه، تولیدکننده → جواز کسب
     خدمات فنی، بازیکن، کاربر عادی  → تیک ندارند
   ═══════════════════════════════════════════════════════════════ */

/* ── وضعیتِ draft ── */
ALTER TABLE public.role_requests DROP CONSTRAINT IF EXISTS role_requests_status_chk;
ALTER TABLE public.role_requests
  ADD CONSTRAINT role_requests_status_chk
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

/* لحظه‌ای که پروفایل تکمیل و ثبت شد — جدا از `requested_at` که لحظه‌ی
   *انتخابِ* نقش است. فاصله‌ی این دو همان چیزی است که ممیزیِ ۷۲ ساعت
   می‌سنجد. */
ALTER TABLE public.role_requests
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

/* نگهبانِ زمان از این شاخص می‌گذرد */
CREATE INDEX IF NOT EXISTS role_requests_draft_idx
  ON public.role_requests (status, requested_at)
  WHERE status = 'draft';

/* ── ممیزیِ ۷۲ ساعت ──
   نقشِ رهاشده را از کاربر پس می‌گیرد و ردیفِ draft را پاک می‌کند.

   `primaryRole` فقط وقتی به `user` برمی‌گردد که همان نقشِ رهاشده بوده
   باشد — وگرنه پس‌گرفتنِ «داور» از یک باشگاه‌دار، باشگاهش را هم از
   دستش درمی‌آورد.

   ردیف پاک می‌شود نه علامت‌گذاری، چون کاربر باید بتواند همان نقش را
   دوباره انتخاب کند و قیدِ یکتاییِ درخواستِ باز جلویش را نگیرد. */
CREATE OR REPLACE FUNCTION public.bh_sweep_stale_roles(p_hours integer DEFAULT 72)
RETURNS TABLE (removed_user uuid, removed_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT id, user_id, role FROM public.role_requests
     WHERE status = 'draft'
       AND requested_at < now() - make_interval(hours => p_hours)
  LOOP
    UPDATE public.users u
       SET "secondaryRoles" = array_remove(coalesce(u."secondaryRoles", '{}'), r.role),
           "primaryRole"    = CASE WHEN u."primaryRole" = r.role THEN 'user' ELSE u."primaryRole" END,
           "updatedAt"      = now()
     WHERE u.id = r.user_id;

    DELETE FROM public.role_requests WHERE id = r.id;

    removed_user := r.user_id;
    removed_role := r.role;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.bh_sweep_stale_roles(integer) FROM PUBLIC, anon, authenticated;

/* ── ردیف‌های امروز ──
   شش درخواستِ خالی که با مدلِ قدیمی ساخته شدند به `draft` می‌روند تا
   از میزِ ادمین بیرون بیایند. پاک نمی‌شوند: نقششان به کاربر داده شده و
   نگهبانِ ۷۲ ساعت خودش تصمیم می‌گیرد. */
UPDATE public.role_requests
   SET status = 'draft'
 WHERE status = 'pending' AND doc_url IS NULL AND submitted_at IS NULL;

/* ── بررسی ── */
SELECT
  (SELECT count(*) FROM pg_proc WHERE proname = 'bh_sweep_stale_roles')          AS fn_sweep,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'role_requests' AND column_name = 'submitted_at')         AS col_submitted,
  (SELECT count(*) FROM public.role_requests WHERE status = 'draft')             AS drafts,
  (SELECT count(*) FROM public.role_requests WHERE status = 'pending')           AS pending;
