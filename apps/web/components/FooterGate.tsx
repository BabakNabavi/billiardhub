'use client'

import { usePathname } from 'next/navigation'

/* تنها دلیلی که فوتر باید کلاینتی باشد: تشخیص مسیر برای پنهان‌شدن در
   چند صفحه‌ی خاص. آن تصمیم همین‌جا — در ده خط — گرفته می‌شود و خود
   فوتر (۲۸۰ خط) به‌عنوان children از سرور می‌آید و هیچ جاوااسکریپتی
   همراهش نیست.

   پیش‌تر کل فوتر `'use client'` بود و روی **هر صفحه‌ی سایت** Hydrate
   می‌شد، فقط به‌خاطر یک شرط مسیر و دو افکت هاور. */

const HIDDEN = new Set(['/login', '/register', '/shop', '/direct'])

/* صفحه‌ی نمایشِ بزرگ (مانیتورِ سالن) هیچ‌کدام از عناصرِ سایت را
   نمی‌خواهد — از ده متر آن‌طرف‌تر دیده می‌شود، نه خوانده. */
const isStage = (p: string) => /^\/tournaments\/[^/]+\/(stage|control)$/.test(p)

/* ── صفحه‌ی یک فروشگاه ──
   خودش فوترِ اختصاصی دارد (دسته‌بندی‌ها، راه‌های ارتباطی، موقعیت، و
   کپی‌رایتِ همان فروشگاه). فوترِ سایت زیرِ آن یعنی دو فوترِ پشتِ سرِ
   هم و دو کپی‌رایت. فهرستِ `/sellers` خودش فوتر دارد و دست‌نخورده
   می‌ماند. */
const isStorePage = (p: string) => /^\/sellers\/[^/]+$/.test(p)

export default function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (HIDDEN.has(pathname) || isStage(pathname) || isStorePage(pathname)) return null
  return <>{children}</>
}
