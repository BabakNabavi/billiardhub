-- ═══════════════════════════════════════════════════════════════
-- پارچه + ستون‌های ایندکس‌دارِ مشخصات
-- ───────────────────────────────────────────────────────────────
-- ── چرا بعضی مشخصات ستونِ جدا می‌گیرند ──
-- `specs` یک JSONB است و برای فیلدهای کم‌کاربرد کافی است. ولی روی
-- این پنج‌تا فیلتر و جست‌وجو خواهیم داشت («همه‌ی میزهای ۹ فوت»،
-- «سنگ اسلیت ایتالیایی»، «پارچه‌ی Strachan»)، و فیلترِ JSONB نه
-- ایندکس می‌گیرد نه در PostgREST خوانا می‌ماند.
--
-- بقیه‌ی سی‌وشش فیلد همان‌جا در `specs` می‌مانند.
--
-- همه nullable و بدونِ پیش‌فرض: هیچ ردیفی نوشته نمی‌شود.
--
-- اجرا:
--   docker exec -i supabase-db psql -U postgres -d postgres < 087_...sql
-- ═══════════════════════════════════════════════════════════════

alter table public.products
  -- پارچه: زنجیره‌ی برند ⟵ مدل، وابسته به نوعِ میز
  add column if not exists "clothBrandId"     text,
  add column if not exists "clothBrandCustom" text,
  add column if not exists "clothModelId"     text,
  add column if not exists "clothModelCustom" text,
  -- مشخصاتی که رویشان فیلتر خواهیم داشت
  add column if not exists "bedMaterial"   text,
  add column if not exists "shaftMaterial" text,
  add column if not exists "cuePieces"     text;

-- ── قیدها ──
-- شناسه‌ی مدلِ پارچه بدونِ برند بی‌معناست: مدل‌ها زیرِ برند تعریف
-- شده‌اند و همین قاعده در روتِ API هم هست. قاعده‌ای که فقط در یکی
-- باشد باگِ فرداست — دو مسیرِ نوشتن روی این جدول وجود دارد.
alter table public.products
  drop constraint if exists products_cloth_model_needs_brand;
alter table public.products
  add constraint products_cloth_model_needs_brand
  check ("clothModelId" is null or "clothBrandId" is not null);

-- «سایر» یعنی از فهرست نبوده؛ پس شناسه و متنِ دستی با هم بی‌معنا‌اند
alter table public.products
  drop constraint if exists products_cloth_brand_one_of;
alter table public.products
  add constraint products_cloth_brand_one_of
  check ("clothBrandId" is null or "clothBrandCustom" is null);

-- پارچه فقط برای میز معنا دارد
alter table public.products
  drop constraint if exists products_cloth_table_only;
alter table public.products
  add constraint products_cloth_table_only
  check (("clothBrandId" is null and "clothBrandCustom" is null)
         or category = 'table');

-- ── ایندکس‌ها ──
-- جزئی، چون بیشترِ ردیف‌ها null‌اند.
create index if not exists products_cloth_brand_idx
  on public.products ("clothBrandId") where "clothBrandId" is not null;
create index if not exists products_bed_material_idx
  on public.products ("bedMaterial") where "bedMaterial" is not null;
create index if not exists products_shaft_material_idx
  on public.products ("shaftMaterial") where "shaftMaterial" is not null;
create index if not exists products_cue_pieces_idx
  on public.products ("cuePieces") where "cuePieces" is not null;
