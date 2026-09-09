/* ─────────────────────────────────────────────────────────────
   جست‌وجو و فیلتر اخبار.

   ⚠️ عمدا یک `<form method="get">` ساده است، نه یک ویجت کلاینتی:
   نتیجه نشانی خودش را می‌گیرد (`/news?q=…&s=…&d=…`)، قابل
   اشتراک‌گذاری و بوکمارک است، دکمه‌ی بازگشت مرورگر درست کار می‌کند،
   و روی شبکه‌ی کند بدون هیچ جاوااسکریپتی هم کار می‌کند. یک نوار
   جست‌وجوی خبری هیچ‌کدام از اینها را نباید از دست بدهد.

   ⚠️ بازه‌ی زمانی رادیوی واقعی است نه دکمه‌ی جعلی، تا با صفحه‌کلید و
   صفحه‌خوان هم کار کند؛ ظاهر قرصی‌شکل فقط CSS روی همان رادیوهاست.
   ───────────────────────────────────────────────────────────── */

import { NAV_SECTIONS, NEWS_SECTIONS } from '@/lib/news/sections'

export interface SearchBarProps {
  /** روی صفحه‌ی اول فقط ورودی و دکمه */
  slim?: boolean
  q: string
  section: string | null
  range: string
  ranges: ReadonlyArray<{ key: string; label: string }>
}

export function SearchBar({ q, section, range, ranges, slim = false }: SearchBarProps) {
  return (
    <form className={`nr-search${slim ? ' nr-search--slim' : ''}`} action="/news" method="get" role="search">
      <div className="nr-search-row">
        <label className="nr-sr" htmlFor="nr-q">جست‌وجو در اخبار</label>
        <input
          id="nr-q" name="q" type="search" defaultValue={q}
          className="nr-search-in" autoComplete="off"
          placeholder="جست‌وجو در اخبار، بازیکنان و مسابقات…"
        />

        <label className="nr-sr" htmlFor="nr-s">بخش</label>
        <select id="nr-s" name="s" defaultValue={section ?? ''} className="nr-search-sel">
          <option value="">همه‌ی بخش‌ها</option>
          {NAV_SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          {/* بخش‌های خارج از نوار هم باید قابل انتخاب باشند */}
          {NEWS_SECTIONS.filter(s => !s.nav).map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <button className="nr-btn nr-search-go" type="submit">جست‌وجو</button>
      </div>

      <fieldset className="nr-range">
        <legend className="nr-sr">بازه زمانی</legend>
        {ranges.map(r => (
          <label key={r.key} className="nr-range-opt">
            <input type="radio" name="d" value={r.key} defaultChecked={range === r.key} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
    </form>
  )
}
