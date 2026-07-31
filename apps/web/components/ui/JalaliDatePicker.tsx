'use client'

/* انتخابگر تاریخ شمسی — با کشوی سال و ماه.

   تایپ دستی تاریخ منبع اشتباه بود (ماه و روز یک‌رقمی، جابه‌جایی
   ماه و روز، سال اشتباه). این‌جا کاربر فقط انتخاب می‌کند؛ خروجی همیشه
   «۱۳۶۳/۶/۲» با ارقام لاتین است تا سرویس‌های استعلام همان را بپذیرند.

   پنل تقویم در portal روی <body> رندر می‌شود، نه داخل فرم: کارت
   ثبت‌نام `overflow: hidden` دارد و تقویم را از وسط می‌بُرید. با
   position: fixed و محاسبه‌ی جا، هیچ والدی نمی‌تواند ببُردش و اگر
   زیر فیلد جا نباشد، خودش بالای فیلد باز می‌شود. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react'
import { J_MONTHS, toJalali, jalaliToGregorian, toFaDigits } from '../../lib/jalali'

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17', MUT = '#8A8474', LINE = '#E7E2D6'
const WD = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const PANEL_W = 320
const PANEL_H = 396      // تقریب ارتفاع، فقط تا اندازه‌گیری واقعی
const LIST_H  = 208      // ارتفاع کشوی ماه/سال

/* روزهای هر ماه شمسی (اسفند کبیسه ۳۰) */
function daysInJMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  /* اسفند: اگر ۱ فروردین سال بعد یک روز بعد از ۳۰ اسفند باشد ⇒ کبیسه */
  const [gy, gm, gd] = jalaliToGregorian(jy, 12, 30)
  const [, , backDay] = toJalali(gy, gm, gd)
  return backDay === 30 ? 30 : 29
}

/* شمسی → روز هفته (شنبه = ۰) */
function firstWeekday(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1)
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7
}

const parse = (v: string): { y: number; m: number; d: number } | null => {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(String(v || '').trim())
  if (!m) return null
  return { y: +m[1]!, m: +m[2]!, d: +m[3]! }
}

/* ── کشوی سفارشی — به‌جای <select> بومی سیستم ────────────────── */
function Picker({ value, options, onChange, ariaLabel, width }: {
  value: number
  options: { v: number; label: string }[]
  onChange: (v: number) => void
  ariaLabel: string
  width?: number
}) {
  const [open, setOpen] = useState(false)
  /* اگر زیر دکمه جا نبود، لیست رو به بالا باز می‌شود — لیست سال بلند است */
  const [up, setUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    const b = btnRef.current?.getBoundingClientRect()
    if (b) setUp(window.innerHeight - b.bottom < LIST_H + 16 && b.top > window.innerHeight - b.bottom)
  }, [open])

  /* گزینه‌ی انتخاب‌شده باید در دید باشد — لیست سال ۱۰۰ ردیف دارد */
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector('[data-on="1"]') as HTMLElement | null
    if (el) listRef.current.scrollTop = el.offsetTop - listRef.current.clientHeight / 2 + el.clientHeight / 2
  }, [open, up])

  const current = options.find(o => o.v === value)?.label ?? ''

  return (
    <div ref={ref} style={{ position: 'relative', width: width ?? '100%' }}>
      <button
        ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        aria-label={ariaLabel} aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
          padding: '9px 12px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13.5, fontWeight: 700, color: INK, textAlign: 'right',
          background: open ? 'rgba(199,166,106,0.08)' : '#FAFAF7',
          border: `1px solid ${open ? 'rgba(199,166,106,0.55)' : LINE}`,
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.13)' : 'none',
          transition: 'border-color .2s, box-shadow .2s, background .2s',
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current}</span>
        <ChevronDown size={14} style={{
          color: open ? GOLD_D : MUT, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
        }} />
      </button>

      {open && (
        <div ref={listRef} role="listbox" style={{
          position: 'absolute', insetInline: 0, zIndex: 30,
          ...(up ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
          maxHeight: LIST_H, overflowY: 'auto', overscrollBehavior: 'contain',
          background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13,
          boxShadow: '0 16px 40px rgba(28,27,23,0.16)', padding: 4,
          animation: 'jdpIn .2s cubic-bezier(.22,1,.36,1) both',
        }}>
          {options.map(o => {
            const on = o.v === value
            return (
              <button
                key={o.v} type="button" role="option" aria-selected={on} data-on={on ? '1' : '0'}
                onClick={() => { onChange(o.v); setOpen(false) }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(199,166,106,0.09)' }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '9px 11px', border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 800 : 600,
                  color: on ? GOLD_D : 'rgba(0,0,0,0.66)',
                  background: on ? 'rgba(199,166,106,0.13)' : 'transparent',
                  textAlign: 'right', transition: 'background .15s',
                }}>
                {o.label}
                {on && <Check size={13} style={{ flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export interface JalaliDatePickerProps {
  value: string                       // «۱۳۶۳/۶/۲» یا خالی
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  /* بازه‌ی سال‌های قابل انتخاب — پیش‌فرض مناسب تاریخ تولد */
  minYear?: number
  maxYear?: number
  error?: string
  id?: string
}

export default function JalaliDatePicker({
  value, onChange, label, placeholder = 'انتخاب تاریخ', minYear, maxYear, error, id,
}: JalaliDatePickerProps) {
  const today = useMemo(() => {
    const n = new Date()
    const [y, m, d] = toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate())
    return { y, m, d }
  }, [])

  const loYear = minYear ?? today.y - 100
  const hiYear = maxYear ?? today.y            // تاریخ تولد آینده بی‌معناست

  const sel = parse(value)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [viewY, setViewY] = useState(sel?.y ?? today.y - 25)
  const [viewM, setViewM] = useState(sel?.m ?? 1)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* جای پنل نسبت به فیلد.

     ارتفاع واقعی پنل اندازه گرفته می‌شود، نه تخمین ثابت: با تخمین،
     وقتی زیر فیلد جا نبود پنل بالا می‌رفت و از بالای صفحه می‌زد بیرون.
     ترتیب: اول پایین، اگر جا نبود بالا، اگر بالا هم جا نبود همان‌جا
     که جا می‌شود — و پنل خودش داخلی اسکرول می‌کند. */
  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect()
    if (!b) return
    const vw = window.innerWidth, vh = window.innerHeight
    const w = Math.min(PANEL_W, vw - 16)
    const h = Math.min(panelRef.current?.offsetHeight || PANEL_H, vh - 16)

    let top = b.bottom + 8
    if (top + h > vh - 8) {
      const above = b.top - 8 - h
      top = above >= 8 ? above : Math.max(8, vh - h - 8)
    }

    /* در RTL پنل از لبه‌ی راست فیلد شروع می‌شود */
    let left = b.right - w
    left = Math.max(8, Math.min(left, vw - w - 8))

    setPos({ top, left })
  }, [])

  useLayoutEffect(() => { if (open) place() }, [open, place])

  useEffect(() => {
    if (!open) return
    const s = parse(value)
    if (s) { setViewY(s.y); setViewM(s.m) }
  }, [open, value])

  /* کلیک بیرون، Escape، اسکرول و تغییر اندازه */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  const years = useMemo(() => {
    const out: { v: number; label: string }[] = []
    for (let y = hiYear; y >= loYear; y--) out.push({ v: y, label: toFaDigits(y) })
    return out
  }, [loYear, hiYear])

  const months = useMemo(() => J_MONTHS.map((m, i) => ({ v: i + 1, label: m })), [])

  const cells = useMemo(() => {
    const n = daysInJMonth(viewY, viewM)
    const pad = firstWeekday(viewY, viewM)
    return [...Array(pad).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)] as (number | null)[]
  }, [viewY, viewM])

  const isFuture = (d: number) =>
    viewY > today.y
    || (viewY === today.y && viewM > today.m)
    || (viewY === today.y && viewM === today.m && d > today.d)

  const pick = (d: number) => {
    onChange(`${viewY}/${viewM}/${d}`)
    setOpen(false)
  }

  const display = sel ? `${toFaDigits(sel.d)} ${J_MONTHS[sel.m - 1]} ${toFaDigits(sel.y)}` : ''

  const panel = (
    <div
      ref={panelRef} dir="rtl"
      style={{
        position: 'fixed', zIndex: 3000,
        top: pos?.top ?? -9999, left: pos?.left ?? -9999,
        width: Math.min(PANEL_W, typeof window !== 'undefined' ? window.innerWidth - 16 : PANEL_W),
        background: '#fff', borderRadius: 16, border: `1px solid ${LINE}`,
        boxShadow: '0 22px 60px rgba(28,27,23,0.18)', padding: 14,
        maxHeight: 'calc(100vh - 16px)', overflowY: 'auto', overscrollBehavior: 'contain',
        fontFamily: 'inherit', visibility: pos ? 'visible' : 'hidden',
        animation: 'jdpIn .22s cubic-bezier(.22,1,.36,1) both',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>انتخاب تاریخ</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="بستن"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      {/* کشوی ماه و سال — رسیدن به سال تولد بدون کلیک پیاپی */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Picker value={viewM} options={months} onChange={setViewM} ariaLabel="ماه" />
        <Picker value={viewY} options={years} onChange={setViewY} ariaLabel="سال" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {WD.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: MUT, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />
          const isSel = !!sel && sel.y === viewY && sel.m === viewM && sel.d === d
          const isToday = today.y === viewY && today.m === viewM && today.d === d
          const disabled = isFuture(d)
          return (
            <button key={d} type="button" disabled={disabled} onClick={() => pick(d)}
              style={{
                height: 34, borderRadius: 9, border: 'none', fontSize: 13, fontFamily: 'inherit',
                fontWeight: isSel || isToday ? 800 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: isSel ? `linear-gradient(135deg,${GOLD},#A07840)` : isToday ? 'rgba(199,166,106,0.12)' : 'transparent',
                color: isSel ? '#fff' : disabled ? 'rgba(0,0,0,0.18)' : isToday ? GOLD_D : 'rgba(0,0,0,0.62)',
                opacity: disabled ? 0.45 : 1, transition: 'background .15s',
              }}>
              {toFaDigits(d)}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <style>{`@keyframes jdpIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; } }`}</style>

      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: MUT, marginBottom: 6 }}>
          {label}
        </label>
      )}

      <button
        ref={btnRef} id={id} type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px',
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, textAlign: 'right',
          background: '#fff', color: display ? INK : '#A69F8E',
          border: `1px solid ${error ? 'rgba(178,59,46,0.5)' : open ? 'rgba(199,166,106,0.55)' : LINE}`,
          boxShadow: open ? '0 0 0 3px rgba(199,166,106,0.13)' : 'none',
          transition: 'border-color .2s, box-shadow .2s',
        }}>
        <CalendarDays size={16} style={{ color: GOLD_D, flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display || placeholder}</span>
        {display && (
          <span role="button" tabIndex={0} aria-label="پاک کردن"
            onClick={e => { e.stopPropagation(); onChange('') }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onChange('') } }}
            style={{ display: 'flex', color: MUT, padding: 2 }}>
            <X size={14} />
          </span>
        )}
      </button>

      {error && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#B23B2E', marginTop: 5 }}>{error}</div>}

      {/* روی <body> رندر می‌شود تا overflow: hidden هیچ والدی نبُردش */}
      {open && mounted && createPortal(panel, document.body)}
    </div>
  )
}
