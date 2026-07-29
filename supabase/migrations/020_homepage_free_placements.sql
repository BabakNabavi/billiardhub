-- ─────────────────────────────────────────────────────────────────
-- ۰۲۰ — اتصالِ صفحه‌ی اصلی به سیستمِ تبلیغات (فاز ۵)
--
-- سه سکشنِ «ویژه»ی صفحه‌ی اصلی از این پس محتوایشان را از سیستمِ
-- جایگاه‌ها می‌گیرند، نه از آرایه‌ی هاردکد. فعلاً حالتشان «رایگان» است:
-- یعنی محتوا = تازه‌ترین محصولات/باشگاه‌ها/فروشگاه‌های خودِ سایت.
-- هر وقت ادمین حالت را روی «دستی» یا «پولی» بگذارد، همان کمپین‌ها
-- جایشان را می‌گیرند — بدونِ هیچ تغییری در کدِ صفحه.
--
-- سه جایگاهِ بنری (راست/چپ/پایین) عمداً دست‌نخورده می‌مانند: پولی و
-- غیرفعال، تا تا وقتی تبلیغی فروخته نشده چیزی روی صفحه ظاهر نشود.
-- ─────────────────────────────────────────────────────────────────

UPDATE public.placements
   SET mode = 'free',
       is_active = true,
       updated_at = now()
 WHERE key IN (
         'market_featured_products_homepage',
         'featured_clubs_homepage',
         'featured_equipment_stores_homepage'
       )
   AND NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'mig_020_data_done');

INSERT INTO public.app_settings (key, value)
VALUES ('mig_020_data_done', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
