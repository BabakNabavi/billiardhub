'use client'
/* ─────────────────────────────────────────────────────────────
   ProvinceCitySelect — انتخاب زنجیره‌ای استان → شهر (سرچ‌دار)
   منبع واحد انتخاب استان/شهر در کل پروژه. لیست را هرگز جای دیگری نسازید.

   controlled است: مقدار فعلی را با province/city بده و تغییرات را از onChange بگیر.
   با انتخاب استان، فیلد شهر باز می‌شود و فقط شهرهای همان استان را نشان می‌دهد؛
   تا استان انتخاب نشود، شهر غیرفعال است.

   نمونه:
     const [geo, setGeo] = useState({ province: '', city: '' })
     <ProvinceCitySelect value={geo} onChange={setGeo} required />
   ───────────────────────────────────────────────────────────── */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProvinceNames, getCities, getProvinces } from '../lib/iran-geo'
import { toFaDigits } from '../lib/jalali'

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
  /* 'chained' = دو دراپ‌داون استان⟵شهر (پیش‌فرض، رفتار قبلی)
     'box'     = یک جعبه‌ی سرچ‌دار؛ هر سطر شهر + استانِ کم‌رنگ کنارش.
     ⚠️ چرا هر دو می‌مانند: زنجیره‌ای جایی لازم است که استان معنای
     مستقل دارد؛ جعبه‌ای وقتی کاربر فقط می‌خواهد شهرش را پیدا کند
     و دو مرحله‌ی جدا اضافه است. */
  variant?: 'chained' | 'box'
  /** برچسبِ حالتِ جعبه‌ای — یک فیلد است پس یک برچسب دارد */
  label?: string
  className?: string
}

/* توکن‌ها با CSS variable تعریف شده‌اند تا هم تم روشن هم تیره پشتیبانی شود
   (light پیش‌فرض؛ کلاس .dark مقادیر را برای پس‌زمینه‌ی تیره عوض می‌کند). */
let styleInjected = false
const CSS = `
.pcs-wrap {
  direction: rtl; font-family: inherit;
  --pcs-gold: #C7A66A; --pcs-gold-d: #8F6531;
  --pcs-text: #1C1B17; --pcs-mut: #A69F8E; --pcs-sub: #5B564B;
  --pcs-border: #E7E2D6; --pcs-field: #FAFAF7; --pcs-panel: #fff;
  --pcs-opt-hover: rgba(199,166,106,0.12);
  --pcs-shadow: 0 12px 32px rgba(28,27,23,0.14), 0 2px 8px rgba(28,27,23,0.06);
}
.pcs-wrap.dark {
  --pcs-gold-d: #D4B87F;   /* طلایی روشن‌تر برای خوانایی روی زمینه‌ی تیره */
  --pcs-text: #E8E8E6; --pcs-mut: rgba(232,232,230,0.42); --pcs-sub: rgba(232,232,230,0.62);
  --pcs-border: rgba(255,255,255,0.14); --pcs-field: rgba(255,255,255,0.05); --pcs-panel: #16201B;
  --pcs-opt-hover: rgba(199,166,106,0.18);
  --pcs-shadow: 0 14px 36px rgba(0,0,0,0.5);
}
/* ── حالتِ جعبه‌ای ── */
.pcs-boxw { position: relative; }
.pcs-box-in {
  display: flex; align-items: center; gap: 8px;
  width: 100%; min-height: 44px; padding: 8px 12px;
  border: 1px solid var(--pcs-border); border-radius: 12px;
  background: var(--pcs-field); cursor: text;
  transition: border-color .16s, box-shadow .16s;
}
.pcs-box-in:focus-within {
  border-color: var(--pcs-gold);
  box-shadow: 0 0 0 3px rgba(199,166,106,0.18);
}
.pcs-box-in input {
  flex: 1; min-width: 0; border: 0; outline: none; background: transparent;
  font-family: inherit; font-size: 13.5px; color: var(--pcs-text);
}
.pcs-box-in input::placeholder { color: var(--pcs-mut); font-size: 12.5px; }
.pcs-box-clear {
  display: grid; place-items: center; width: 22px; height: 22px; flex-shrink: 0;
  border: 0; border-radius: 999px; background: transparent;
  color: var(--pcs-mut); cursor: pointer;
}
.pcs-box-clear:hover { color: var(--pcs-text); }
.pcs-box-panel {
  position: absolute; inset-inline: 0; top: calc(100% + 6px); z-index: 60;
  max-height: 264px; overflow-y: auto;
  border: 1px solid var(--pcs-border); border-radius: 12px;
  background: var(--pcs-panel); box-shadow: var(--pcs-shadow);
}
.pcs-box-opt {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 9px 12px; border: 0; background: transparent;
  font-family: inherit; font-size: 13px; color: var(--pcs-text);
  text-align: start; cursor: pointer;
}
.pcs-box-opt:hover, .pcs-box-opt.on, .pcs-box-opt.hl { background: var(--pcs-opt-hover); }
/* ⚠️ خودِ ورودی outline ندارد و گزینه‌ها دکمه‌ی واقعی‌اند؛ بدون این
   قاعده، کاربر کیبورد هیچ نشانه‌ای نمی‌بیند.
   ⚠️ این متن داخل یک template literal است — بک‌تیک ننویس. */
.pcs-box-opt:focus-visible, .pcs-box-clear:focus-visible {
  outline: 2px solid var(--pcs-gold); outline-offset: -2px;
  background: var(--pcs-opt-hover);
}
/* ⚠️ استان کم‌رنگ و سمتِ پایانی — همان چیدمانی که فیلترِ شهرِ
   «خدمات فنی» و «شهرهای تحت پوشش» دارند. */
.pcs-box-prov { font-size: 11px; color: var(--pcs-mut); flex-shrink: 0; }
.pcs-box-empty { padding: 18px 12px; text-align: center; font-size: 12.5px; color: var(--pcs-mut); }
.pcs-box-more { padding: 8px 12px; border-top: 1px solid var(--pcs-border); text-align: center; font-size: 11.5px; color: var(--pcs-mut); }

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
.pcs-val.ph { color: var(--pcs-mut); font-size: 11.5px; }
.pcs-chev { flex-shrink: 0; color: var(--pcs-mut); transition: transform .2s ease; }
.pcs-btn.open .pcs-chev { transform: rotate(180deg); color: var(--pcs-gold-d); }
/* ── چرا fixed و از راه Portal ──
   پنل تا امروز absolute بود و داخل همان کارتی می‌ماند که فیلد در
   آن است. هر کارتی که overflow:hidden داشت (یا با backdrop-filter
   — بک‌تیک این‌جا ممنوع است، این متن داخل template literal است —
   بافت چینش خودش را می‌ساخت) لیست را می‌برید — کاربر باکس را باز
   می‌کرد و فهرست زیر لبه‌ی کارت گم می‌شد.

   حالا روی body رندر می‌شود و جای واقعی‌اش هر بار اندازه گرفته
   می‌شود؛ اگر پایین صفحه جا نبود، رو به بالا باز می‌شود. */
.pcs-panel {
  position: fixed; z-index: 9999;
  display: flex; flex-direction: column;
  background: var(--pcs-panel); border: 1px solid var(--pcs-border); border-radius: 12px; overflow: hidden;
  box-shadow: var(--pcs-shadow); animation: pcsIn .14s ease both;
  direction: rtl; font-family: inherit;
  --pcs-gold: #C7A66A; --pcs-gold-d: #8F6531;
  --pcs-text: #1C1B17; --pcs-mut: #A69F8E; --pcs-sub: #5B564B;
  --pcs-border: #E7E2D6; --pcs-field: #FAFAF7; --pcs-panel: #fff;
  --pcs-opt-hover: rgba(199,166,106,0.12);
  --pcs-shadow: 0 12px 32px rgba(28,27,23,0.14), 0 2px 8px rgba(28,27,23,0.06);
}
.pcs-panel.dark {
  --pcs-gold-d: #D4B87F;
  --pcs-text: #E8E8E6; --pcs-mut: rgba(232,232,230,0.42); --pcs-sub: rgba(232,232,230,0.62);
  --pcs-border: rgba(255,255,255,0.14); --pcs-field: rgba(255,255,255,0.05); --pcs-panel: #16201B;
  --pcs-opt-hover: rgba(199,166,106,0.18);
  --pcs-shadow: 0 14px 36px rgba(0,0,0,0.5);
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
.pcs-list { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 5px; }
.pcs-search { flex-shrink: 0; }
.pcs-opt {
  display: flex; align-items: center; gap: 7px; padding: 8px 10px; border-radius: 8px;
  font-size: 13px; color: var(--pcs-text); cursor: pointer; transition: background .12s;
}
.pcs-opt:hover, .pcs-opt.active { background: var(--pcs-opt-hover); }
.pcs-opt.sel { color: var(--pcs-gold-d); font-weight: 700; }
.pcs-opt .tick { margin-inline-start: auto; color: var(--pcs-gold-d); }
.pcs-empty { padding: 22px 12px; text-align: center; font-size: 12.5px; color: var(--pcs-mut); }
`

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
)
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
  value, options, placeholder, searchPlaceholder, onSelect, disabled, error, size, dark,
}: {
  value: string
  options: string[]
  placeholder: string
  searchPlaceholder: string
  onSelect: (v: string) => void
  disabled?: boolean
  error?: boolean
  size: 'sm' | 'md'
  dark?: boolean
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return options
    return options.filter(o => o.includes(q))
  }, [options, query])

  /* جای پنل از فضای واقعی بالا و پایین دکمه حساب می‌شود */
  const place = () => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    const GAP = 6, EDGE = 10
    const vh = window.innerHeight, vw = window.innerWidth
    const below = vh - r.bottom - GAP - EDGE
    const above = r.top - GAP - EDGE
    const openUp = below < 200 && above > below
    const maxH = Math.max(160, Math.min(320, openUp ? above : below))
    const top = openUp ? Math.max(EDGE, r.top - GAP - maxH) : r.bottom + GAP
    const width = Math.min(Math.max(r.width, 180), vw - EDGE * 2)
    const left = Math.min(Math.max(EDGE, r.left), Math.max(EDGE, vw - width - EDGE))
    setRect({ top, left, width, maxH })
  }

  /* بستن با کلیک بیرون — پنل حالا بیرون wrap است، پس جدا چک می‌شود */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  /* فوکوس روی سرچ هنگام باز شدن — روی موبایل نه، چون کیبورد همان
     پنلی را که تازه جا شده دوباره از صفحه بیرون می‌اندازد */
  useEffect(() => {
    if (!open) return
    setQuery(''); setActive(0)
    if (typeof window !== 'undefined' && window.innerWidth <= 820) return
    const t = setTimeout(() => inputRef.current?.focus(), 20)
    return () => clearTimeout(t)
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
        onClick={() => { if (disabled) return; if (!open) place(); setOpen(o => !o) }}
        className={`pcs-btn ${size}${open ? ' open' : ''}${error ? ' err' : ''}`}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className={`pcs-val${value ? '' : ' ph'}`}>{value || placeholder}</span>
        <IconChev />
      </button>

      {open && rect && typeof document !== 'undefined' && createPortal(
        <div ref={panelRef} className={`pcs-panel${dark ? ' dark' : ''}`} role="listbox"
          style={{ top: rect.top, left: rect.left, width: rect.width, maxHeight: rect.maxH }}>
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
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ⚠️ یک‌بار صاف می‌شود، نه در هر تایپ. نامِ تکراری بین استان‌ها
   حذف **نمی‌شود**: انتخاب این‌جا هر دو مقدار را می‌نشاند، پس
   «سردشت/آذربایجان غربی» و «سردشت/خوزستان» دو گزینه‌ی متفاوت‌اند. */
interface BoxRow { city: string; province: string }
let BOX_ROWS: BoxRow[] | null = null
const boxRows = (): BoxRow[] => (BOX_ROWS ??= getProvinces()
  .flatMap(p => p.cities.map(c => ({ city: c, province: p.name }))))

/* ی/ي و ک/ك یکسان می‌شوند: صفحه‌کلید عربی نباید نتیجه را خالی کند */
const boxNorm = (v: string) => v.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').trim()

function BoxSelect({
  value, onChange, label, required, disabled, error, theme, className, max = 60,
}: {
  value: ProvinceCityValue
  onChange: (v: ProvinceCityValue) => void
  label: string
  required: boolean
  disabled: boolean
  error?: string
  theme: 'light' | 'dark'
  className: string
  max?: number
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  /* ⚠️ ۱۱۵۶ ردیف با سقف ۶۰: بدون پیمایش با فلش، انتخاب با کیبورد
     یعنی Tab زدن روی تا شصت دکمه. */
  const [hl, setHl] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const uid = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) { setOpen(false); setQ('') }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const { shown, total } = useMemo(() => {
    const t = boxNorm(q)
    const all = boxRows()
    if (!t) return { shown: all.slice(0, max), total: all.length }
    /* آنچه با عبارت *شروع* می‌شود اول می‌آید */
    const starts: BoxRow[] = [], has: BoxRow[] = []
    for (const r of all) {
      const c = boxNorm(r.city)
      if (c.startsWith(t)) starts.push(r)
      else if (c.includes(t) || boxNorm(r.province).includes(t)) has.push(r)
    }
    const list = [...starts, ...has]
    return { shown: list.slice(0, max), total: list.length }
  }, [q, max])

  useEffect(() => { setHl(0) }, [q])
  /* گزینه‌ی هایلایت‌شده باید در دید بماند */
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelectorAll('.pcs-box-opt')[hl]
      ?.scrollIntoView({ block: 'nearest' })
  }, [hl, open])

  const pick = (r: BoxRow) => {
    onChange({ province: r.province, city: r.city })
    setQ(''); setOpen(false)
  }
  const same = (r: BoxRow) => r.city === value.city && r.province === value.province

  return (
    <div ref={wrap} className={`pcs-wrap${theme === 'dark' ? ' dark' : ''} ${className} pcs-boxw`}>
      <label className="pcs-label" htmlFor={uid}>
        {label}{required ? <span className="pcs-req"> *</span> : null}
      </label>
      <div className="pcs-box-in">
        <IconSearch />
        <input
          id={uid} autoComplete="off" disabled={disabled}
          value={open ? q : value.city}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setQ('') }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setQ(''); return }
            if (e.key === 'ArrowDown') {
              e.preventDefault(); setOpen(true)
              setHl(i => Math.min(i + 1, shown.length - 1)); return
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault(); setHl(i => Math.max(i - 1, 0)); return
            }
            /* ⚠️ Enter با عبارتِ خالی حق ندارد چیزی انتخاب کند.
               نسخه‌ی اول `shown[0]` را برمی‌داشت و چون فهرستِ
               بی‌فیلتر با «آبادان» شروع می‌شود، فشردنِ Enter برای
               ثبتِ فرم بی‌صدا شهر را عوض می‌کرد — و
               `preventDefault` خودِ ثبت را هم می‌خورد. */
            if (e.key === 'Enter' && open && boxNorm(q)) {
              e.preventDefault()
              const f = shown[hl] ?? shown[0]
              if (f) pick(f)
            }
          }}
          placeholder="شهر را بنویسید یا انتخاب کنید…"
          /* ⚠️ `role="listbox"` و `role="option"` عمدا نیامدند —
             همان تصمیمی که CoverageCitySelect مستند کرده: listbox
             فقط `option` می‌پذیرد و با فرزندِ `<button>` صفحه‌خوان
             فهرست را خالی اعلام می‌کند. تا وقتی combobox کامل با
             `aria-activedescendant` نداریم، منوی دکمه‌ای صادق‌تر
             است. `aria-expanded` روی textbox تنها هم بی‌معناست. */
        />
        {/* ⚠️ استان کنارِ همان فیلد دیده می‌شود، نه در فیلدِ دوم */}
        {!open && value.province && <span className="pcs-box-prov">{value.province}</span>}
        {/* ⚠️ شرط قبلی `open ? q : value.city` بود، پس با فوکوسِ
            خالی ناپدید می‌شد و برای پاک‌کردن باید اول blur می‌کردی */}
        {!disabled && (value.city || q) !== '' && (
          <button type="button" className="pcs-box-clear" aria-label="پاک کردن"
            onClick={() => { onChange({ province: '', city: '' }); setQ(''); setOpen(false) }}>
            <IconX />
          </button>
        )}
      </div>

      {open && (
        <div className="pcs-box-panel" ref={listRef}>
          {shown.length === 0 ? (
            <p className="pcs-box-empty">شهری با این نام پیدا نشد</p>
          ) : (
            <>
              {shown.map((r, i) => (
                <button
                  key={`${r.province}/${r.city}`} type="button"
                  className={`pcs-box-opt${same(r) ? ' on' : ''}${i === hl ? ' hl' : ''}`}
                  onMouseEnter={() => setHl(i)}
                  onClick={() => pick(r)}>
                  <span>{r.city}</span>
                  <span className="pcs-box-prov">{r.province}</span>
                </button>
              ))}
              {total > shown.length && (
                <p className="pcs-box-more">و {toFaDigits(String(total - shown.length))} شهر دیگر — نامش را بنویسید</p>
              )}
            </>
          )}
        </div>
      )}
      {error && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: '#B23B2E' }}>{error}</p>}
    </div>
  )
}
export default function ProvinceCitySelect({
  value, onChange,
  provinceLabel = 'استان', cityLabel = 'شهر',
  required = false, provinceError, cityError,
  layout = 'row', disabled = false, size = 'md', theme = 'light', className = '',
  variant = 'chained', label,
}: Props) {
  useEffect(() => {
    if (styleInjected || typeof document === 'undefined') return
    const el = document.createElement('style')
    el.setAttribute('data-pcs', '')
    el.textContent = CSS
    document.head.appendChild(el)
    styleInjected = true
  }, [])

  if (variant === 'box') {
    return (
      <BoxSelect
        value={value} onChange={onChange}
        label={label ?? cityLabel}
        required={required} disabled={disabled}
        error={cityError ?? provinceError}
        theme={theme} className={className}
      />
    )
  }

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
          onSelect={pickProvince} disabled={disabled} error={!!provinceError} size={size} dark={theme === 'dark'}
        />
        {provinceError && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: '#B23B2E' }}>{provinceError}</p>}
      </div>
      <div>
        <label className="pcs-label">{cityLabel}{star}</label>
        <Combobox
          value={value.city} options={cities}
          placeholder={value.province ? 'انتخاب شهر…' : 'ابتدا استان را انتخاب کنید'}
          searchPlaceholder="جستجوی شهر…"
          onSelect={pickCity} disabled={disabled || !value.province} error={!!cityError} size={size} dark={theme === 'dark'}
        />
        {cityError && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: '#B23B2E' }}>{cityError}</p>}
      </div>
    </div>
  )
}
