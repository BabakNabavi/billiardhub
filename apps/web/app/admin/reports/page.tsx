'use client'

/* گزارش‌های تخلف — بررسیِ گزارشِ کاربران درباره‌ی آگهی‌ها و محتوا.
   ادمین می‌تواند وضعیت را عوض کند و یادداشت بگذارد. */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Flag, Loader2, AlertCircle, ExternalLink, CheckCircle2, XCircle, Eye, RotateCcw } from 'lucide-react'
import { faDateTime, toFaDigits } from '../../../lib/jalali'
import { apiFetch } from '../../../lib/http'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

interface R {
  id: string; target_type: string; target_id: string; target_title?: string | null; target_url?: string | null
  reason_code: string; reason_label: string; details?: string | null
  reporter_id?: string | null; reporter_name?: string | null; reporter_phone?: string | null
  status: string; admin_note?: string | null; created_at: string
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:      { label: 'بررسی‌نشده', color: RED,    bg: 'rgba(178,59,46,0.08)' },
  REVIEWING: { label: 'در حال بررسی', color: GOLD_D, bg: 'rgba(199,166,106,0.13)' },
  RESOLVED:  { label: 'رسیدگی شد',   color: FELT,   bg: 'rgba(14,122,56,0.09)' },
  REJECTED:  { label: 'رد شد',       color: MUT,    bg: 'rgba(0,0,0,0.05)' },
}
const TARGET_LABEL: Record<string, string> = {
  product: 'آگهی بیلیارد بازار', club: 'باشگاه', user: 'کاربر', media: 'ویدیو', ad: 'تبلیغ',
}
const FILTERS: [string, string][] = [
  ['OPEN', 'بررسی‌نشده'], ['REVIEWING', 'در حال بررسی'], ['RESOLVED', 'رسیدگی‌شده'], ['REJECTED', 'رد شده'], ['', 'همه'],
]

export default function AdminReports() {
  const [rows, setRows] = useState<R[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState('OPEN')
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(false)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/admin/reports?status=${encodeURIComponent(status)}`, {
        headers: { }, cache: 'no-store',
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); setRows([]); return }
      setRows(j.rows ?? []); setCounts(j.counts ?? {}); setPending(!!j.pending); setErr('')
    } catch { setErr('خطا در ارتباط با سرور'); setRows([]) }
  }, [status])
  useEffect(() => { load() }, [load])

  const update = async (id: string, next: string) => {
    setBusy(id)
    try {
      const r = await apiFetch('/api/admin/reports', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next, adminNote: note[id] ?? '' }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { alert(j?.message || 'به‌روزرسانی انجام نشد'); return }
      await load()
    } finally { setBusy('') }
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Flag size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>گزارش‌های تخلف</h1>
        {counts.OPEN ? (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: RED, background: 'rgba(178,59,46,0.08)', borderRadius: 20, padding: '4px 11px' }}>
            {toFaDigits(counts.OPEN)} گزارش بررسی‌نشده
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {FILTERS.map(([k, label]) => (
          <button key={k || 'all'} onClick={() => setStatus(k)}
            style={{ flexShrink: 0, padding: '8px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
              background: status === k ? INK : '#fff', color: status === k ? '#fff' : SEC, border: `1px solid ${status === k ? INK : LINE}` }}>
            {label}
          </button>
        ))}
      </div>

      {pending && (
        <div style={{ padding: '12px 15px', borderRadius: 13, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD_D, fontSize: 12.5, fontWeight: 700, marginBottom: 14, lineHeight: 1.9 }}>
          جدول گزارش‌ها هنوز در دیتابیس ساخته نشده است (مایگریشن ۰۰۳ اجرا نشده).
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
          <Loader2 size={26} style={{ color: MUT, animation: 'arspin 1s linear infinite' }} />
          <style>{`@keyframes arspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {rows && rows.length === 0 && !err && (
        <div style={{ textAlign: 'center', padding: '46px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16 }}>
          <Flag size={28} style={{ color: MUT, opacity: 0.4, marginBottom: 10 }} />
          <p style={{ fontSize: 14.5, fontWeight: 800, color: INK, margin: 0 }}>گزارشی در این وضعیت وجود ندارد</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(r => {
            const st = STATUS[r.status] ?? STATUS.OPEN!
            return (
              <div key={r.id} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '15px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: INK }}>{r.reason_label}</span>
                  <span style={{ fontSize: 10.5, color: st.color, background: st.bg, borderRadius: 20, padding: '3px 10px', fontWeight: 800 }}>{st.label}</span>
                  <span style={{ fontSize: 11, color: MUT }}>{TARGET_LABEL[r.target_type] ?? r.target_type}</span>
                  <span style={{ marginInlineStart: 'auto', fontSize: 11, color: MUT }}>{faDateTime(r.created_at)}</span>
                </div>

                <div style={{ fontSize: 13, color: SEC, lineHeight: 2, marginBottom: 8 }}>
                  {r.target_title && <div>مورد: <b style={{ color: INK }}>{r.target_title}</b></div>}
                  {r.details && <div style={{ color: MUT }}>توضیح گزارش‌دهنده: {r.details}</div>}
                  <div style={{ fontSize: 11.5, color: MUT }}>
                    گزارش‌دهنده: {r.reporter_name || (r.reporter_id ? 'کاربر ثبت‌نام‌شده' : 'مهمان')}
                    {r.reporter_phone ? ` — ${toFaDigits(r.reporter_phone)}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {r.target_type === 'product' && (
                    <Link href={`/shop/${r.target_id}`} target="_blank"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, textDecoration: 'none', fontSize: 11.5, fontWeight: 800, background: '#FAF8F3', border: `1px solid ${LINE}`, color: SEC }}>
                      <ExternalLink size={12} /> دیدن آگهی
                    </Link>
                  )}
                  {r.status !== 'REVIEWING' && (
                    <button onClick={() => update(r.id, 'REVIEWING')} disabled={busy === r.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: GOLD_D }}>
                      <Eye size={12} /> در حال بررسی
                    </button>
                  )}
                  {r.status !== 'RESOLVED' && (
                    <button onClick={() => update(r.id, 'RESOLVED')} disabled={busy === r.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, background: 'rgba(14,122,56,0.08)', border: '1px solid rgba(14,122,56,0.24)', color: FELT }}>
                      {busy === r.id ? <Loader2 size={12} style={{ animation: 'arspin 1s linear infinite' }} /> : <CheckCircle2 size={12} />} رسیدگی شد
                    </button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <button onClick={() => update(r.id, 'REJECTED')} disabled={busy === r.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, background: '#fff', border: `1px solid ${LINE}`, color: MUT }}>
                      <XCircle size={12} /> رد گزارش
                    </button>
                  )}
                  <input value={note[r.id] ?? r.admin_note ?? ''} onChange={e => setNote(p => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="یادداشت ادمین"
                    style={{ flex: '1 1 160px', minWidth: 140, padding: '8px 12px', borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 12, fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => load()} title="به‌روزرسانی"
        style={{ position: 'fixed', bottom: 22, insetInlineStart: 22, width: 44, height: 44, borderRadius: '50%', border: `1px solid ${LINE}`, background: '#fff', color: SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(28,27,23,0.10)' }}>
        <RotateCcw size={17} />
      </button>
    </div>
  )
}
