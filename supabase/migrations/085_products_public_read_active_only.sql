-- ═══════════════════════════════════════════════════════════════
-- سیاستِ خواندنِ عمومیِ products فقط آگهیِ فعال را بدهد
-- ───────────────────────────────────────────────────────────────
-- سیاستِ فعلی `products_public_read` شرطش `true` است، یعنی نقشِ
-- `anon` هر ردیفی را می‌بیند — از جمله `pending` و `rejected` و
-- `paused` و `deleted`.
--
-- امروز همه‌ی هشت آگهی `active`اند، پس چیزی لو نمی‌رود. ولی این یک
-- تله‌ی خفته است: نخستین آگهیِ ردشده یا در انتظارِ تأیید، از راهِ
-- Kong (پورت ۸۰۰۰) قابلِ خواندن می‌شود، در حالی که API خودِ سایت
-- عمداً پنهانش می‌کند.
--
-- ── چرا این کار مسیرهای خودِ سایت را نمی‌شکند ──
-- کدِ سرور با کلیدِ `service_role` وصل می‌شود و آن نقش از RLS
-- معاف است. پس داشبوردِ فروشنده (`?mine=true`) و پنلِ ادمین
-- (`?all=1`) که باید آگهیِ غیرفعال را ببینند، دست‌نخورده کار
-- می‌کنند. این سیاست فقط روی `anon` اثر دارد.
--
-- تأیید شد که `service_role` و `postgres` هر دو `rolbypassrls = t`
-- دارند، ولی `anon` و `authenticated` نه.
--
-- ── چرا نقشِ سیاست دست نمی‌خورد ──
-- سیاستِ فعلی روی `PUBLIC` است. عمداً همان می‌ماند و فقط شرط عوض
-- می‌شود: تغییرِ هم‌زمانِ نقش و شرط یعنی دو تغییر در یک مهاجرت و
-- سخت‌شدنِ ریشه‌یابی اگر چیزی بشکند.
--
-- ── بازگشت ──
-- برای برگرداندن:
--   drop policy products_public_read on public.products;
--   create policy products_public_read on public.products
--     for select using (true);
-- ═══════════════════════════════════════════════════════════════

drop policy if exists products_public_read on public.products;

create policy products_public_read on public.products
  for select
  using (status = 'active');

-- بررسی: باید یک ردیف با شرطِ status برگرداند
do $$
declare q text;
begin
  select pg_get_expr(polqual, polrelid) into q
  from pg_policy where polrelid = 'public.products'::regclass
    and polname = 'products_public_read';
  raise notice 'products_public_read → %', q;
end $$;
