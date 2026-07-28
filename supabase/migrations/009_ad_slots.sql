-- ═══════════════════════════════════════════════════════════════════
-- 009 — جایگاه‌های تبلیغاتیِ اجاره‌ای و درخواست تبلیغ
--
-- چهار جایگاهِ ثابت روی سایت (زیر بیلیارد بازار — دو تا، زیر «بیشتر
-- در بیلیارد هاب کاوش کن»، و بالای فوتر). ادمین برای هر جایگاه تعداد
-- بنر، قیمت و مدتِ اجاره را تعیین می‌کند.
--
-- کلیدِ ad_slots_enabled (مایگریشن ۰۰۶) تعیین می‌کند بنرها اصلاً روی
-- سایت دیده شوند یا نه — زیرساخت کامل کار می‌کند ولی تا خودِ شما
-- روشنش نکنید، هیچ جایگاهی روی صفحه ظاهر نمی‌شود.
--
-- عمداً جدولِ تبلیغِ فعلیِ localStorage را جایگزین می‌کند: آن نسخه
-- فقط در مرورگرِ ادمین بود و برای هیچ بازدیدکننده‌ای نمایش داده
-- نمی‌شد.
-- ═══════════════════════════════════════════════════════════════════

-- ── تعریفِ جایگاه‌ها (ادمین قیمت و ظرفیت را تعیین می‌کند) ─────────
CREATE TABLE IF NOT EXISTS public.ad_slots (
  key            text PRIMARY KEY,          -- market_1 | market_2 | explore | footer
  title          text        NOT NULL,
  description    text,
  capacity       integer     NOT NULL DEFAULT 1,   -- چند بنر همزمان
  price          bigint      NOT NULL DEFAULT 0,   -- تومان، برای یک دوره
  duration_days  integer     NOT NULL DEFAULT 30,
  is_active      boolean     NOT NULL DEFAULT true,
  sort_order     integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── بنرهای اجاره‌شده ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_placements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key    text        NOT NULL REFERENCES public.ad_slots(key),
  advertiser  text        NOT NULL DEFAULT '',   -- نامِ تبلیغ‌دهنده
  user_id     uuid,                              -- اگر خودِ کاربر خریده باشد
  title       text        NOT NULL DEFAULT '',
  image_url   text        NOT NULL DEFAULT '',
  link_url    text        NOT NULL DEFAULT '',
  status      text        NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | PAUSED | EXPIRED
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz NOT NULL,
  impressions bigint      NOT NULL DEFAULT 0,
  clicks      bigint      NOT NULL DEFAULT 0,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_placements_status_chk CHECK (status IN ('ACTIVE','PAUSED','EXPIRED'))
);

CREATE INDEX IF NOT EXISTS ad_placements_live_idx ON public.ad_placements (slot_key, status, ends_at DESC);

-- ── درخواستِ تبلیغ (فرمِ «تبلیغ در بیلیارد هاب») ──────────────────
CREATE TABLE IF NOT EXISTS public.ad_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid,
  name       text        NOT NULL,
  phone      text        NOT NULL,
  email      text,
  company    text,
  slot_key   text,                              -- جایگاهِ موردِ نظر، اگر انتخاب کرده
  budget     text,
  message    text        NOT NULL DEFAULT '',
  status     text        NOT NULL DEFAULT 'NEW',   -- NEW | CONTACTED | CLOSED
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_requests_status_chk CHECK (status IN ('NEW','CONTACTED','CLOSED'))
);

CREATE INDEX IF NOT EXISTS ad_requests_status_idx ON public.ad_requests (status, created_at DESC);

ALTER TABLE public.ad_slots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_requests   ENABLE ROW LEVEL SECURITY;

/* چهار جایگاهِ سایت — قیمت صفر یعنی «هنوز قیمت‌گذاری نشده»؛
   ادمین در پنل تکمیل می‌کند. */
INSERT INTO public.ad_slots (key, title, description, capacity, price, duration_days, sort_order) VALUES
  ('market_1', 'بیلیارد بازار — جایگاه اول', 'بنرِ افقی، بلافاصله زیر محصولات بیلیارد بازار', 1, 0, 30, 1),
  ('market_2', 'بیلیارد بازار — جایگاه دوم', 'بنرِ افقی، زیر جایگاه اول',                      1, 0, 30, 2),
  ('explore',  'زیر «بیشتر در بیلیارد هاب کاوش کن»', 'بنرِ عریضِ صفحه‌ی اصلی',                1, 0, 30, 3),
  ('footer',   'بالای فوتر', 'بنرِ عریض در همه‌ی صفحات، بالای فوتر',                          1, 0, 30, 4)
ON CONFLICT (key) DO NOTHING;
