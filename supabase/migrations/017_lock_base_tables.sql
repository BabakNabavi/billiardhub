-- ─────────────────────────────────────────────────────────────────
-- ۰۱۷ — قفلِ جدول‌های پایه (users / clubs / tables)
--
-- این سه جدول پیش از شروعِ مایگریشن‌ها ساخته شده بودند (TypeORM/داشبورد)
-- و هرگز RLS نگرفتند، در حالی که هر جدولی که مایگریشن‌ها ساخته‌اند RLS
-- روشن و صفر policy دارد (مدلِ «فقط service-role»).
--
-- چرا فوری است: کلیدِ anon داخلِ باندلِ مرورگر منتشر می‌شود
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY). با RLS خاموش، PostgREST همین سه
-- جدول را مستقیم در اختیارِ همان کلید می‌گذارد. اندازه‌گیریِ زنده پیش از
-- این مایگریشن نشان داد:
--   GET  /rest/v1/users  → ۲۰۰ و ردیف‌های واقعی (کد ملی، هشِ رمز، کدِ OTP)
--   PATCH /rest/v1/users → ۲۰۴ (اجازه‌ی نوشتن روی هر کاربر)
--   GET/PATCH /rest/v1/clubs → همان
-- یعنی هر کسی می‌توانست کد ملیِ خودش را عوض کند (سهمیه‌ی تازه)، باشگاهی
-- را verified کند (نقشِ باشگاه‌دار و سهمیه‌ی ۴تایی) یا خودش را admin کند.
-- این دقیقاً بندِ «National ID فقط Backend / غیرقابل دستکاری از Frontend»
-- و «Backend Enforcement» فاز ۳ را باطل می‌کرد.
--
-- سازگاری: هیچ کدِ مرورگری به این جدول‌ها وصل نیست — کلاینتِ مرورگر فقط
-- برای Storage (lib/supabase.ts) و کانال‌های Realtime (lib/realtime.ts،
-- lib/live/webrtc.ts) استفاده می‌شود. همه‌ی خواندن/نوشتنِ جدول‌ها از
-- سرور و با service-role است که RLS را دور می‌زند.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- بدونِ policy ⇒ فقط service_role (bypassrls). گرنت‌های باقی‌مانده هم
-- برداشته می‌شوند تا حتی با روشن‌شدنِ policyی در آینده، پیش‌فرض بسته باشد.
REVOKE ALL ON TABLE public.users  FROM anon, authenticated;
REVOKE ALL ON TABLE public.clubs  FROM anon, authenticated;
REVOKE ALL ON TABLE public.tables FROM anon, authenticated;

-- products: RLS روشن است و policyِ عمومی فقط SELECT می‌دهد (کاتالوگ
-- عمداً عمومی است)؛ ولی گرنت‌های نوشتنِ anon بی‌دلیل باز مانده‌اند.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.products FROM anon, authenticated;

-- جدولِ دست‌سازِ بعدی نباید این اشتباه را تکرار کند
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
