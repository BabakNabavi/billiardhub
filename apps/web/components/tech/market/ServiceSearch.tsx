'use client'

/* ─────────────────────────────────────────────────────────────
   ماژولِ جست‌وجوی خدمت — «چه خدمتی؟» + «کجا؟»

   ⚠️ فرمِ واقعی است نه دکور: `<form>` با `onSubmit`، پس Enter هم
   کار می‌کند و صفحه‌خوان می‌فهمد این یک جست‌وجوست.

   ⚠️ فهرستِ شهر از منبعِ واحدِ `lib/iran-geo` می‌آید. نسخه‌ی قبلی
   فقط شهرهای متخصصانِ موجود را می‌داد و کاربرِ اصفهانی شهرش را در
   فهرست نمی‌دید (۳۱ استان، ۱۱۲۶ نامِ یکتای شهر).
   `withTechnicians` فقط برای نشانه‌گذاری است.
   ───────────────────────────────────────────────────────────── */

import { useId } from 'react'
import { Search } from 'lucide-react'
import { CityFilterSelect } from './CityFilterSelect'

export interface ServiceSearchProps {
  query: string
  onQuery: (v: string) => void
  city: string
  onCity: (v: string) => void
  cities: readonly string[]
  onSubmit: () => void
}

export function ServiceSearch({ query, onQuery, city, onCity, cities, onSubmit }: ServiceSearchProps) {
  const uid = useId()
  const qId = `${uid}-q`
  const cId = `${uid}-c`

  return (
    <form
      className="tm-search"
      role="search"
      onSubmit={e => { e.preventDefault(); onSubmit() }}
    >
      <div className="tm-field">
        <label className="tm-label" htmlFor={qId}>چه خدمتی نیاز داری؟</label>
        <input
          id={qId} className="tm-input" type="search"
          value={query} onChange={e => onQuery(e.target.value)}
          placeholder="مثلاً تعویض فرول، تراز میز…"
          autoComplete="off"
        />
      </div>

      <div className="tm-field">
        <label className="tm-label" htmlFor={cId}>شهر</label>
        <CityFilterSelect id={cId} value={city} onChange={onCity} withTechnicians={cities} />
      </div>

      <button className="tm-btn tm-btn--primary" type="submit">
        <Search size={16} aria-hidden />
        جستجو
      </button>
    </form>
  )
}
