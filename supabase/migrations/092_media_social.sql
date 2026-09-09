-- ─────────────────────────────────────────────────────────────
-- ۰۹۲ — لایه‌ی اجتماعیِ بیلیارد مدیا: اشتراکِ کانال، پسند، دیدگاه
--
-- ── چرا ──
-- صفحه‌ی تماشا و صفحه‌ی کانال سه دکمه داشتند («لایک»، «تماشای بعداً»،
-- «دنبال کردن») که هر سه فقط `useState` بودند: هیچ درخواستی نمی‌رفت و
-- با یک رفرش همه‌چیز می‌پرید. شمارنده‌ی لایک هم همیشه صفر بود چون در
-- نگاشت هاردکد شده بود. آن دکمه‌ها برداشته شدند؛ این مهاجرت پشتوانه‌ی
-- واقعی‌شان را می‌سازد.
--
-- ── سه تصمیمِ مشترک ──
--   ۱) هیچ‌کدام از anon/authenticated خواندنی/نوشتنی نیستند؛ دسترسی
--      فقط از راهِ APIهای خودمان با کلیدِ سرویس — الگوی ۰۲۵ و ۰۸۹.
--   ۲) حذفِ کاربر محتوایش را پاک می‌کند (CASCADE): دیدگاهِ بی‌نویسنده
--      در یک بخشِ عمومی معنا ندارد.
--   ۳) ایندکسِ اضافه ساخته نمی‌شود. هر ایندکس هزینه‌ی نوشتن دارد و
--      ایندکسِ یکتا خودش ستونِ اولش را پوشش می‌دهد.
--
-- ⚠️ کانال در این پروژه جدول ندارد؛ هویتش `creator_handle`ِ روی
-- `videos` است (فهرستِ کانال‌ها یک فایلِ JSON در Storage است). پس
-- اشتراک روی همان هندل بسته می‌شود، نه روی کلیدِ خارجیِ خیالی.
--
-- ⚠️ لیستِ پخش در این مهاجرت **نیست**. ساختنِ جدولش بدونِ جریانِ
-- ساخت/ویرایش فقط اسکیمای مرده است؛ وقتی آن جریان طراحی شد، با هم
-- می‌آید.
-- ─────────────────────────────────────────────────────────────

-- ═══════════ اشتراکِ کانال ═══════════
CREATE TABLE IF NOT EXISTS public.channel_subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel_handle text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT channel_subs_handle_chk CHECK (channel_handle <> '' AND length(channel_handle) <= 30),
  CONSTRAINT channel_subs_once UNIQUE (user_id, channel_handle)
);
-- شمارشِ دنبال‌کننده‌های یک کانال. ایندکسِ یکتا با `user_id` شروع
-- می‌شود، پس این پرس‌وجو ایندکسِ خودش را لازم دارد.
CREATE INDEX IF NOT EXISTS channel_subs_handle_idx ON public.channel_subscriptions (channel_handle);

-- ═══════════ پسندِ ویدیو ═══════════
CREATE TABLE IF NOT EXISTS public.video_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- ستونِ اولش `video_id` است، پس شمارشِ پسندهای یک ویدیو هم از همین
  -- ایندکس استفاده می‌کند و ایندکسِ دوم لازم نیست.
  CONSTRAINT video_likes_once UNIQUE (video_id, user_id)
);

-- ═══════════ دیدگاه ═══════════
CREATE TABLE IF NOT EXISTS public.video_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  -- پاسخ به دیدگاهِ دیگر. یک سطح عمق؛ درختِ بی‌انتها روی موبایل
  -- خوانده نمی‌شود. «پاسخ به پاسخ» را خودِ API رد می‌کند.
  parent_id  uuid REFERENCES public.video_comments(id) ON DELETE CASCADE,
  body       text NOT NULL,
  -- گزارشِ کاربران دیدگاه را پنهان می‌کند، پاک نمی‌کند
  is_hidden  boolean NOT NULL DEFAULT false,
  -- صاحبِ ویدیو می‌تواند یک دیدگاه را سنجاق کند
  is_pinned  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT video_comments_body_chk CHECK (length(btrim(body)) BETWEEN 1 AND 2000)
);
CREATE INDEX IF NOT EXISTS video_comments_video_idx
  ON public.video_comments (video_id, is_pinned DESC, created_at DESC)
  WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS video_comments_parent_idx ON public.video_comments (parent_id)
  WHERE parent_id IS NOT NULL;

-- ═══════════ شمارنده روی خود videos ═══════════
-- ⚠️ کارت ویدیو باید تعداد پسند و دیدگاه را نشان بدهد. بدون این
-- ستون‌ها هر شبکه بیست‌کارتی چهل شمارش جداگانه لازم داشت. تریگر
-- نگهشان می‌دارد تا هیچ‌وقت از واقعیت جدا نیفتند.
--
-- صفر این‌جا دروغ نیست: ویدیویی که کسی نپسندیده واقعا صفر پسند
-- دارد. رابط هم فقط بالای صفر را نشان می‌دهد.
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS likes_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.bh_video_likes_refresh()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  v := COALESCE(NEW.video_id, OLD.video_id);
  UPDATE videos SET likes_count = (SELECT count(*)::int FROM video_likes WHERE video_id = v)
   WHERE id = v;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS bh_video_likes_aiud ON public.video_likes;
CREATE TRIGGER bh_video_likes_aiud
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.bh_video_likes_refresh();

CREATE OR REPLACE FUNCTION public.bh_video_comments_refresh()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  v := COALESCE(NEW.video_id, OLD.video_id);
  UPDATE videos SET comments_count =
    (SELECT count(*)::int FROM video_comments WHERE video_id = v AND is_hidden = false)
   WHERE id = v;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS bh_video_comments_aiud ON public.video_comments;
CREATE TRIGGER bh_video_comments_aiud
AFTER INSERT OR UPDATE OF is_hidden OR DELETE ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION public.bh_video_comments_refresh();

-- ═══════════ امنیت ═══════════
-- RLS روشن و بدونِ سیاست ⇒ هیچ نقشِ عادی‌ای ردیفی نمی‌بیند؛ REVOKE هم
-- لایه‌ی دوم است. کلیدِ سرویس از هر دو عبور می‌کند و تنها راهِ
-- دسترسی، APIهای خودمان است — همان قاعده‌ی مهاجرتِ ۰۲۵.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['channel_subscriptions','video_likes','video_comments'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- ⚠️ بدونِ این، PostgREST کشِ اسکیمای قدیمی را نگه می‌دارد و
-- «could not find the table in the schema cache» برمی‌گرداند —
-- که کدِ ما آن را «این قابلیت هنوز فعال نیست» تفسیر می‌کند. یعنی
-- مهاجرت اجرا می‌شد و هیچ‌کدام از دکمه‌ها ظاهر نمی‌شدند.
NOTIFY pgrst, 'reload schema';
