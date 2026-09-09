'use client'

/* ─────────────────────────────────────────────────────────────
   انتخاب شهر برای فیلتر دایرکتوری.

   ⚠️ نسخه قبلی یک select بومی با ۱۱۲۶ گزینه بود. روی موبایل یعنی
   چرخاندن یک استوانه با هزار سطر، و روی دسکتاپ فهرستی بلند که فقط
   با جست‌وجوی تایپی مرورگر (که پس از یک ثانیه ریست می‌شود) قابل
   استفاده بود. حالا یک جعبه سرچ‌دار است.

   ⚠️ فهرست از lib/iran-geo می‌آید — همان منبع واحدی که
   ProvinceCitySelect و همه فرم‌ها از آن می‌خوانند.

   ⚠️ نام تکراری بین استان‌ها حذف می‌شود (سردشت در چهار استان و ۲۹
   نام دیگر). فیلتر فقط نام شهر را مقایسه می‌کند، پس دو گزینه
   هم‌مقدار هیچ تفاوتی در نتیجه نمی‌سازند و فقط سردرگمی‌اند.

   ⚠️ پنل با Portal روی body می‌نشیند: کارت فیلتر overflow دارد و
   بدون Portal فهرست زیر لبه کارت بریده می‌شد — همان تله‌ای که
   ProvinceCitySelect هم برایش Portal گرفت.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { getProvinces } from '@/lib/iran-geo'

export interface CityFilterSelectProps {
  id: string
  value: string
  onChange: (v: string) => void
  className?: string
  /** شهرهایی که دست‌کم یک متخصص دارند */
  withTechnicians?: readonly string[]
}

interface Row { city: string; province: string }

const ROWS: Row[] = (() => {
  const seen = new Set<string>()
  const out: Row[] = []
  for (const p of getProvinces().slice().sort((a, b) => a.name.localeCompare(b.name, 'fa'))) {
    for (const c of p.cities) {
      if (seen.has(c)) continue
      seen.add(c)
      out.push({ city: c, province: p.name })
    }
  }
  return out
})()

const EMPTY: readonly string[] = []

/* ⚠️ «ی/ي» و «ک/ك» و نویسه‌های نامرئی یکسان می‌شوند: کاربری که با
   صفحه‌کلید عربی «كرج» می‌نویسد بدون این هیچ نتیجه‌ای نمی‌گیرد. */
const norm = (s: string) =>
  s.replace(/[‌‎‏]/g, '').replace(/ی/g, 'ي').replace(/ک/g, 'ك').trim()

export function CityFilterSelect({
  id, value, onChange, className = 'tm-select', withTechnicians = EMPTY,
}: CityFilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const have = useMemo(() => new Set(withTechnicians), [withTechnicians])

  const list = useMemo(() => {
    const t = norm(q)
    if (!t) return ROWS
    const starts: Row[] = []
    const has: Row[] = []
    for (const r of ROWS) {
      const c = norm(r.city)
      if (c.startsWith(t)) starts.push(r)
      else if (c.includes(t) || norm(r.province).includes(t)) has.push(r)
    }
    /* آنچه با عبارت شروع می‌شود اول می‌آید */
    return [...starts, ...has]
  }, [q])

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const GAP = 6, EDGE = 10
    const vh = window.innerHeight, vw = window.innerWidth
    const below = vh - r.bottom - GAP - EDGE
    const above = r.top - GAP - EDGE
    const up = below < 240 && above > below
    const maxH = Math.max(200, Math.min(380, up ? above : below))
    const width = Math.min(Math.max(r.width, 260), vw - EDGE * 2)
    setRect({
      top: up ? Math.max(EDGE, r.top - GAP - maxH) : r.bottom + GAP,
      left: Math.min(Math.max(EDGE, r.left), Math.max(EDGE, vw - width - EDGE)),
      width, maxH,
    })
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return
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

  useEffect(() => {
    if (!open) return
    setQ('')
    setActive(0)
    /* روی موبایل فوکوس نمی‌گیریم: کیبورد همان پنلی را که تازه جا شده
       دوباره از صفحه بیرون می‌اندازد. */
    if (window.innerWidth <= 820) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  const pick = (city: string) => { onChange(city); setOpen(false) }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, list.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const r = list[active]
      if (r) pick(r.city)
    }
  }

  const btnClass = className + ' tm-citybtn' + (open ? ' is-open' : '')

  return (
    <>
      <button
        ref={btnRef} id={id} type="button" className={btnClass}
        onClick={() => { if (!open) place(); setOpen(o => !o) }}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className={value === 'all' ? 'tm-citybtn-ph' : undefined}>
          {value === 'all' ? 'همه شهرها' : value}
        </span>
        <ChevronDown size={16} aria-hidden />
      </button>

      {open && rect && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef} className="tm-citypanel" role="listbox" dir="rtl"
          style={{ top: rect.top, left: rect.left, width: rect.width, maxHeight: rect.maxH }}
        >
          <div className="tm-citysearch">
            <Search size={15} aria-hidden />
            <input
              ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setActive(0) }}
              onKeyDown={onKey} placeholder="نام شهر یا استان…"
              aria-label="جست‌وجوی شهر" autoComplete="off"
            />
            {q !== '' && (
              <button type="button" onClick={() => { setQ(''); inputRef.current?.focus() }} aria-label="پاک کردن">
                <X size={14} aria-hidden />
              </button>
            )}
          </div>

          <div className="tm-citylist">
            <button
              type="button" role="option" aria-selected={value === 'all'}
              className={'tm-cityopt' + (value === 'all' ? ' is-sel' : '')}
              onClick={() => pick('all')}
            >
              <span className="tm-cityname">همه شهرها</span>
              {value === 'all' && <Check size={15} aria-hidden />}
            </button>

            {list.length === 0 ? (
              <p className="tm-cityempty">شهری با این نام پیدا نشد</p>
            ) : list.map((r, i) => (
              <button
                key={r.city} type="button" role="option" aria-selected={r.city === value}
                className={'tm-cityopt'
                  + (r.city === value ? ' is-sel' : '')
                  + (i === active ? ' is-active' : '')}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r.city)}
              >
                <span className="tm-cityname">{r.city}</span>
                <span className="tm-cityprov">{r.province}</span>
                {/* نشانه فقط روی شهرهایی که واقعا متخصص دارند */}
                {have.has(r.city) && <span className="tm-citydot" aria-label="متخصص دارد" />}
                {r.city === value && <Check size={15} aria-hidden />}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
