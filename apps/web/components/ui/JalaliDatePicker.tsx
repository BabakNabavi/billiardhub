'use client'

/* انتخابگرِ تاریخِ شمسی — با کشویِ سال و ماه.

   تایپِ دستیِ تاریخ منبعِ اشتباه بود (ماه و روزِ یک‌رقمی، جابه‌جاییِ
   ماه و روز، سالِ اشتباه). این‌جا کاربر فقط انتخاب می‌کند؛ خروجی همیشه
   «۱۳۶۳/۶/۲» با ارقامِ لاتین است تا سرویس‌های استعلام همان را بپذیرند. */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import { J_MONTHS, toJalali, jalaliToGregorian, toFaDigits } from '../../lib/jalali'

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17', MUT = '#8A8474', LINE = '#E7E2D6'
const WD = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/* روزهای هر ماهِ شمسی (اسفندِ کبیسه ۳۰) */
function daysInJMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  /* اسفند: اگر ۱ فروردینِ سالِ بعد یک روز بعد از ۳۰ اسفند باشد ⇒ کبیسه */
  const [gy, gm, gd] = jalaliToGregorian(jy, 12, 30)
  const [, , backDay] = toJalali(gy, gm, gd)
  return backDay === 30 ? 30 : 29
}

/* شمسی → روزِ هفته (شنبه = ۰) */
function firstWeekday(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1)
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7
}

const parse = (v: string): { y: number; m: number; d: number } | null => {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(String(v || '').trim())
  if (!m) return null
  return { y: +m[1]!, m: +m[2]!, d: +m[3]! }
}

export interface JalaliDatePickerProps {
  value: string                       // «۱۳۶۳/۶/۲» یا خالی
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  /* بازه‌ی سال‌های قابلِ انتخاب — پیش‌فرض مناسبِ تاریخِ تولد */
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
  const hiYear = maxYear ?? today.y            // تاریخِ تولدِ آینده بی‌معناست

  const sel = parse(value)
  const [open, setOpen] = useState(false)
  const [viewY, setViewY] = useState(sel?.y ?? today.y - 25)
  const [viewM, setViewM] = useState(sel?.m ?? 1)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const s = parse(value)
    if (s) { setViewY(s.y); setViewM(s.m) }
  }, [open, value])

  /* کلیکِ بیرون و کلیدِ Escape می‌بندند */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const years = useMemo(() => {
    const out: number[] = []
    for (let y = hiYear; y >= loYear; y--) out.push(y)
    return out
  }, [loYear, hiYear])

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

  const selectStyle: React.CSSProperties = {
    appearance: 'none', width: '100%', padding: '8px 10px', paddingInlineEnd: 26,
    borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff',
    fontSize: 13, fontFamily: 'inherit', color: INK, cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ position: 'relative' }} ref={boxRef}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: MUT, marginBottom: 6 }}>
          {label}
        </label>
      )}

      <button
        id={id} type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px',
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, textAlign: 'right',
          background: '#fff', color: display ? INK : '#A69F8E',
          border: `1px solid ${error ? 'rgba(178,59,46,0.5)' : LINE}`,
        }}>
        <CalendarDays size={16} style={{ color: GOLD_D, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{display || placeholder}</span>
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

      {open && (
        <div dir="rtl" style={{
          position: 'absolute', zIndex: 1000, top: 'calc(100% + 8px)', insetInlineStart: 0,
          width: 'min(320px, 92vw)', background: '#fff', borderRadius: 16,
          border: `1px solid ${LINE}`, boxShadow: '0 22px 60px rgba(28,27,23,0.16)', padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>انتخاب تاریخ</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', padding: 2 }}>
              <X size={16} />
            </button>
          </div>

          {/* کشویِ ماه و سال — رسیدن به سالِ تولد بدونِ کلیکِ پیاپی */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <select value={viewM} onChange={e => setViewM(+e.target.value)} style={selectStyle} aria-label="ماه">
                {J_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', insetInlineStart: 8, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={viewY} onChange={e => setViewY(+e.target.value)} style={selectStyle} aria-label="سال">
                {years.map(y => <option key={y} value={y}>{toFaDigits(y)}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', insetInlineStart: 8, top: '50%', transform: 'translateY(-50%)', color: MUT, pointerEvents: 'none' }} />
            </div>
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
      )}
    </div>
  )
}
