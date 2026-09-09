import type { Metadata } from 'next'

/* متادیتای این بخش. خود صفحه Client Component است و نمی‌تواند
   metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند.

   ⚠️ عنوان absolute است. رشته‌ی ساده قالبِ ریشه
   ('%s | بیلیارد هاب') را می‌گیرد و چون پسوند از قبل دستی نوشته
   شده بود، روی سایتِ زنده «بیلیارد مدیا | بیلیارد هاب | بیلیارد
   هاب» دیده می‌شد. همان تله‌ای که در خدماتِ فنی و اخبار هم بود. */
export const metadata: Metadata = {
  title: { absolute: 'بیلیارد مدیا | بیلیارد هاب' },
  description: 'ویدیوهای آموزشی، مسابقات و کلیپ‌های بیلیارد و اسنوکر.',
  alternates: { canonical: '/media' },
  openGraph: {
    title: 'بیلیارد مدیا | بیلیارد هاب',
    description: 'ویدیوهای آموزشی، مسابقات و کلیپ‌های بیلیارد و اسنوکر.',
    url: '/media',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'بیلیارد مدیا | بیلیارد هاب', description: 'ویدیوهای آموزشی، مسابقات و کلیپ‌های بیلیارد و اسنوکر.' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
