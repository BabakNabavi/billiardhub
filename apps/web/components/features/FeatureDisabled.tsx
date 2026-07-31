'use client'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

/* صفحه‌ی «این بخش موقتاً غیرفعال است».

   جایگزینِ صفحه‌ی خالی یا ریدایرکتِ بی‌توضیح. کاربری که لینکِ دایرکت را
   بوکمارک کرده یا از تاریخچه برمی‌گردد، به‌جای یک صفحه‌ی شکسته یک پیامِ
   روشن می‌بیند و راهِ برگشت دارد.

   عمداً هیچ جزئیاتی از دلیلِ فنی، نامِ پرچم یا زمان‌بندی نمی‌گوید. */
export default function FeatureDisabled({
  title = 'این بخش موقتاً غیرفعال است',
  note = 'این قابلیت در حالِ به‌روزرسانی است و به‌زودی باز می‌گردد.',
}: { title?: string; note?: string }) {
  return (
    <div style={{
      minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: '40px 22px', textAlign: 'center', direction: 'rtl',
    }}>
      <span style={{
        width: 62, height: 62, borderRadius: 20, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.32)',
        color: '#9A6E38',
      }}>
        <Clock size={26} />
      </span>

      <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111111', lineHeight: 1.7 }}>
        {title}
      </h1>
      <p style={{ margin: 0, maxWidth: 380, fontSize: 13.5, lineHeight: 2, color: '#5B5B5B' }}>
        {note}
      </p>

      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6,
        minHeight: 44, padding: '0 20px', borderRadius: 12,
        background: '#141413', color: '#FFFFFF', textDecoration: 'none',
        fontSize: 14, fontWeight: 700,
      }}>
        <ArrowRight size={16} /> بازگشت به صفحه‌ی اصلی
      </Link>
    </div>
  )
}
