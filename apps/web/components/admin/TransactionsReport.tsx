'use client'

/* ─────────────────────────────────────────────────────────────
   گزارشِ تراکنش‌به‌تراکنش — پایه‌ی گزارشِ مالیاتی.

   ── چرا این کامپوننت ساخته شد ──
   مسیرِ `/api/admin/finance/transactions` از مدت‌ها پیش کامل و درست
   نوشته شده بود (فیلترِ تاریخ، باشگاه، نوع و منبع، صفحه‌بندی، و
   خروجیِ CSV با BOM برای اکسلِ فارسی) — و **هیچ صفحه‌ای صدایش
   نمی‌زد**. فقط فایل‌های تست. یعنی حسابدار راهی برای گرفتنِ گزارش
   نداشت، در حالی که خودِ گزارش آماده بود.

   `/finance/timeline?booking=<id>` هم همین وضع را داشت؛ این‌جا با
   کلیک روی هر ردیفِ رزرو باز می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { Loader2, Download, AlertCircle, Clock3 } from 'lucide-react'
import { LEDGER_SHORT, LEDGER_TYPES } from '../../lib/finance/labels'
import TransactionTimeline from './TransactionTimeline'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
const GOLD_D = '#8F6531', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')
const faDateTime = (iso?: unknown) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
    }).format(new Date(String(iso)))
  } catch { return '—' }
}

const PAGE = 100

interface Tx {
  id: string; created_at: string; type: string; amount: number
  club_id: string | null; club_name: string | null; source: string
  booking_id: string | null; payment_id: string | null; source_key: string | null
  platform_revenue: number; club_share: number; gross_in: number; refunded_out: number
}

export default function TransactionsReport({ from, to }: { from: string; to: string }) {
  const [rows, setRows] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [type, setType] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dl, setDl] = useState(false)
  const [err, setErr] = useState('')
  /* پیامِ مربوط به دانلود — جدا از `err` که کلِ جدول را جایگزین می‌کند */
  const [note, setNote] = useState('')
  const [timeline, setTimeline] = useState<string | null>(null)

  const qs = useCallback((extra?: Record<string, string>) => {
    const p = new URLSearchParams()
    if (from && to) { p.set('from', from); p.set('to', to) }
    if (type) p.set('type', type)
    if (source) p.set('source', source)
    p.set('limit', String(PAGE))
    p.set('offset', String(page * PAGE))
    for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v)
    return p.toString()
  }, [from, to, type, source, page])

  /* ── چرا گاردِ `alive` ──
     تغییرِ فیلتر دو درخواست می‌ساخت (یکی با `page`ی قدیمی، یکی بعد از
     ریست‌شدنِ صفحه) و هیچ ترتیبی تضمین نبود؛ پاسخِ کندتر برنده می‌شد و
     جدول با فیلترِ قبلی پر می‌ماند. حالا فقط آخرین درخواست می‌نشیند.
     ریستِ صفحه هم داخلِ خودِ setterها انجام می‌شود، نه در یک effectِ
     جدا که یک رفت‌وبرگشتِ اضافه می‌ساخت. */
  useEffect(() => {
    let alive = true
    setLoading(true)
    apiFetch(`/api/admin/finance/transactions?${qs()}`, { cache: 'no-store' })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!alive) return
        if (!r.ok) { setErr(j?.message || 'گزارش خوانده نشد'); setLoading(false); return }
        setRows(j.transactions ?? []); setTotal(Number(j.total) || 0)
        setTotals(j.pageTotals ?? {}); setErr(''); setLoading(false)
      })
      .catch(() => { if (alive) { setErr('خطا در ارتباط با سرور'); setLoading(false) } })
    return () => { alive = false }
  }, [qs])

  /* بازه از بیرون عوض شد ⇒ برگرد به صفحه‌ی اول، وگرنه کاربر «خالی»
     می‌بیند در حالی که فقط از انتهای فهرستِ تازه رد شده. */
  useEffect(() => { setPage(0) }, [from, to])

  const csv = async () => {
    /* ── چرا `apiFetch` و نه `window.open` ──
       `window.open` کوکی را می‌برد ولی از مسیرِ تازه‌سازیِ نشستِ
       `apiFetch` رد می‌شود؛ بعد از چند دقیقه بی‌کاری حسابدار به‌جای
       فایل یک تبِ سفید با «دسترسی مجاز نیست» می‌گرفت. */
    setDl(true)
    try {
      /* ⚠️ پیامِ دانلود **نباید** در `err` بنشیند: شاخه‌ی خطا پیش از
         جدول رندر می‌شود، پس یک خروجیِ موفقِ ولی بریده، کلِ جدول را با
         صفحه‌ی خطا جایگزین می‌کرد. */
      const r = await apiFetch(`/api/admin/finance/transactions?${qs({ format: 'csv' })}`, { cache: 'no-store' })
      if (!r.ok) { setNote('خروجی ساخته نشد'); return }
      setNote(r.headers.get('X-Truncated') === '1'
        ? `خروجی روی ${Number(r.headers.get('X-Rows-Exported') || 0).toLocaleString('fa-IR')} ردیف بسته شد؛ بازه را کوچک‌تر کنید.`
        : '')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `billiardhub-financial-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { setNote('خطا در ساخت خروجی') } finally { setDl(false) }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE))

  return (
    <div>
      <div className="tr-bar">
        <select aria-label="نوع تراکنش" value={type} className="tr-sel"
          onChange={e => { setPage(0); setType(e.target.value) }}>
          <option value="">همه‌ی انواع</option>
          {LEDGER_TYPES.map(t => <option key={t} value={t}>{LEDGER_SHORT[t]}</option>)}
        </select>
        <select aria-label="منبع تراکنش" value={source} className="tr-sel"
          onChange={e => { setPage(0); setSource(e.target.value) }}>
          <option value="">همه‌ی منابع</option>
          <option value="reservation">رزرو میز</option>
          <option value="tournament">مسابقات</option>
        </select>
        <button type="button" onClick={csv} className="tr-csv" disabled={dl || loading}>
          {dl ? <Loader2 size={14} style={{ animation: 'trspin 1s linear infinite' }} /> : <Download size={14} />}
          {dl ? 'در حال ساخت…' : 'خروجی اکسل (CSV)'}
        </button>
        <span className="tr-count">{fa(total)} ردیف</span>
      </div>

      {note && <p role="status" className="tr-note">{note}</p>}

      {/* جمعِ همین صفحه — عمدا «جمع کل» نوشته نمی‌شود چون صفحه‌بندی
          دارد و ادعای غلط بدتر از نبودنِ عدد است. */}
      <div className="tr-sums">
        <Sum label="ورودی ناخالص" v={totals.grossIn} />
        <Sum label="درآمد پلتفرم" v={totals.platformRevenue} tone="gold" />
        <Sum label="سهم باشگاه‌ها" v={totals.clubShare} tone="felt" />
        <Sum label="بازپرداخت" v={totals.refunded} muted />
        <span className="tr-sums-n">جمعِ این صفحه است، نه کل بازه</span>
      </div>

      {loading ? (
        <div style={{ padding: 50, textAlign: 'center' }}><Loader2 size={24} style={{ color: MUT, animation: 'trspin 1s linear infinite' }} /></div>
      ) : err ? (
        <div style={{ padding: 40, textAlign: 'center', color: SEC, fontSize: 13 }}>
          <AlertCircle size={22} style={{ color: MUT }} /><p>{err}</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: MUT, fontSize: 13 }}>
          در این بازه تراکنشی ثبت نشده است
        </div>
      ) : (
        <div className="tr-wrap">
          <table className="tr-t">
            <thead>
              <tr>{['تاریخ', 'نوع', 'منبع', 'باشگاه', 'مبلغ', 'درآمد ما', 'سهم باشگاه', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id}>
                  <td>{faDateTime(t.created_at)}</td>
                  <td><b>{LEDGER_SHORT[t.type] ?? t.type}</b></td>
                  <td>{t.source === 'tournament' ? 'مسابقه' : t.source === 'reservation' ? 'رزرو' : t.source}</td>
                  <td>{t.club_name ?? '—'}</td>
                  <td style={{ color: Number(t.amount) < 0 ? '#991B1B' : INK, fontWeight: 800 }}>{fa(t.amount)}</td>
                  <td style={{ color: GOLD_D }}>{Number(t.platform_revenue) ? fa(t.platform_revenue) : '—'}</td>
                  <td style={{ color: FELT }}>{Number(t.club_share) ? fa(t.club_share) : '—'}</td>
                  <td>
                    {t.booking_id && (
                      <button type="button" onClick={() => setTimeline(String(t.booking_id))}
                        className="tr-tl" aria-label="سیر تراکنش"><Clock3 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="tr-pg">
          <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>قبلی</button>
          <span>صفحه {fa(page + 1)} از {fa(pages)}</span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>بعدی</button>
        </div>
      )}

      {timeline && <TransactionTimeline bookingId={timeline} onClose={() => setTimeline(null)} />}

      <style>{`
        @keyframes trspin{to{transform:rotate(360deg)}}
        .tr-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
        .tr-sel{font-family:inherit;font-size:12.5px;font-weight:700;color:${SEC};
          background:#fff;border:1px solid ${LINE};border-radius:10px;padding:8px 12px;cursor:pointer}
        .tr-csv{display:inline-flex;align-items:center;gap:6px;font-family:inherit;font-size:12.5px;
          font-weight:800;color:#fff;background:${INK};border:1px solid ${INK};border-radius:10px;
          padding:8px 14px;cursor:pointer}
        .tr-csv:hover{opacity:.88}
        .tr-csv:disabled{opacity:.5;cursor:not-allowed}
        .tr-sel:focus-visible,.tr-csv:focus-visible,.tr-tl:focus-visible,
        .tr-pg button:focus-visible{outline:2px solid ${GOLD_D};outline-offset:2px}
        .tr-count{font-size:12px;color:${MUT};margin-inline-start:auto}
        .tr-note{font-size:12px;font-weight:700;color:#8A5A12;background:rgba(199,166,106,.12);
          border:1px solid rgba(199,166,106,.34);border-radius:10px;padding:9px 12px;margin:0 0 12px}
        .tr-sums{display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:11px 14px;
          background:${GROUND};border:1px solid ${LINE};border-radius:12px;margin-bottom:12px}
        .tr-sums-n{font-size:11px;color:${MUT};margin-inline-start:auto}
        .tr-wrap{overflow-x:auto;border:1px solid ${LINE};border-radius:12px;background:#fff}
        .tr-t{width:100%;border-collapse:collapse;font-size:12.5px}
        .tr-t th{text-align:start;font-weight:800;color:${SEC};padding:10px 12px;
          border-bottom:1px solid ${LINE};white-space:nowrap;background:${GROUND}}
        .tr-t td{padding:10px 12px;border-bottom:1px solid ${LINE};color:${INK};white-space:nowrap}
        .tr-t tr:last-child td{border-bottom:0}
        .tr-tl{display:inline-flex;padding:5px;border-radius:8px;border:1px solid ${LINE};
          background:#fff;color:${SEC};cursor:pointer}
        .tr-tl:hover{background:${GROUND}}
        .tr-pg{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px;
          font-size:12.5px;color:${SEC}}
        .tr-pg button{font-family:inherit;font-size:12.5px;font-weight:700;color:${SEC};background:#fff;
          border:1px solid ${LINE};border-radius:9px;padding:7px 14px;cursor:pointer}
        .tr-pg button:disabled{opacity:.42;cursor:not-allowed}
      `}</style>
    </div>
  )
}

function Sum({ label, v, tone, muted }: { label: string; v?: number; tone?: 'gold' | 'felt'; muted?: boolean }) {
  const c = tone === 'gold' ? GOLD_D : tone === 'felt' ? FELT : muted ? MUT : INK
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: MUT }}>{label}</span>
      <b style={{ fontSize: 13.5, color: c }}>{fa(v)}</b>
    </span>
  )
}
