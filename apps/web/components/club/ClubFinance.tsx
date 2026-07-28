'use client'

/* بخشِ مالیِ داشبوردِ باشگاه — درآمد، موجودی، حسابِ بانکی و تسویه‌ها.
   داده‌ها فقط از /api/clubs/:id/finance می‌آیند (RBAC سمتِ سرور). */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import {
  Wallet, TrendingUp, Clock3, CheckCircle2, Landmark, ShieldCheck,
  AlertCircle, Loader2, ArrowDownToLine, Receipt, X,
} from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', GROUND = '#FAF8F3'
const fa = (n: number) => Math.round(Number(n) || 0).toLocaleString('fa-IR')

interface Finance {
  balance: { available: number; pending: number; totalEarnings: number; totalCommission: number; totalSettled: number }
  revenue: { today: number; week: number; month: number; total: number }
  bankAccount: { account_holder_name?: string; bank_name?: string; iban?: string; verification_status?: string; rejection_reason?: string } | null
  bookings: { today: number; upcoming: number; completed: number; cancelled: number; recent: Record<string, unknown>[] }
  settlements: Record<string, unknown>[]
}


export default function ClubFinance({ clubId }: { clubId: string }) {
  const [d, setD] = useState<Finance | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [bankOpen, setBankOpen] = useState(false)

  const load = useCallback(async () => {
    if (!clubId) return
    try {
      const r = await apiFetch(`/api/clubs/${clubId}/finance`, { credentials: 'include', headers: { }, cache: 'no-store' })
      if (!r.ok) { setErr((await r.json().catch(() => ({})))?.message || 'دریافتِ اطلاعاتِ مالی ممکن نشد'); setLoading(false); return }
      setD(await r.json()); setErr(''); setLoading(false)
    } catch { setErr('خطا در ارتباط با سرور'); setLoading(false) }
  }, [clubId])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: MUT }}><Loader2 size={26} style={{ animation: 'cfspin 1s linear infinite' }} /><style>{`@keyframes cfspin{to{transform:rotate(360deg)}}`}</style></div>
  if (err) return <Empty icon={<AlertCircle size={26} />} title="اطلاعاتِ مالی در دسترس نیست" desc={err} />
  if (!d) return null

  const bank = d.bankAccount
  const vs = bank?.verification_status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── درآمد ── */}
      <section>
        <Head icon={<TrendingUp size={17} style={{ color: FELT }} />} title="درآمد" />
        <div className="cf-grid">
          <Stat label="امروز" value={d.revenue.today} tone="felt" />
          <Stat label="این هفته" value={d.revenue.week} />
          <Stat label="این ماه" value={d.revenue.month} />
          <Stat label="کلِ درآمد" value={d.revenue.total} strong />
        </div>
      </section>

      {/* ── موجودی ── */}
      <section>
        <Head icon={<Wallet size={17} style={{ color: GOLD_D }} />} title="موجودی" />
        <div className="cf-grid">
          <Stat label="قابلِ تسویه" value={d.balance.available} tone="gold" strong />
          <Stat label="در انتظارِ تسویه" value={d.balance.pending} />
          <Stat label="تسویه‌شده" value={d.balance.totalSettled} />
          <Stat label="کمیسیونِ پلتفرم" value={d.balance.totalCommission} muted />
        </div>
      </section>

      {/* ── رزروها ── */}
      <section>
        <Head icon={<Clock3 size={17} style={{ color: SEC }} />} title="رزروها" />
        <div className="cf-grid">
          <Stat label="امروز" value={d.bookings.today} count />
          <Stat label="پیشِ‌رو" value={d.bookings.upcoming} count />
          <Stat label="انجام‌شده" value={d.bookings.completed} count />
          <Stat label="کنسل‌شده" value={d.bookings.cancelled} count muted />
        </div>
      </section>

      {/* ── حسابِ بانکی ── */}
      <section>
        <Head icon={<Landmark size={17} style={{ color: GOLD_D }} />} title="حسابِ بانکیِ تسویه"
          action={<button onClick={() => setBankOpen(true)} style={btnGhost}>{bank ? 'تغییرِ حساب' : 'ثبتِ حساب'}</button>} />
        <div style={card}>
          {!bank ? (
            <p style={{ fontSize: 13, color: MUT, margin: 0, lineHeight: 2 }}>
              برای دریافتِ تسویه، ابتدا شماره شبای خود را ثبت کنید. تا تأییدِ حساب، تسویه انجام نمی‌شود.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label="صاحبِ حساب" value={bank.account_holder_name || '—'} />
              <Row label="بانک" value={bank.bank_name || '—'} />
              <Row label="شماره شبا" value={bank.iban || '—'} mono />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
                <span style={{ fontSize: 12, color: MUT }}>وضعیت</span>
                <span style={{ marginInlineStart: 'auto', ...badge(vs) }}>
                  {vs === 'VERIFIED' ? <><ShieldCheck size={12} /> تأییدشده</> : vs === 'REJECTED' ? <><X size={12} /> رد شده</> : <><Clock3 size={12} /> در انتظارِ تأیید</>}
                </span>
              </div>
              {vs === 'REJECTED' && bank.rejection_reason && (
                <p style={{ fontSize: 12, color: '#B23B2E', margin: 0 }}>علت: {bank.rejection_reason}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── تسویه‌ها ── */}
      <section>
        <Head icon={<ArrowDownToLine size={17} style={{ color: FELT }} />} title="تسویه‌ها" />
        {d.settlements.length === 0 ? (
          <Empty icon={<Receipt size={24} />} title="هنوز تسویه‌ای انجام نشده" desc="پس از تأییدِ حسابِ بانکی، تسویه‌ها اینجا نمایش داده می‌شوند." />
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {d.settlements.map((s, i) => (
              <div key={String(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i ? `1px solid ${LINE}` : 'none', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{fa(Number(s.amount))} <span style={{ fontSize: 11, fontWeight: 700, color: MUT }}>تومان</span></span>
                <span style={settleBadge(String(s.status))}>{settleLabel(String(s.status))}</span>
                {!!s.reference_number && <span style={{ fontSize: 11, color: MUT, direction: 'ltr' }}>#{String(s.reference_number)}</span>}
                <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: MUT }}>{faDate(String(s.completed_at || s.requested_at))}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {bankOpen && <BankModal clubId={clubId} current={bank} onClose={() => setBankOpen(false)} onSaved={() => { setBankOpen(false); load() }} />}

      <style>{`
        .cf-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 860px) { .cf-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  )
}

/* ── اجزا ── */
const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16 }
const btnGhost: React.CSSProperties = { padding: '7px 14px', borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }

function Head({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
      {icon}<h3 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>{title}</h3>
      {action && <span style={{ marginInlineStart: 'auto' }}>{action}</span>}
    </div>
  )
}

function Stat({ label, value, tone, strong, muted, count }: { label: string; value: number; tone?: 'gold' | 'felt'; strong?: boolean; muted?: boolean; count?: boolean }) {
  const color = tone === 'gold' ? GOLD_D : tone === 'felt' ? FELT : muted ? MUT : INK
  return (
    <div style={{ background: '#fff', border: `1px solid ${tone === 'gold' ? 'rgba(199,166,106,0.4)' : LINE}`, borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ fontSize: 11.5, color: MUT, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: strong ? 21 : 18, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
        {fa(value)}{!count && <span style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginInlineStart: 4 }}>تومان</span>}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, color: MUT }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: INK, direction: mono ? 'ltr' : 'rtl' }}>{value}</span>
    </div>
  )
}

function Empty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
      <span style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 16, background: GROUND, color: MUT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{icon}</span>
      <p style={{ fontSize: 14.5, fontWeight: 800, color: INK, margin: '0 0 6px' }}>{title}</p>
      <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>{desc}</p>
    </div>
  )
}

const badge = (s?: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: '4px 11px',
  color: s === 'VERIFIED' ? FELT : s === 'REJECTED' ? '#B23B2E' : GOLD_D,
  background: s === 'VERIFIED' ? 'rgba(14,122,56,0.1)' : s === 'REJECTED' ? 'rgba(178,59,46,0.09)' : 'rgba(199,166,106,0.13)',
})
const settleBadge = (s: string): React.CSSProperties => ({
  fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px',
  color: s === 'COMPLETED' ? FELT : s === 'FAILED' ? '#B23B2E' : GOLD_D,
  background: s === 'COMPLETED' ? 'rgba(14,122,56,0.1)' : s === 'FAILED' ? 'rgba(178,59,46,0.09)' : 'rgba(199,166,106,0.13)',
})
const settleLabel = (s: string) => s === 'COMPLETED' ? 'واریز شد' : s === 'PROCESSING' ? 'در حالِ انجام' : s === 'FAILED' ? 'ناموفق' : 'در انتظار'
const faDate = (iso: string) => { try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(iso)) } catch { return '—' } }

/* ── مودالِ ثبت/تغییرِ حسابِ بانکی ── */
function BankModal({ clubId, current, onClose, onSaved }: { clubId: string; current: Finance['bankAccount']; onClose: () => void; onSaved: () => void }) {
  const [holder, setHolder] = useState(current?.account_holder_name || '')
  const [bankName, setBankName] = useState(current?.bank_name || '')
  const [iban, setIban] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    const clean = iban.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!holder.trim()) { setMsg('نامِ صاحبِ حساب را وارد کنید'); return }
    if (!/^IR\d{24}$/.test(clean)) { setMsg('شماره شبا باید با IR شروع شود و ۲۴ رقم داشته باشد'); return }
    setBusy(true); setMsg('')
    try {
      const r = await apiFetch(`/api/clubs/${clubId}/bank-account`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountHolderName: holder.trim(), bankName, iban: clean }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg(j?.message || 'ثبت ناموفق بود'); setBusy(false); return }
      onSaved()
    } catch { setMsg('خطا در ارتباط با سرور'); setBusy(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, border: `1px solid ${LINE}`, boxShadow: '0 30px 70px rgba(20,18,14,0.28)', overflow: 'hidden' }}>
        <div style={{ padding: '15px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Landmark size={18} style={{ color: GOLD_D }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: INK, flex: 1 }}>حسابِ بانکیِ تسویه</span>
          <button onClick={onClose} style={{ background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 9, padding: 7, cursor: 'pointer', color: SEC, display: 'flex' }}><X size={15} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="نامِ صاحبِ حساب" value={holder} onChange={setHolder} placeholder="مطابقِ کارتِ بانکی" />
          <Field label="نامِ بانک" value={bankName} onChange={setBankName} placeholder="مثلاً ملت" />
          <Field label="شماره شبا" value={iban} onChange={v => setIban(v.toUpperCase())} placeholder="IR000000000000000000000000" ltr />
          <p style={{ fontSize: 11.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
            پس از ثبت، حساب در وضعیتِ «در انتظارِ تأیید» قرار می‌گیرد و تسویه فقط پس از تأییدِ مدیرِ پلتفرم انجام می‌شود.
          </p>
          {msg && <p style={{ fontSize: 12.5, fontWeight: 700, color: '#B23B2E', margin: 0 }}>{msg}</p>}
          <button onClick={save} disabled={busy}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, background: GOLD, color: '#241B08' }}>
            {busy ? <Loader2 size={16} style={{ animation: 'cfspin 1s linear infinite' }} /> : <CheckCircle2 size={16} />} ثبتِ حساب
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, ltr }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; ltr?: boolean }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11, border: `1px solid ${LINE}`, background: GROUND, fontSize: 13.5, fontFamily: 'inherit', color: INK, outline: 'none', direction: ltr ? 'ltr' : 'rtl', textAlign: ltr ? 'left' : 'right' }} />
    </label>
  )
}
