'use client'

/* مرزِ خطای سراسری. بدونِ این، هر خطای رندری صفحه‌ی پیش‌فرضِ Next را
   نشان می‌داد. متنِ خطا عمداً به کاربر نشان داده نمی‌شود (می‌تواند
   جزئیاتِ داخلی داشته باشد)؛ فقط digest که شناسه‌ی بی‌خطرِ لاگ است. */

import { useEffect } from 'react'

const LINE = '#E7E2D6'
const GOLD_D = '#9A6E38'

export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div dir="rtl" style={{
      minHeight: 'calc(100vh - 72px)', background: '#F7F5F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(24px,6vh,64px) 20px', fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: '#fff', border: `1px solid ${LINE}`,
        borderRadius: 22, padding: 'clamp(28px,5vw,40px)', textAlign: 'center',
        boxShadow: '0 18px 60px rgba(28,27,23,0.08)',
      }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1B17', margin: '0 0 8px' }}>
          مشکلی پیش آمد
        </h1>
        <p style={{ fontSize: 13, color: '#8A8474', margin: '0 0 24px', lineHeight: 2 }}>
          این بخش موقتاً بالا نیامد. یک‌بار دیگر تلاش کنید؛ اگر باز هم تکرار شد
          کمی بعد سر بزنید.
        </p>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={reset} style={{
            padding: '12px 22px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 800, color: GOLD_D,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
          }}>تلاش دوباره</button>
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
    </div>
  )
}
