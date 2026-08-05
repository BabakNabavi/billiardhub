'use client'

/* نرخ کمیسیون — پنل مدیریت.

   API از قبل کامل بود (`/api/admin/commission`) ولی هیچ صفحه‌ای به آن
   وصل نبود، پس عملاً هیچ راهی برای دیدن یا عوض‌کردنِ نرخ وجود نداشت
   جز نوشتنِ مستقیم در دیتابیس.

   دو نکته که در متنِ صفحه هم گفته می‌شوند، چون تصمیمِ مالی بدونشان
   ریسک دارد:
     • نرخِ باشگاه بر نرخِ سراسری اولویت دارد.
     • تغییر نرخ روی رزروهای گذشته اثر ندارد؛ مبلغِ کمیسیون لحظه‌ی
       رزرو روی خودِ رزرو ثبت می‌شود. */

import { useCallback, useEffect, useState } from 'react'
import { Percent, Loader2, AlertCircle, Save, History, Info } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, faDate } from '../../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

interface Rule {
  id: string; context: string; scope: string; club_id: string | null
  clubName?: string | null; type: string; value: number
  is_active: boolean; created_at: string
}
interface Club { id: string; name: string }

const CONTEXT_FA: Record<string, string> = {
  RESERVATION: 'رزرو باشگاه',
  TOURNAMENT: 'ثبت‌نام مسابقه',
}
const fa = (n: unknown) => toFaDigits(Math.round(Number(n) || 0).toLocaleString('en-US'))

export default function AdminCommission() {
  const [rules, setRules] = useState<Rule[]>([])
  const [history, setHistory] = useState<Rule[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [form, setForm] = useState({
    context: 'RESERVATION', scope: 'GLOBAL', clubId: '',
    type: 'PERCENTAGE', value: '',
  })

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/admin/commission', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); return }
      setRules(j.active ?? []); setHistory(j.history ?? []); setClubs(j.clubs ?? []); setErr('')
    } catch { setErr('خطا در ارتباط با سرور') } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const save = async () => {
    const value = Number(String(form.value).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(value) || value < 0) { setErr('مقدار معتبر نیست'); return }
    if (form.type === 'PERCENTAGE' && value > 100) { setErr('درصد نمی‌تواند بیش از ۱۰۰ باشد'); return }
    if (form.scope === 'CLUB' && !form.clubId) { setErr('باشگاه را انتخاب کنید'); return }

    setBusy(true); setErr(''); setMsg('')
    try {
      const r = await apiFetch('/api/admin/commission', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: form.context, scope: form.scope,
          clubId: form.scope === 'CLUB' ? form.clubId : null,
          type: form.type, value,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ذخیره انجام نشد'); return }
      setMsg('نرخ تازه ثبت شد — روی رزروهای بعدی اعمال می‌شود')
      setForm(f => ({ ...f, value: '' }))
      await load()
    } catch { setErr('خطا در ارتباط با سرور') } finally { setBusy(false) }
  }

  const showRule = (r: Rule) =>
    r.type === 'PERCENTAGE' ? `${toFaDigits(r.value)}٪` : `${fa(r.value)} تومان`

  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}>
      <Loader2 size={22} className="animate-spin" style={{ color: MUT }} />
    </div>
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Percent size={20} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>نرخ کمیسیون</h1>
      </div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 16px', maxWidth: 700 }}>
        سهم پلتفرم از هر رزرو یا ثبت‌نام مسابقه. نرخِ اختصاصیِ یک باشگاه بر نرخِ سراسری اولویت دارد.
      </p>

      {/* ── نرخ‌های فعال ── */}
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', marginBottom: 20 }}>
        {rules.length === 0 ? (
          <div style={{
            border: `1px solid rgba(178,59,46,0.3)`, background: 'rgba(178,59,46,0.05)',
            borderRadius: 14, padding: '13px 16px', fontSize: 12.5, color: RED, lineHeight: 1.95,
          }}>
            هیچ نرخی فعال نیست — یعنی کمیسیون <b>صفر</b> است و کل مبلغ به باشگاه می‌رسد.
          </div>
        ) : rules.map(r => (
          <div key={r.id} style={{
            border: `1px solid ${LINE}`, borderRadius: 14, padding: '13px 15px', background: '#fff',
          }}>
            <div style={{ fontSize: 11.5, color: MUT, marginBottom: 4 }}>
              {CONTEXT_FA[r.context] ?? r.context}
              {r.scope === 'CLUB' ? ` — ${r.clubName ?? 'باشگاه'}` : ' — همه‌ی باشگاه‌ها'}
            </div>
            <div style={{ fontSize: 21, fontWeight: 900, color: GOLD_D, fontVariantNumeric: 'tabular-nums' }}>
              {showRule(r)}
            </div>
            <div style={{ fontSize: 11, color: MUT, marginTop: 5 }}>از {faDate(r.created_at)}</div>
          </div>
        ))}
      </div>

      {/* ── تغییر نرخ ── */}
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 17px', background: '#fff' }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, color: INK, margin: '0 0 13px' }}>ثبت نرخ تازه</h3>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))' }}>
          <Field label="مورد">
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} style={sel}>
              <option value="RESERVATION">رزرو باشگاه</option>
              <option value="TOURNAMENT">ثبت‌نام مسابقه</option>
            </select>
          </Field>

          <Field label="دامنه">
            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} style={sel}>
              <option value="GLOBAL">همه‌ی باشگاه‌ها</option>
              <option value="CLUB">یک باشگاه خاص</option>
            </select>
          </Field>

          {form.scope === 'CLUB' && (
            <Field label="باشگاه">
              <select value={form.clubId} onChange={e => setForm(f => ({ ...f, clubId: e.target.value }))} style={sel}>
                <option value="">انتخاب کنید…</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="نوع">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={sel}>
              <option value="PERCENTAGE">درصدی</option>
              <option value="FIXED_AMOUNT">مبلغ ثابت</option>
            </select>
          </Field>

          <Field label={form.type === 'PERCENTAGE' ? 'درصد' : 'مبلغ (تومان)'}>
            <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              inputMode="numeric" placeholder={form.type === 'PERCENTAGE' ? '۵' : '۱۰۰۰۰'}
              style={{ ...sel, textAlign: 'center' }} />
          </Field>
        </div>

        {err ? (
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', color: RED, fontSize: 12.5, marginTop: 12 }}>
            <AlertCircle size={15} /> {err}
          </div>
        ) : null}
        {msg ? (
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', color: FELT, fontSize: 12.5, marginTop: 12 }}>
            <Save size={15} /> {msg}
          </div>
        ) : null}

        <button onClick={() => void save()} disabled={busy || !form.value}
          style={{
            marginTop: 15, display: 'inline-flex', alignItems: 'center', gap: 7,
            border: '1px solid', borderColor: form.value ? 'rgba(199,166,106,0.34)' : LINE,
            background: form.value ? 'rgba(199,166,106,0.12)' : '#F7F6F2',
            color: form.value ? GOLD_D : MUT, borderRadius: 11, padding: '10px 20px',
            fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
            cursor: busy || !form.value ? 'not-allowed' : 'pointer',
          }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          ثبت نرخ
        </button>

        {/* ── هشدارِ لازم ──
            بدونِ این، طبیعی است که کسی فکر کند عوض‌کردنِ نرخ گزارشِ
            دیروز را هم عوض می‌کند. */}
        <p style={{
          display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14, paddingTop: 13,
          borderTop: `1px solid ${LINE}`, fontSize: 11.5, color: MUT, lineHeight: 2,
        }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 4 }} />
          نرخِ تازه فقط روی رزروهای <b style={{ color: SEC }}>بعدی</b> اثر دارد. کمیسیونِ هر رزرو
          همان لحظه روی خودش ثبت می‌شود، پس گزارش‌های مالیِ گذشته دست‌نخورده می‌مانند.
          نرخِ قبلی هم پاک نمی‌شود؛ به تاریخچه می‌رود.
        </p>
      </div>

      {/* ── تاریخچه ── */}
      {history.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowHistory(v => !v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${LINE}`,
            background: '#fff', color: SEC, borderRadius: 10, padding: '8px 14px',
            fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <History size={14} /> تاریخچه‌ی نرخ‌ها ({toFaDigits(history.length)})
          </button>

          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
              {history.map(r => (
                <div key={r.id} style={{
                  display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                  border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 13px',
                  fontSize: 12, color: MUT,
                }}>
                  <span style={{ fontWeight: 800, color: SEC }}>{showRule(r)}</span>
                  <span>{CONTEXT_FA[r.context] ?? r.context}</span>
                  <span>{r.scope === 'CLUB' ? (r.clubName ?? 'باشگاه') : 'همه‌ی باشگاه‌ها'}</span>
                  <span style={{ marginInlineStart: 'auto' }}>{faDate(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const sel: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`,
  borderRadius: 10, padding: '9px 11px', fontSize: 13,
  fontFamily: 'var(--font-base)', color: INK, outline: 'none', background: '#FCFBF8',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
