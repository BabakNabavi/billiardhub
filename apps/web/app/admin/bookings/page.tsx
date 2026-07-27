'use client'

/* مدیریتِ رزروها — فهرست، جستجو، فیلترِ وضعیت و لغوِ رزرو با بازپرداخت.
   لغو از همان مسیرِ /api/bookings/[id]/cancel انجام می‌شود تا اثرِ مالی
   (بازپرداخت، دفترِ کل، رکوردِ refund) دقیقاً مثلِ لغوِ کاربر ثبت شود. */

import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays, Loader2, AlertCircle, Search, X, CheckCircle2, AlertTriangle, RotateCcw,
} from 'lucide-react'
import { faDate, faTimeRange, faNum, toFaDigits } from '../../../lib/jalali'
import CancellationPolicy from '../../../components/booking/CancellationPolicy'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'
const token = () => { try { return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token || '' } catch { return '' } }

interface RefundPreview { refundPercent: number; refundAmount: number; label: string; hoursBefore: number; canCancel: boolean }
interface B {
  id: string; booking_reference?: string | null
  clubName: string; clubCity?: string; userName: string; userPhone?: string
  bookingDate: string; timeSlots: string | null; totalHours?: number
  final_amount: number; booking_status: string; payment_status: string
  refund_amount?: number; refund_status?: string; cancellation_reason?: string | null
  canCancel: boolean; inCancelWindow: boolean; refundPreview: RefundPreview | null
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED:       { label: 'قطعی',             color: FELT,   bg: 'rgba(14,122,56,0.09)' },
  PENDING_PAYMENT: { label: 'در انتظار پرداخت', color: GOLD_D, bg: 'rgba(199,166,106,0.13)' },
  COMPLETED:       { label: 'انجام‌شده',         color: MUT,    bg: 'rgba(0,0,0,0.05)' },
  CANCELLED:       { label: 'لغو شده',           color: RED,    bg: 'rgba(178,59,46,0.08)' },
  EXPIRED:         { label: 'منقضی',             color: MUT,    bg: 'rgba(0,0,0,0.05)' },
}
const FILTERS: [string, string][] = [
  ['', 'همه'], ['CONFIRMED', 'قطعی'], ['PENDING_PAYMENT', 'در انتظار پرداخت'],
  ['CANCELLED', 'لغو شده'], ['COMPLETED', 'انجام‌شده'], ['EXPIRED', 'منقضی'],
]

export default function AdminBookings() {
  const [rows, setRows] = useState<B[] | null>(null)
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<B | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try {
      const url = `/api/admin/bookings?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); setRows([]); return }
      setPending(!!j.pending); setRows(j.rows ?? []); setErr('')
    } catch { setErr('خطا در ارتباط با سرور'); setRows([]) }
  }, [status, q])
  useEffect(() => { load() }, [load])

  const cancel = async (b: B) => {
    setBusy(b.id)
    try {
      const r = await fetch(`/api/bookings/${b.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ reason: reason.trim() || 'لغو توسط ادمین' }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { alert(j?.message || 'لغو رزرو ممکن نشد'); return }
      setConfirm(null); setReason(''); await load()
    } finally { setBusy('') }
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <CalendarDays size={22} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>رزروها</h1>
        <span style={{ fontSize: 12, color: MUT }}>مشاهده و لغو رزرو با محاسبه‌ی خودکار بازپرداخت</span>
      </div>

      {/* جستجو + فیلتر */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی کد پیگیری…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 34px 10px 12px', borderRadius: 11, border: `1px solid ${LINE}`, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: INK }} />
        </div>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(([k, label]) => (
            <button key={k || 'all'} onClick={() => setStatus(k)}
              style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
                background: status === k ? INK : '#fff', color: status === k ? '#fff' : SEC, border: `1px solid ${status === k ? INK : LINE}` }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div style={{ padding: '12px 15px', borderRadius: 13, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD_D, fontSize: 12.5, fontWeight: 700, marginBottom: 14, lineHeight: 1.9 }}>
          جدول رزروها هنوز در دیتابیس ساخته نشده است (مایگریشن اجرا نشده).
        </div>
      )}

      {err && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <AlertCircle size={26} style={{ color: MUT }} />
          <p style={{ fontSize: 14, color: SEC, marginTop: 10 }}>{err}</p>
        </div>
      )}

      {rows === null && !err && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={26} style={{ color: MUT, animation: 'abspin 1s linear infinite' }} />
          <style>{`@keyframes abspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {rows && rows.length === 0 && !err && (
        <div style={{ textAlign: 'center', padding: '46px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16 }}>
          <CalendarDays size={30} style={{ color: MUT, opacity: 0.45, marginBottom: 10 }} />
          <p style={{ fontSize: 14.5, fontWeight: 800, color: INK, margin: 0 }}>رزروی با این فیلترها پیدا نشد</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(b => {
            const st = STATUS[b.booking_status] ?? STATUS.COMPLETED!
            const cancelled = b.booking_status === 'CANCELLED'
            return (
              <div key={b.id} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: INK }}>{b.clubName}</span>
                    <span style={{ fontSize: 10.5, color: st.color, background: st.bg, borderRadius: 20, padding: '3px 10px', fontWeight: 800 }}>{st.label}</span>
                    {b.payment_status === 'PAID' && <span style={{ fontSize: 10.5, color: FELT, background: 'rgba(14,122,56,0.08)', borderRadius: 20, padding: '3px 10px', fontWeight: 800 }}>پرداخت‌شده</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12.5, color: MUT, lineHeight: 2 }}>
                    <span>{faDate(b.bookingDate)}</span>
                    <span>{faTimeRange(b.timeSlots)}</span>
                    <span>{b.userName}{b.userPhone ? ` — ${toFaDigits(b.userPhone)}` : ''}</span>
                    {b.booking_reference && <span style={{ direction: 'ltr', fontFamily: 'monospace' }}>{b.booking_reference}</span>}
                  </div>
                  {cancelled && Number(b.refund_amount) > 0 && (
                    <div style={{ fontSize: 11.5, color: FELT, marginTop: 5 }}>
                      بازپرداخت: {faNum(b.refund_amount)} تومان{b.refund_status ? ` (${b.refund_status === 'COMPLETED' ? 'انجام‌شده' : 'در انتظار'})` : ''}
                    </div>
                  )}
                  {cancelled && b.cancellation_reason && (
                    <div style={{ fontSize: 11.5, color: MUT, marginTop: 4 }}>دلیل: {b.cancellation_reason}</div>
                  )}
                </div>

                <div style={{ textAlign: 'left', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                    {faNum(b.final_amount)} <span style={{ fontSize: 11, color: MUT, fontWeight: 600 }}>تومان</span>
                  </div>
                  {b.canCancel && (
                    <button onClick={() => { setConfirm(b); setReason('') }} disabled={busy === b.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: RED }}>
                      <X size={12} /> لغو رزرو
                    </button>
                  )}
                  {b.refundPreview && b.canCancel && (
                    <div style={{ fontSize: 10.5, color: MUT }}>
                      بازگشت: {toFaDigits(b.refundPreview.refundPercent)}٪
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── پنجره‌ی تأیید لغو ── */}
      {confirm && (
        <div onClick={() => !busy && setConfirm(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={e => e.stopPropagation()} dir="rtl"
            style={{ width: '100%', maxWidth: 400, maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 20, border: `1px solid ${LINE}`, padding: 22, textAlign: 'center', fontFamily: 'var(--font-base)' }}>
            <span style={{ display: 'inline-flex', width: 54, height: 54, borderRadius: 17, background: 'rgba(178,59,46,0.09)', color: RED, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <AlertTriangle size={25} />
            </span>
            <h3 style={{ fontSize: 16.5, fontWeight: 900, color: INK, margin: '0 0 8px' }}>لغو رزرو</h3>
            <p style={{ fontSize: 13, color: SEC, margin: '0 0 14px', lineHeight: 2 }}>
              رزرو <b>{confirm.clubName}</b> برای <b>{confirm.userName}</b> در تاریخ <b>{faDate(confirm.bookingDate)}</b>،
              ساعت <b>{faTimeRange(confirm.timeSlots)}</b> لغو شود؟
            </p>

            {confirm.refundPreview ? (
              <div style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14, marginBottom: 12, textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: MUT, marginBottom: 8 }}>{confirm.refundPreview.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: SEC }}>مبلغ بازگشتی به کاربر</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: FELT, fontVariantNumeric: 'tabular-nums' }}>
                    {faNum(confirm.refundPreview.refundAmount)} <span style={{ fontSize: 11, color: MUT }}>تومان</span>
                  </span>
                </div>
                {!confirm.inCancelWindow && (
                  <div style={{ fontSize: 11, color: GOLD_D, marginTop: 8, fontWeight: 700, lineHeight: 1.9 }}>
                    مهلت لغو کاربر گذشته است؛ این لغو با اختیار ادمین انجام می‌شود.
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: MUT, margin: '0 0 12px' }}>این رزرو پرداخت نشده است؛ مبلغی بازگردانده نمی‌شود.</p>
            )}

            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="دلیل لغو (اختیاری)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 12, textAlign: 'right' }} />

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
                {busy ? <Loader2 size={15} style={{ animation: 'abspin 1s linear infinite' }} /> : <CheckCircle2 size={15} />} تأیید لغو
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => load()} title="به‌روزرسانی"
        style={{ position: 'fixed', bottom: 22, insetInlineStart: 22, width: 44, height: 44, borderRadius: '50%', border: `1px solid ${LINE}`, background: '#fff', color: SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(28,27,23,0.10)' }}>
        <RotateCcw size={17} />
      </button>
    </div>
  )
}
