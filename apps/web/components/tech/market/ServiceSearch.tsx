'use client'

/* ─────────────────────────────────────────────────────────────
   ماژولِ جست‌وجوی خدمت — «چه خدمتی؟» + «کجا؟»

   ⚠️ فرمِ واقعی است نه دکور: `<form>` با `onSubmit`، پس Enter هم
   کار می‌کند و صفحه‌خوان می‌فهمد این یک جست‌وجوست.

   ⚠️ فهرستِ شهر از `getCities`/`getProvinceNames` نمی‌آید بلکه از
   *شهرهای متخصصانِ موجود*. قاعده‌ی پروژه استفاده از منبعِ واحد را
   برای **ورودیِ کاربر** الزامی می‌کند؛ این یک فیلترِ فهرست است و
   نشان‌دادنِ ۱۱۹۳ شهری که هیچ متخصصی ندارند فقط بن‌بست می‌سازد.
   ───────────────────────────────────────────────────────────── */

import { useId } from 'react'
import { Search } from 'lucide-react'

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
        <select id={cId} className="tm-select" value={city} onChange={e => onCity(e.target.value)}>
          <option value="all">همه شهرها</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button className="tm-btn tm-btn--primary" type="submit">
        <Search size={16} aria-hidden />
        جستجو
      </button>
    </form>
  )
}
