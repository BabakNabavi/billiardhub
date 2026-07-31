import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  title: 'خدمات فنی بیلیارد | بیلیارد هاب',
  description: 'نصب، تعمیر، تعویض ماهوت و تراز میز بیلیارد توسط متخصصان.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'خدمات فنی بیلیارد | بیلیارد هاب',
    description: 'نصب، تعمیر، تعویض ماهوت و تراز میز بیلیارد توسط متخصصان.',
    url: '/services',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'خدمات فنی بیلیارد | بیلیارد هاب', description: 'نصب، تعمیر، تعویض ماهوت و تراز میز بیلیارد توسط متخصصان.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
