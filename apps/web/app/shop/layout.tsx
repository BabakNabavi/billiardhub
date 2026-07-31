import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'فروشگاه تجهیزات بیلیارد | بیلیارد هاب',
  description: 'خرید چوب، میز، توپ و لوازم جانبی بیلیارد از فروشندگان معتبر ایران.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'فروشگاه تجهیزات بیلیارد | بیلیارد هاب',
    description: 'خرید چوب، میز، توپ و لوازم جانبی بیلیارد از فروشندگان معتبر ایران.',
    url: '/shop',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'فروشگاه تجهیزات بیلیارد | بیلیارد هاب', description: 'خرید چوب، میز، توپ و لوازم جانبی بیلیارد از فروشندگان معتبر ایران.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
