-- ─────────────────────────────────────────────────────────────────
-- ۰۱۹ — تحویلِ عادلانه بر پایه‌ی شمارنده‌ی سرورمحور (اصلاحِ فاز ۴)
--
-- مسئله: چرخشِ «عادلانه» به ستونِ impressions تکیه داشت، ولی آن ستون را
-- بیکنِ بدونِ احراز هویت زیاد می‌کند. یعنی هر کسی می‌توانست با چند
-- درخواستِ ساده، شمارشِ یک کمپینِ پولی را باد کند و آن را تا پایانِ
-- دوره‌اش ته صف بفرستد (تبلیغ‌کننده پولش را می‌داد و نمایش نمی‌گرفت).
-- ضمناً سکشن‌های «موجودیتی» اصلاً بیکن نمی‌فرستند، پس عدالتشان روی
-- صفر می‌ماند و ترتیب هر بار تصادفی می‌شد.
--
-- راه‌حل: شمارنده‌ی جداگانه‌ی serves که فقط خودِ سرور هنگامِ تحویلِ
-- واقعی زیادش می‌کند. تصمیمِ چرخش با این عدد گرفته می‌شود؛ impressions
-- و clicks فقط برای گزارشِ آماری می‌مانند.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS serves bigint NOT NULL DEFAULT 0;

-- شمارشِ دسته‌ایِ تحویل — یک رفت‌وبرگشت برای همه‌ی کمپین‌های یک صفحه
CREATE OR REPLACE FUNCTION public.bh_bump_serves(p_ids uuid[])
RETURNS void AS $$
BEGIN
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.campaigns
     SET serves = serves + 1
   WHERE id = ANY(p_ids);
END;
$$ LANGUAGE plpgsql;

-- مثلِ بقیه‌ی توابعِ bh_*: فقط service-role
REVOKE ALL ON FUNCTION public.bh_bump_serves(uuid[]) FROM PUBLIC, anon, authenticated;

-- جایگاه‌های «موجودیتی» (سکشن‌های ویژه‌ی صفحه‌ی اصلی) چیدمانِ انتخابیِ
-- ادمین‌اند، نه کاروسلِ فروخته‌شده؛ پیش‌فرضشان ترتیبِ ثابت است تا
-- فهرستِ محصولات/باشگاه‌ها در هر بارگذاری بُر نخورد. کاروسل‌های بنری
-- روی «عادلانه» می‌مانند.
UPDATE public.placements
   SET rotation_mode = 'fixed'
 WHERE content_kind = 'entity'
   AND rotation_mode = 'fair'
   AND NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_019_data_done');

INSERT INTO public.app_settings (key, value)
VALUES ('mig_019_data_done', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
