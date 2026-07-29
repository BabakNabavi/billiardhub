import type { Metadata } from 'next'

/* متادیتای این بخش. خودِ صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'تماس با ما | بیلیارد هاب',
  description: 'راه‌های ارتباط با تیم بیلیارد هاب.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'تماس با ما | بیلیارد هاب',
    description: 'راه‌های ارتباط با تیم بیلیارد هاب.',
    url: '/contact',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'تماس با ما | بیلیارد هاب', description: 'راه‌های ارتباط با تیم بیلیارد هاب.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
