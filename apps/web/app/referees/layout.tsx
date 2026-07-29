import type { Metadata } from 'next'

/* متادیتای این بخش. خودِ صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'داوران بیلیارد | بیلیارد هاب',
  description: 'داوران رسمی بیلیارد و اسنوکر ایران با درجه و مدرک معتبر.',
  alternates: { canonical: '/referees' },
  openGraph: {
    title: 'داوران بیلیارد | بیلیارد هاب',
    description: 'داوران رسمی بیلیارد و اسنوکر ایران با درجه و مدرک معتبر.',
    url: '/referees',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'داوران بیلیارد | بیلیارد هاب', description: 'داوران رسمی بیلیارد و اسنوکر ایران با درجه و مدرک معتبر.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
