'use client'

/* ─────────────────────────────────────────────────────────────
   «شهرهای تحت پوشش» — انتخاب چندتایی شهر از فهرست واقعی ایران.

   ── مشکلی که این را ساخت ──
   فیلد قبلی یک `<input>` متنی خالی بود با دکمه‌ی `+`. زدن `+` بدون
   تایپ هیچ کاری نمی‌کرد و کاربر فکر می‌کرد خراب است؛ و چون هر متنی
   پذیرفته می‌شد، «تهرون» و «تهران» دو شهر متفاوت می‌شدند.

   داده از همان `lib/iran-geo` می‌آید که بقیه‌ی پروژه استفاده می‌کند —
   قاعده‌ی «منبع واحد استان و شهر» در CLAUDE.md. این‌جا
   `ProvinceCitySelect` جواب نمی‌داد چون آن یکی یک جفت استان→شهر
   می‌گیرد و این فیلد چند شهر از چند استان می‌خواهد.

   «کل ایران» گزینه‌ی اول است و انحصاری: انتخابش بقیه را کنار می‌زند،
   چون «کل ایران + تهران» خودش را نقض می‌کند.

   ── چرا منوی دکمه‌ای و نه listbox ──
   `role="listbox"` فقط `option` می‌پذیرد؛ با فرزند `<button>` صفحه‌خوان
   فهرست را خالی اعلام می‌کند. تا وقتی ناوبری کامل combobox با
   `aria-activedescendant` نداریم، منوی سرراست دکمه‌ای صادق‌تر است.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { getProvinces } from '../lib/iran-geo'

export const ALL_IRAN = 'کل ایران'

interface Row { city: string; province: string }

export interface CoverageCitySelectProps {
  value: string[]
  onChange: (v: string[]) => void
  label?: string
  /** سقف پیشنهادهای نمایش‌داده‌شده — بقیه با جست‌وجو پیدا می‌شوند */
  maxOptions?: number
}

const RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(199,166,106,0.55)]'

export default function CoverageCitySelect({
  value, onChange, label = 'شهرهای تحت پوشش', maxOptions = 60,
}: CoverageCitySelectProps) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  /* دو نمونه روی یک صفحه نباید شناسه‌ی یکسان بسازند، وگرنه
     `htmlFor` به ورودی اشتباه وصل می‌شود. */
  const uid = useId()

  /* ۱۱۵۶ مدخل شهر — یک‌بار صاف می‌شود، نه در هر تایپ */
  const all = useMemo<Row[]>(
    () => getProvinces().flatMap(p => p.cities.map(c => ({ city: c, province: p.name }))),
    [])

  const picked = useMemo(() => new Set(value), [value])
  const allIran = picked.has(ALL_IRAN)

  /* شمار کل نتیجه‌ها جداست تا بشود گفت «و N شهر دیگر» —
     بریدن بی‌صدای فهرست، «پیدا نشد» به نظر می‌رسد. */
  const { shown, total } = useMemo(() => {
    const t = q.trim()
    const base = (t ? all.filter(r => r.city.includes(t) || r.province.includes(t)) : all)
      .filter(r => !picked.has(r.city))
    return { shown: base.slice(0, maxOptions), total: base.length }
  }, [q, all, picked, maxOptions])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const add = (city: string) => {
    /* «کل ایران» در هر دو جهت انحصاری است */
    onChange(city === ALL_IRAN ? [ALL_IRAN] : [...value.filter(v => v !== ALL_IRAN), city])
    setQ(''); setOpen(false)
  }
  const remove = (city: string) => onChange(value.filter(v => v !== city))

  return (
    <div ref={wrap} className="relative">
      <label htmlFor={uid} className="mb-1.5 block text-[12.5px] font-bold text-[#5B564B]">
        {label}
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} aria-hidden
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#A69F8E]" />
          <input
            id={uid} value={q} autoComplete="off"
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => {
              /* با جست‌وجوی خالی، `shown[0]` فقط اولین شهر اولین استان
                 است — نه چیزی که کاربر قصدش را داشته. */
              if (e.key === 'Enter' && q.trim()) { e.preventDefault(); const f = shown[0]; if (f) add(f.city) }
              if (e.key === 'Escape') setOpen(false)
            }}
            placeholder="نام شهر یا استان را بنویسید…"
            className={`w-full rounded-[10px] border border-[#E7E2D6] bg-[#FAFAF7] py-2 pe-3 ps-8 text-[13px] text-[#1C1B17] transition focus:border-[rgba(199,166,106,0.55)] ${RING}`} />
        </div>
        <button type="button" onClick={() => setOpen(o => !o)}
          aria-label="نمایش فهرست شهرها" aria-expanded={open}
          className={`lq-icon-btn ${RING}`}><Plus size={14} /></button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#E7E2D6] bg-white shadow-[0_12px_32px_rgba(28,27,23,0.14)]">
          {!allIran && (
            <button type="button" onClick={() => add(ALL_IRAN)}
              className={`flex w-full items-center justify-between border-b border-[#F0EDE8] px-3 py-3 text-[13px] font-extrabold text-[#8F6531] transition hover:bg-[rgba(199,166,106,0.12)] ${RING}`}>
              {ALL_IRAN}
              <span className="text-[11px] font-semibold text-[#A69F8E]">همه‌ی استان‌ها</span>
            </button>
          )}

          {shown.length === 0 ? (
            <p className="px-3 py-4 text-center text-[12.5px] text-[#6F6A5C]">
              {q.trim() ? 'شهری با این نام پیدا نشد' : 'همه‌ی شهرها انتخاب شده‌اند'}
            </p>
          ) : (
            <>
              {shown.map(r => (
                <button key={`${r.province}/${r.city}`} type="button" onClick={() => add(r.city)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-[13px] text-[#1C1B17] transition hover:bg-[rgba(199,166,106,0.12)] ${RING}`}>
                  {r.city}
                  <span className="text-[11px] text-[#A69F8E]">{r.province}</span>
                </button>
              ))}
              {total > shown.length && (
                <p className="border-t border-[#F0EDE8] px-3 py-2 text-center text-[11.5px] text-[#6F6A5C]">
                  و {total - shown.length} شهر دیگر — نامش را بنویسید
                </p>
              )}
            </>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map(c => (
            <span key={c}
              className="inline-flex items-center gap-1 rounded-full border border-[#E7E2D6] bg-[#FAFAF7] px-3 py-1 text-[11.5px] font-semibold text-[#5B564B]">
              {c}
              <button type="button" onClick={() => remove(c)}
                aria-label={`حذف ${c}`}
                className={`rounded-full text-[#B23B2E] ${RING}`}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
