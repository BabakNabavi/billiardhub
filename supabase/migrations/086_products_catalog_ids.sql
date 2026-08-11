-- ═══════════════════════════════════════════════════════════════
-- شناسه‌های کاتالوگ کنارِ رشته‌های موجود — چوب و میز
-- ───────────────────────────────────────────────────────────────
-- تا امروز `brand` و `model` فقط رشته بودند. کلِ سایت از همان‌ها
-- می‌خواند (کارتِ بازار، صفحه‌ی جزئیات، آگهی‌های مرتبط، `title.ts`)
-- پس رشته‌ها **سرِ جایشان می‌مانند**؛ این ستون‌ها کنارشان می‌نشینند:
-- شناسه برای یکپارچگی و فیلتر، رشته برای نمایش.
--
-- همه nullable و بدونِ پیش‌فرض: آگهی‌های موجود دست‌نخورده می‌مانند و
-- هیچ نوشتنی روی جدولِ زنده انجام نمی‌شود.
--
-- ⚠️ ترتیب مهم است: این مهاجرت باید **پیش از** کدی اجرا شود که این
--    ستون‌ها را می‌نویسد. اگر برعکس شود، هر ثبتِ آگهی روی سایتِ زنده
--    با «column does not exist» می‌شکند. (یک‌بار با `rating` همین
--    اتفاق افتاد و فهرستِ محصولات ده دقیقه ۵۰۰ می‌داد.)
--
-- اجرا روی سرور:
--   docker exec -i supabase-db psql -U postgres -d postgres < 086_...sql
-- ═══════════════════════════════════════════════════════════════

alter table public.products
  -- شناسه‌ی نوع در کاتالوگ: pocket_billiard / snooker / heyball / carom
  add column if not exists "cueType"   text,
  -- همان، به‌اضافه‌ی home_table برای میز
  add column if not exists "tableType" text,
  -- شناسه‌ی برند و مدل — مشترک بینِ چوب و میز، چون `category` تفکیک می‌کند
  add column if not exists "brandId"   text,
  add column if not exists "modelId"   text,
  -- سایز فقط برای میز. شناسه‌ها بینِ نوع‌ها تکراری‌اند (`9ft` هم در
  -- اسنوکر هست هم در پاکت)، پس بدونِ `tableType` بی‌معناست.
  add column if not exists "tableSizeId"     text,
  add column if not exists "tableSizeCustom" text;

-- ── قیدها ──
-- شناسه‌ی نوع باید یکی از مقدارهای کاتالوگ باشد. `null` مجاز است:
-- آگهی‌های قدیمی و دسته‌هایی که کاتالوگ ندارند.
alter table public.products
  drop constraint if exists products_cue_type_valid;
alter table public.products
  add constraint products_cue_type_valid
  check ("cueType" is null or "cueType" in
    ('pocket_billiard', 'snooker', 'heyball', 'carom'));

alter table public.products
  drop constraint if exists products_table_type_valid;
alter table public.products
  add constraint products_table_type_valid
  check ("tableType" is null or "tableType" in
    ('pocket_billiard', 'snooker', 'heyball', 'carom', 'home_table'));

-- «میز خانگی» فهرستِ برند ندارد؛ هر شناسه‌ای برایش جعلی است.
-- این قاعده در روتِ API هم هست — قاعده‌ای که فقط در یکی باشد، باگِ
-- فرداست، چون دو مسیرِ نوشتن روی این جدول وجود دارد.
alter table public.products
  drop constraint if exists products_home_table_no_ids;
alter table public.products
  add constraint products_home_table_no_ids
  check ("tableType" is distinct from 'home_table'
         or ("brandId" is null and "modelId" is null));

-- سایز فقط وقتی معنا دارد که نوعِ میز مشخص باشد
alter table public.products
  drop constraint if exists products_size_needs_type;
alter table public.products
  add constraint products_size_needs_type
  check ("tableSizeId" is null or "tableType" is not null);

-- ── ایندکس ──
-- فیلترِ «همه‌ی میزهای اسنوکر» و «همه‌ی چوب‌های Predator» روی همین
-- دو ستون می‌نشیند. جزئی است چون بیشترِ ردیف‌ها null‌اند.
create index if not exists products_brand_id_idx
  on public.products ("brandId") where "brandId" is not null;
create index if not exists products_catalog_type_idx
  on public.products ("cueType", "tableType")
  where "cueType" is not null or "tableType" is not null;
