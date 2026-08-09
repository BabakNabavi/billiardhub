-- ── چسباندنِ آگهی‌های موجود به فروشگاهِ صاحبشان ─────────────────────
--
-- `products."storeSlug"` تا امروز از مرورگر می‌آمد، و مرورگر آن را با
-- `findSellerByOwner()` از localStorage می‌خواند — در حالی که فروشگاه‌ها
-- در جدولِ `profiles` زندگی می‌کنند. پس هیچ‌وقت مقداری نمی‌گرفت و هر
-- آگهی با `storeSlug = NULL` ذخیره می‌شد.
--
-- نتیجه‌اش این بود که صاحبِ فروشگاه ده‌ها محصول ثبت می‌کرد و صفحه‌ی
-- فروشگاهش خالی می‌ماند — حتی آگهی‌ای که *بعد از* ساختنِ فروشگاه ثبت
-- شده بود.
--
-- کدِ ثبتِ آگهی از این پس خودش نامک را از روی مالک پیدا می‌کند؛ این
-- مهاجرت فقط ردیف‌های قبلی را جبران می‌کند.
--
-- ── چرا امن است ──
-- فقط ردیف‌هایی دست می‌خورند که `storeSlug` آن‌ها خالی است **و**
-- صاحبشان یک فروشگاهِ تأییدشده دارد. آگهیِ کاربرِ عادی (بدونِ
-- فروشگاه) دست‌نخورده می‌ماند، و آگهی‌ای که قبلاً نامک داشته هم
-- بازنویسی نمی‌شود.

UPDATE products p
SET "storeSlug"       = pr.slug,
    "isOfficialStore" = true
FROM profiles pr
WHERE pr.kind      = 'seller'
  AND pr.status    = 'approved'
  AND pr.owner_id  = p."sellerId"
  AND p."storeSlug" IS NULL;

-- گزارشِ نتیجه
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM products WHERE "storeSlug" IS NOT NULL;
  RAISE NOTICE 'آگهی‌های متصل به فروشگاه: %', n;
END $$;
