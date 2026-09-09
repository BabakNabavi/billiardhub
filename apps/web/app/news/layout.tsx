import type { Metadata } from 'next'

/* ─────────────────────────────────────────────────────────────
   لایه‌ی بخش اخبار.

   ⚠️ فونت تیتر تحریریه فقط همین‌جا preload می‌شود، نه در
   `app/layout`: ۱۲۸ کیلوبایت روی *هر* صفحه‌ی سایت برای فونتی که
   جای دیگری استفاده نمی‌شود. خود `@font-face` در `newsroom.css`
   است.

   ⚠️ متادیتای این‌جا فقط پس‌افت است — هر سه صفحه‌ی بخش
   (`page.tsx`، `[id]/page.tsx`) عنوان و canonical خودشان را با
   `absolute` می‌دهند.
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'اخبار بیلیارد هاب',
  description: 'اتاق خبر بیلیارد هاب: اسنوکر، پول، کاروم، مسابقات، بازیکنان و صنعت بیلیارد.',
  alternates: { canonical: '/news' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Server Component است؛ `<link>` مستقیم در head می‌نشیند و
          هیچ جاوااسکریپتی به باندل کلاینت اضافه نمی‌کند. */}
      <link
        rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
        href="/fonts/Estedad/Estedad-Variable.woff2"
      />
      {children}
    </>
  )
}
