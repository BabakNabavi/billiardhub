-- ─────────────────────────────────────────────────────────────
-- ۱۰۶ — فهرستِ کنش‌های موجود، برای فیلترِ صفحه‌ی /admin/logs
--
-- ── مسئله ──
-- فیلترِ «رویداد» یک فیلدِ متنیِ آزاد بود: کاربر باید نامِ دقیقِ کنش
-- را با حروفِ بزرگ تایپ می‌کرد. و چون پرس‌وجو `eq` است (نه `ilike`،
-- که اصلا از ایندکس استفاده نمی‌کرد)، یک حرفِ کم یعنی **صفر ردیف
-- بدونِ هیچ توضیحی** — کاربر نتیجه می‌گیرد رویدادی نبوده.
--
-- کنش‌ها ۱۲۷ تا و در حالِ زیادشدن‌اند، پس هاردکدشان در کلاینت یعنی
-- فهرستی که بی‌صدا کهنه می‌شود. این تابع همان چیزی را می‌دهد که
-- **واقعا در جدول هست**.
--
-- ── چرا CTEِ بازگشتی و نه `SELECT DISTINCT` ──
-- `DISTINCT` کلِ ایندکس را می‌پیماید: O(ردیف). این الگو (loose index
-- scan) به ازای هر مقدارِ یکتا یک جهشِ ایندکس می‌زند: O(یکتا × log n).
-- با ۱۲۷ کنش یعنی ۱۲۷ جهش به‌جای پیمایشِ کلِ جدول — و جدول فقط بزرگ‌تر
-- می‌شود. ایندکسِ `audit_action_idx (action, created_at DESC)` از
-- مهاجرتِ ۱۰۴ دقیقا همین را پشتیبانی می‌کند.
--
-- ⚠️ `STABLE` است نه `VOLATILE`: فقط می‌خواند.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.bh_audit_actions()
RETURNS TABLE (action text)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  WITH RECURSIVE walk AS (
    (SELECT a.action FROM public.audit_logs a ORDER BY a.action LIMIT 1)
    UNION ALL
    SELECT (SELECT a.action
              FROM public.audit_logs a
             WHERE a.action > w.action
             ORDER BY a.action
             LIMIT 1)
      FROM walk w
     WHERE w.action IS NOT NULL
  )
  SELECT w.action FROM walk w WHERE w.action IS NOT NULL ORDER BY w.action;
$$;

REVOKE ALL ON FUNCTION public.bh_audit_actions() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
