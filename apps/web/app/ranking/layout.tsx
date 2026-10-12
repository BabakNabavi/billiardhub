import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  /* `template` عمدی است: لایه‌ای که `title`ِ رشته‌ای دارد قالبِ ریشه را برای
     فرزندانش قطع می‌کند، پس صفحه‌ی جزئیات (مثلاً آگهی/باشگاه/مسابقه) بی‌نامِ
     سایت می‌ماند. با `default` عنوانِ خودِ بخش همان قبلی است. */
  title: { default: 'رنکینگ بیلیارد', template: '%s | بیلیارد هاب' },
  description: 'جدول رنکینگ رسمی بازیکنان بیلیارد و اسنوکر ایران.',
  alternates: { canonical: '/ranking' },
  openGraph: {
    title: 'رنکینگ بیلیارد | بیلیارد هاب',
    description: 'جدول رنکینگ رسمی بازیکنان بیلیارد و اسنوکر ایران.',
    url: '/ranking',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'رنکینگ بیلیارد | بیلیارد هاب', description: 'جدول رنکینگ رسمی بازیکنان بیلیارد و اسنوکر ایران.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
