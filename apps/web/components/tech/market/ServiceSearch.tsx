'use client'

/* ─────────────────────────────────────────────────────────────
   ماژول جست‌وجوی خدمت — «چه خدماتی؟» + «کجا؟»

   ⚠️ فرم واقعی است نه دکور: `<form>` با `onSubmit`، پس Enter هم
   کار می‌کند و صفحه‌خوان می‌فهمد این یک جست‌وجوست.

   ⚠️ فهرست شهر از منبع واحد `lib/iran-geo` می‌آید. نسخه‌ی قبلی
   فقط شهرهای متخصصان موجود را می‌داد و کاربر اصفهانی شهرش را در
   فهرست نمی‌دید (۳۱ استان، ۱۱۲۶ نام یکتای شهر).
   `withTechnicians` فقط برای نشانه‌گذاری است.

   ── چیدمان ──
   نوارِ شیشه‌ایِ شناور روی پایینِ سرلوحه: خودِ فرم قابِ شیشه است، نه
   جعبه‌ای داخلِ جعبه‌ی دیگر. دکمه هم داخلِ همان قاب است نه بیرونش،
   وگرنه دو عنصرِ جدا دیده می‌شوند.
   ───────────────────────────────────────────────────────────── */

import { useId } from 'react'
import { Search, MapPin } from 'lucide-react'
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
      <div className="tm-search-fields">
        <div className="tm-field tm-field--q">
          <label className="tm-label" htmlFor={qId}>چه خدماتی نیاز دارید؟</label>
          <input
            id={qId} className="tm-input" type="search"
            value={query} onChange={e => onQuery(e.target.value)}
            placeholder="تعمیر چوب، رگلاژ، نصب قطعات و …"
            autoComplete="off"
          />
        </div>

        <div className="tm-field tm-field--city">
          {/* نشانِ مکان داخلِ قرصِ روشن — همان چیزی که در طرح کنارِ
              «همه شهرها» می‌نشیند. برچسبِ متنی پنهان است چون خودِ
              نشان و مقدارِ انتخاب‌شده گویا هستند، ولی برای صفحه‌خوان
              می‌ماند. */}
          <span aria-hidden className="tm-search-pin"><MapPin size={17} /></span>
          <label className="tm-label tm-sr" htmlFor={cId}>شهر</label>
          <CityFilterSelect id={cId} value={city} onChange={onCity} withTechnicians={cities} />
        </div>
      </div>

      {/* دایره‌ی سبزِ تیره — تنها کنشِ اصلیِ نوار */}
      <button className="tm-search-go" type="submit" aria-label="جستجو">
        <Search size={19} aria-hidden />
      </button>
    </form>
  )
}
