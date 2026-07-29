import type { Metadata } from 'next'

/* متادیتای این بخش. خودِ صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'مسابقات بیلیارد | بیلیارد هاب',
  description: 'مسابقات و لیگ‌های بیلیارد و اسنوکر ایران — ثبت‌نام و نتایج.',
  alternates: { canonical: '/tournaments' },
  openGraph: {
    title: 'مسابقات بیلیارد | بیلیارد هاب',
    description: 'مسابقات و لیگ‌های بیلیارد و اسنوکر ایران — ثبت‌نام و نتایج.',
    url: '/tournaments',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'مسابقات بیلیارد | بیلیارد هاب', description: 'مسابقات و لیگ‌های بیلیارد و اسنوکر ایران — ثبت‌نام و نتایج.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
