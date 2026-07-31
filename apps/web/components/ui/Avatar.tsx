'use client'

/* ─────────────────────────────────────────────────────────────
   آواتار واحد پروژه.

   تا امروز هر جا شکل خودش را داشت و همه‌شان روی «حرف اول نام» تکیه
   می‌کردند: نوار استوری، ناوبار، پروفایل. نتیجه دو مشکل بود:

     ۱) کاربری که عکس گذاشته بود، در نوار استوری باز هم حرف اولش را
        می‌دید (آن‌جا اصلاً به `avatar` نگاه نمی‌شد).
     ۲) کاربر بدون عکس همه‌جا یک حرف فارسی روی دایره‌ی طلایی می‌دید —
        روی صفحه‌ی اول زیبا نبود.

   حالا یک منبع واحد: اگر عکس هست عکس، وگرنه آیکون آدمک.
   ───────────────────────────────────────────────────────────── */

/** آدمک پیش‌فرض — SVG درون‌خطی، بدون وابستگی به فونت یا CDN.
 *
 *  عمداً دو شکل توپُر و ساده است (سر + شانه) نه خطی ظریف: در قطر
 *  ۳۲ تا ۸۰ پیکسل روی صفحه‌ی اول باید از فاصله هم خوانا بماند. */
export function PersonIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.6" r="3.9" fill={color} />
      <path
        d="M4.4 20.2c0-3.9 3.4-6.6 7.6-6.6s7.6 2.7 7.6 6.6a.9.9 0 0 1-.9.9H5.3a.9.9 0 0 1-.9-.9Z"
        fill={color}
      />
    </svg>
  )
}

export interface AvatarProps {
  src?: string | null
  /** فقط برای متن جایگزین تصویر (خوانده نمی‌شود اگر تزئینی باشد) */
  alt?: string
  size?: number
  /** پس‌زمینه‌ی حالت بدون عکس */
  background?: string
  /** رنگ آدمک در حالت بدون عکس */
  iconColor?: string
  className?: string
  style?: React.CSSProperties
}

export default function Avatar({
  src,
  alt = '',
  size = 40,
  background = 'linear-gradient(135deg,#E8DCC3,#CBB78C)',
  iconColor = 'rgba(255,255,255,0.92)',
  className,
  style,
}: AvatarProps) {
  const box: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: src ? '#EFEAE0' : background,
    ...style,
  }

  return (
    <span className={className} style={box}>
      {src
        /* eslint-disable-next-line @next/next/no-img-element */
        ? <img src={src} alt={alt} width={size} height={size}
               loading="lazy" decoding="async"
               style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <PersonIcon size={Math.round(size * 0.58)} color={iconColor} />}
    </span>
  )
}
