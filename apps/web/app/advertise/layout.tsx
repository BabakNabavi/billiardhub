import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند. */
export const metadata: Metadata = {
  /* `template` عمدی است: لایه‌ای که `title`ِ رشته‌ای دارد قالبِ ریشه را برای
     فرزندانش قطع می‌کند، پس صفحه‌ی جزئیات (مثلاً آگهی/باشگاه/مسابقه) بی‌نامِ
     سایت می‌ماند. با `default` عنوانِ خودِ بخش همان قبلی است. */
  title: { default: 'تبلیغات در بیلیارد هاب', template: '%s | بیلیارد هاب' },
  description: 'جایگاه‌های تبلیغاتی و بسته‌های نمایش در پلتفرم بیلیارد هاب.',
  alternates: { canonical: '/advertise' },
  openGraph: {
    title: 'تبلیغات در بیلیارد هاب | بیلیارد هاب',
    description: 'جایگاه‌های تبلیغاتی و بسته‌های نمایش در پلتفرم بیلیارد هاب.',
    url: '/advertise',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'تبلیغات در بیلیارد هاب | بیلیارد هاب', description: 'جایگاه‌های تبلیغاتی و بسته‌های نمایش در پلتفرم بیلیارد هاب.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
