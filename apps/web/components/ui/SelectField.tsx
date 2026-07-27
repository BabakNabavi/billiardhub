'use client'

/* دراپ‌داونِ اختصاصی — روی دسکتاپ پاپ‌آور، روی موبایل شیتِ پایین‌کشویی.
   جایگزین <select> نیتیو که روی موبایل زشت و غیرقابل استایل است. */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, X } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', GROUND = '#FAF8F3'

export interface SelectOption { value: string; label: string; dot?: string }

export default function SelectField({
  value, onChange, options, placeholder = 'انتخاب کنید', label,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 620)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!open || mobile) return
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect()
      if (r) setRect({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    place()
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place)
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [open, mobile])

  /* بازبودنِ شیتِ موبایل نباید صفحه را اسکرول کند */
  useEffect(() => {
    if (!open || !mobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open, mobile])

  const selected = options.find(o => o.value === value)

  const list = (
    <div role="listbox" style={{ maxHeight: mobile ? '62vh' : 300, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      {options.map(o => {
        const on = o.value === value
        return (
          <button key={o.value} type="button" role="option" aria-selected={on}
            onClick={() => { onChange(o.value); setOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'right',
              padding: mobile ? '14px 18px' : '11px 14px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: mobile ? 14.5 : 13.5, fontWeight: on ? 800 : 500,
              background: on ? 'rgba(199,166,106,0.11)' : 'transparent', color: on ? GOLD_D : INK,
            }}>
            {o.dot && <span style={{ width: 9, height: 9, borderRadius: '50%', background: o.dot, flexShrink: 0, boxShadow: `0 0 6px ${o.dot}66` }} />}
            <span style={{ flex: 1, minWidth: 0 }}>{o.label}</span>
            {on && <Check size={16} style={{ flexShrink: 0 }} />}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {label && <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>{label}</span>}
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 9,
          padding: '11px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5,
          background: GROUND, border: `1px solid ${open ? 'rgba(199,166,106,0.55)' : LINE}`,
          color: selected ? INK : MUT, textAlign: 'right', transition: 'border-color .2s',
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.13)' : 'none',
        }}>
        {selected?.dot && <span style={{ width: 9, height: 9, borderRadius: '50%', background: selected.dot, flexShrink: 0 }} />}
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected ? 700 : 500 }}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} style={{ color: GOLD_D, flexShrink: 0, transition: 'transform .22s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        mobile ? (
          /* ── شیتِ موبایل ── */
          <div onClick={() => setOpen(false)} dir="rtl"
            style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(20,18,14,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', animation: 'sfFade .2s ease' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: '#fff', borderRadius: '22px 22px 0 0', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -20px 50px rgba(20,18,14,0.25)', animation: 'sfUp .28s cubic-bezier(.22,1,.36,1)', fontFamily: 'var(--font-base)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                <span style={{ width: 40, height: 4, borderRadius: 3, background: LINE }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px 10px', borderBottom: `1px solid ${LINE}` }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: INK, flex: 1 }}>{label ?? placeholder}</span>
                <button type="button" onClick={() => setOpen(false)}
                  style={{ background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 10, padding: 7, cursor: 'pointer', color: SEC, display: 'flex' }}><X size={15} /></button>
              </div>
              {list}
            </div>
          </div>
        ) : (
          /* ── پاپ‌آورِ دسکتاپ ── */
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 3999 }} />
            <div dir="rtl" style={{
              position: 'fixed', top: rect?.top ?? 0, left: rect?.left ?? 0, width: rect?.width ?? 240, zIndex: 4000,
              background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(28,27,23,0.16)', animation: 'sfFade .16s ease', fontFamily: 'var(--font-base)',
            }}>{list}</div>
          </>
        ),
        document.body,
      )}

      <style>{`
        @keyframes sfFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sfUp { from { transform: translateY(100%) } to { transform: none } }
      `}</style>
    </>
  )
}
