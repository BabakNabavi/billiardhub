'use client'

import { useEffect, useState } from 'react'
import { ask } from '../../../lib/ui/dialogs'
import { Save, Power, Loader2, Plus, Trash2, Package } from 'lucide-react'
import { toFaDigits } from '../../../lib/jalali'
import Select from '../../../components/ui/Select'
import { INK, SEC, MUT, LINE, GOLD_D, FELT, RED, CARD, INPUT, LABEL, BTN, MODE_FA, Placement, Plan, fa, digits } from './shared'

/* ── پلن‌های قیمت‌گذاری: ساخت، ویرایش، جابه‌جایی، حذف ────────── */
export function PlansSection({ plans, placements, onChanged, flash, call }: {
  plans: Plan[]; placements: Placement[]
  onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState('')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({
    name: '', description: '', placementKey: '', price: '', durationDays: '30', adQuantity: '1', creditAmount: '1', badge: '',
  })

  const create = async () => {
    if (!draft.name.trim()) { flash('نام پلن لازم است'); return }
    setBusy('new')
    try {
      const ok = await call('POST', {
        type: 'plan', name: draft.name, description: draft.description,
        placementKey: draft.placementKey || undefined,
        price: Number(draft.price) || 0, durationDays: Number(draft.durationDays) || 30,
        adQuantity: Number(draft.adQuantity) || 0, creditAmount: Number(draft.creditAmount) || 0,
        badge: draft.badge,
      })
      if (ok) {
        setDraft({ name: '', description: '', placementKey: '', price: '', durationDays: '30', adQuantity: '1', creditAmount: '1', badge: '' })
        setOpen(false); await onChanged(); flash('پلن ساخته شد')
      }
    } finally { setBusy('') }
  }

  /* گروه‌بندی بر اساس جایگاه تا پله‌های مدت هر جایگاه کنار هم باشند */
  const groups: { key: string; title: string; items: Plan[] }[] = []
  for (const p of placements) {
    const items = plans.filter(x => x.placementKey === p.key)
    if (items.length) groups.push({ key: p.key, title: p.title, items })
  }
  const general = plans.filter(x => !x.placementKey || !placements.some(p => p.key === x.placementKey))
  if (general.length) groups.push({ key: '', title: 'پلن‌های عمومی آگهی (بدون جایگاه)', items: general })

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
        <Package size={17} style={{ color: GOLD_D }} />
        <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>پلن‌های قیمت‌گذاری</h2>
        <button onClick={() => setOpen(o => !o)} style={{ ...BTN, marginInlineStart: 'auto', padding: '7px 13px', fontSize: 12 }}>
          <Plus size={13} /> پلن تازه
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 1.95 }}>
        قیمت‌ها از دیتابیس خوانده می‌شوند، نه از کد، هر جایگاه می‌تواند چند پله‌ی مدت داشته باشد
        (مثلا ۷ روزه، ۳۰ روزه، ۳ ماهه)، پلنی که سفارش ثبت‌شده دارد حذف نمی‌شود و فقط غیرفعال می‌گردد
      </p>

      {open && (
        <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: 15, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>نام پلن *</label>
              <input style={INPUT} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="مثلا بنر کناری راست — ۳۰ روزه" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>جایگاه</label>
              <Select value={draft.placementKey} ariaLabel="جایگاه پلن"
                options={[{ value: '', label: 'بدون جایگاه (پلن عمومی آگهی)' },
                  ...placements.map(p => ({ value: p.key, label: p.title, hint: MODE_FA[p.mode] }))]}
                onChange={v => setDraft(d => ({ ...d, placementKey: v }))} />
            </div>
            <div><label style={LABEL}>قیمت (تومان)</label>
              <input style={INPUT} inputMode="numeric"
                value={draft.price ? toFaDigits(Number(draft.price).toLocaleString('en-US')) : ''}
                onChange={e => setDraft(d => ({ ...d, price: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>مدت (روز)</label>
              <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(draft.durationDays)}
                onChange={e => setDraft(d => ({ ...d, durationDays: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>تعداد آگهی</label>
              <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(draft.adQuantity)}
                onChange={e => setDraft(d => ({ ...d, adQuantity: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>اعتبار</label>
              <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(draft.creditAmount)}
                onChange={e => setDraft(d => ({ ...d, creditAmount: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>برچسب</label>
              <input style={INPUT} value={draft.badge} onChange={e => setDraft(d => ({ ...d, badge: e.target.value }))}
                placeholder="مثلا پرمیوم" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>توضیح</label>
              <input style={INPUT} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></div>
          </div>
          <button onClick={create} disabled={busy === 'new'} style={{ ...BTN, marginTop: 14 }}>
            {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساخت پلن
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 14 }}>هنوز پلنی تعریف نشده است</p>
      ) : groups.map(g => (
        <div key={g.key || 'general'} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: SEC, marginBottom: 8 }}>{g.title}</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {g.items.map(p => (
              <PlanRow key={p.id} p={p} placements={placements} onChanged={onChanged} flash={flash} call={call} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/* ── ردیف پلن قیمت ─────────────────────────────────────────── */
function PlanRow({ p, placements, onChanged, flash, call }: {
  p: Plan; placements: Placement[]
  onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState(false)
  const [price, setPrice] = useState(String(p.price))
  const [qty, setQty] = useState(String(p.adQuantity))
  const [days, setDays] = useState(String(p.durationDays))
  const [credit, setCredit] = useState(String(p.creditAmount))
  useEffect(() => {
    setPrice(String(p.price)); setQty(String(p.adQuantity))
    setDays(String(p.durationDays)); setCredit(String(p.creditAmount))
  }, [p.price, p.adQuantity, p.durationDays, p.creditAmount])

  const changed = Number(price) !== p.price || Number(qty) !== p.adQuantity
    || Number(days) !== p.durationDays || Number(credit) !== p.creditAmount

  const save = async (body: Record<string, unknown>) => {
    setBusy(true)
    try { if (await call('PATCH', { planId: p.id, ...body })) { await onChanged(); flash('ذخیره شد') } }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (!(await ask(`پلن «${p.name}» حذف شود؟`, { body: 'اگر سفارشی داشته باشد فقط غیرفعال می‌شود' }))) return
    setBusy(true)
    try {
      const r = await call('DELETE', undefined, `?plan=${p.id}`)
      if (r) { await onChanged(); flash(r.deactivated ? 'سفارش داشت؛ غیرفعال شد' : 'پلن حذف شد') }
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-end', flexWrap: 'wrap', border: `1px solid ${LINE}`, borderRadius: 13, padding: '12px 14px', opacity: p.isActive ? 1 : 0.6 }}>
      <div style={{ minWidth: 150, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{p.name}</span>
          {p.badge && <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '2px 8px' }}>{p.badge}</span>}
          {!p.isActive && <span style={{ fontSize: 10.5, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '2px 8px' }}>غیرفعال</span>}
        </div>
        <div style={{ fontSize: 11.5, color: MUT, marginTop: 4, lineHeight: 1.85 }}>
          {p.adQuantity === 0 ? 'طبق سهمیه‌ی نقش' : `${fa(p.adQuantity)} آگهی`} · اعتبار {fa(p.durationDays)} روز
          {p.creditAmount > 0 ? ` · ${fa(p.creditAmount)} اعتبار` : ''}
          {p.description ? ` · ${p.description}` : ''}
        </div>
        <div style={{ marginTop: 7, maxWidth: 260 }}>
          <Select compact value={p.placementKey ?? ''} ariaLabel={`جایگاه ${p.name}`}
            options={[{ value: '', label: 'بدون جایگاه (عمومی)' },
              ...placements.map(x => ({ value: x.key, label: x.title }))]}
            onChange={v => void save({ placementKey: v })} />
        </div>
      </div>
      <div style={{ width: 84 }}>
        <label style={LABEL}>تعداد</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(qty)} onChange={e => setQty(digits(e.target.value))} />
      </div>
      <div style={{ width: 84 }}>
        <label style={LABEL}>اعتبار</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(credit)} onChange={e => setCredit(digits(e.target.value))} />
      </div>
      <div style={{ width: 84 }}>
        <label style={LABEL}>مدت</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(days)} onChange={e => setDays(digits(e.target.value))} />
      </div>
      <div style={{ width: 140 }}>
        <label style={LABEL}>قیمت (تومان)</label>
        <input style={INPUT} inputMode="numeric" value={price ? toFaDigits(Number(price).toLocaleString('en-US')) : '۰'}
          onChange={e => setPrice(digits(e.target.value))} />
      </div>
      <button onClick={() => void save({ price: Number(price) || 0, adQuantity: Number(qty) || 0, durationDays: Number(days) || 30, creditAmount: Number(credit) || 0 })}
        disabled={busy || !changed}
        style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
      </button>
      <button onClick={() => void save({ isActive: !p.isActive })} disabled={busy} style={{
        ...BTN,
        background: p.isActive ? 'rgba(0,0,0,0.04)' : 'rgba(14,122,56,0.10)',
        borderColor: p.isActive ? LINE : 'rgba(14,122,56,0.32)',
        color: p.isActive ? SEC : FELT,
      }}>
        <Power size={14} /> {p.isActive ? 'غیرفعال کن' : 'فعال کن'}
      </button>
      <button onClick={() => void remove()} disabled={busy} title="حذف"
        style={{ ...BTN, padding: '9px 11px', background: 'rgba(178,59,46,0.08)', borderColor: 'rgba(178,59,46,0.28)', color: RED }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
