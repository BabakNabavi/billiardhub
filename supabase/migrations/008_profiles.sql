-- ═══════════════════════════════════════════════════════════════════
-- 008 — پروفایل‌های نقش‌ها روی دیتابیس
--
-- تا امروز پروفایلِ فروشگاه، تولیدکننده، مربی، داور، متخصص و بازیکن
-- فقط در localStorageِ مرورگرِ خودِ صاحبش بود: هیچ کاربرِ دیگری
-- نمی‌دیدشان، با پاک‌شدنِ حافظه‌ی مرورگر از بین می‌رفتند و ادمین هم
-- چیزی برای تأیید نداشت.
--
-- یک جدولِ واحد با ستونِ kind، چون هر شش پروفایل ساختارِ یکسانی دارند
-- (مالک، نامک، وضعیت، تأییدِ ادمین) و فقط بدنه‌شان فرق می‌کند. بدنه
-- jsonb است تا فرم‌های موجود بدونِ بازنویسی همان شکلِ داده را بفرستند.
--
-- عکس‌ها هرگز داخلِ jsonb نمی‌مانند: مسیرِ ذخیره، data:URLها را به
-- Storage آپلود می‌کند و فقط نشانی را نگه می‌دارد.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text        NOT NULL,   -- seller | manufacturer | coach | referee | technician | player
  slug        text        NOT NULL,   -- نشانیِ عمومی: /sellers/<slug> و…
  owner_id    uuid        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}'::jsonb,

  status      text        NOT NULL DEFAULT 'approved',  -- approved | pending | rejected
  verified    boolean     NOT NULL DEFAULT false,       -- تیکِ آبی (فقط ادمین)

  /* جوازِ کسب / پروانه‌ی تولید */
  license_number   text,
  license_url      text,
  license_verified boolean NOT NULL DEFAULT false,
  license_note     text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_kind_chk   CHECK (kind IN ('seller','manufacturer','coach','referee','technician','player')),
  CONSTRAINT profiles_status_chk CHECK (status IN ('approved','pending','rejected')),
  CONSTRAINT profiles_slug_uniq  UNIQUE (kind, slug)
);

CREATE INDEX IF NOT EXISTS profiles_owner_idx  ON public.profiles (kind, owner_id);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (kind, status, updated_at DESC);

/* هر کاربر از هر نوع پروفایل فقط یکی — «فروشگاهِ من» باید یکتا باشد */
CREATE UNIQUE INDEX IF NOT EXISTS profiles_owner_uniq ON public.profiles (kind, owner_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
