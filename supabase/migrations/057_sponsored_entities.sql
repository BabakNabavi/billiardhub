/* ═══════════════════════════════════════════════════════════════
   محتوای اسپانسری — مسابقه و ویدیو هم می‌توانند موجودیتِ جایگاه باشند
   ───────────────────────────────────────────────────────────────
   «مسابقهٔ اسپانسری» و «ویدیوی اسپانسری» نوعِ تازه‌ای از تبلیغ نیستند؛
   همان جایگاهِ موجودیتی‌اند با جدولِ منبعِ متفاوت. به همین دلیل
   `content_kind` تازه‌ای ساخته نشد — که کلِ مسیرِ سرو، اعتبارسنجی و
   پنل ادمین را تکرار می‌کرد — و فقط فهرستِ مجازِ `entity_type` باز شد.

   قیدِ فعلی فقط سه مقدار را می‌پذیرد، پس بدونِ این مهاجرت ساختِ
   جایگاهِ اسپانسری با خطای CHECK رد می‌شود.
   ═══════════════════════════════════════════════════════════════ */

ALTER TABLE public.placements
  DROP CONSTRAINT IF EXISTS placements_entity_chk;

ALTER TABLE public.placements
  ADD CONSTRAINT placements_entity_chk
  CHECK (entity_type IS NULL OR entity_type IN
    ('product', 'club', 'seller', 'tournament', 'video'));

/* ── بررسی ──
   باید ۵ مقدار را نشان دهد. */
SELECT pg_get_constraintdef(oid) AS entity_check
  FROM pg_constraint
 WHERE conname = 'placements_entity_chk';
