import { productTitleParts, type ProductTitleFields } from '../../lib/market/title'

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
      <span className={headClassName}>{head}</span>
      {tail && <span className={tailClassName}>{tail}</span>}
    </span>
  )
}
