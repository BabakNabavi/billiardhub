import type { Metadata } from 'next'

/* متادیتای بخشِ خدماتِ فنی. خودِ صفحه Client Component است و
   نمی‌تواند metadata صادر کند، پس این لایه فقط برای SEO اضافه شده و
   چیزی جز children رندر نمی‌کند.

   ⚠️ `canonical` این‌جا ارثی است و روی `[id]` هم می‌نشیند — که هر
   پروفایل را به دایرکتوری canonical می‌کرد. `[id]/layout.tsx` آن را
   با canonicalِ خودش بازنویسی می‌کند. */

const title = 'خدمات فنی بیلیارد | تعمیر، رگلاژ و نگهداری تجهیزات | بیلیارد هاب'
const description =
  'متخصصان خدمات فنی بیلیارد را بر اساس تخصص و شهر پیدا کنید: تعمیر و سرویس چوب، '
  + 'تعویض نوک و فرول، جوینت، تراز و رگلاژ میز، تعویض پارچه و باند، نصب و جابه‌جایی.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/services' },
  openGraph: {
    title, description,
    url: '/services',
    siteName: 'بیلیارد هاب',
    locale: 'fa_IR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
