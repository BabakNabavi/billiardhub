/* ═══════════════════════════════════════════════════════════════
   جایگاهِ ساختنی — ادمین بتواند جایگاه تازه تعریف کند
   ───────────────────────────────────────────────────────────────
   تا امروز کلیدِ هر جایگاه در کد هاردکد بود (`PLACEMENT_KEYS`) و
   نقش‌های مجازِ خریدش هم در یک ثابتِ TypeScript (`PLACEMENT_ROLES`).
   یعنی هر جایگاهِ تازه یک کامیت و یک دیپلوی می‌خواست.

   این مهاجرت آنچه را که در کد ثابت بود به دیتابیس می‌آورد، و فقط
   همان چیزهایی که واقعاً استفاده می‌شوند — نه هر ستونی که ممکن است
   روزی به‌کار بیاید:

     advertiser_roles  کدام نقشِ تأییدشده اجازه‌ی خرید دارد
                       (جایگزینِ ثابتِ PLACEMENT_ROLES)
     approval_required آیا کمپین پیش از نمایش بازبینی می‌شود
     dimensions        ابعادِ پیشنهادیِ فایل — در فرمِ خرید نشان داده
                       می‌شود تا کاربر تصویرِ بدقواره نفرستد
     max_file_mb       سقفِ حجمِ فایلِ همین جایگاه
     terms             قوانینِ ویژه‌ی این جایگاه، اگر داشته باشد

   ستون‌هایی مثل format، price_unit و minimum_duration عمداً ساخته
   نشدند: مدت و قیمت از پله‌های `ad_pricing_plans` می‌آیند و فرمت از
   `content_kind` معلوم است. ستونی که دو منبعِ حقیقت بسازد بدتر از
   نبودنش است.
   ═══════════════════════════════════════════════════════════════ */

ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS advertiser_roles  text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dimensions        text,
  ADD COLUMN IF NOT EXISTS max_file_mb       integer,
  ADD COLUMN IF NOT EXISTS terms             text;

/* کلیدِ جایگاه در URL و در کد استفاده می‌شود؛ اگر ادمین بتواند هر
   رشته‌ای بگذارد، کلیدی با فاصله یا حرفِ فارسی می‌سازد که در مسیرها
   و در `Record`های کد می‌شکند. */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'placements_key_shape_chk'
  ) THEN
    ALTER TABLE public.placements
      ADD CONSTRAINT placements_key_shape_chk
      CHECK (key ~ '^[a-z][a-z0-9_]{2,48}$');
  END IF;
END $$;

/* ── پرکردن از همان نگاشتی که تا امروز در کد بود ──
   بدونِ این، هر جایگاهِ موجود بعد از مهاجرت `advertiser_roles` خالی
   می‌گرفت و ناگهان برای هیچ‌کس قابلِ خرید نمی‌شد. */
UPDATE public.placements SET advertiser_roles = ARRAY['manufacturer','seller']
  WHERE key = 'market_featured_products_homepage' AND advertiser_roles = '{}';
UPDATE public.placements SET advertiser_roles = ARRAY['club_owner']
  WHERE key = 'featured_clubs_homepage' AND advertiser_roles = '{}';
UPDATE public.placements SET advertiser_roles = ARRAY['seller']
  WHERE key = 'featured_equipment_stores_homepage' AND advertiser_roles = '{}';
UPDATE public.placements SET advertiser_roles = ARRAY['club_owner','seller','manufacturer']
  WHERE key IN ('market_ads_right','market_ads_left','equipment_ads_right',
                'equipment_ads_left','homepage_bottom_banner')
    AND advertiser_roles = '{}';

/* پیش‌پخشِ ویدیو تا امروز در آن نگاشت نبود، چون فقط دستی پر می‌شد.
   حالا که جایگاه‌ها ساختنی‌اند، این هم باید نقشِ مجازش را داشته باشد. */
UPDATE public.placements SET advertiser_roles = ARRAY['club_owner','seller','manufacturer']
  WHERE key = 'media_preroll' AND advertiser_roles = '{}';

/* ابعادِ پیشنهادیِ بنرهای موجود — چیزی که تا امروز فقط در سرِ طراح بود */
UPDATE public.placements SET dimensions = '۳۰۰×۶۰۰ پیکسل'
  WHERE key IN ('market_ads_right','market_ads_left','equipment_ads_right','equipment_ads_left')
    AND dimensions IS NULL;
UPDATE public.placements SET dimensions = '۱۲۸۰×۲۰۰ پیکسل'
  WHERE key = 'homepage_bottom_banner' AND dimensions IS NULL;

/* ── بررسی ── */
SELECT key, advertiser_roles, approval_required, dimensions
  FROM public.placements
 ORDER BY priority DESC, sort_order;
