'use client'

/* مدیریت رزروها — فهرست، جستجو، فیلتر وضعیت و لغو رزرو با بازپرداخت.
   لغو از همان مسیر /api/bookings/[id]/cancel انجام می‌شود تا اثر مالی
   (بازپرداخت، دفتر کل، رکورد refund) دقیقا مثل لغو کاربر ثبت شود. */

import { useCallback, useEffect, useState } from 'react'
import { notify } from '../../../lib/ui/dialogs'
import TabStrip from '@/components/ui/TabStrip'
import ScrollList from '@/components/ui/ScrollList'
import { Button } from '@/components/ui/Button'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  CalendarDays, AlertCircle, Search, X, CheckCircle2, AlertTriangle, RotateCcw,
} from 'lucide-react'
import { faDate, faTimeRange, faNum, toFaDigits } from '../../../lib/jalali'
import CancellationPolicy from '../../../components/booking/CancellationPolicy'
import { apiFetch } from '../../../lib/http'

const MUT = '#6F6A5C'
const GOLD_D = '#8F6531', FELT = '#0E7A38', RED = '#B23B2E'

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
      const r = await apiFetch(url, { headers: { }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); setRows([]); return }
      setPending(!!j.pending); setRows(j.rows ?? []); setErr('')
    } catch { setErr('خطا در ارتباط با سرور'); setRows([]) }
  }, [status, q])
  useEffect(() => { load() }, [load])

  const cancel = async (b: B) => {
    setBusy(b.id)
    try {
      const r = await apiFetch(`/api/bookings/${b.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'لغو توسط ادمین' }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { notify(j?.message || 'لغو رزرو ممکن نشد'); return }
      setConfirm(null); setReason(''); await load()
    } finally { setBusy('') }
  }

  return (
    <main className="adm-page">
      <AdminHeader
        icon={<CalendarDays size={26} className="text-gold-text" aria-hidden />}
        title="رزروها"
        description="مشاهده و لغو رزرو با محاسبه‌ی خودکار بازپرداخت"
        actions={
          <button type="button" onClick={() => load()} aria-label="به‌روزرسانی"
            className="inline-flex size-11 items-center justify-center rounded-field border border-line/20 bg-surface text-ink-2 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
            <RotateCcw size={17} aria-hidden />
          </button>
        } />

      {/* جستجو + فیلتر: نوارِ تب ردیفِ خودش را دارد تا از عرضِ صفحه بیرون نزند */}
      <div className="grid gap-3">
        <div className="relative max-w-sm">
          <label htmlFor="bk-q" className="sr-only">جستجوی کد پیگیری</label>
          <Search size={14} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input id="bk-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی کد پیگیری…"
            className="h-11 w-full rounded-field border border-line/20 bg-surface pe-3 ps-9 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
        </div>
        <div className="min-w-0">
          <TabStrip value={status} onChange={setStatus} style={{ marginBottom: 0 }}
            tabs={FILTERS.map(([k, label]) => ({ key: k, label }))} />
        </div>
      </div>

      {pending && (
        <div role="note" className="rounded-card border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold leading-loose text-gold-text">
          جدول رزروها هنوز در دیتابیس ساخته نشده است (مایگریشن اجرا نشده)
        </div>
      )}

      {err && (
        <div role="alert" className="adm-card py-10 text-center">
          <AlertCircle size={26} className="mx-auto text-ink-3" aria-hidden />
          <p className="m-0 mt-2 text-sm text-ink-2">{err}</p>
        </div>
      )}

      {rows === null && !err && (
        <ul aria-busy="true" aria-label="در حال بارگذاری" className="m-0 grid list-none gap-3 p-0">
          {[0, 1, 2, 3].map(i => <li key={i} className="h-24 rounded-card border border-line/10 bg-surface motion-safe:animate-pulse" />)}
        </ul>
      )}

      {rows && rows.length === 0 && !err && (
        <div className="adm-card py-12 text-center">
          <CalendarDays size={30} className="mx-auto mb-3 text-ink-3" aria-hidden />
          <p className="m-0 text-sm font-semibold text-ink">رزروی با این فیلترها پیدا نشد</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ScrollList count={rows.length} min={5} gap={12}>
          {rows.map(b => {
            const st = STATUS[b.booking_status] ?? STATUS.COMPLETED!
            const cancelled = b.booking_status === 'CANCELLED'
            return (
              <article key={b.id} className="adm-card flex flex-wrap items-start gap-3">
                <div className="min-w-0 basis-60 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="adm-break m-0 text-sm font-semibold text-ink">{b.clubName}</h2>
                    {/* رنگِ وضعیت از جدولِ STATUS می‌آید (داده‌ی داینامیک) */}
                    <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                    {b.payment_status === 'PAID' && <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">پرداخت‌شده</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-loose text-ink-2">
                    <span>{faDate(b.bookingDate)}</span>
                    <span>{faTimeRange(b.timeSlots)}</span>
                    <span>{b.userName}{b.userPhone ? ` — ${toFaDigits(b.userPhone)}` : ''}</span>
                    {b.booking_reference && <span dir="ltr" className="adm-break font-mono">{b.booking_reference}</span>}
                  </div>
                  {cancelled && Number(b.refund_amount) > 0 && (
                    <div className="mt-2 text-xs text-success">
                      بازپرداخت: {faNum(b.refund_amount)} تومان{b.refund_status ? ` (${b.refund_status === 'COMPLETED' ? 'انجام‌شده' : 'در انتظار'})` : ''}
                    </div>
                  )}
                  {cancelled && b.cancellation_reason && (
                    <div className="mt-1 text-xs text-ink-2">دلیل: {b.cancellation_reason}</div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="text-sm font-semibold tabular-nums text-ink">
                    {faNum(b.final_amount)} <span className="text-xs font-normal text-ink-2">تومان</span>
                  </div>
                  {b.canCancel && (
                    <button type="button" onClick={() => { setConfirm(b); setReason('') }} disabled={busy === b.id}
                      className="inline-flex h-11 items-center gap-1 rounded-field border border-line/20 bg-surface px-3 text-xs font-semibold text-danger-ink hover:border-danger/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep disabled:opacity-50">
                      <X size={12} aria-hidden /> لغو رزرو
                    </button>
                  )}
                  {b.refundPreview && b.canCancel && (
                    <div className="text-xs text-ink-2">
                      بازگشت: {toFaDigits(b.refundPreview.refundPercent)}٪
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </ScrollList>
      )}

      {/* ── پنجره‌ی تأیید لغو ── */}
      {confirm && (
        <div onClick={() => !busy && setConfirm(null)} className="adm-modal-backdrop">
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bk-cancel-title"
            className="adm-modal text-center">
            <span className="mb-3 inline-flex size-14 items-center justify-center rounded-panel bg-danger/10 text-danger-ink">
              <AlertTriangle size={25} aria-hidden />
            </span>
            <h2 id="bk-cancel-title" className="m-0 mb-2 text-xl font-semibold text-ink">لغو رزرو</h2>
            <p className="m-0 mb-3 text-sm leading-loose text-ink-2">
              رزرو <b>{confirm.clubName}</b> برای <b>{confirm.userName}</b> در تاریخ <b>{faDate(confirm.bookingDate)}</b>،
              ساعت <b>{faTimeRange(confirm.timeSlots)}</b> لغو شود؟
            </p>

            {confirm.refundPreview ? (
              <div className="mb-3 rounded-card border border-line/15 bg-paper p-4 text-start">
                <div className="mb-2 text-xs text-ink-2">{confirm.refundPreview.label}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink-2">مبلغ بازگشتی به کاربر</span>
                  <span className="text-base font-semibold tabular-nums text-success">
                    {faNum(confirm.refundPreview.refundAmount)} <span className="text-xs font-normal text-ink-2">تومان</span>
                  </span>
                </div>
                {!confirm.inCancelWindow && (
                  <div className="mt-2 text-xs font-semibold leading-loose text-gold-text">
                    مهلت لغو کاربر گذشته است؛ این لغو با اختیار ادمین انجام می‌شود
                  </div>
                )}
              </div>
            ) : (
              <p className="m-0 mb-3 text-xs text-ink-2">این رزرو پرداخت نشده است؛ مبلغی بازگردانده نمی‌شود</p>
            )}

            <label htmlFor="bk-reason" className="sr-only">دلیل لغو (اختیاری)</label>
            <input id="bk-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="دلیل لغو (اختیاری)"
              className="mb-3 h-11 w-full rounded-field border border-line/20 bg-surface px-3 text-sm text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />

            <div className="mb-4 text-start">
              <CancellationPolicy compact />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirm(null)} disabled={!!busy}>
                انصراف
              </Button>
              <Button variant="danger" className="flex-1" loading={!!busy}
                icon={<CheckCircle2 size={15} aria-hidden />} onClick={() => cancel(confirm)}>
                تأیید لغو
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
