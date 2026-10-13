'use client'

/* ─────────────────────────────────────────────────────────────
   نوارِ ابزارِ فهرستِ باشگاه‌ها: جست‌وجو، فیلتر، نزدیکِ من، ترتیب، نما.

   ── چسبان فقط از تبلت ──
   روی گوشی نوارِ دوطبقه (جست‌وجو + کنترل‌ها) ۱۲۰ پیکسل از ۶۶۷ پیکسلِ
   صفحه را همیشه می‌گرفت. آن‌جا با صفحه بالا می‌رود — و چون نمی‌چسبد،
   شیشه‌ی پشتش هم لازم نیست (`backdrop-filter` روی CPUِ ضعیف هزینه دارد).

   ── `top` ──
   از `--nav-offset` (۷۲ پیکسل + ناحیه‌ی امن). عددِ ثابتِ ۶۲ پیشین
   ۱۰ پیکسل زیرِ نوارِ بالا می‌رفت.

   ── اندازه‌ی متنِ جست‌وجو ──
   روی گوشی ۱۶ پیکسل است، نه ۱۳: سافاریِ iOS روی ورودیِ زیرِ ۱۶
   پیکسل هنگامِ فوکوس صفحه را بزرگ می‌کند و دیگر برنمی‌گرداند.

   ── ترتیب: دکمه‌ها، نه «منو» ──
   `role="menu"` به صفحه‌خوان وعده‌ی کلیدهای جهت‌دار و رفتنِ فوکوس به
   داخلِ منو را می‌دهد. این فهرستِ کوتاه با Tab پیمایش می‌شود، پس
   دکمه‌ی ساده با `aria-pressed` راست‌تر است.
   ───────────────────────────────────────────────────────────── */

import { ArrowDownUp, Check, ChevronDown, LayoutGrid, List, Loader2, Navigation, Search, SlidersHorizontal, X } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { SORT_LABEL, countFilters, type ClubFilters, type SortKey } from '@/lib/clubs/filters'
import { useDismissable } from '@/hooks/use-dismissable'
import { ClubsFilterPanel } from './ClubsFilterPanel'

/** `square`: دکمه‌ی فقط‌آیکون، ۴۴×۴۴ */
const ctl = (on: boolean, square = false) => [
  'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-field border text-sub font-bold',
  square ? 'w-11' : 'px-4',
  'transition-colors duration-fast ease-smooth disabled:cursor-progress',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  on ? 'border-gold/[.34] bg-gold/[.12] text-gold-text' : 'border-line/10 bg-surface text-ink hover:border-line/20',
].join(' ')

export interface ToolbarProps {
  search: string
  onSearch: (v: string) => void
  filters: ClubFilters
  onFilters: (f: ClubFilters) => void
  canFilterOpen: boolean
  sort: SortKey
  sorts: SortKey[]
  onSort: (s: SortKey) => void
  nearActive: boolean
  locating: boolean
  locError: boolean
  onNear: () => void
  view: 'grid' | 'list'
  onView: (v: 'grid' | 'list') => void
}

export function ClubsToolbar(p: ToolbarProps) {
  const filter = useDismissable()
  const sortMenu = useDismissable()
  const nFilters = countFilters(p.filters)

  /* دکمه‌ی «بستن» داخلِ پنل خودش را حذف می‌کند؛ بدونِ این، فوکوس روی
     `<body>` می‌افتاد و کاربرِ کیبورد از اولِ صفحه شروع می‌کرد. */
  const closeFilter = () => {
    filter.setOpen(false)
    filter.ref.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
  }

  /* ⚠️ `relative` روی گوشی لازم است: بدونِ `position`، `z-40` بی‌اثر می‌ماند
     و پنلِ فیلتر زیرِ کارت‌ها می‌رفت (کارت‌ها با انیمیشنِ ورود کانتکستِ
     چیدمانِ خودشان را دارند). */
  return (
    <div className="relative z-40 border-b border-line/[.06] bg-paper/80 sm:sticky sm:top-[var(--nav-offset)] sm:backdrop-blur-2 sm:backdrop-saturate-150">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
        {/* ⚠️ `<div>` نه `<label>`: برچسب فقط کنترلِ خودش را می‌پذیرد، و دکمه‌ی
            پاک‌کردن داخلش نامِ دسترس‌پذیرِ ورودی را «… پاک‌کردنِ جست‌وجو» می‌کرد. */}
        <div className="flex h-11 w-full min-w-0 items-center gap-2 rounded-field border border-line/10 bg-surface px-3
                        transition-colors duration-fast focus-within:border-gold-deep/50 focus-within:ring-2 focus-within:ring-gold/20
                        sm:w-auto sm:max-w-xs sm:flex-1">
          <Search size={16} aria-hidden className="shrink-0 text-ink-2" />
          <label htmlFor="clubs-q" className="sr-only">جست‌وجوی باشگاه</label>
          <input id="clubs-q" type="search" enterKeyHint="search" value={p.search} onChange={e => p.onSearch(e.target.value)}
            placeholder="نامِ باشگاه یا شهر"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 sm:text-sub
                       [&::-webkit-search-cancel-button]:appearance-none" />
          {p.search && (
            <button type="button" aria-label="پاک‌کردنِ جست‌وجو" onClick={() => p.onSearch('')}
              className="-me-2 flex size-11 shrink-0 items-center justify-center rounded-field text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        <div ref={filter.ref} className="relative">
          <button type="button" aria-expanded={filter.open} aria-controls="clubs-filter" aria-haspopup="dialog"
            onClick={() => { filter.setOpen(o => !o); sortMenu.setOpen(false) }} className={ctl(filter.open || nFilters > 0)}>
            <SlidersHorizontal size={16} aria-hidden />فیلتر
            {nFilters > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-gold-deep text-sub text-white">{faNum(nFilters)}</span>
            )}
          </button>
          {filter.open && <ClubsFilterPanel value={p.filters} onChange={p.onFilters} onClose={closeFilter} canFilterOpen={p.canFilterOpen} />}
        </div>

        {/* اقدام است، نه کلیدِ دوحالته — پس `aria-pressed` ندارد. حالتِ فعالش
            فقط می‌گوید ترتیبِ فعلی «نزدیک‌ترین» است. */}
        <button type="button" onClick={p.onNear} disabled={p.locating} className={ctl(p.nearActive)}>
          {p.locating ? <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Navigation size={16} aria-hidden />}
          نزدیکِ من
        </button>

        <div ref={sortMenu.ref} className="relative">
          <button type="button" aria-expanded={sortMenu.open} aria-controls="clubs-sort" aria-label={`ترتیب: ${SORT_LABEL[p.sort]}`}
            onClick={() => { sortMenu.setOpen(o => !o); filter.setOpen(false) }} className={ctl(sortMenu.open)}>
            <ArrowDownUp size={16} aria-hidden className="sm:hidden" />
            <span className="hidden sm:inline">{SORT_LABEL[p.sort]}</span>
            <ChevronDown size={16} aria-hidden className={['hidden text-ink-2 transition-transform duration-base sm:block', sortMenu.open ? 'rotate-180' : ''].join(' ')} />
          </button>
          {sortMenu.open && (
            <div id="clubs-sort" role="group" aria-label="ترتیب"
              className="absolute end-0 top-full z-50 mt-2 flex min-w-44 flex-col rounded-card border border-line/10 bg-surface p-1 shadow-e3 sm:end-auto sm:start-0">
              {p.sorts.map(k => (
                <button key={k} type="button" aria-pressed={p.sort === k}
                  onClick={() => { p.onSort(k); sortMenu.setOpen(false) }}
                  className={['flex min-h-11 items-center justify-between gap-3 rounded-field px-3 text-start text-sub',
                    'hover:bg-line/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep',
                    p.sort === k ? 'font-bold text-gold-text' : 'text-ink'].join(' ')}>
                  {SORT_LABEL[k]}
                  {p.sort === k && <Check size={16} aria-hidden />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={() => p.onView(p.view === 'grid' ? 'list' : 'grid')}
          aria-label={p.view === 'grid' ? 'نمایشِ فهرستی' : 'نمایشِ شبکه‌ای'} className={ctl(false, true)}>
          {p.view === 'grid' ? <List size={18} aria-hidden /> : <LayoutGrid size={18} aria-hidden />}
        </button>
      </div>

      {p.locError && (
        <p role="status" className="mx-auto my-0 max-w-screen-xl px-4 pb-3 text-sub text-danger-ink sm:px-6 lg:px-8">
          موقعیتِ مکانی در دسترس نیست. اجازه‌ی مکان‌یابی را در تنظیماتِ مرورگر بدهید و دوباره «نزدیکِ من» را بزنید.
        </p>
      )}
    </div>
  )
}
