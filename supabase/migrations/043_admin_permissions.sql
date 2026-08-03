-- ═══════════════════════════════════════════════════════════════
-- دسترسی‌های تفکیک‌شده‌ی پنل ادمین
-- ═══════════════════════════════════════════════════════════════
--
-- تا امروز «ادمین» یک بله/خیر بود: هرکس ادمین می‌شد به همه‌چیز
-- دسترسی داشت — از داشبورد مالی و ثبتِ واریز گرفته تا صفحه‌ی
-- «دسترسی ادمین». یعنی هر ادمینِ تازه می‌توانست ادمینِ دیگری بسازد
-- یا مالکِ سایت را از ادمینی بردارد.
--
-- حالا هر ادمین فهرستی از کلیدها دارد. فهرستِ `{*}` یعنی سوپرادمین:
-- به همه‌چیز دسترسی دارد، تنها کسی است که می‌تواند دسترسیِ دیگران
-- را عوض کند، و هیچ ادمینِ معمولی نمی‌تواند دستش بزند.
--
-- ⚠️ تا وقتی این جدول ساخته نشده، کد عمداً رفتارِ قبلی را نگه
-- می‌دارد (همه‌ی ادمین‌ها دسترسیِ کامل) تا بینِ دیپلوی و اجرای
-- مهاجرت پنل قفل نشود. به‌محضِ اجرا، قاعده‌ی سخت‌گیرانه فعال می‌شود.

create table if not exists public.admin_permissions (
  user_id     uuid primary key references public.users(id) on delete cascade,
  permissions text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

comment on table  public.admin_permissions is 'دسترسی‌های تفکیک‌شده‌ی هر ادمین؛ {*} یعنی سوپرادمین';
comment on column public.admin_permissions.permissions is 'کلیدهای صفحه‌های پنل، یا {*} برای دسترسیِ کامل';

-- ادمین‌های امروز سوپرادمین می‌شوند.
-- بدونِ این، همه در لحظه‌ی اجرای مهاجرت از پنل بیرون می‌افتادند —
-- چون کد به ادمینِ بدونِ ردیف هیچ دسترسی‌ای نمی‌دهد (پیش‌فرضِ امن).
insert into public.admin_permissions (user_id, permissions)
select id, '{*}'
from public.users
where "primaryRole" = 'admin' or 'admin' = any("secondaryRoles")
on conflict (user_id) do nothing;

-- این جدول فقط با کلیدِ سرویس خوانده و نوشته می‌شود (مسیرهای
-- /api/admin). هیچ دسترسیِ مستقیمی از سمتِ مرورگر نباید باشد.
alter table public.admin_permissions enable row level security;
