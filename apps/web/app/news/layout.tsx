import type { Metadata } from 'next'

/* ─────────────────────────────────────────────────────────────
   لایه‌ی بخش اخبار.

   فونت تیتر تحریریه همان دانای کل سایت است و در `app/layout`
   بار می‌شود. پیش‌تر Estedad جدا همین‌جا preload می‌شد.

   ⚠️ متادیتای این‌جا فقط پس‌افت است — هر سه صفحه‌ی بخش
   (`page.tsx`، `[id]/page.tsx`) عنوان و canonical خودشان را با
   `absolute` می‌دهند.
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'اخبار بیلیارد هاب',
  description: 'اتاق خبر بیلیارد هاب: اسنوکر، پول، کاروم، مسابقات، بازیکنان و صنعت بیلیارد',
  alternates: { canonical: '/news' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
