import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'بازیکنان بیلیارد | بیلیارد هاب',
  description: 'ستارگان بیلیارد ایران — رنکینگ، افتخارات و پروفایل بازیکنان.',
  alternates: { canonical: '/players' },
  openGraph: {
    title: 'بازیکنان بیلیارد | بیلیارد هاب',
    description: 'ستارگان بیلیارد ایران — رنکینگ، افتخارات و پروفایل بازیکنان.',
    url: '/players',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'بازیکنان بیلیارد | بیلیارد هاب', description: 'ستارگان بیلیارد ایران — رنکینگ، افتخارات و پروفایل بازیکنان.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
