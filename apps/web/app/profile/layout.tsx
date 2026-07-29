import type { Metadata } from 'next'

/* بخشِ خصوصی — هرگز نباید در نتایجِ جست‌وجو بیاید.
   robots.txt هم همین را می‌گوید، ولی این متاتگ لایه‌ی دومِ قطعی است
   (اگر جایی لینکِ مستقیم منتشر شود، Disallow به‌تنهایی کافی نیست). */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
