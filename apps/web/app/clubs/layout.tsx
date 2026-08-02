import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده. */
export const metadata: Metadata = {
  title: 'باشگاه‌های بیلیارد | بیلیارد هاب',
  description: 'فهرست باشگاه‌های بیلیارد و اسنوکر سراسر ایران — میزها، امکانات، ساعات کاری و رزرو آنلاین.',
  alternates: { canonical: '/clubs' },
  openGraph: {
    title: 'باشگاه‌های بیلیارد | بیلیارد هاب',
    description: 'فهرست باشگاه‌های بیلیارد و اسنوکر سراسر ایران — میزها، امکانات، ساعات کاری و رزرو آنلاین.',
    url: '/clubs',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'باشگاه‌های بیلیارد | بیلیارد هاب', description: 'فهرست باشگاه‌های بیلیارد و اسنوکر سراسر ایران — میزها، امکانات، ساعات کاری و رزرو آنلاین.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
