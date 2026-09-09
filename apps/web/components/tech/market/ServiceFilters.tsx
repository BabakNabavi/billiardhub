'use client'

/* ─────────────────────────────────────────────────────────────
   فیلترهای دایرکتوری.

   ── قاعده‌ی سخت: فیلترِ بدونِ داده ساخته نمی‌شود ──
   ستون‌هایی که واقعاً وجود دارند: شهر، نوعِ خدمت (`onsite` /
   `workshop`)، تأییدِ ادمین (`verified`)، و امتیاز
   (`rating_avg` / `rating_count` — مهاجرتِ ۰۸۹).

   ستون‌هایی که **وجود ندارند**: قیمت، فاصله، و «امروز/این هفته».
   این سه به‌جای حذف، *خاموش* نمایش داده می‌شوند با برچسبِ «به‌زودی»
   تا معلوم باشد نبودشان تصمیم است نه فراموشی. جعلِ فیلتر — نمایشش
   طوری که انگار کار می‌کند — بدترین حالت است.
   ───────────────────────────────────────────────────────────── */


export interface FilterState {
  city: string
  /** 'all' | 'onsite' | 'workshop' */
  mode: string
  verifiedOnly: boolean
  /** 0 = بدون فیلتر، وگرنه کفِ امتیاز */
  minRating: number
}

export const EMPTY_FILTERS: FilterState = {
  city: 'all', mode: 'all', verifiedOnly: false, minRating: 0,
}

export function countActive(f: FilterState): number {
  return (f.city !== 'all' ? 1 : 0)
    + (f.mode !== 'all' ? 1 : 0)
    + (f.verifiedOnly ? 1 : 0)
    + (f.minRating > 0 ? 1 : 0)
}

export interface ServiceFiltersProps {
  value: FilterState
  onChange: (next: FilterState) => void
  cities: readonly string[]
  /** آیا اصلاً نظری در سیستم هست؟ اگر نه، فیلترِ امتیاز خاموش است */
  hasAnyRating: boolean
  idPrefix: string
}

export function ServiceFilters({ value, onChange, cities, hasAnyRating, idPrefix }: ServiceFiltersProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })

  return (
    <>
      <div className="tm-fgroup">
        <label className="tm-fhead" htmlFor={`${idPrefix}-city`}>شهر</label>
        <select
          id={`${idPrefix}-city`} className="tm-select"
          value={value.city} onChange={e => set({ city: e.target.value })}
        >
          <option value="all">همه شهرها</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <fieldset className="tm-fgroup">
        <legend>نوع خدمت</legend>
        {([
          ['all', 'همه'],
          ['onsite', 'اعزام به محل'],
          ['workshop', 'پذیرش در کارگاه'],
        ] as const).map(([v, label]) => (
          <label className="tm-check" key={v}>
            <input
              type="radio" name={`${idPrefix}-mode`} value={v}
              checked={value.mode === v}
              onChange={() => set({ mode: v })}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {/* ⚠️ فیلترِ امتیاز فقط وقتی *وجود دارد* که نظری در کار باشد.
          امروز روتِ نظرات فقط `coach` را می‌پذیرد
          (`app/api/profiles/[kind]/[slug]/reviews/route.ts`)، پس متخصص
          هرگز امتیاز نمی‌گیرد و این بخش همیشه خاموش می‌ماند —
          سه کنترلِ مرده که هر بار رندر می‌شوند. به‌محضِ افزوده‌شدنِ
          `'technician'` به `KINDS`، خودبه‌خود برمی‌گردد. */}
      {hasAnyRating && (
        <fieldset className="tm-fgroup">
          <legend>امتیاز</legend>
          {([[0, 'همه'], [4, '۴ و بالاتر'], [4.5, '۴٫۵ و بالاتر']] as const).map(([v, label]) => (
            <label className="tm-check" key={v}>
              <input
                type="radio" name={`${idPrefix}-rate`}
                checked={value.minRating === v}
                onChange={() => set({ minRating: v })}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      <div className="tm-fgroup">
        <label className="tm-check">
          <input
            type="checkbox" checked={value.verifiedOnly}
            onChange={e => set({ verifiedOnly: e.target.checked })}
          />
          فقط متخصصان تأییدشده
        </label>
      </div>

      {/* ⚠️ سه فیلترِ زیر ستونی در دیتابیس ندارند. دیده می‌شوند تا
          مسیرِ محصول معلوم باشد، ولی خاموش‌اند و برچسب دارند. */}
      <fieldset className="tm-fgroup" disabled>
        <legend>در دسترس بودن</legend>
        <label className="tm-check">
          <input type="checkbox" disabled />
          امروز
          <span className="tm-soon">به‌زودی</span>
        </label>
        <label className="tm-check">
          <input type="checkbox" disabled />
          این هفته
          <span className="tm-soon">به‌زودی</span>
        </label>
      </fieldset>

      <fieldset className="tm-fgroup" disabled>
        <legend>محدوده قیمت</legend>
        <label className="tm-check">
          <input type="checkbox" disabled />
          فیلتر بر اساس قیمت
          <span className="tm-soon">به‌زودی</span>
        </label>
      </fieldset>
    </>
  )
}

