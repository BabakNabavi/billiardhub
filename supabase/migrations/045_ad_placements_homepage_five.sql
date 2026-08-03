-- ═══════════════════════════════════════════════════════════════
-- ۰۴۵ — پنج جایگاهِ تبلیغِ صفحه‌ی اصلی، با نام‌های نهایی
--
-- فهرستِ خرید در /advertise باید دقیقاً این پنج گزینه را نشان دهد:
--   ۱ سمت راست، پایین بیلیارد بازار
--   ۲ سمت چپ،  پایین بیلیارد بازار
--   ۳ سمت راست، پایین فروشگاه‌های تجهیزات
--   ۴ سمت چپ،  پایین فروشگاه‌های تجهیزات
--   ۵ بنر بزرگ انتهای صفحه، بالای فوتر
--
-- دو تای اول تازه‌اند؛ سه تای بعدی از قبل بودند و فقط عنوانشان به
-- همین جمله‌ها تغییر می‌کند.
--
-- ⚠ بعد از رسیدنِ deployِ کد اجرا شود: کلیدهای تازه در فهرستِ سفیدِ
--    `PLACEMENT_KEYS` هم اضافه شده‌اند و بدونِ آن، کلید ناشناخته رد
--    می‌شود.
-- ═══════════════════════════════════════════════════════════════

-- ── دو جایگاهِ تازه‌ی بیلیارد بازار ──────────────────────────────
-- `mode='paid'` یعنی در کاتالوگِ خرید دیده می‌شوند.
-- `is_active=false` یعنی هنوز روی صفحه چیزی نشان نمی‌دهند — همان
-- حالتی که سه جایگاهِ دیگر هم دارند. فعال‌کردن کارِ پنلِ ادمین است،
-- نه این مهاجرت.
INSERT INTO placements
  (key, title, description, section, is_active, mode, content_kind,
   entity_type, capacity, price, duration_days, sort_order, rotation_mode, priority)
VALUES
  ('market_ads_right',
   'سمت راست ، پایین بیلیارد بازار',
   'بنرِ تبلیغاتی، ستونِ راستِ زیرِ سکشن بیلیارد بازار در صفحه‌ی اصلی',
   'market', false, 'paid', 'banner', NULL, 1, 0, 30, 2, 'fair', 0),
  ('market_ads_left',
   'سمت چپ ، پایین بیلیارد بازار',
   'بنرِ تبلیغاتی، ستونِ چپِ زیرِ سکشن بیلیارد بازار در صفحه‌ی اصلی',
   'market', false, 'paid', 'banner', NULL, 1, 0, 30, 3, 'fair', 0)
ON CONFLICT (key) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      section = EXCLUDED.section,
      mode = EXCLUDED.mode,
      content_kind = EXCLUDED.content_kind,
      sort_order = EXCLUDED.sort_order,
      updated_at = now();


-- ── نام‌های نهاییِ سه جایگاهِ موجود ─────────────────────────────
-- فقط عنوان و ترتیب عوض می‌شود؛ حالتِ فعال/غیرفعال و قیمت دست‌نخورده
-- می‌ماند تا اگر ادمین چیزی تنظیم کرده، از بین نرود.
UPDATE placements SET title = 'سمت راست ، پایین فروشگاههای تجهیزات',
       sort_order = 4, updated_at = now()  WHERE key = 'equipment_ads_right';
UPDATE placements SET title = 'سمت چپ ، پایین فروشگاههای تجهیزات',
       sort_order = 5, updated_at = now()  WHERE key = 'equipment_ads_left';
UPDATE placements SET title = 'بنر بزرگ انتهای صفحه بالای فوتر',
       sort_order = 6, updated_at = now()  WHERE key = 'homepage_bottom_banner';


-- ── گزارش ──────────────────────────────────────────────────────
-- انتظار: دقیقاً پنج ردیف، به همان ترتیبِ فهرستِ بالا.
SELECT sort_order, key, title, mode, is_active
FROM placements
WHERE mode = 'paid'
ORDER BY sort_order;
