import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'تولیدکنندگان تجهیزات | بیلیارد هاب',
  description: 'تولیدکنندگان میز و لوازم بیلیارد ایران.',
  alternates: { canonical: '/manufacturers' },
  openGraph: {
    title: 'تولیدکنندگان تجهیزات | بیلیارد هاب',
    description: 'تولیدکنندگان میز و لوازم بیلیارد ایران.',
    url: '/manufacturers',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'تولیدکنندگان تجهیزات | بیلیارد هاب', description: 'تولیدکنندگان میز و لوازم بیلیارد ایران.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
