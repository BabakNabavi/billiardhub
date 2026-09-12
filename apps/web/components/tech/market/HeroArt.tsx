/* ─────────────────────────────────────────────────────────────
   پوسترِ سرلوحه — عکسِ واقعی، نه صحنه‌ی برداری.

   ── چرا عوض شد ──
   سه نسخه‌ی SVGِ دست‌ساز رد شد. ایراد سلیقه‌ای نبود: مالک می‌خواست
   «سه‌بعدی و سینماتیک» و SVGِ تخت هرچقدر هم دقیق کشیده شود آن را
   نمی‌دهد. عکس‌ها را خودِ مالک با مدلِ تصویری ساخت و داد.

   ── قیدِ ترکیب‌بندی ──
   ⚠️ سوژه سمتِ چپ است و نیمه‌ی راستِ هر دو عکس عمدا تیره و خالی
   مانده، چون صفحه راست‌به‌چپ است و تمامِ متن آن‌جا می‌نشیند. اگر
   روزی عکس عوض شد، همین قید باید رعایت شود وگرنه متن روی شلوغی
   می‌افتد و پرده هم نجاتش نمی‌دهد.

   ── وزن ──
   AVIF با WebP به‌عنوان پس‌افت، در چهار عرض تا ۱۵۳۶ که رزولوشنِ
   بومیِ فایل است. موبایلِ DPR۲ پله‌ی ۱۰۲۴ را می‌گیرد: ۱۶ تا ۲۰
   کیلوبایت. مخاطبِ اصلی شبکه‌ی کندِ ایران است.
   ───────────────────────────────────────────────────────────── */

export type HeroArtVariant = 'services' | 'profile'

const W = [768, 1024, 1280, 1536] as const
const set = (base: string, ext: string) =>
  W.map(w => `/images/services/${base}-${w}.${ext} ${w}w`).join(', ')

export function HeroArt({ variant }: { variant: HeroArtVariant }) {
  const base = variant === 'services' ? 'hero-services' : 'hero-profile'
  return (
    <div className={`tmha tmha--${variant}`} aria-hidden>
      <picture>
        <source type="image/avif" srcSet={set(base, 'avif')} sizes="100vw" />
        {/* ⚠️ `alt=""` عمدی است: عکس تزئینِ سرلوحه است و کلِ ظرف هم
            `aria-hidden` دارد. متنِ معنادار در خودِ سربرگ است. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="tmha-img"
          src={`/images/services/${base}-1024.webp`}
          srcSet={set(base, 'webp')}
          sizes="100vw"
          width={1536}
          height={1024}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <span className="tmha-grain" />
      <span className="tmha-sheen" />
    </div>
  )
}
