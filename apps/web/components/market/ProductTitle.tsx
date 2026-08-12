import { productTitleParts, type ProductTitleFields } from '../../lib/market/title'
import { keepLatinProps } from '../../lib/text-fa'

/* ─────────────────────────────────────────────────────────────
   عنوانِ محصول — یک کامپوننت برای همه‌ی کارت‌ها.

   ── چرا لازم شد ──
   `productTitleParts` از قبل منبعِ واحدِ *محاسبه* بود، ولی هر صفحه
   خودش تصمیم می‌گرفت چطور نشانش بدهد:

     فهرستِ بازار      → دو تکه، سر بولد            ✅
     صفحه‌ی محصول      → دو تکه                     ✅
     کارتِ صفحه‌ی اصلی → دو تکه (کلاسِ جدا)          ~
     کارتِ فروشگاه     → یک رشته‌ی خام، بدونِ تکه‌بندی ✗

   نتیجه‌اش این بود که یک محصول در سه صفحه سه‌جور دیده می‌شد — جایی
   برندش زیرِ عنوان بود، جایی اصلاً نبود، و وزنِ فونت‌ها هم یکی نبود.

   حالا محاسبه و نمایش هر دو یک‌جا هستند. اندازه و رنگ همچنان از
   بیرون می‌آید (هر کارت ابعادِ خودش را دارد)، ولی *ساختار* — سرِ
   بولد و برند/مدلِ زیرش — همه‌جا یکی است.
   ───────────────────────────────────────────────────────────── */

export interface ProductTitleProps {
  p: ProductTitleFields
  /** کلاسِ پوشش — کنترلِ اندازه و کلامپِ هر کارت */
  className?: string
  /** کلاسِ سرِ عنوان (دسته‌بندی و نوع) */
  headClassName?: string
  /** کلاسِ برند و مدل */
  tailClassName?: string
}


export default function ProductTitle({
  p, className, headClassName, tailClassName,
}: ProductTitleProps) {
  const { head, tail } = productTitleParts(p)
  return (
    <span className={className}>
      {/* ── ارقامِ داخلِ نامِ لاتین ──
          `PersianDigits` هر رقمِ رندرشده را فارسی می‌کند و «Century G1»
          را «Century G۱» نشان می‌داد. `keepLatinProps` تصمیم می‌گیرد
          کدام استثنا لازم است — و برای متنِ ترکیبی فونت را عوض
          نمی‌کند. سرِ عنوان هم شامل است: «G1 تورنومنت» که فروشنده
          نوشته، «۱G تورنومنت» رندر می‌شد. */}
      <span {...keepLatinProps(head, headClassName)}>{head}</span>
      {tail && (
        <span {...keepLatinProps(tail, tailClassName)}>{tail}</span>
      )}
    </span>
  )
}
