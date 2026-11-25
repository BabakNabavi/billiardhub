'use client'

import { useEffect, useState } from 'react'
import { Save, Power, Loader2, Plus, Check } from 'lucide-react'
import { toFaDigits } from '../../../lib/jalali'
import Select from '../../../components/ui/Select'
import { INK, SEC, MUT, LINE, GOLD_D, FELT, RED, INPUT, LABEL, BTN, MODE_OPTS, ROTATION_OPTS, Mode, Rotation, Placement, fa, digits } from './shared'

/* ── ردیف جایگاه — Active و Mode مستقل ─────────────────────── */
/* ── ساخت جایگاه تازه ──────────────────────────────────────────
   تا مهاجرت ۰۵۶ کلید هر جایگاه در کد هاردکد بود و هر جایگاه تازه یک
   دیپلوی می‌خواست. جایگاه ساخته‌شده عمدا خاموش و «دستی» متولد می‌شود:
   جایگاهی که همان لحظه روی سایت ظاهر شود یعنی اشتباه تایپی مستقیم به
   بازدیدکننده می‌رسد. */
const ROLE_OPTS = [
  { key: 'club_owner', fa: 'باشگاه‌دار' },
  { key: 'seller', fa: 'فروشنده' },
  { key: 'manufacturer', fa: 'تولیدکننده' },
  { key: 'coach', fa: 'مربی' },
  { key: 'referee', fa: 'داور' },
]
const KIND_OPTS = [
  { value: 'banner' as const, label: 'بنر تصویری' },
  { value: 'video' as const, label: 'ویدیو (پیش‌پخش)' },
  { value: 'entity' as const, label: 'موجودیت (کارت محصول/باشگاه/فروشگاه)' },
]
/* مسابقه و ویدیو برای «محتوای اسپانسری» — نوع تازه‌ی تبلیغ نیستند،
   همان جایگاه موجودیتی‌اند با جدول منبع متفاوت. */
const ENTITY_OPTS = [
  { value: 'product' as const, label: 'محصول' },
  { value: 'club' as const, label: 'باشگاه' },
  { value: 'seller' as const, label: 'فروشگاه' },
  { value: 'tournament' as const, label: 'مسابقه (اسپانسری)' },
  { value: 'video' as const, label: 'ویدیو (اسپانسری)' },
]
type EntityOpt = typeof ENTITY_OPTS[number]['value']

export function NewPlacement({ onDone, flash, call }: {
  onDone: () => Promise<void> | void
  flash: (m: string) => void
  call: (m: string, b?: Record<string, unknown>, q?: string) => Promise<Record<string, unknown> | null>
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [kind, setKind] = useState<'banner' | 'video' | 'entity'>('banner')
  const [entity, setEntity] = useState<EntityOpt>('product')
  const [cap, setCap] = useState('1')
  const [dims, setDims] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [approval, setApproval] = useState(true)
  const [err, setErr] = useState('')

  const reset = () => {
    setKey(''); setTitle(''); setDesc(''); setKind('banner'); setEntity('product')
    setCap('1'); setDims(''); setRoles([]); setApproval(true); setErr('')
  }

  const submit = async () => {
    if (!/^[a-z][a-z0-9_]{2,48}$/.test(key.trim())) {
      setErr('کلید باید با حرف کوچک انگلیسی شروع شود و فقط حرف کوچک، رقم و زیرخط داشته باشد')
      return
    }
    if (!title.trim()) { setErr('عنوان لازم است'); return }
    setBusy(true); setErr('')
    try {
      const r = await call('POST', {
        type: 'placement',
        key: key.trim(), title: title.trim(), description: desc.trim() || null,
        contentKind: kind, entityType: kind === 'entity' ? entity : null,
        capacity: Number(cap) || 1,
        dimensions: dims.trim() || null,
        advertiserRoles: roles, approvalRequired: approval,
      })
      if (r) { flash('جایگاه ساخته شد — خاموش است تا خودتان روشنش کنید'); reset(); setOpen(false); await onDone() }
    } finally { setBusy(false) }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        style={{ ...BTN, marginTop: 12, alignSelf: 'flex-start' }}>
        <Plus size={14} /> جایگاه جدید
      </button>
    )
  }

  return (
    <div style={{ marginTop: 12, border: `1px dashed ${LINE}`, borderRadius: 14, padding: 15, background: '#FAFAF7' }}>
      <div style={{ fontSize: 13.5, fontWeight: 900, color: INK, marginBottom: 12 }}>جایگاه جدید</div>

      <div style={{ display: 'grid', gap: 11, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        <div>
          <label style={LABEL}>کلید (لاتین، در URL می‌آید)</label>
          <input style={{ ...INPUT, background: '#fff', direction: 'ltr', textAlign: 'left' }}
            value={key} onChange={e => { setKey(e.target.value.toLowerCase()); setErr('') }}
            placeholder="sponsored_tournament" />
        </div>
        <div>
          <label style={LABEL}>عنوان</label>
          <input style={{ ...INPUT, background: '#fff' }} value={title}
            onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="اسپانسر مسابقات" />
        </div>
        <div>
          <label style={LABEL}>نوع محتوا</label>
          <Select value={kind} options={KIND_OPTS} ariaLabel="نوع محتوا"
            onChange={v => setKind(v)} />
        </div>
        {kind === 'entity' && (
          <div>
            <label style={LABEL}>نوع موجودیت</label>
            <Select value={entity} options={ENTITY_OPTS} ariaLabel="نوع موجودیت"
              onChange={v => setEntity(v)} />
          </div>
        )}
        <div>
          <label style={LABEL}>ظرفیت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric"
            value={fa(cap)} onChange={e => setCap(digits(e.target.value))} title="۰ = بی‌سقف" />
        </div>
        <div>
          <label style={LABEL}>ابعاد پیشنهادی</label>
          <input style={{ ...INPUT, background: '#fff' }} value={dims}
            onChange={e => setDims(e.target.value)} placeholder="۳۰۰×۶۰۰ پیکسل" />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={LABEL}>توضیح (به خریدار نشان داده می‌شود)</label>
        <input style={{ ...INPUT, background: '#fff' }} value={desc}
          onChange={e => setDesc(e.target.value)} placeholder="کجا دیده می‌شود و چه مخاطبی دارد" />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={LABEL}>چه نقشی می‌تواند بخرد</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {ROLE_OPTS.map(r => {
            const on = roles.includes(r.key)
            return (
              <button key={r.key} type="button"
                onClick={() => setRoles(s => on ? s.filter(x => x !== r.key) : [...s, r.key])}
                style={{
                  ...BTN, padding: '6px 12px', fontSize: 12,
                  background: on ? 'rgba(14,122,56,0.10)' : '#fff',
                  borderColor: on ? 'rgba(14,122,56,0.32)' : LINE,
                  color: on ? FELT : SEC,
                }}>
                {on && <Check size={12} />} {r.fa}
              </button>
            )
          })}
        </div>
        {roles.length === 0 && (
          <div style={{ fontSize: 10.5, color: '#B7791F', marginTop: 5, lineHeight: 1.7 }}>
            بدون نقش، این جایگاه برای هیچ‌کس قابل خرید نیست — فقط خودتان می‌توانید رویش کمپین بگذارید
          </div>
        )}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={approval} onChange={e => setApproval(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: GOLD_D }} />
        <span style={{ fontSize: 12, color: SEC }}>کمپین‌های این جایگاه پیش از نمایش بازبینی شوند</span>
      </label>

      {err && (
        <div style={{ fontSize: 11.5, color: RED, marginTop: 10, lineHeight: 1.8 }}>{err}</div>
      )}

      <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
        <button type="button" onClick={() => void submit()} disabled={busy} style={BTN}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ساخت
        </button>
        <button type="button" onClick={() => { reset(); setOpen(false) }} style={{ ...BTN, background: '#fff' }}>
          انصراف
        </button>
      </div>
    </div>
  )
}

export function PlacementRow({ p, busy, campaignCount, onPatch }: {
  p: Placement; busy: boolean; campaignCount: number
  onPatch: (key: string, body: Record<string, unknown>) => Promise<void>
}) {
  const [cap, setCap] = useState(String(p.capacity))
  const [price, setPrice] = useState(String(p.price))
  const [days, setDays] = useState(String(p.durationDays))
  const [shown, setShown] = useState(String(p.displayCount))
  const [prio, setPrio] = useState(String(p.priority))
  /* جایگاه ویدیویی: خالی یعنی `null` — «رد کردن ممکن نیست» /
     «سقف مدت ندارد» — که با صفر یکی نیست. */
  const isVideo = p.contentKind === 'video'
  const [skip, setSkip] = useState(p.skipAfterSec === null ? '' : String(p.skipAfterSec))
  const [maxDur, setMaxDur] = useState(p.maxDurationSec === null ? '' : String(p.maxDurationSec))
  useEffect(() => {
    setCap(String(p.capacity)); setPrice(String(p.price)); setDays(String(p.durationDays))
    setShown(String(p.displayCount)); setPrio(String(p.priority))
    setSkip(p.skipAfterSec === null ? '' : String(p.skipAfterSec))
    setMaxDur(p.maxDurationSec === null ? '' : String(p.maxDurationSec))
  }, [p.capacity, p.price, p.durationDays, p.displayCount, p.priority, p.skipAfterSec, p.maxDurationSec])

  const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s) || 0)

  const changed = Number(cap) !== p.capacity || Number(price) !== p.price || Number(days) !== p.durationDays
    || Number(shown) !== p.displayCount || Number(prio) !== p.priority
    || (isVideo && (numOrNull(skip) !== p.skipAfterSec || numOrNull(maxDur) !== p.maxDurationSec))

  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 15, opacity: p.isActive ? 1 : 0.72, background: '#FAFAF7' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{p.title}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '2px 8px', direction: 'ltr' }}>{p.key}</span>
            {campaignCount > 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: FELT, background: 'rgba(14,122,56,0.09)', borderRadius: 20, padding: '2px 8px' }}>
                {fa(campaignCount)} کمپین فعال
              </span>
            )}
          </div>
          {p.description && <div style={{ fontSize: 11.5, color: MUT, marginTop: 4, lineHeight: 1.85 }}>{p.description}</div>}
        </div>

        {/* دو کنترل مستقل: وضعیت و حالت */}
        <button onClick={() => onPatch(p.key, { isActive: !p.isActive })} disabled={busy} style={{
          ...BTN,
          background: p.isActive ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
          borderColor: p.isActive ? 'rgba(14,122,56,0.32)' : LINE,
          color: p.isActive ? FELT : SEC,
        }}>
          <Power size={14} /> {p.isActive ? 'فعال' : 'غیرفعال'}
        </button>
        <div style={{ width: 118 }}>
          <Select<Mode> compact value={p.mode} options={MODE_OPTS} ariaLabel={`حالت ${p.title}`}
            onChange={m => void onPatch(p.key, { mode: m })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 92 }}>
          <label style={LABEL}>ظرفیت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(cap)}
            onChange={e => setCap(digits(e.target.value))} />
          {Number(cap) === 0 && (
            <div style={{ fontSize: 10.5, color: RED, marginTop: 4, lineHeight: 1.6 }}>
              با ظرفیت صفر چیزی نمایش داده نمی‌شود
            </div>
          )}
        </div>
        <div style={{ width: 100 }}>
          <label style={LABEL}>تعداد نمایش</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(shown)}
            onChange={e => setShown(digits(e.target.value))} title="۰ = به‌اندازه‌ی ظرفیت" />
          {Number(shown) > Number(cap) && Number(cap) >= 0 && (
            <div style={{ fontSize: 10.5, color: '#B7791F', marginTop: 4, lineHeight: 1.6 }}>
              بیش از ظرفیت است؛ عملا {fa(cap)} نمایش داده می‌شود
            </div>
          )}
        </div>
        <div style={{ width: 138 }}>
          <label style={LABEL}>چرخش</label>
          <Select<Rotation> compact value={p.rotationMode} options={ROTATION_OPTS} ariaLabel={`چرخش ${p.title}`}
            onChange={r => void onPatch(p.key, { rotationMode: r })} />
        </div>
        <div style={{ width: 88 }}>
          <label style={LABEL}>اولویت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(prio)}
            onChange={e => setPrio(digits(e.target.value))} title="بزرگ‌تر = مهم‌تر" />
        </div>
        <div style={{ width: 150 }}>
          <label style={LABEL}>قیمت پایه (تومان)</label>
          <input style={{ ...INPUT, background: '#fff' }} inputMode="numeric"
            value={price ? toFaDigits(Number(price).toLocaleString('en-US')) : ''}
            onChange={e => setPrice(digits(e.target.value))} />
        </div>
        <div style={{ width: 92 }}>
          <label style={LABEL}>مدت (روز)</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(days)}
            onChange={e => setDays(digits(e.target.value))} />
        </div>
        {isVideo && (
          <>
            <div style={{ width: 116 }}>
              <label style={LABEL}>رد کردن پس از (ثانیه)</label>
              <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(skip)}
                onChange={e => setSkip(digits(e.target.value))} title="خالی = بیننده اصلا نمی‌تواند رد کند" />
              {skip.trim() !== '' && maxDur.trim() !== '' && Number(skip) >= Number(maxDur) && (
                <div style={{ fontSize: 10.5, color: '#B7791F', marginTop: 4, lineHeight: 1.6 }}>
                  از سقف مدت بیشتر است؛ دکمه‌ی رد کردن هرگز فعال نمی‌شود
                </div>
              )}
            </div>
            <div style={{ width: 116 }}>
              <label style={LABEL}>سقف مدت (ثانیه)</label>
              <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(maxDur)}
                onChange={e => setMaxDur(digits(e.target.value))} title="ویدیوی بلندتر از این در فرم خرید رد می‌شود" />
            </div>
          </>
        )}
        <button onClick={() => onPatch(p.key, {
          capacity: Number(cap) || 0, price: Number(price) || 0, durationDays: Number(days) || 30,
          displayCount: Number(shown) || 0, priority: Number(prio) || 0,
          ...(isVideo ? { skipAfterSec: numOrNull(skip), maxDurationSec: numOrNull(maxDur) } : {}),
        })}
          disabled={busy || !changed}
          style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
        </button>
      </div>

      {p.mode === 'paid' && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: FELT, background: 'rgba(14,122,56,0.07)', borderRadius: 9, padding: '7px 11px', lineHeight: 1.8 }}>
          این جایگاه در صفحه‌ی «درخواست تبلیغات» قابل خرید است، پله‌های قیمتش را در بخش پلن‌ها تنظیم کنید
        </div>
      )}
    </div>
  )
}
