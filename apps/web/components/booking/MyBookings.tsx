'use client'

/* رزروهای کاربر — با لغو رزرو و نمایش شفاف سیاست بازپرداخت پیش از تأیید. */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock3, MapPin, X, Loader2, AlertTriangle, CheckCircle2, CalendarDays } from 'lucide-react'
import { faDate, faTimeRange, faNum, toFaDigits } from '../../lib/jalali'
import CancellationPolicy from './CancellationPolicy'
import { apiFetch } from '../../lib/http'

const INK = '#111111', SEC = '#5B564B', MUT = 'rgba(0,0,0,0.42)', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'
const fa = faNum

interface RefundPreview { refundPercent: number; refundAmount: number; label: string; hoursBefore: number }
interface B {
  id: string; booking_reference?: string | null; clubName: string; clubCity?: string
  bookingDate: string; timeSlots: string | null; totalHours: number; final_amount: number
  booking_status: string; payment_status: string; refund_amount?: number; refund_status?: string
  canCancel: boolean; cancelBlockedReason?: string | null; refundPreview: RefundPreview | null
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED:       { label: 'قطعی',            color: FELT,   bg: 'rgba(14,122,56,0.09)' },
  PENDING_PAYMENT: { label: 'در انتظار پرداخت', color: GOLD_D, bg: 'rgba(199,166,106,0.13)' },
  COMPLETED:       { label: 'انجام‌شده',        color: MUT,    bg: 'rgba(0,0,0,0.05)' },
  CANCELLED:       { label: 'کنسل‌شده',         color: RED,    bg: 'rgba(178,59,46,0.08)' },
  EXPIRED:         { label: 'منقضی',            color: MUT,    bg: 'rgba(0,0,0,0.05)' },
}

export default function MyBookings() {
  const [rows, setRows] = useState<B[] | null>(null)
  const [confirm, setConfirm] = useState<B | null>(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/bookings/my', { credentials: 'include', headers: { }, cache: 'no-store' })
      setRows(r.ok ? await r.json() : [])
    } catch { setRows([]) }
  }, [])
  useEffect(() => { load() }, [load])

  const cancel = async (b: B) => {
    setBusy(b.id)
    try {
      const r = await apiFetch(`/api/bookings/${b.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'لغو توسط کاربر' }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) alert(j?.message || 'لغو رزرو ممکن نشد')
      setConfirm(null); await load()
    } finally { setBusy('') }
  }

  if (rows === null) return <div style={{ textAlign: 'center', padding: 40, color: MUT }}><Loader2 size={22} style={{ animation: 'mbspin 1s linear infinite' }} /><style>{`@keyframes mbspin{to{transform:rotate(360deg)}}`}</style></div>

  if (rows.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <CalendarDays size={30} style={{ color: 'rgba(0,0,0,0.2)', marginBottom: 10 }} />
      <p style={{ fontSize: 15, color: MUT, margin: '0 0 14px' }}>هنوز رزروی ثبت نکرده‌اید</p>
      <Link href="/clubs" style={{ display: 'inline-flex', padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD_D }}>
        رزرو میز
      </Link>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map(b => {
        const st = STATUS[b.booking_status] ?? STATUS.COMPLETED!
        const timeLabel = faTimeRange(b.timeSlots)
        return (
          <div key={b.id} className="booking-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎱</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.clubName}</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 12.5, color: MUT, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} /> {faDate(b.bookingDate)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock3 size={11} /> {timeLabel}</span>
                {b.clubCity && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {b.clubCity}</span>}
              </div>
              {b.booking_status === 'CANCELLED' && Number(b.refund_amount) > 0 && (
                <div style={{ fontSize: 11.5, color: FELT, marginTop: 5 }}>بازپرداخت: {fa(b.refund_amount)} تومان</div>
              )}
              {b.canCancel ? (
                <button onClick={() => setConfirm(b)} disabled={busy === b.id}
                  style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: RED }}>
                  <X size={12} /> لغو رزرو
                </button>
              ) : b.cancelBlockedReason && b.booking_status !== 'CANCELLED' ? (
                /* دلیل نوشته می‌شود؛ نبود دکمه به‌تنهایی یعنی «اصلاً
                   امکان لغو نیست» که پیام درستی نبود. */
                <div style={{ marginTop: 8, fontSize: 11, color: MUT, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={11} style={{ flexShrink: 0 }} /> {b.cancelBlockedReason}
                </div>
              ) : null}
            </div>

            <div style={{ textAlign: 'left', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: st.color, background: st.bg, borderRadius: 20, padding: '3px 10px', fontWeight: 700, marginBottom: 5, textAlign: 'center' }}>{st.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.55)', fontVariantNumeric: 'tabular-nums' }}>{fa(b.final_amount)}</div>
            </div>
          </div>
        )
      })}

      {confirm && (
        <div onClick={() => !busy && setConfirm(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={e => e.stopPropagation()} dir="rtl"
            style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, border: `1px solid ${LINE}`, padding: 22, textAlign: 'center', fontFamily: 'var(--font-base)' }}>
            <span style={{ display: 'inline-flex', width: 54, height: 54, borderRadius: 17, background: 'rgba(178,59,46,0.09)', color: RED, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <AlertTriangle size={25} />
            </span>
            <h3 style={{ fontSize: 16.5, fontWeight: 900, color: INK, margin: '0 0 8px' }}>لغو رزرو</h3>
            <p style={{ fontSize: 13, color: SEC, margin: '0 0 16px', lineHeight: 2 }}>
              رزرو <b>{confirm.clubName}</b> در تاریخ <b>{faDate(confirm.bookingDate)}</b>،
              ساعت <b>{faTimeRange(confirm.timeSlots)}</b> لغو شود؟
            </p>

            {confirm.refundPreview ? (
              <div style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14, marginBottom: 12, textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: MUT, marginBottom: 8 }}>{confirm.refundPreview.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: SEC }}>مبلغ بازگشتی</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: FELT, fontVariantNumeric: 'tabular-nums' }}>
                    {fa(confirm.refundPreview.refundAmount)} <span style={{ fontSize: 11, color: MUT }}>تومان</span>
                  </span>
                </div>
                {confirm.refundPreview.refundPercent < 100 && (
                  <div style={{ fontSize: 11, color: MUT, marginTop: 6 }}>
                    ({toFaDigits(confirm.refundPreview.refundPercent)}٪ از {fa(confirm.final_amount)} تومان)
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: MUT, margin: '0 0 12px' }}>این رزرو پرداخت نشده است؛ مبلغی بازگردانده نمی‌شود.</p>
            )}

            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <CancellationPolicy compact />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} disabled={!!busy}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${LINE}`, background: '#F4F3F1', color: SEC, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                انصراف
              </button>
              <button onClick={() => cancel(confirm)} disabled={!!busy}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, border: 'none', background: RED, color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {busy ? <Loader2 size={15} style={{ animation: 'mbspin 1s linear infinite' }} /> : <CheckCircle2 size={15} />} لغو رزرو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
