'use client'

/* ── آخرین لایه‌ی مرزِ خطا ──
   `error.tsx` خطای داخلِ صفحه‌ها را می‌گیرد، ولی خطایی که در خودِ
   `app/layout.tsx` (یا Providerهای ریشه) رخ دهد به آن نمی‌رسد — چون
   `error.tsx` *داخلِ* همان layout رندر می‌شود. تا امروز آن حالت صفحه‌ی
   خامِ انگلیسیِ Next را نشان می‌داد.

   این فایل به‌جای layoutِ ریشه می‌نشیند، پس:
     · خودش `<html>` و `<body>` دارد
     · CSSِ سراسری و فونتِ layout را ندارد ⇒ همه‌ی استایل همین‌جاست
     · لینکِ «صفحه اصلی» عمداً `<a>` است نه `<Link>`: ریشه خراب است و
       بارگذاریِ کامل تنها راهِ مطمئنِ بیرون‌آمدن است.

   ظاهر همان کارتِ `error.tsx` است تا کاربر دو صفحه‌ی خطای متفاوت نبیند. */

import { useEffect } from 'react'
import { reportClientError } from '../components/ErrorBeacon'

const LINE = '#E7E2D6'
const GOLD_D = '#8F6531'

export default function GlobalError({ error, retry }: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
    reportClientError(error, error.digest ? `global ${error.digest}` : 'global')
  }, [error])

  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, background: '#F7F5F0', color: '#1C1B17' }}>
        <title>مشکلی پیش آمد | بیلیارد هاب</title>
        <main style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(24px,6vh,64px) 16px', boxSizing: 'border-box',
          fontFamily: 'Vazirmatn, Tahoma, sans-serif',
        }}>
          <div style={{
            width: '100%', maxWidth: 440, background: '#fff', border: `1px solid ${LINE}`,
            borderRadius: 22, padding: 'clamp(28px,5vw,40px)', textAlign: 'center',
            boxShadow: '0 18px 60px rgba(28,27,23,0.08)', boxSizing: 'border-box',
          }}>
            <h1 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 8px' }}>
              مشکلی پیش آمد
            </h1>
            <p style={{ fontSize: 13, color: '#6F6A5C', margin: '0 0 24px', lineHeight: 2 }}>
              سایت موقتاً بالا نیامد. یک‌بار دیگر تلاش کنید؛ اگر باز هم تکرار شد
              چند دقیقه بعد سر بزنید.
            </p>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" onClick={retry} style={{
                padding: '12px 22px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 800, color: GOLD_D,
                background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
              }}>تلاش دوباره</button>
              {/* عمداً <a>: layoutِ ریشه خراب است و ناوبریِ کلاینتیِ <Link> روی
                  همان درختِ خراب سوار می‌شود؛ فقط بارگذاریِ کامل بیرون می‌برد. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" style={{
                padding: '12px 22px', borderRadius: 12, textDecoration: 'none',
                fontSize: 13.5, fontWeight: 800, color: '#5B564B',
                background: 'transparent', border: `1px solid ${LINE}`,
              }}>صفحه اصلی</a>
            </div>
            {error.digest && (
              <p style={{ fontSize: 11, color: '#B7B0A0', margin: '18px 0 0', direction: 'ltr' }}>
                ref: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  )
}
