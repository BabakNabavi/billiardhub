'use client'

/* ─────────────────────────────────────────────────────────────
   کشوی سفارشی — جایگزین <select> بومی سیستم.

   select بومی در هر سیستم‌عامل شکل خودش را دارد و با بقیه‌ی فرم
   جور در نمی‌آید؛ این‌جا همان تینت طلایی برند، تیک گزینه‌ی
   انتخاب‌شده، و بازشدن رو به بالا وقتی زیرش جا نیست.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

const INK = '#1C1B17', MUT = '#8A8474', LINE = '#E7E2D6', GOLD_D = '#9A6E38'
const LIST_H = 240

export interface SelectOption<T extends string | number = string> {
  value: T
  label: string
  hint?: string
}

export default function Select<T extends string | number = string>({
  value, options, onChange, placeholder = 'انتخاب کنید…', disabled, ariaLabel, style, compact,
  latin, noChevron, center,
}: {
  value: T | ''
  options: SelectOption<T>[]
  onChange: (v: T) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  style?: React.CSSProperties
  compact?: boolean
  /** ارقامِ برچسب‌ها لاتین بمانند.
   *
   *  `PersianDigits` هر متنِ رندرشده‌ای را فارسی می‌کند — که برای
   *  تقریباً همه‌جای سایت درست است، ولی نه برای «Best of 5» که یک
   *  اصطلاحِ لاتین است و «Best of ۵» نه فارسی است نه انگلیسی.
   *  کلاسِ `bh-latin` همان راهِ کنارگذاشتنی است که خودِ آن کامپوننت
   *  تعریف کرده. */
  latin?: boolean
  /** فلشِ رو‌به‌پایین رندر نشود.
   *
   *  برای جعبه‌های خیلی باریک مثلِ ساعت و دقیقه: آن‌جا فلش با فاصله‌اش
   *  حدودِ ۲۲px از یک جعبه‌ی ۶۲پیکسلی را می‌گیرد — یعنی یک‌سومِ عرض —
   *  و چیزی هم نمی‌گوید که از خودِ عدد و اشاره‌گر معلوم نباشد. */
  noChevron?: boolean
  /** متن وسط‌چین — برای جعبه‌های عددیِ باریک */
  center?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    const b = btnRef.current?.getBoundingClientRect()
    if (b) setUp(window.innerHeight - b.bottom < LIST_H + 16 && b.top > window.innerHeight - b.bottom)
  }, [open])

  /* گزینه‌ی انتخاب‌شده باید در دید باشد */
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector('[data-on="1"]') as HTMLElement | null
    if (el) listRef.current.scrollTop = el.offsetTop - listRef.current.clientHeight / 2 + el.clientHeight / 2
  }, [open, up])

  const current = options.find(o => o.value === value)
  const pad = compact ? '8px 11px' : '10px 13px'

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', ...style }}>
      <style>{`@keyframes bhSelIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; } }`}</style>

      <button
        ref={btnRef} type="button" disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-label={ariaLabel} aria-expanded={open} aria-haspopup="listbox"
        className={latin ? 'bh-latin' : undefined}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: center ? 'center' : 'space-between',
          gap: noChevron ? 0 : 8,
          padding: noChevron ? (compact ? '8px 4px' : '10px 6px') : pad,
          borderRadius: 11, fontFamily: 'inherit',
          fontSize: compact ? 12.5 : 13.5, fontWeight: 700,
          textAlign: center ? 'center' : 'right',
          color: current ? INK : MUT,
          background: disabled ? 'rgba(0,0,0,0.03)' : open ? 'rgba(199,166,106,0.08)' : '#fff',
          border: `1px solid ${open ? 'rgba(199,166,106,0.55)' : LINE}`,
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.13)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color .2s, box-shadow .2s, background .2s',
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.label ?? placeholder}
        </span>
        {!noChevron && (
          <ChevronDown size={14} style={{
            color: open ? GOLD_D : MUT, flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
          }} />
        )}
      </button>

      {open && !disabled && (
        <div ref={listRef} role="listbox" className={latin ? 'bh-latin' : undefined} style={{
          position: 'absolute', insetInline: 0, zIndex: 60,
          ...(up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
          maxHeight: LIST_H, overflowY: 'auto', overscrollBehavior: 'contain',
          background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13,
          boxShadow: '0 16px 44px rgba(28,27,23,0.17)', padding: 4,
          animation: 'bhSelIn .2s cubic-bezier(.22,1,.36,1) both',
        }}>
          {options.map(o => {
            const on = o.value === value
            return (
              <button
                key={String(o.value)} type="button" role="option" aria-selected={on} data-on={on ? '1' : '0'}
                onClick={() => { onChange(o.value); setOpen(false) }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(199,166,106,0.09)' }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '9px 11px', border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 800 : 600,
                  color: on ? GOLD_D : 'rgba(0,0,0,0.68)',
                  background: on ? 'rgba(199,166,106,0.13)' : 'transparent',
                  textAlign: 'right', transition: 'background .15s',
                }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                  {o.hint && <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: MUT, marginTop: 2 }}>{o.hint}</span>}
                </span>
                {on && <Check size={13} style={{ flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
