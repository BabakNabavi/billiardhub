'use client'

/* ─────────────────────────────────────────────────────────────
   نرخِ کمیسیون — قابلِ تغییر توسطِ ادمین، بدونِ دخالتِ برنامه‌نویس.

   دو زمینه‌ی مستقل: رزرو و مسابقه. برای هر باشگاه هم می‌شود نرخِ
   اختصاصی گذاشت که بر نرخِ سراسری اولویت دارد.

   نکته‌ای که در خودِ صفحه هم به ادمین گفته می‌شود: تغییرِ نرخ روی
   تراکنش‌های گذشته اثر ندارد. مبلغِ کمیسیون لحظه‌ی رزرو روی همان رزرو
   ثبت (snapshot) می‌شود، پس گزارشِ دیروز با نرخِ دیروز می‌ماند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { Percent, Loader2, Check, Trash2, AlertCircle, Plus } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'
const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')

interface Rule {
  id: string; scope: string; context: string; club_id: string | null
  type: string; value: number; is_active: boolean
  clubName?: string | null; updated_at?: string; created_at?: string
}
interface Club { id: string; name: string }

const CTX_LABEL: Record<string, string> = {
  RESERVATION: 'رزرو میز',
  TOURNAMENT: 'ثبت‌نام مسابقه',
}

export default function CommissionPanel() {
  const [active, setActive] = useState<Rule[]>([])
  const [history, setHistory] = useState<Rule[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})

  /* فرمِ نرخِ اختصاصیِ باشگاه */
  const [newClub, setNewClub] = useState('')
  const [newCtx, setNewCtx] = useState('RESERVATION')
  const [newVal, setNewVal] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiFetch('/api/admin/commission', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ ok: false, text: j?.message ?? 'خواندن نرخ‌ها انجام نشد' }); return }
      setActive(j.active ?? []); setHistory(j.history ?? []); setClubs(j.clubs ?? [])
      setDraft({})
    } catch { setMsg({ ok: false, text: 'خطا در ارتباط با سرور' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = async (body: Record<string, unknown>, key: string) => {
    setBusy(key); setMsg(null)
    try {
      const r = await apiFetch('/api/admin/commission', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ ok: false, text: j?.message ?? 'ثبت انجام نشد' }); return }
      setMsg({ ok: true, text: j.unchanged ? 'مقدار تغییری نکرد' : 'نرخ تازه ثبت شد' })
      await load()
    } catch { setMsg({ ok: false, text: 'خطا در ارتباط با سرور' }) }
    finally { setBusy('') }
  }

  const remove = async (id: string) => {
    setBusy(id); setMsg(null)
    try {
      const r = await apiFetch(`/api/admin/commission?id=${id}`, { method: 'DELETE' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ ok: false, text: j?.message ?? 'حذف انجام نشد' }); return }
      setMsg({ ok: true, text: 'نرخ اختصاصی برداشته شد — این باشگاه به نرخ سراسری برمی‌گردد' })
      await load()
    } catch { setMsg({ ok: false, text: 'خطا در ارتباط با سرور' }) }
    finally { setBusy('') }
  }

  const globals = active.filter(r => r.scope === 'GLOBAL')
  const perClub = active.filter(r => r.scope === 'CLUB')

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: 24 }}>
      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
    </div>
  )

  const card: React.CSSProperties = {
    background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, marginBottom: 12,
  }
  const input: React.CSSProperties = {
    width: 110, padding: '8px 10px', borderRadius: 9, border: `1px solid ${LINE}`,
    fontSize: 14, fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', background: '#FAFAFA',
  }
  const btn = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '8px 16px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
    fontFamily: 'inherit', cursor: on ? 'pointer' : 'not-allowed', opacity: on ? 1 : 0.5,
    border: '1px solid rgba(199,166,106,0.42)', background: 'rgba(199,166,106,0.14)', color: GOLD_D,
  })

  return (
    <div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 14px' }}>
        نرخ کمیسیون از همین‌جا تنظیم می‌شود و هیچ‌جای کد ثابت نیست.
        <b style={{ color: INK }}> تغییر نرخ روی تراکنش‌های گذشته اثر ندارد</b> — مبلغ کمیسیون
        لحظه‌ی رزرو روی همان رزرو ثبت می‌شود، پس گزارش‌های قبلی دست‌نخورده می‌مانند.
      </p>

      {msg && (
        <div style={{
          marginBottom: 12, padding: '10px 13px', borderRadius: 11, fontSize: 12.5, fontWeight: 700,
          background: msg.ok ? 'rgba(48,197,90,0.09)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${msg.ok ? 'rgba(48,197,90,0.28)' : 'rgba(239,68,68,0.26)'}`,
          color: msg.ok ? FELT : '#991B1B', lineHeight: 1.9,
        }}>{msg.text}</div>
      )}

      {/* ── نرخ سراسری ── */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, marginBottom: 8 }}>نرخ سراسری</div>
      {['RESERVATION', 'TOURNAMENT'].map(ctx => {
        const rule = globals.find(r => r.context === ctx)
        const key = `g-${ctx}`
        const val = draft[key] ?? String(rule?.value ?? '')
        const changed = rule ? Number(val) !== Number(rule.value) : val !== ''
        return (
          <div key={ctx} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{CTX_LABEL[ctx]}</div>
              <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }}>
                {rule ? `اکنون ${fa(rule.value)}٪` : 'تعریف نشده'}
              </div>
            </div>
            <input value={val} inputMode="decimal" style={input}
              onChange={e => setDraft(d => ({ ...d, [key]: e.target.value.replace(/[^0-9.]/g, '') }))} />
            <span style={{ fontSize: 13, color: SEC }}>درصد</span>
            <button disabled={!changed || busy === key} style={btn(changed && busy !== key)}
              onClick={() => void save({ context: ctx, scope: 'GLOBAL', type: 'PERCENTAGE', value: Number(val) }, key)}>
              {busy === key ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
              ذخیره
            </button>
            {/* نمونه‌ی محاسبه — عدد انتزاعی را ملموس می‌کند */}
            {val && Number(val) >= 0 && (
              <span style={{ fontSize: 11.5, color: MUT, marginRight: 'auto' }}>
                از هر ۱٬۰۰۰٬۰۰۰ تومان: {fa(1_000_000 * Number(val) / 100)} سهم ما،
                {' '}{fa(1_000_000 - 1_000_000 * Number(val) / 100)} سهم باشگاه
              </span>
            )}
          </div>
        )
      })}

      {/* ── نرخ اختصاصی باشگاه ── */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, margin: '18px 0 8px' }}>
        نرخ اختصاصی باشگاه
        <span style={{ fontSize: 11.5, fontWeight: 600, color: MUT, marginRight: 6 }}>
          (بر نرخ سراسری اولویت دارد)
        </span>
      </div>

      {perClub.map(r => (
        <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{r.clubName ?? '—'}</div>
            <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }}>{CTX_LABEL[r.context]}</div>
          </div>
          <b style={{ fontSize: 15, color: GOLD_D }}>{fa(r.value)}٪</b>
          <button disabled={busy === r.id} onClick={() => void remove(r.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 'auto',
              padding: '7px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#dc2626',
            }}><Trash2 size={12} /> برداشتن</button>
        </div>
      ))}

      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <select value={newClub} onChange={e => setNewClub(e.target.value)}
          style={{ ...input, width: 200, textAlign: 'right' }}>
          <option value="">انتخاب باشگاه…</option>
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={newCtx} onChange={e => setNewCtx(e.target.value)}
          style={{ ...input, width: 150, textAlign: 'right' }}>
          <option value="RESERVATION">رزرو میز</option>
          <option value="TOURNAMENT">ثبت‌نام مسابقه</option>
        </select>
        <input value={newVal} inputMode="decimal" placeholder="درصد" style={input}
          onChange={e => setNewVal(e.target.value.replace(/[^0-9.]/g, ''))} />
        <button disabled={!newClub || !newVal || busy === 'new'} style={btn(!!newClub && !!newVal && busy !== 'new')}
          onClick={() => void save({ context: newCtx, scope: 'CLUB', clubId: newClub, type: 'PERCENTAGE', value: Number(newVal) }, 'new')
            .then(() => { setNewClub(''); setNewVal('') })}>
          <Plus size={13} /> افزودن
        </button>
      </div>

      {/* ── تاریخچه ──
          تغییرِ نرخ بایگانی می‌شود، نه بازنویسی — تا بشود ثابت کرد در
          هر تاریخی نرخ چند بوده. */}
      {history.length > 0 && (
        <>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, margin: '18px 0 8px' }}>
            تاریخچه‌ی تغییرات
          </div>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {history.slice(0, 20).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderTop: i ? `1px solid ${LINE}` : 'none', fontSize: 12.5, color: SEC,
              }}>
                <span style={{ minWidth: 110, fontWeight: 700, color: INK }}>{CTX_LABEL[r.context] ?? r.context}</span>
                <span style={{ minWidth: 140 }}>{r.scope === 'GLOBAL' ? 'سراسری' : (r.clubName ?? 'باشگاه')}</span>
                <b>{fa(r.value)}٪</b>
                <span style={{ marginRight: 'auto', fontSize: 11.5, color: MUT }}>
                  {r.updated_at ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(r.updated_at)) : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!globals.length && (
        <div style={{
          marginTop: 12, padding: '11px 14px', borderRadius: 11,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.26)',
          fontSize: 12.5, fontWeight: 700, color: '#991B1B', display: 'flex', gap: 8,
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          هیچ نرخ سراسری‌ای تعریف نشده — کمیسیون صفر محاسبه می‌شود.
        </div>
      )}
    </div>
  )
}
