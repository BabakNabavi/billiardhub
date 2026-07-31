'use client'

import { usePathname } from 'next/navigation'

/* تنها دلیلی که فوتر باید کلاینتی باشد: تشخیص مسیر برای پنهان‌شدن در
   چند صفحه‌ی خاص. آن تصمیم همین‌جا — در ده خط — گرفته می‌شود و خود
   فوتر (۲۸۰ خط) به‌عنوان children از سرور می‌آید و هیچ جاوااسکریپتی
   همراهش نیست.

   پیش‌تر کل فوتر `'use client'` بود و روی **هر صفحه‌ی سایت** Hydrate
   می‌شد، فقط به‌خاطر یک شرط مسیر و دو افکت هاور. */

const HIDDEN = new Set(['/login', '/register', '/shop', '/direct'])

export default function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (HIDDEN.has(pathname)) return null
  return <>{children}</>
}
