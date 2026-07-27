'use client'

/* نتیجه‌ی پرداخت — وضعیت همیشه از سرور خوانده می‌شود، نه از پارامترِ URL. */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { faDateLong, faTimeRange, faNum } from '../../../lib/jalali'
import CancellationPolicy from '../../../components/booking/CancellationPolicy'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'
const fa = faNum

interface B {
  id: string; booking_reference?: string | null; final_amount?: number
  booking_status?: string; payment_status?: string
  bookingDate?: string; timeSlots?: string; clubId?: string
}

export default function BookingResultPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', background: '#F7F5F0' }} />}>
      <BookingResult />
    </Suspense>
  )
}

function BookingResult() {
  const sp = useSearchParams()
  const bookingId = sp.get('booking') || ''
  const reason = sp.get('reason') || ''
  const [b, setB] = useState<B | null>(null)
  const [loading, setLoading] = useState(!!bookingId)

  useEffect(() => {
    if (!bookingId) return
    let alive = true
    fetch(`/api/bookings/${bookingId}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) { setB(d); setLoading(false) } })
      .catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [bookingId])

  const paid = b?.payment_status === 'PAID'

  return (
    <div dir="rtl" style={{ minHeight: '80vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 22, border: `1px solid ${LINE}`, boxShadow: '0 24px 60px rgba(28,27,23,0.1)', padding: '30px 26px', textAlign: 'center' }}>
        {loading ? (
          <><Loader2 size={30} style={{ color: MUT, animation: 'rspin 1s linear infinite' }} />
            <p style={{ fontSize: 13.5, color: MUT, marginTop: 12 }}>در حال بررسیِ وضعیتِ پرداخت…</p></>
        ) : paid ? (
          <>
            <span style={{ display: 'inline-flex', width: 68, height: 68, borderRadius: 22, background: 'rgba(14,122,56,0.1)', color: FELT, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><CheckCircle2 size={34} /></span>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: INK, margin: '0 0 8px' }}>رزرو شما قطعی شد</h1>
            <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.9 }}>پرداخت با موفقیت تأیید و زمان شما رزرو شد.</p>

            <div style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {b?.booking_reference && <Row label="کد پیگیری" value={b.booking_reference} mono />}
              {b?.bookingDate && <Row label="تاریخ" value={faDateLong(b.bookingDate)} icon={<CalendarDays size={13} />} />}
              {b?.timeSlots && <Row label="ساعت" value={faTimeRange(b.timeSlots)} icon={<Clock3 size={13} />} />}
              {typeof b?.final_amount === 'number' && <Row label="مبلغ پرداخت‌شده" value={`${fa(b.final_amount)} تومان`} strong />}
            </div>

            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <CancellationPolicy compact />
            </div>
          </>
        ) : (
          <>
            <span style={{ display: 'inline-flex', width: 68, height: 68, borderRadius: 22, background: 'rgba(178,59,46,0.09)', color: '#B23B2E', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><XCircle size={34} /></span>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: INK, margin: '0 0 8px' }}>پرداخت انجام نشد</h1>
            <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.9 }}>
              {reason || 'پرداخت تأیید نشد. اگر مبلغی کسر شده، طیِ ۷۲ ساعت به‌صورتِ خودکار بازمی‌گردد.'}
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Link href="/clubs" style={{ flex: 1, padding: '12px', borderRadius: 13, textDecoration: 'none', fontSize: 13.5, fontWeight: 800, background: '#F4F3F1', border: `1px solid ${LINE}`, color: SEC }}>باشگاه‌ها</Link>
          <Link href="/dashboard" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 13, textDecoration: 'none', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD_D }}>
            رزروهای من <ArrowLeft size={14} />
          </Link>
        </div>
        <style>{`@keyframes rspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function Row({ label, value, icon, mono, strong }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, color: MUT, display: 'inline-flex', alignItems: 'center', gap: 5 }}>{icon}{label}</span>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 900 : 700, color: INK, direction: mono ? 'ltr' : 'rtl', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}
