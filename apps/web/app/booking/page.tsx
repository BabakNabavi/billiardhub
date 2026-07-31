'use client'

/* `/booking` صفحه نداشت و فقط `[clubId]` و `result` زیرش بودند؛ ولی
   لینک «همه» کنار «رزروهای شما» در داشبورد به همین‌جا می‌رفت و کاربر
   به صفحه‌ی خطا می‌خورد. این‌جا همان فهرست، ولی تمام‌عرض. */

import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import AuthGuard from '../../components/AuthGuard'
import MyBookings from '../../components/booking/MyBookings'

const INK = '#1C1B17', MUT = '#8A8474', LINE = '#E7E2D6', GOLD_D = '#9A6E38'

export default function MyBookingsPage() {
  return (
    <AuthGuard>
      <div dir="rtl" style={{
        minHeight: 'calc(100vh - 72px)', background: '#F7F5F0',
        padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,32px) 60px',
        fontFamily: 'var(--font-base)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <CalendarDays size={22} style={{ color: GOLD_D }} />
            <h1 style={{ fontSize: 'clamp(20px,3.4vw,27px)', fontWeight: 900, color: INK, margin: 0, letterSpacing: '-0.02em' }}>
              رزروهای من
            </h1>
          </div>
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 22px', lineHeight: 2 }}>
            رزروهای گذشته و پیش‌رو، وضعیت پرداخت و امکان لغو.
          </p>

          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: 'clamp(14px,3vw,20px)' }}>
            <MyBookings />
          </div>

          <Link href="/clubs" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 14, padding: 13, borderRadius: 13, textDecoration: 'none',
            background: 'rgba(199,166,106,0.08)', border: '1px dashed rgba(199,166,106,0.32)',
            color: GOLD_D, fontSize: 14.5, fontWeight: 700,
          }}>
            <Plus size={15} /> رزرو جدید
          </Link>
        </div>
      </div>
    </AuthGuard>
  )
}
