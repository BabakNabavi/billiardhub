-- ═══════════════════════════════════════════════════════════════
-- ۰۴۸ — جدولِ ویدیوها (بیلیارد مدیا)
--
-- ── چرا ──
-- متادیتای ویدیوها تا امروز در یک فایلِ JSON داخلِ Storage بود
-- (`social/media/index.json`). آن ساختار چند چیز را ناممکن می‌کرد:
--
--   · هر خواندن کلِ فایل را می‌آورد و هر نوشتن کلش را بازمی‌نوشت —
--     یعنی با دو آپلودِ هم‌زمان یکی از آن‌ها گم می‌شد.
--   · سقفِ ۸۰۰ ویدیو در کد هاردکد بود.
--   · صفحه‌بندی، جست‌وجو و مرتب‌سازی همه در حافظه انجام می‌شد؛ با ده
--     هزار ویدیو یعنی خواندنِ ده هزار رکورد برای نمایشِ بیست تا.
--   · نه نشانیِ یکتا (slug) ممکن بود، نه وضعیتِ انتشار، نه بازبینیِ
--     ادمین، نه sitemap کارآمد.
--
-- خودِ فایلِ ویدیو همچنان در Storage می‌ماند. این جدول فقط متادیتاست.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- نشانیِ عمومی. پایدار و یکتا؛ از عنوان ساخته می‌شود.
  slug          text NOT NULL UNIQUE,

  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  category      text NOT NULL DEFAULT 'other',
  tags          text[] NOT NULL DEFAULT '{}',

  -- مالک. حذفِ کاربر ویدیو را بی‌صاحب می‌کند، نه نابود:
  -- تصمیمِ حذفِ محتوا جداست از تصمیمِ حذفِ حساب.
  owner_id      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  creator_name  text NOT NULL DEFAULT '',
  creator_handle text NOT NULL DEFAULT '',
  club_id       uuid REFERENCES public.clubs(id) ON DELETE SET NULL,

  -- مسیرِ فایل در Storage (نه خودِ فایل)
  src           text NOT NULL,
  thumb         text NOT NULL DEFAULT '',

  -- متادیتای واقعیِ فایل. NULL یعنی «هنوز استخراج نشده» — عمداً صفر
  -- نیست، چون صفر یعنی «طولش صفر است» و آن دروغ است.
  duration_sec  integer,
  width         integer,
  height        integer,
  mime          text,
  size_bytes    bigint,

  -- چرخه‌ی انتشار
  status        text NOT NULL DEFAULT 'published'
                CHECK (status IN ('draft','pending','published','rejected','hidden')),
  visibility    text NOT NULL DEFAULT 'public'
                CHECK (visibility IN ('public','unlisted','private')),
  featured      boolean NOT NULL DEFAULT false,
  reject_note   text,

  views         integer NOT NULL DEFAULT 0,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

-- ── ایندکس‌ها ──
-- فقط آن‌هایی که کوئریِ واقعیِ صفحه‌ها به آن‌ها می‌خورد.

-- صفحه‌ی اصلیِ مدیا و sitemap: «منتشرشده‌های عمومی، تازه‌ترین اول»
CREATE INDEX IF NOT EXISTS videos_public_recent_idx
  ON public.videos (published_at DESC NULLS LAST)
  WHERE status = 'published' AND visibility = 'public';

-- فیلترِ دسته‌بندی روی همان مجموعه
CREATE INDEX IF NOT EXISTS videos_public_category_idx
  ON public.videos (category, published_at DESC NULLS LAST)
  WHERE status = 'published' AND visibility = 'public';

-- بخشِ «پربازدیدها»
CREATE INDEX IF NOT EXISTS videos_public_views_idx
  ON public.videos (views DESC)
  WHERE status = 'published' AND visibility = 'public';

-- «ویدیوهای من» در داشبورد، و صفحه‌ی کانال
CREATE INDEX IF NOT EXISTS videos_owner_idx  ON public.videos (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS videos_handle_idx ON public.videos (creator_handle, created_at DESC);

-- ویدیوهای یک باشگاه
CREATE INDEX IF NOT EXISTS videos_club_idx ON public.videos (club_id)
  WHERE club_id IS NOT NULL;

-- صفِ بازبینیِ ادمین
CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos (status, created_at DESC);

-- جست‌وجو در عنوان و توضیح. ترکیبِ `simple` عمدی است: پیکربندی‌های
-- زبانیِ Postgres ریشه‌یابیِ فارسی ندارند و `simple` دستِ‌کم قابلِ
-- پیش‌بینی است. برای تطبیقِ جزئی، ایندکسِ trigram هم کنارش می‌آید.
CREATE INDEX IF NOT EXISTS videos_search_idx
  ON public.videos USING gin (to_tsvector('simple', title || ' ' || description));

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS videos_title_trgm_idx
  ON public.videos USING gin (title gin_trgm_ops);

-- ── نشانی‌های قدیمی ──
-- اگر slug عوض شود، نشانیِ قبلی نباید ۴۰۴ بدهد. این جدول کوچک است و
-- فقط برای ریدایرکت خوانده می‌شود.
CREATE TABLE IF NOT EXISTS public.video_slug_history (
  slug       text PRIMARY KEY,
  video_id   uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ──
-- نوشتن فقط از سرور (service_role) انجام می‌شود، مثلِ بقیه‌ی جدول‌ها.
-- هیچ سیاستی برای anon تعریف نمی‌شود، پس چیزی مستقیم خوانده یا نوشته
-- نمی‌شود؛ همه چیز از مسیرهای API می‌گذرد که مجوز را بررسی می‌کنند.
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_slug_history ENABLE ROW LEVEL SECURITY;


-- ── گزارش ──
SELECT
  (SELECT count(*) FROM public.videos)               AS videos,
  (SELECT count(*) FROM public.video_slug_history)   AS slug_history,
  (SELECT count(*) FROM pg_indexes
    WHERE schemaname='public' AND tablename='videos') AS indexes;
-- انتظار: videos = 0 · slug_history = 0 · indexes = ۱۰ (شاملِ کلیدِ اصلی و یکتاییِ slug)
