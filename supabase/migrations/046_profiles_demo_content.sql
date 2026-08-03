-- ═══════════════════════════════════════════════════════════════
-- ۰۴۶ — محتوای نمایشی روی جدولِ profiles
--
-- (این فایل روی پروداکشن اجرا شده؛ برای مخزن ثبت می‌شود.)
--
-- ── مسئله ──
-- `profiles_owner_uniq` هر کاربر را به یک پروفایل از هر نوع محدود
-- می‌کرد. برای کاربرِ واقعی درست است — یک شخص یک مربی است — ولی یعنی
-- ادمین هم از حسابِ خودش نمی‌تواند فهرست‌های خالیِ سایت را پر کند.
--
-- ── راه‌حل ──
-- یک ستونِ نشانه، و یکتاییِ *جزئی*: قاعده فقط روی ردیف‌های واقعی
-- اعمال می‌شود. ردیف‌های نمایشی آزادند و همیشه از داده‌ی واقعی
-- قابلِ تفکیک‌اند — پاک‌کردنشان بعداً به حدس‌زدن نمی‌افتد.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

DROP INDEX IF EXISTS public.profiles_owner_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_owner_uniq
  ON public.profiles (kind, owner_id)
  WHERE is_demo = false;

-- برای فهرست‌گرفتنِ ردیف‌های نمایشی در پنل
CREATE INDEX IF NOT EXISTS profiles_demo_idx
  ON public.profiles (is_demo, kind, created_at DESC)
  WHERE is_demo = true;


-- ── پاک‌سازیِ یک‌جا، هر وقت لازم شد ──
-- (عمداً اجرا نمی‌شود؛ این‌جا فقط برای یادآوری نوشته شده.)
--
--   DELETE FROM public.profiles WHERE is_demo = true;                    -- همه
--   DELETE FROM public.profiles WHERE is_demo = true AND kind = 'coach'; -- یک نوع


-- ── گزارش ──
SELECT
  (SELECT count(*) FROM public.profiles WHERE is_demo)      AS demo_rows,
  (SELECT count(*) FROM public.profiles WHERE NOT is_demo)  AS real_rows,
  (SELECT count(*) FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'profiles_owner_uniq'
      AND indexdef LIKE '%is_demo = false%')                AS partial_index_ok;
-- انتظار: partial_index_ok = 1
