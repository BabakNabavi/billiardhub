import Link from 'next/link'
import type { Metadata } from 'next'

/* بدون این فایل، Next صفحه‌ی پیش‌فرض انگلیسی خودش را نشان می‌داد —
   وسط یک سایت کاملاً فارسی راست‌به‌چپ. */

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد | بیلیارد هاب',
  robots: { index: false, follow: true },
}

const GOLD_D = '#9A6E38'
const LINE = '#E7E2D6'

export default function NotFound() {
  return (
    <div dir="rtl" style={{
      minHeight: 'calc(100vh - 72px)', background: '#F7F5F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(24px,6vh,64px) 20px', fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: '#fff', border: `1px solid ${LINE}`,
        borderRadius: 22, padding: 'clamp(28px,5vw,40px)', textAlign: 'center',
        boxShadow: '0 18px 60px rgba(28,27,23,0.08)',
      }}>
        <div style={{
          fontSize: 'clamp(48px,12vw,68px)', fontWeight: 900, lineHeight: 1,
          color: 'rgba(199,166,106,0.35)', letterSpacing: '-0.04em', marginBottom: 6,
        }}>۴۰۴</div>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1B17', margin: '0 0 8px' }}>
          این صفحه پیدا نشد
        </h1>
        <p style={{ fontSize: 13, color: '#8A8474', margin: '0 0 24px', lineHeight: 2 }}>
          ممکن است نشانی را اشتباه وارد کرده باشید یا این صفحه برداشته شده باشد.
        </p>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{
            padding: '12px 22px', borderRadius: 12, textDecoration: 'none',
            fontSize: 13.5, fontWeight: 800, color: GOLD_D,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
          }}>صفحه اصلی</Link>
          <Link href="/clubs" style={{
            padding: '12px 22px', borderRadius: 12, textDecoration: 'none',
            fontSize: 13.5, fontWeight: 800, color: '#5B564B',
            background: 'transparent', border: `1px solid ${LINE}`,
          }}>باشگاه‌ها</Link>
        </div>
      </div>
    </div>
  )
}
