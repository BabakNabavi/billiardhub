import type { Metadata } from 'next'

/* متادیتای این بخش. خودِ صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'درباره بیلیارد هاب | بیلیارد هاب',
  description: 'پلتفرم جامع بیلیارد ایران — باشگاه‌ها، مربیان، فروشگاه و مسابقات.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'درباره بیلیارد هاب | بیلیارد هاب',
    description: 'پلتفرم جامع بیلیارد ایران — باشگاه‌ها، مربیان، فروشگاه و مسابقات.',
    url: '/about',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'درباره بیلیارد هاب | بیلیارد هاب', description: 'پلتفرم جامع بیلیارد ایران — باشگاه‌ها، مربیان، فروشگاه و مسابقات.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
