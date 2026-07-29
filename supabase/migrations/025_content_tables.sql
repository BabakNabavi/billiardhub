-- ─────────────────────────────────────────────────────────────────
-- ۰۲۵ — جدول‌های محتوایی: اخبار، رویدادها، رنکینگ و رسانه.
--
-- چهار صفحه‌ی پنلِ ادمین (`news`, `events`, `rankings`, `media`) هیچ
-- جدولی پشتشان نبود و از `useState` یا localStorage می‌خواندند؛ یعنی
-- هرچه ادمین می‌ساخت با یک رفرش می‌پرید و روی دستگاهِ دیگری اصلاً
-- دیده نمی‌شد.
--
-- سه تصمیم مشترک:
--   ۱) ستونِ `status` با پیش‌فرضِ 'draft' — محتوا تا وقتی ادمین
--      منتشرش نکند در سایت دیده نمی‌شود.
--   ۲) `slug` یکتا برای نشانیِ خوانا؛ NULL مجاز است تا رکوردِ
--      نیمه‌کاره هم بتواند ذخیره شود.
--   ۳) RLS روشن و همه‌ی گرنت‌ها از anon/authenticated گرفته شده —
--      دسترسی فقط از راهِ APIهای خودمان با کلیدِ سرویس.
-- ─────────────────────────────────────────────────────────────────

-- ── اخبار ──
CREATE TABLE IF NOT EXISTS public.news (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE,
  title       text        NOT NULL,
  excerpt     text,
  body        text,
  cover_url   text,
  category    text,
  tags        text[]      NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'draft',   -- draft | published | archived
  author_id   uuid,
  published_at timestamptz,
  views       integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_status_chk CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS news_status_idx ON public.news (status, published_at DESC);

-- ── رویدادها / مسابقات ──
CREATE TABLE IF NOT EXISTS public.events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE,
  title        text        NOT NULL,
  description  text,
  category     text,                                  -- club | provincial | national | open | international
  sport        text,                                  -- snooker | pocket | highball
  location     text,
  province     text,
  city         text,
  start_date   date,
  end_date     date,
  max_participants integer,
  prize        text,
  organizer    text,
  registration_open boolean NOT NULL DEFAULT true,
  status       text        NOT NULL DEFAULT 'upcoming', -- upcoming | ongoing | finished | cancelled
  cover_url    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_status_chk CHECK (status IN ('upcoming', 'ongoing', 'finished', 'cancelled')),
  /* تاریخِ پایان نباید پیش از شروع باشد */
  CONSTRAINT events_window_chk CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events (status, start_date DESC);

-- ── رنکینگ ──
CREATE TABLE IF NOT EXISTS public.rankings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline  text        NOT NULL,                   -- snooker | pocket | highball
  season      text,                                   -- مثلاً «۱۴۰۵»
  player_id   uuid,                                   -- اگر کاربرِ ثبت‌شده باشد
  player_name text        NOT NULL,
  city        text,
  points      integer     NOT NULL DEFAULT 0,
  rank        integer,
  played      integer     NOT NULL DEFAULT 0,
  won         integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  /* یک بازیکن در هر رشته و فصل فقط یک ردیف دارد */
  UNIQUE (discipline, season, player_name)
);
CREATE INDEX IF NOT EXISTS rankings_board_idx ON public.rankings (discipline, season, points DESC);

-- ── رسانه (ویدیو/آموزش) ──
CREATE TABLE IF NOT EXISTS public.media_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE,
  title       text        NOT NULL,
  description text,
  kind        text        NOT NULL DEFAULT 'video',   -- video | article | clip
  media_url   text,
  thumb_url   text,
  channel     text,
  duration_sec integer,
  tags        text[]      NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'draft',
  owner_id    uuid,
  views       integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_status_chk CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS media_status_idx ON public.media_items (status, created_at DESC);

-- ── امنیت: هیچ‌کدام مستقیم از مرورگر خواندنی/نوشتنی نیستند ──
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['news', 'events', 'rankings', 'media_items'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
