'use client'
/* ─────────────────────────────────────────────────────────────
   ProvinceCitySelect — انتخابِ زنجیره‌ایِ استان → شهر (سرچ‌دار)
   منبعِ واحدِ انتخاب استان/شهر در کل پروژه. لیست را هرگز جای دیگری نسازید.

   controlled است: مقدارِ فعلی را با province/city بده و تغییرات را از onChange بگیر.
   با انتخاب استان، فیلد شهر باز می‌شود و فقط شهرهای همان استان را نشان می‌دهد؛
   تا استان انتخاب نشود، شهر غیرفعال است.

   نمونه:
     const [geo, setGeo] = useState({ province: '', city: '' })
     <ProvinceCitySelect value={geo} onChange={setGeo} required />
   ───────────────────────────────────────────────────────────── */
import { useEffect, useMemo, useRef, useState } from 'react'
import { getProvinceNames, getCities } from '../lib/iran-geo'

export interface ProvinceCityValue { province: string; city: string }

interface Props {
  value: ProvinceCityValue
  onChange: (v: ProvinceCityValue) => void
  provinceLabel?: string
  cityLabel?: string
  required?: boolean
  provinceError?: string
  cityError?: string
  layout?: 'row' | 'stack'   // row = دو ستون کنار هم (پیش‌فرض)، stack = زیر هم
  disabled?: boolean
  size?: 'sm' | 'md'
  theme?: 'light' | 'dark'   // dark = برای صفحات تم تیره (مثل ثبت باشگاه)
  className?: string
}

/* توکن‌ها با CSS variable تعریف شده‌اند تا هم تم روشن هم تیره پشتیبانی شود
   (light پیش‌فرض؛ کلاس .dark مقادیر را برای پس‌زمینه‌ی تیره عوض می‌کند). */
let styleInjected = false
const CSS = `
.pcs-wrap {
  direction: rtl; font-family: inherit;
  --pcs-gold: #C7A66A; --pcs-gold-d: #9A6E38;
  --pcs-text: #1C1B17; --pcs-mut: #A69F8E; --pcs-sub: #5B564B;
  --pcs-border: #E7E2D6; --pcs-field: #FAFAF7; --pcs-panel: #fff;
  --pcs-opt-hover: rgba(199,166,106,0.12);
  --pcs-shadow: 0 12px 32px rgba(28,27,23,0.14), 0 2px 8px rgba(28,27,23,0.06);
}
.pcs-wrap.dark {
  --pcs-gold-d: #D4B87F;   /* طلاییِ روشن‌تر برای خوانایی روی زمینه‌ی تیره */
  --pcs-text: #E8E8E6; --pcs-mut: rgba(232,232,230,0.42); --pcs-sub: rgba(232,232,230,0.62);
  --pcs-border: rgba(255,255,255,0.14); --pcs-field: rgba(255,255,255,0.05); --pcs-panel: #16201B;
  --pcs-opt-hover: rgba(199,166,106,0.18);
  --pcs-shadow: 0 14px 36px rgba(0,0,0,0.5);
}
.pcs-field { position: relative; }
.pcs-label { display: block; margin-bottom: 6px; font-size: 12.5px; font-weight: 600; color: var(--pcs-sub); }
.pcs-req { color: #E0645A; }
.pcs-btn {
  width: 100%; display: flex; align-items: center; gap: 8px; text-align: right;
  background: var(--pcs-field); border: 1px solid var(--pcs-border); border-radius: 10px;
  color: var(--pcs-text); font-family: inherit; cursor: pointer; transition: border-color .18s, box-shadow .18s;
}
.pcs-btn.md { padding: 10px 12px; font-size: 13.5px; }
.pcs-btn.sm { padding: 8px 11px;  font-size: 12.5px; }
.pcs-btn:hover:not(:disabled) { border-color: rgba(199,166,106,0.55); }
.pcs-btn.open { border-color: var(--pcs-gold); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); }
.pcs-btn.err { border-color: #E4A2A2; }
.pcs-btn:disabled { opacity: .55; cursor: not-allowed; }
.pcs-val { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pcs-val.ph { color: var(--pcs-mut); }
.pcs-chev { flex-shrink: 0; color: var(--pcs-mut); transition: transform .2s ease; }
.pcs-btn.open .pcs-chev { transform: rotate(180deg); color: var(--pcs-gold-d); }
.pcs-panel {
  position: absolute; z-index: 60; top: calc(100% + 6px); left: 0; right: 0;
  background: var(--pcs-panel); border: 1px solid var(--pcs-border); border-radius: 12px; overflow: hidden;
  box-shadow: var(--pcs-shadow); animation: pcsIn .14s ease both;
}
@keyframes pcsIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .pcs-panel { animation: none; } .pcs-chev { transition: none; } }
.pcs-search { padding: 9px 11px; border-bottom: 1px solid var(--pcs-border); position: relative; }
.pcs-search input {
  width: 100%; border: 1px solid var(--pcs-border); border-radius: 8px; background: var(--pcs-field);
  padding: 7px 32px 7px 11px; font-family: inherit; font-size: 12.5px; color: var(--pcs-text); outline: none;
}
.pcs-search input:focus { border-color: var(--pcs-gold); }
.pcs-search svg { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: var(--pcs-mut); }
.pcs-list { max-height: 240px; overflow-y: auto; padding: 5px; }
.pcs-opt {
  display: flex; align-items: center; gap: 7px; padding: 8px 10px; border-radius: 8px;
  font-size: 13px; color: var(--pcs-text); cursor: pointer; transition: background .12s;
}
.pcs-opt:hover, .pcs-opt.active { background: var(--pcs-opt-hover); }
.pcs-opt.sel { color: var(--pcs-gold-d); font-weight: 700; }
.pcs-opt .tick { margin-inline-start: auto; color: var(--pcs-gold-d); }
.pcs-empty { padding: 22px 12px; text-align: center; font-size: 12.5px; color: var(--pcs-mut); }
`

const IconChev = (p: { size?: number }) => (
  <svg className="pcs-chev" width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
)
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
)
const IconTick = () => (
  <svg className="tick" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)

/* ── یک combobox سرچ‌دار (برای هر دو فیلد استفاده می‌شود) ── */
function Combobox({
  value, options, placeholder, searchPlaceholder, onSelect, disabled, error, size,
}: {
  value: string
  options: string[]
  placeholder: string
  searchPlaceholder: string
  onSelect: (v: string) => void
  disabled?: boolean
  error?: boolean
  size: 'sm' | 'md'
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return options
    return options.filter(o => o.includes(q))
  }, [options, query])

  /* بستن با کلیک بیرون */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  /* فوکوس روی سرچ هنگام باز شدن */
  useEffect(() => {
    if (open) { setQuery(''); setActive(0); const t = setTimeout(() => inputRef.current?.focus(), 20); return () => clearTimeout(t) }
  }, [open])

  const choose = (v: string) => { onSelect(v); setOpen(false) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); const v = filtered[active]; if (v) choose(v) }
  }

  return (
    <div className="pcs-field" ref={wrapRef}>
      <button
        type="button" disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`pcs-btn ${size}${open ? ' open' : ''}${error ? ' err' : ''}`}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className={`pcs-val${value ? '' : ' ph'}`}>{value || placeholder}</span>
        <IconChev />
      </button>

      {open && (
        <div className="pcs-panel" role="listbox">
          <div className="pcs-search">
            <input
              ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onKey} placeholder={searchPlaceholder} dir="rtl"
            />
            <IconSearch />
          </div>
          <div className="pcs-list">
            {filtered.length === 0 ? (
              <div className="pcs-empty">موردی یافت نشد</div>
            ) : (
              filtered.map((o, i) => (
                <div
                  key={o} role="option" aria-selected={o === value}
                  className={`pcs-opt${o === value ? ' sel' : ''}${i === active ? ' active' : ''}`}
                  onMouseEnter={() => setActive(i)} onClick={() => choose(o)}
                >
                  <span>{o}</span>
                  {o === value && <IconTick />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProvinceCitySelect({
  value, onChange,
  provinceLabel = 'استان', cityLabel = 'شهر',
  required = false, provinceError, cityError,
  layout = 'row', disabled = false, size = 'md', theme = 'light', className = '',
}: Props) {
  useEffect(() => {
    if (styleInjected || typeof document === 'undefined') return
    const el = document.createElement('style')
    el.setAttribute('data-pcs', '')
    el.textContent = CSS
    document.head.appendChild(el)
    styleInjected = true
  }, [])

  const provinces = getProvinceNames()
  const cities    = value.province ? getCities(value.province) : []

  const pickProvince = (p: string) => onChange({ province: p, city: '' })  // تغییر استان ⇒ شهر ریست
  const pickCity     = (c: string) => onChange({ province: value.province, city: c })

  const star = required ? <span className="pcs-req"> *</span> : null
  const cols = layout === 'row' ? 'repeat(2, minmax(0, 1fr))' : '1fr'

  return (
    <div className={`pcs-wrap${theme === 'dark' ? ' dark' : ''} ${className}`} style={{ display: 'grid', gridTemplateColumns: cols, gap: 14 }}>
      <div>
        <label className="pcs-label">{provinceLabel}{star}</label>
        <Combobox
          value={value.province} options={provinces}
          placeholder="انتخاب استان…" searchPlaceholder="جستجوی استان…"
          onSelect={pickProvince} disabled={disabled} error={!!provinceError} size={size}
        />
        {provinceError && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: '#B23B2E' }}>{provinceError}</p>}
      </div>
      <div>
        <label className="pcs-label">{cityLabel}{star}</label>
        <Combobox
          value={value.city} options={cities}
          placeholder={value.province ? 'انتخاب شهر…' : 'ابتدا استان را انتخاب کنید'}
          searchPlaceholder="جستجوی شهر…"
          onSelect={pickCity} disabled={disabled || !value.province} error={!!cityError} size={size}
        />
        {cityError && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: '#B23B2E' }}>{cityError}</p>}
      </div>
    </div>
  )
}
