/* ═══════════════════════════════════════════════════════════════
   باشگاهِ نمایشی — همان قاعده‌ی ۰۴۶، این‌بار روی جدولِ clubs
   ───────────────────────────────────────────────────────────────
   صفحه‌ی «افزودن محتوای نمایشی» شش نوع پروفایل می‌سازد ولی باشگاه
   نمی‌سازد، چون باشگاه جدولِ خودش را دارد. نتیجه این بود که مهم‌ترین
   فهرستِ سایت — باشگاه‌ها — تنها فهرستی بود که ادمین نمی‌توانست پرش
   کند.

   ── چرا ستونِ نشانه لازم است ──
   بدونِ `is_demo`، ردیفِ نمایشی از ردیفِ واقعی قابلِ تفکیک نیست و
   پاک‌کردنش بعداً به حدس‌زدن می‌افتد — همان چیزی که در ۰۴۶ برای
   پروفایل‌ها حل شد.

   ── مالکیت ──
   `ownerId` باقی می‌ماند (ستون NOT NULL نیست ولی کدِ موجود همه‌جا
   انتظارِ مقدار دارد) و شناسه‌ی همان ادمینی می‌نشیند که ساخته است.
   جایگزینش — مالکِ ساختگی — یعنی ردیفی در `users` که هیچ‌کس نیست.

   ── تیکِ تأیید ──
   `verificationStatus` روی `pending` می‌ماند. آن تیک یعنی جوازِ کسب
   استعلام شده، و روی باشگاهی که وجودِ خارجی ندارد ادعای درستی نیست.
   ولی `isActive` روشن است، چون کارِ این ردیف‌ها دقیقاً دیده‌شدن است.
   ═══════════════════════════════════════════════════════════════ */

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

/* فهرست‌گرفتنِ ردیف‌های نمایشی در پنل — بدونش هر بار کلِ جدول خوانده
   می‌شود، و این جدول قرار است بزرگ‌ترینِ سایت باشد. */
CREATE INDEX IF NOT EXISTS clubs_demo_idx
  ON public.clubs (is_demo, "createdAt" DESC)
  WHERE is_demo = true;

/* ── پاک‌سازیِ یک‌جا، هر وقت لازم شد ──
   (عمداً اجرا نمی‌شود؛ این‌جا فقط برای یادآوری نوشته شده.)

     DELETE FROM public.clubs WHERE is_demo = true;
*/

/* ── بررسی ── */
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'is_demo')      AS col,
  (SELECT count(*) FROM pg_indexes WHERE indexname = 'clubs_demo_idx') AS idx,
  (SELECT count(*) FROM public.clubs)                            AS clubs_total,
  (SELECT count(*) FROM public.clubs WHERE is_demo)              AS clubs_demo;
