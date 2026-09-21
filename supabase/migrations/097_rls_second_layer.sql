-- ─────────────────────────────────────────────────────────────
-- ۰۹۷ — لایه‌ی دومِ دفاع: RLS روی ده جدولی که جا مانده بودند
--
-- ⚠️ این مهاجرت **اجرا نشده** است. مثل هر تغییرِ اسکیما، اجرایش
-- دستی و با تأییدِ صریحِ مالک است و `deploy.sh` مهاجرت نمی‌برد.
--
-- ── چرا، و چرا فوری نیست ──
-- درگاهِ Supabase از بیرون باز است (`/rest/v1/` روی دامنه ۴۰۱
-- می‌دهد، یعنی در دسترس است) و کلیدِ anon هم طبق طراحی داخلِ باندلِ
-- مرورگر است. پس تنها چیزی که بین اینترنت و جدول‌ها می‌ایستد،
-- دسترسیِ نقشِ anon است.
--
-- آن لایه **برقرار است**: مهاجرتِ ۰۱۷ با
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES
--     FROM anon, authenticated;
-- هر جدولِ تازه را از پیش بی‌دسترسی می‌کند، و ۰۲۲ یک‌بار روی همه‌ی
-- جدول‌های موجود هم جارو کشیده. پس این ده جدول «باز» نیستند.
--
-- ولی امروز تنها چیزی که نگهشان داشته یک GRANT است. اگر روزی کسی
-- برای رفعِ یک خطا دسترسی بدهد، یا جدولی با نقشِ دیگری ساخته شود که
-- قاعده‌ی DEFAULT PRIVILEGES شاملش نشود، هیچ لایه‌ی دومی زیرش نیست.
-- بقیه‌ی ۵۱ جدول آن لایه را دارند؛ این ده تا ندارند.
--
-- ── سیاست ──
-- هیچ policyای ساخته نمی‌شود. یعنی با RLSِ روشن و بدونِ policy،
-- anon و authenticated هیچ ردیفی نمی‌بینند — همان چیزی که امروز هم
-- هست. کلیدِ سرویس (`service_role`) از RLS معاف است، پس APIهای خودِ
-- سایت دست‌نخورده کار می‌کنند. این عمدی است: الگوی ۰۲۵ و ۰۸۹ همین
-- است و دسترسیِ عمومی از راهِ route handlerهای ما می‌گذرد، نه
-- مستقیم از PostgREST.
--
-- ── پیش از اجرا، این را ببینید ──
-- تأییدِ اینکه واقعا هیچ دسترسیِ مستقیمی باز نمانده:
--
--   SELECT table_name, grantee, privilege_type
--     FROM information_schema.role_table_grants
--    WHERE table_schema = 'public'
--      AND grantee IN ('anon','authenticated')
--    ORDER BY table_name;
--
-- خروجیِ مورد انتظار: فقط `products` با SELECT. هر ردیفِ دیگری
-- یعنی یک درِ باز که این مهاجرت می‌بنددش.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.ad_boosts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes           ENABLE ROW LEVEL SECURITY;

-- کمربند دوم: همان جاروی ۰۲۲، این‌بار فقط روی همین ده تا.
-- بی‌ضرر است اگر از قبل هیچ دسترسی‌ای نداشته باشند.
REVOKE ALL ON TABLE public.ad_boosts             FROM anon, authenticated;
REVOKE ALL ON TABLE public.channel_subscriptions FROM anon, authenticated;
REVOKE ALL ON TABLE public.events                FROM anon, authenticated;
REVOKE ALL ON TABLE public.media_items           FROM anon, authenticated;
REVOKE ALL ON TABLE public.news                  FROM anon, authenticated;
REVOKE ALL ON TABLE public.playlist_items        FROM anon, authenticated;
REVOKE ALL ON TABLE public.playlists             FROM anon, authenticated;
REVOKE ALL ON TABLE public.rankings              FROM anon, authenticated;
REVOKE ALL ON TABLE public.video_comments        FROM anon, authenticated;
REVOKE ALL ON TABLE public.video_likes           FROM anon, authenticated;
