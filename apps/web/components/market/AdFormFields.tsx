'use client'

/* ═══════════════════════════════════════════════════════════════
   اجزای مشترکِ فرمِ آگهی — منبعِ واحد.
   ───────────────────────────────────────────────────────────────
   این‌ها تا امروز فقط داخلِ `app/shop/new/page.tsx` بودند. فرمِ
   ویرایش نسخه‌ی خودش را داشت: دراپ‌داونِ دیگر، رنگِ دیگر، ورودیِ
   دیگر — و مهم‌تر از ظاهر، رفتارِ دیگر. حالا هر دو فرم دقیقاً یک
   چیز را نشان می‌دهند.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { SpecFieldDef } from '../../lib/market/specs'

export const GOLD     = '#C7A66A'
export const GOLD_D   = '#9A6E38'
export const TEXT     = '#1C1C1A'
export const TEXT_SEC = 'rgba(28,28,26,0.52)'
export const TEXT_MUT = 'rgba(28,28,26,0.30)'
export const LQ_BG    = 'rgba(255,255,255,0.82)'
export const LQ_BOR   = '1px solid rgba(255,255,255,0.85)'
export const LQ_SHAD  = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'
export const ERR      = '#EF4444'

/* استایلِ مشترکِ صفحه — هر دو فرم همین را در <style> می‌گذارند.
   (بک‌تیک این‌جا ممنوع — این رشته داخلِ template literal مصرف می‌شود) */
export const AD_FORM_CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes popIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  * { box-sizing: border-box; }
  .nf:focus { border-color: ${GOLD} !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.14) !important; }
  .nf::placeholder { color: rgba(28,28,26,0.28); }
  .drop-area { transition: border-color 0.2s, background 0.2s, transform 0.15s; }
  .drop-area:hover { border-color: ${GOLD} !important; background: rgba(199,166,106,0.04) !important; }
  .img-thumb { transition: transform 0.2s, box-shadow 0.2s; }
  .img-thumb:hover { transform: scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
  .cond-btn { transition: all 0.2s; cursor: pointer; }
  .cond-btn:hover { border-color: ${GOLD} !important; }
  @media(max-width:820px) { .two-col { grid-template-columns: 1fr !important; } .spec-grid { grid-template-columns: 1fr !important; } }
`

// ── Shared input style ─────────────────────────────────────────
export function inp(err?: string, locked?: boolean): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 11, fontSize: 14.5,
    border: `1.5px solid ${err ? ERR : locked ? 'rgba(199,166,106,0.32)' : 'rgba(28,28,26,0.13)'}`,
    background: locked ? 'rgba(199,166,106,0.06)' : '#FAFAFA',
    color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
    outline: 'none', direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: locked ? 'default' : undefined,
  }
}

// parse Persian/Arabic numerals → pure digits
export function toAsciiDigits(s: string) {
  return s.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
          .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
}

export function fmtPrice(v: string) {
  const n = toAsciiDigits(v).replace(/\D/g, '')
  return n ? Number(n).toLocaleString('fa-IR') : ''
}

/* ── دراپ‌داون حرفه‌ای — پنل با Portal روی document.body و position:fixed رندر می‌شود
   تا از overflow:hidden و stacking-context کارت‌ها فرار کند و زیر المان بعدی نرود. ── */
export function FancySelect({ value, onChange, options, placeholder = 'انتخاب...', disabled, error }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchable = options.length > 8

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setRect({ top: r.bottom + 6, left: r.left, width: r.width })
  }
  const toggle = () => { if (disabled) return; if (!open) place(); setOpen(o => !o) }

  useEffect(() => {
    if (!open) return
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place)
    }
  }, [open])

  const cur = options.find(o => o.value === value)
  const list = searchable && q.trim() ? options.filter(o => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options

  return (
    <>
      <button ref={btnRef} type="button" disabled={disabled} onClick={toggle}
        style={{
          width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 14px', borderRadius: 11, fontSize: 14.5, textAlign: 'right',
          border: `1.5px solid ${error ? ERR : open ? GOLD : disabled ? 'rgba(28,28,26,0.07)' : 'rgba(28,28,26,0.13)'}`,
          background: disabled ? 'rgba(28,28,26,0.03)' : '#FAFAFA',
          color: cur ? TEXT : (disabled ? 'rgba(28,28,26,0.30)' : TEXT_MUT),
          fontFamily: 'Vazirmatn,Tahoma,sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.14)' : 'none', transition: 'border-color .18s, box-shadow .18s',
        }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cur ? cur.label : placeholder}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && !disabled && rect && typeof document !== 'undefined' && createPortal(
        <div ref={panelRef} style={{
          position: 'fixed', zIndex: 9999, top: rect.top, left: rect.left, width: rect.width,
          background: '#fff', border: '1px solid rgba(28,28,26,0.1)', borderRadius: 13, overflow: 'hidden',
          boxShadow: '0 18px 44px rgba(28,27,23,0.20)', animation: 'fadeIn 0.14s ease both', direction: 'rtl',
        }}>
          {searchable && (
            <div style={{ padding: 8, borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="جستجو..." dir="rtl"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 9, fontSize: 13, border: '1.5px solid rgba(28,28,26,0.12)', background: '#FAFAFA', color: TEXT, outline: 'none', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }} />
            </div>
          )}
          <div style={{ maxHeight: 264, overflowY: 'auto', padding: 6 }}>
            {list.length === 0 ? (
              <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: 13, color: TEXT_MUT }}>موردی یافت نشد</div>
            ) : list.map(o => {
              const s = o.value === value
              return (
                <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQ('') }}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '10px 12px', border: 'none', borderRadius: 9, cursor: 'pointer', textAlign: 'right',
                    fontFamily: 'Vazirmatn,Tahoma,sans-serif', fontSize: 14,
                    background: s ? 'rgba(199,166,106,0.14)' : 'transparent', color: s ? GOLD_D : TEXT, fontWeight: s ? 800 : 500,
                  }}
                  onMouseEnter={e => { if (!s) e.currentTarget.style.background = 'rgba(28,28,26,0.04)' }}
                  onMouseLeave={e => { if (!s) e.currentTarget.style.background = 'transparent' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                  {s && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD_D} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

/* optional دیگر برچسب «(اختیاری)» نمی‌گذارد — کلمه‌ی «اختیاری» از کل فرم حذف شد */
export function Label({ children, required }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 7 }}>
      {children}
      {required && <span style={{ color: ERR, marginRight: 3 }}>*</span>}
    </label>
  )
}

export function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ fontSize: 12, color: ERR, marginTop: 4, margin: '4px 0 0' }}>{msg}</p>
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 22px', display: 'flex', alignItems: 'center', gap: 9, position: 'relative', zIndex: 1 }}>
      <span style={{ width: 3, height: 17, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
      {children}
    </h2>
  )
}

export function SpecField({ field, value, otherValue, onChange, onOtherChange, dependencyValue }: {
  field: SpecFieldDef; value: string; otherValue: string
  onChange: (v: string) => void; onOtherChange: (v: string) => void
  dependencyValue?: string
}) {
  const hasDep   = Boolean(field.dependsOn)
  // cueType === 'سایر' → free-text input for brand
  const depOther = hasDep && dependencyValue === 'سایر'
  // no cueType selected yet → disable the brand dropdown
  const noDepYet = hasDep && !dependencyValue

  // resolve the correct options list
  const resolvedOptions: string[] =
    hasDep && field.optionsByDependency && dependencyValue && !depOther
      ? field.optionsByDependency[dependencyValue] ?? []
      : field.options ?? []

  const effectiveType = depOther ? 'text' : field.type
  const showOther = effectiveType === 'dropdown' && resolvedOptions.includes('سایر') && value === 'سایر'
  const labelText = field.unit ? `${field.label} (${field.unit})` : field.label

  return (
    <div style={{ gridColumn: field.wide ? '1 / -1' : undefined }}>
      <Label optional>{labelText}</Label>

      {/* Wrap in a keyed div so the fade-in triggers every time dependency changes */}
      <div key={`dep-${dependencyValue ?? '__none__'}`}
        style={{ animation: hasDep ? 'fadeIn 0.25s ease both' : undefined }}>

        {effectiveType === 'dropdown' ? (
          <FancySelect value={value} onChange={onChange}
            options={resolvedOptions.map(o => ({ value: o, label: o }))}
            placeholder={noDepYet ? 'ابتدا نوع را انتخاب کنید' : 'انتخاب...'}
            disabled={noDepYet} />
        ) : effectiveType === 'number' ? (
          <input className="nf" type="number" step="any" inputMode="decimal" placeholder={field.placeholder ?? ''} value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inp(), direction: 'ltr', textAlign: 'right' }} />
        ) : (
          <input className="nf" type="text"
            placeholder={depOther ? 'نام برند را وارد کنید...' : (field.placeholder ?? '')}
            value={depOther ? otherValue : value}
            onChange={e => depOther ? onOtherChange(e.target.value) : onChange(e.target.value)}
            style={{ ...inp(), ...(depOther ? { background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' } : {}) }} />
        )}

        {showOther && (
          <div style={{ marginTop: 8, animation: 'fadeIn 0.25s ease both' }}>
            <input className="nf" type="text" placeholder="لطفاً توضیح دهید..." value={otherValue}
              onChange={e => onOtherChange(e.target.value)}
              style={{ ...inp(), background: 'rgba(199,166,106,0.05)', borderColor: 'rgba(199,166,106,0.30)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
