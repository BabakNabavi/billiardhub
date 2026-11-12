import { type Img, src, srcSet } from './imagery'

/* تصویرِ صفحه‌ی درباره ما — srcset دوعرضی، ابعادِ واقعی برای جلوگیری از جابه‌جاییِ
   چیدمان، و lazy مگر برای تصویرِ هیرو که نامزدِ LCP است. `position` نقطه‌ی کانونیِ
   برش است وقتی کادر نسبتِ دیگری از عکسِ اصلی دارد (مقدارِ محاسبه‌شده، پس اینلاین) */
export function Photo({ img, sizes, className = '', priority = false, position, alt }: {
  img: Img; sizes: string; className?: string; priority?: boolean; position?: string; alt?: string
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- WebPهای آماده با srcset؛ next/image کارِ تازه‌ای نمی‌کند */
    <img src={src(img)} srcSet={srcSet(img)} sizes={sizes} width={img.w[1]} height={img.h[1]}
      alt={alt ?? img.alt} decoding="async" loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined} className={`block h-full w-full object-cover ${className}`}
      style={position ? { objectPosition: position } : undefined} />
  )
}
