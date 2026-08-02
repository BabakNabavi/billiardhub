import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده. */
export const metadata: Metadata = {
  title: 'ثبت‌نام | بیلیارد هاب',
  description: 'ساخت حساب کاربری در بیلیارد هاب.',
  alternates: { canonical: '/register' },
  /* صفحه‌ی ثبت‌نام ارزشِ ایندکس ندارد و نباید در نتایج بیاید */
  robots: { index: false, follow: true },
  openGraph: {
    title: 'ثبت‌نام | بیلیارد هاب',
    description: 'ساخت حساب کاربری در بیلیارد هاب.',
    url: '/register',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'ثبت‌نام | بیلیارد هاب', description: 'ساخت حساب کاربری در بیلیارد هاب.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
