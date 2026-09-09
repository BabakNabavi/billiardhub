-- ─────────────────────────────────────────────────────────────
-- ۰۹۳ — لیست‌های پخشِ بیلیارد مدیا
--
-- ── چرا جدا از ۰۹۲ ──
-- لیستِ پخش عمداً در آن مهاجرت نیامد: جدول بدونِ جریانِ ساخت و
-- ویرایش فقط اسکیمای مرده است. حالا آن جریان هست (مسیرِ
-- `/api/media/playlists` و تبِ «لیست‌های پخش» در صفحه‌ی کانال)، پس
-- جدولش هم می‌آید.
--
-- ── مالکیت ──
-- ⚠️ لیست به *کانال* تعلق دارد، نه مستقیم به کاربر: هویتِ کانال در
-- این پروژه `creator_handle` است و ویدیوها هم با همان کلید به کانال
-- وصل‌اند. `owner_id` هم نگه داشته می‌شود تا اگر کاربری حذف شد،
-- بدانیم لیست بی‌صاحب شده — ولی مرجعِ اجازه، مالکیتِ هندل است که
-- سرور با `myChannelHandles` بررسی می‌کند.
--
-- ── ترتیب ──
-- `position` دستی است و مساوی‌ها با زمانِ افزودن شکسته می‌شوند، پس
-- افزودنِ ساده بدونِ تعیینِ جا هم ترتیبِ قابل‌پیش‌بینی می‌دهد.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.playlists (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  title          text NOT NULL,
  description    text NOT NULL DEFAULT '',
  -- حذفِ کاربر لیست را نابود نمی‌کند؛ محتوای کانال به کانال است
  owner_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  channel_handle text NOT NULL,
  visibility     text NOT NULL DEFAULT 'public'
                 CHECK (visibility IN ('public','unlisted','private')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT playlists_title_chk  CHECK (length(btrim(title)) BETWEEN 1 AND 120),
  CONSTRAINT playlists_handle_chk CHECK (channel_handle <> '' AND length(channel_handle) <= 30)
);
CREATE INDEX IF NOT EXISTS playlists_handle_idx ON public.playlists (channel_handle, created_at DESC);

CREATE TABLE IF NOT EXISTS public.playlist_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id    uuid NOT NULL REFERENCES public.videos(id)    ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- ستونِ اولش `playlist_id` است، پس خواندنِ آیتم‌های یک لیست هم از
  -- همین ایندکس استفاده می‌کند و ایندکسِ دوم لازم نیست.
  CONSTRAINT playlist_items_once UNIQUE (playlist_id, video_id)
);
-- مرتب‌سازیِ نمایش
CREATE INDEX IF NOT EXISTS playlist_items_order_idx
  ON public.playlist_items (playlist_id, position, created_at);

-- ⚠️ `updated_at` خودش به‌روز نمی‌شود؛ تریگر لازم دارد وگرنه ستونی
-- می‌ماند که همیشه لحظه‌ی ساخت را نشان می‌دهد.
-- تابعش از قبل در مهاجرتِ ۰۹۰ ساخته شده؛ نسخه‌ی دومِ همان بدنه
-- فقط یک چیزِ دیگر برای از-هم-افتادن است.
DROP TRIGGER IF EXISTS bh_playlists_touch_bu ON public.playlists;
CREATE TRIGGER bh_playlists_touch_bu
BEFORE UPDATE ON public.playlists
FOR EACH ROW EXECUTE FUNCTION public.bh_touch_updated_at();

-- امنیت — دسترسی فقط از راهِ APIهای خودمان با کلیدِ سرویس
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['playlists','playlist_items'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- بدونِ این، PostgREST کشِ قدیمیِ اسکیما را نگه می‌دارد و جدول را
-- «پیدا نشده» گزارش می‌کند.
NOTIFY pgrst, 'reload schema';
