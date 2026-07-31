import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'اخبار بیلیارد | بیلیارد هاب',
  description: 'تازه‌ترین اخبار بیلیارد، اسنوکر و رویدادهای ورزشی ایران.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'اخبار بیلیارد | بیلیارد هاب',
    description: 'تازه‌ترین اخبار بیلیارد، اسنوکر و رویدادهای ورزشی ایران.',
    url: '/news',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'اخبار بیلیارد | بیلیارد هاب', description: 'تازه‌ترین اخبار بیلیارد، اسنوکر و رویدادهای ورزشی ایران.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
