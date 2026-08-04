'use client'

/* ─────────────────────────────────────────────────────────────
   برندهای بیلیارد بازار.

   تا امروز برند متنِ آزاد بود: «Predator»، «predator» و «پریداتور»
   سه برندِ جدا می‌شدند، پس فیلترِ برند هرگز کامل نبود.

   فروشنده همچنان می‌تواند برندی بنویسد که در فهرست نیست — بازارِ
   دستِ‌دومِ بیلیارد پر از برندِ محلی است و اجبار به فهرست یعنی همه
   «متفرقه» را می‌زنند. آن برندها این‌جا **غیرفعال** ظاهر می‌شوند تا
   شما تأیید یا نادیده‌شان بگیرید.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Plus, Loader2, Check, EyeOff, Save } from 'lucide-react'
import { useAuthStore } from '../../../store/auth.store'
import { apiFetch } from '../../../lib/http'
import { toFaDigits } from '../../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD: React.CSSProperties = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18,
  padding: 'clamp(18px,2.4vw,26px)', marginBottom: 18,
}
const INPUT: React.CSSProperties = {
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 13px',
  fontSize: 13, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 10, cursor: 'pointer',
  border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
  fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '9px 15px',
}

interface Brand {
  id: string
  slug: string
  name: string
  is_active: boolean
  sort_order: number
}

export default function AdminBrandsPage() {
  const router = useRouter()
  const { user, _hydrated } = useAuthStore()

  const [brands, setBrands] = useState<Brand[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2400) }

  const load = useCallback(async () => {
    try {
      /* `all=1` ⇒ برندهای تأییدنشده هم می‌آیند. سرور خودش ادمین‌بودن
         را بررسی می‌کند؛ این پارامتر برای غیرادمین ۴۰۳ می‌دهد. */
      const r = await apiFetch('/api/market/brands?all=1', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); setBrands([]); return }
      setBrands(j.brands ?? [])
      setErr('')
    } catch { setErr('خطا در ارتباط با سرور'); setBrands([]) }
  }, [])

  useEffect(() => {
    if (!_hydrated) return
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return }
    void load()
  }, [_hydrated, user, load, router])

  const add = async () => {
    const name = newName.trim()
    if (name.length < 2) { setErr('نام برند کوتاه است'); return }
    setAdding(true); setErr('')
    try {
      const r = await apiFetch('/api/market/brands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ثبت برند انجام نشد'); return }
      setNewName('')
      flash(j?.existed ? 'این برند از قبل وجود داشت' : 'برند اضافه شد')
      await load()
    } catch { setErr('خطا در ارتباط با سرور') } finally { setAdding(false) }
  }

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    setBusy(id); setErr('')
    try {
      const r = await apiFetch('/api/market/brands', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'ویرایش انجام نشد'); return }
      await load(); flash(msg)
    } catch { setErr('خطا در ارتباط با سرور') } finally { setBusy('') }
  }

  if (!_hydrated) return null
  if (!user || user.primaryRole !== 'admin') return null

  const list = brands ?? []
  /* برندهای پیشنهادیِ فروشنده‌ها بالا می‌آیند — کارِ روی میز است */
  const suggested = list.filter(b => !b.is_active)
  const active = list.filter(b => b.is_active)

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)', padding: 'clamp(14px,2.5vw,28px)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <Tag size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>برندهای بازار</h1>
        {suggested.length > 0 && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#B7791F', background: 'rgba(183,121,31,0.10)', borderRadius: 20, padding: '4px 11px' }}>
            {toFaDigits(suggested.length)} پیشنهاد تازه
          </span>
        )}
      </div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 18px' }}>
        فروشنده می‌تواند برندی بنویسد که در فهرست نیست؛ آن برند این‌جا «پیشنهاد تازه» می‌شود.
        تا وقتی فعالش نکنید، در کشوی ثبت آگهی به کسی نشان داده نمی‌شود — ولی آگهیِ ثبت‌شده
        برندش را از دست نمی‌دهد.
      </p>

      {err && (
        <div style={{ ...CARD, background: 'rgba(178,59,46,0.05)', borderColor: 'rgba(178,59,46,0.24)', color: RED, fontSize: 13, fontWeight: 700, padding: '12px 16px' }}>
          {err}
        </div>
      )}

      {/* افزودن */}
      <section style={{ ...CARD, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input style={{ ...INPUT, flex: 1, minWidth: 200, background: '#fff' }}
          value={newName} onChange={e => { setNewName(e.target.value); setErr('') }}
          onKeyDown={e => { if (e.key === 'Enter') void add() }}
          placeholder="نام برند تازه — مثلاً Kamui" />
        <button type="button" onClick={() => void add()} disabled={adding} style={BTN}>
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} افزودن
        </button>
      </section>

      {brands === null ? (
        <div style={{ ...CARD, display: 'flex', gap: 9, alignItems: 'center', color: MUT }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>در حال بارگذاری…</span>
        </div>
      ) : (
        <>
          {suggested.length > 0 && (
            <section style={CARD}>
              <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: '0 0 12px' }}>
                پیشنهادهای فروشنده‌ها
              </h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {suggested.map(b => (
                  <Row key={b.id} b={b} busy={busy === b.id} onPatch={patch} />
                ))}
              </div>
            </section>
          )}

          <section style={CARD}>
            <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: '0 0 12px' }}>
              برندهای فعال ({toFaDigits(active.length)})
            </h2>
            {active.length === 0 ? (
              <p style={{ fontSize: 13, color: MUT, margin: 0 }}>هنوز برندی فعال نیست.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {active.map(b => (
                  <Row key={b.id} b={b} busy={busy === b.id} onPatch={patch} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {toast && (
        <div style={{
          position: 'fixed', insetInlineStart: 20, bottom: 20, zIndex: 60,
          background: INK, color: '#fff', borderRadius: 12, padding: '11px 18px',
          fontSize: 13, fontWeight: 700,
        }}>{toast}</div>
      )}
    </div>
  )
}

function Row({ b, busy, onPatch }: {
  b: Brand
  busy: boolean
  onPatch: (id: string, body: Record<string, unknown>, msg: string) => Promise<void>
}) {
  const [name, setName] = useState(b.name)
  const [order, setOrder] = useState(String(b.sort_order))
  useEffect(() => { setName(b.name); setOrder(String(b.sort_order)) }, [b.name, b.sort_order])
  const changed = name.trim() !== b.name || Number(order) !== b.sort_order

  return (
    <div style={{
      display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap',
      border: `1px solid ${LINE}`, borderRadius: 12, padding: '9px 12px',
      background: b.is_active ? '#fff' : 'rgba(183,121,31,0.04)',
    }}>
      <input style={{ ...INPUT, flex: 1, minWidth: 150, background: '#fff' }}
        value={name} onChange={e => setName(e.target.value)} />
      <span style={{ fontSize: 10.5, color: MUT, background: 'rgba(0,0,0,0.04)', borderRadius: 20, padding: '2px 8px', direction: 'ltr' }}>
        {b.slug}
      </span>
      <input style={{ ...INPUT, width: 72, textAlign: 'center', background: '#fff' }}
        value={order} onChange={e => setOrder(e.target.value.replace(/[^0-9]/g, ''))}
        title="ترتیب — کوچک‌تر بالاتر" />

      {changed && (
        <button type="button" disabled={busy}
          onClick={() => void onPatch(b.id, { name: name.trim(), sortOrder: Number(order) || 0 }, 'ذخیره شد')}
          style={{ ...BTN, padding: '7px 12px' }}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} ذخیره
        </button>
      )}

      <button type="button" disabled={busy}
        onClick={() => void onPatch(b.id, { isActive: !b.is_active }, b.is_active ? 'غیرفعال شد' : 'فعال شد')}
        style={{
          ...BTN, padding: '7px 12px',
          background: b.is_active ? 'rgba(14,122,56,0.10)' : '#fff',
          borderColor: b.is_active ? 'rgba(14,122,56,0.32)' : LINE,
          color: b.is_active ? FELT : SEC,
        }}>
        {b.is_active ? <><Check size={13} /> فعال</> : <><EyeOff size={13} /> غیرفعال</>}
      </button>
    </div>
  )
}
