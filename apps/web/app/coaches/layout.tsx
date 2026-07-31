import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'مربیان بیلیارد | بیلیارد هاب',
  description: 'فهرست مربیان بیلیارد، اسنوکر و پاکت با مدرک و سابقه‌ی تأییدشده.',
  alternates: { canonical: '/coaches' },
  openGraph: {
    title: 'مربیان بیلیارد | بیلیارد هاب',
    description: 'فهرست مربیان بیلیارد، اسنوکر و پاکت با مدرک و سابقه‌ی تأییدشده.',
    url: '/coaches',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'مربیان بیلیارد | بیلیارد هاب', description: 'فهرست مربیان بیلیارد، اسنوکر و پاکت با مدرک و سابقه‌ی تأییدشده.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
