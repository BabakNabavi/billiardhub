-- ═══════════════════════════════════════════════════════════════════════════
-- ۰۶۴ — استوریِ باشگاه: ستون‌هایی که کد از روزِ اول انتظارشان را داشت
--
-- ── باگ ──
-- استوریِ باشگاه در فضای ذخیره‌سازی (`club-media/clubs/<id>/stories/index.json`)
-- نوشته می‌شد و درست هم نوشته می‌شد. ولی هیچ‌جای سایت دیده نمی‌شد:
--
--   • نوارِ استوریِ صفحه‌ی اول (`components/Stories.tsx`) فهرستِ باشگاه‌ها را
--     می‌گرفت و **فقط** از باشگاه‌هایی استوری می‌پرسید که
--     `club.hasActiveStory === true` باشد.
--   • رینگِ استوری روی کارتِ باشگاه (`app/clubs/page.tsx`) و روی صفحه‌ی
--     باشگاه (`app/clubs/[id]/page.tsx`) هم به همان پرچم و به
--     `storyMediaUrl` گره خورده بود.
--
-- و هیچ‌کدام از این ستون‌ها روی جدولِ `clubs` وجود نداشت. `select('*')`
-- آن‌ها را برنمی‌گرداند، `undefined` می‌شد، فیلتر همه را دور می‌ریخت، و
-- استوریِ باشگاه هرگز به چشمِ کسی نمی‌رسید. استوریِ کاربر (و ادمین) از
-- مسیرِ کاملاً جدایی می‌آید و برای همین همیشه کار می‌کرد.
--
-- ── چرا `hasActiveStory` ستون نیست ──
-- یک پرچمِ بولیِ ذخیره‌شده باید موقعِ انقضای استوری هم پاک شود، وگرنه
-- ۲۴ ساعت بعد رینگی نشان داده می‌شود که پشتش چیزی نیست — و آن هم یک
-- کارِ زمان‌بندی‌شده می‌خواهد. به‌جایش `storyExpiresAt` ذخیره می‌شود و
-- خودِ API پرچم را از مقایسه با «حالا» می‌سازد. هیچ‌وقت کهنه نمی‌شود.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS "storyMediaUrl"  text,
  ADD COLUMN IF NOT EXISTS "storyType"      text,
  ADD COLUMN IF NOT EXISTS "storyText"      text,
  ADD COLUMN IF NOT EXISTS "storyExpiresAt" timestamptz;

-- فهرستِ عمومیِ باشگاه‌ها همیشه کلِ سطر را می‌خواند، ولی این ایندکس
-- «کدام باشگاه‌ها همین حالا استوری دارند» را ارزان می‌کند.
CREATE INDEX IF NOT EXISTS clubs_story_active_idx
  ON public.clubs ("storyExpiresAt")
  WHERE "storyExpiresAt" IS NOT NULL;

COMMIT;

-- ── بررسی ──
-- انتظار: چهار ستون = ۴
SELECT count(*) AS story_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clubs'
  AND column_name IN ('storyMediaUrl', 'storyType', 'storyText', 'storyExpiresAt');
