'use client'

/* پنل مالی پلتفرم — نمای کلی، پرداخت‌ها، موجودی باشگاه‌ها، تسویه‌ها و بازپرداخت‌ها.
   همه‌ی داده‌ها از /api/admin/finance می‌آید (RBAC سمت سرور: فقط ادمین). */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../../lib/http'
import CommissionPanel from '../../../components/admin/CommissionPanel'
import {
  Wallet, TrendingUp, CreditCard, Landmark, RotateCcw, Loader2,
  ArrowDownToLine, CheckCircle2, AlertCircle, X,
} from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')
const faDate = (iso?: unknown) => { try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(String(iso))) } catch { return '—' } }

type Row = Record<string, unknown>
interface Data {
  overview: {
    /* پولی که وارد حسابِ مرکزی شده — این «درآمد» نیست */
    grossIn: number; bookingRevenue: number; tournamentRevenue: number
    /* درآمدِ واقعیِ پلتفرم */
    platformCommission: number; cancellationFee: number; netPlatformRevenue: number
    commissionFromReservations: number; commissionFromTournaments: number
    /* بدهی به باشگاه‌ها */
    clubEarnings: number; payableNow: number; inFlightSettlement: number
    completedSettlement: number; settledOut: number
    refunds: number; pendingRefunds: number; failedPayments: number
    /* اگر ناصفر باشد یعنی دفتر ناقص است */
    balanceCheck: number
  }
  payments: Row[]; clubBalances: Row[]; settlements: Row[]; refunds: Row[]
}
type TabKey = 'overview' | 'payments' | 'balances' | 'settlements' | 'refunds' | 'commission'

export default function AdminFinance() {
  const [d, setD] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<TabKey>('overview')
  const [busy, setBusy] = useState('')
  const [modal, setModal] = useState<{ id: string; amount: number } | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/admin/finance', { credentials: 'include', headers: { }, cache: 'no-store' })
      if (!r.ok) { setErr((await r.json().catch(() => ({})))?.message || 'دسترسی مجاز نیست'); setLoading(false); return }
      setD(await r.json()); setErr(''); setLoading(false)
    } catch { setErr('خطا در ارتباط با سرور'); setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const act = async (body: Record<string, unknown>, key: string) => {
    setBusy(key)
    try {
      const r = await apiFetch('/api/admin/settlements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) alert(j?.message || 'عملیات ناموفق بود')
      await load()
    } finally { setBusy('') }
  }

  if (loading) return <Center><Loader2 size={28} style={{ color: MUT, animation: 'afspin 1s linear infinite' }} /><style>{`@keyframes afspin{to{transform:rotate(360deg)}}`}</style></Center>
  if (err) return <Center><AlertCircle size={26} style={{ color: MUT }} /><p style={{ fontSize: 14, color: SEC, marginTop: 10 }}>{err}</p></Center>
  if (!d) return null

  const o = d.overview
  const TABS: [TabKey, string, number][] = [
    ['overview', 'نمای کلی', 0], ['payments', 'پرداخت‌ها', d.payments.length],
    ['balances', 'موجودی باشگاه‌ها', d.clubBalances.length], ['settlements', 'تسویه‌ها', d.settlements.length],
    ['refunds', 'بازپرداخت‌ها', d.refunds.length], ['commission', 'کمیسیون', 0],
  ]

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Wallet size={22} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>مالی</h1>
        <span style={{ fontSize: 12, color: MUT }}>ارقام از دفتر مالی محاسبه می‌شوند</span>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 }}>
        {TABS.map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
              background: tab === k ? INK : '#fff', color: tab === k ? '#fff' : SEC, border: `1px solid ${tab === k ? INK : LINE}` }}>
            {label}{n > 0 && <span style={{ fontSize: 10.5, opacity: .75 }}>({fa(n)})</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* ── تفکیکِ حیاتی ──
              «پولِ دریافتی» درآمدِ ما نیست. کاربر دو میلیون می‌دهد ولی
              درآمدِ پلتفرم فقط کمیسیون و جریمه است؛ بقیه بدهیِ ما به
              باشگاه است. نمایشِ ناخالص به‌عنوان درآمد، هم گزارشِ
              مالیاتی را غلط می‌کند هم تصمیم‌های کسب‌وکار را. */}
          <div style={{ fontSize: 12, color: SEC, marginBottom: 10, lineHeight: 1.9 }}>
            «وجوه دریافتی» پولی است که به حساب مرکزی آمده — درآمد پلتفرم نیست.
            درآمد واقعی ما کمیسیون و جریمه‌ی لغو است.
          </div>

          <div className="af-grid">
            <Stat label="وجوه دریافتی (ناخالص)" value={o.grossIn} icon={<TrendingUp size={15} />} strong />
            <Stat label="درآمد خالص پلتفرم" value={o.netPlatformRevenue} icon={<Wallet size={15} />} tone="gold" strong />
            <Stat label="بدهی به باشگاه‌ها (قابل تسویه)" value={o.payableNow} icon={<Landmark size={15} />} tone="felt" strong />
          </div>

          <div className="af-grid" style={{ marginTop: 12 }}>
            <Stat label="از رزرو" value={o.bookingRevenue} icon={<TrendingUp size={15} />} muted />
            <Stat label="از مسابقات" value={o.tournamentRevenue} icon={<TrendingUp size={15} />} muted />
            <Stat label="کمیسیون" value={o.platformCommission} icon={<Wallet size={15} />} />
            <Stat label="جریمه لغو" value={o.cancellationFee} icon={<Wallet size={15} />} />
            <Stat label="در انتظار تسویه" value={o.inFlightSettlement} icon={<ArrowDownToLine size={15} />} />
            <Stat label="تسویه‌شده" value={o.completedSettlement} icon={<CheckCircle2 size={15} />} />
            <Stat label="بازپرداخت‌ها" value={o.refunds} icon={<RotateCcw size={15} />} muted />
            <Stat label="بازپرداخت در انتظار" value={o.pendingRefunds} icon={<RotateCcw size={15} />} muted />
          </div>

          {/* ناوردا: اگر ناصفر شود یعنی جایی از دفتر ناقص است.
              بی‌صدا نگه‌داشتنش یعنی ماه‌ها بعد در حسابرسی معلوم شود. */}
          {o.balanceCheck !== 0 && (
            <div style={{
              marginTop: 14, padding: '12px 15px', borderRadius: 12,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.28)',
              fontSize: 12.5, fontWeight: 700, color: '#991B1B', lineHeight: 1.9,
            }}>
              ⚠ ناترازی دفتر: {fa(o.balanceCheck)} تومان.
              وجوه دریافتی باید برابر «کمیسیون + جریمه + سهم باشگاه‌ها + بازپرداخت» باشد.
              این اختلاف یعنی رویدادی در دفتر ثبت نشده — پیش از هر تسویه‌ای بررسی شود.
            </div>
          )}
        </>
      )}

      {tab === 'commission' && <CommissionPanel />}

      {tab === 'payments' && (
        <Table head={['شناسه', 'باشگاه', 'مبلغ', 'وضعیت', 'درگاه', 'تاریخ']}
          rows={d.payments.map(p => [
            <Mono key="i">{String(p.id).slice(0, 8)}</Mono>, String(p.clubName ?? '—'),
            <b key="a">{fa(p.amount)}</b>, <PayBadge key="s" s={String(p.status)} />, String(p.provider ?? '—'), faDate(p.created_at),
          ])} empty="هنوز پرداختی ثبت نشده است" />
      )}

      {tab === 'balances' && (
        <Table head={['باشگاه', 'قابل تسویه', 'در انتظار', 'کل درآمد', 'تسویه‌شده', '']}
          rows={d.clubBalances.map(b => [
            String(b.clubName ?? '—'), <b key="a" style={{ color: GOLD_D }}>{fa(b.available_balance)}</b>,
            fa(b.pending_balance), fa(b.total_earnings), fa(b.total_settled),
            Number(b.pending_balance) > 0
              ? <button key="btn" onClick={() => act({ action: 'create', clubId: b.club_id }, String(b.club_id))} disabled={busy === b.club_id}
                  style={btnPrimary}>{busy === b.club_id ? '…' : 'ایجاد تسویه'}</button>
              : <span key="btn" style={{ fontSize: 11.5, color: MUT }}>—</span>,
          ])} empty="هنوز باشگاهی درآمدی نداشته است" />
      )}

      {tab === 'settlements' && (
        <Table head={['باشگاه', 'مبلغ', 'شبا', 'وضعیت', 'پیگیری', 'تاریخ', '']}
          rows={d.settlements.map(s => [
            String(s.clubName ?? '—'), <b key="a">{fa(s.amount)}</b>,
            <Mono key="ib">{String(s.iban ?? '—')}</Mono>, <SettleBadge key="st" s={String(s.status)} />,
            s.reference_number ? <Mono key="rf">{String(s.reference_number)}</Mono> : '—',
            faDate(s.completed_at || s.requested_at),
            String(s.status) === 'COMPLETED' ? <span key="b" style={{ fontSize: 11.5, color: FELT }}>✓</span> : (
              <span key="b" style={{ display: 'inline-flex', gap: 6 }}>
                {String(s.status) === 'PENDING' && (
                  <button onClick={() => act({ action: 'process', id: s.id }, String(s.id))} disabled={busy === s.id} style={btnGhost}>شروع</button>
                )}
                <button onClick={() => setModal({ id: String(s.id), amount: Number(s.amount) })} style={btnPrimary}>ثبت واریز</button>
              </span>
            ),
          ])} empty="هنوز تسویه‌ای ایجاد نشده است" />
      )}

      {tab === 'refunds' && (
        <Table head={['رزرو', 'باشگاه', 'مبلغ', 'وضعیت', 'تاریخ']}
          rows={d.refunds.map(r => [
            <Mono key="b">{String(r.booking_id).slice(0, 8)}</Mono>, String(r.clubName ?? '—'),
            <b key="a">{fa(r.amount)}</b>, <SettleBadge key="s" s={String(r.status)} />, faDate(r.created_at),
          ])} empty="بازپرداختی ثبت نشده است" />
      )}

      {modal && <RefModal amount={modal.amount} onClose={() => setModal(null)}
        onSubmit={async ref => { await act({ action: 'complete', id: modal.id, reference: ref }, modal.id); setModal(null) }} />}

      <style>{`
        .af-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 900px) { .af-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .af-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}

/* ── اجزا ── */
const btnPrimary: React.CSSProperties = { padding: '6px 13px', borderRadius: 9, border: 'none', background: GOLD, color: '#241B08', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost: React.CSSProperties = { padding: '6px 12px', borderRadius: 9, border: `1px solid ${LINE}`, background: '#fff', color: SEC, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

const Center = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 70, textAlign: 'center' }}>{children}</div>
)
const Mono = ({ children }: { children: React.ReactNode }) => (
  <span style={{ direction: 'ltr', fontSize: 11.5, color: SEC }}>{children}</span>
)

function Stat({ label, value, icon, tone, strong, muted }: { label: string; value: number; icon: React.ReactNode; tone?: 'gold' | 'felt'; strong?: boolean; muted?: boolean }) {
  const color = tone === 'gold' ? GOLD_D : tone === 'felt' ? FELT : muted ? MUT : INK
  return (
    <div style={{ background: '#fff', border: `1px solid ${tone === 'gold' ? 'rgba(199,166,106,0.4)' : LINE}`, borderRadius: 18, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: MUT, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>{label}
      </div>
      <div style={{ fontSize: strong ? 24 : 20, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
        {fa(value)}<span style={{ fontSize: 11, fontWeight: 700, color: MUT, marginInlineStart: 5 }}>تومان</span>
      </div>
    </div>
  )
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '46px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 13.5, color: MUT, margin: 0 }}>{empty}</p>
    </div>
  )
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead>
          <tr>{head.map((h, i) => (
            <th key={i} style={{ textAlign: 'right', fontSize: 11.5, fontWeight: 800, color: MUT, padding: '12px 14px', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => (
              <td key={j} style={{ fontSize: 12.5, color: INK, padding: '12px 14px', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${LINE}`, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{c}</td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PayBadge = ({ s }: { s: string }) => {
  const map: Record<string, [string, string, string]> = {
    PAID: ['پرداخت‌شده', FELT, 'rgba(14,122,56,0.1)'],
    PENDING: ['در انتظار', GOLD_D, 'rgba(199,166,106,0.13)'],
    INITIATED: ['آغازشده', MUT, GROUND],
    FAILED: ['ناموفق', '#B23B2E', 'rgba(178,59,46,0.09)'],
    CANCELED: ['لغوشده', MUT, GROUND],
    REFUNDED: ['بازپرداخت', '#7C3AED', 'rgba(124,58,237,0.09)'],
  }
  const [t, c, bg] = map[s] ?? [s, MUT, GROUND]
  return <span style={{ fontSize: 11, fontWeight: 800, color: c, background: bg, borderRadius: 999, padding: '3px 10px' }}>{t}</span>
}

const SettleBadge = ({ s }: { s: string }) => {
  const map: Record<string, [string, string, string]> = {
    COMPLETED: ['انجام‌شده', FELT, 'rgba(14,122,56,0.1)'],
    PROCESSING: ['در حال انجام', GOLD_D, 'rgba(199,166,106,0.13)'],
    PENDING: ['در انتظار', GOLD_D, 'rgba(199,166,106,0.13)'],
    REQUESTED: ['درخواست‌شده', GOLD_D, 'rgba(199,166,106,0.13)'],
    FAILED: ['ناموفق', '#B23B2E', 'rgba(178,59,46,0.09)'],
  }
  const [t, c, bg] = map[s] ?? [s, MUT, GROUND]
  return <span style={{ fontSize: 11, fontWeight: 800, color: c, background: bg, borderRadius: 999, padding: '3px 10px' }}>{t}</span>
}

function RefModal({ amount, onClose, onSubmit }: { amount: number; onClose: () => void; onSubmit: (ref: string) => void }) {
  const [ref, setRef] = useState('')
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, border: `1px solid ${LINE}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <CreditCard size={18} style={{ color: GOLD_D }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: INK, flex: 1 }}>ثبت واریز</span>
          <button onClick={onClose} style={{ background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 9, padding: 6, cursor: 'pointer', color: SEC, display: 'flex' }}><X size={15} /></button>
        </div>
        <p style={{ fontSize: 13, color: SEC, margin: '0 0 14px', lineHeight: 1.9 }}>
          مبلغ <b style={{ color: INK }}>{fa(amount)} تومان</b> واریز شد؟ شماره‌ی پیگیری بانکی را وارد کنید.
        </p>
        <input value={ref} onChange={e => setRef(e.target.value)} placeholder="شماره‌ی پیگیری"
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11, border: `1px solid ${LINE}`, background: GROUND, fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none', direction: 'ltr', textAlign: 'left' }} />
        <button onClick={() => ref.trim() && onSubmit(ref.trim())} disabled={!ref.trim()}
          style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, border: 'none', cursor: ref.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, background: ref.trim() ? FELT : '#EDE9E1', color: ref.trim() ? '#fff' : MUT }}>
          تأیید و نهایی‌سازی
        </button>
      </div>
    </div>
  )
}
