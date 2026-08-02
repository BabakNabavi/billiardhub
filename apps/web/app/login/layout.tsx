import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده. */
export const metadata: Metadata = {
  title: 'ورود | بیلیارد هاب',
  description: 'ورود به حساب کاربری بیلیارد هاب.',
  alternates: { canonical: '/login' },
  /* صفحه‌ی ورود ارزشِ ایندکس ندارد و نباید در نتایج بیاید */
  robots: { index: false, follow: true },
  openGraph: {
    title: 'ورود | بیلیارد هاب',
    description: 'ورود به حساب کاربری بیلیارد هاب.',
    url: '/login',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'ورود | بیلیارد هاب', description: 'ورود به حساب کاربری بیلیارد هاب.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
