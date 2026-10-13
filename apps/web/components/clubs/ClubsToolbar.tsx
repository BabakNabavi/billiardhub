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

/** کنترل‌ها قرصی‌اند، مثلِ تراشه‌های فیلترِ فروشگاهِ اپل */
const ctl = (on: boolean) => [
  'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sub font-bold',
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
        {/* فیلدِ جست‌وجوی خاکستریِ قرصی — بی‌حاشیه، مثلِ جست‌وجوی سیستمِ اپل */}
        {/* ⚠️ حلقه‌ی فوکوس تمام‌رنگ: فیلد حاشیه ندارد، پس حلقه تنها نشانه‌ی
            فوکوس است و با ۴۰٪ شفافیت ۱٫۷:۱ می‌شد (کف ۳:۱). شیار ۴٪ نه ۵٪ تا
            متنِ راهنما بالای ۴٫۵:۱ بماند. */}
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-line/[.04] px-4
                        transition-[background-color,box-shadow] duration-fast focus-within:bg-surface focus-within:ring-2 focus-within:ring-gold-deep
                        sm:max-w-xs">
          <Search size={16} aria-hidden className="shrink-0 text-ink-2" />
          <label htmlFor="clubs-q" className="sr-only">جست‌وجوی باشگاه</label>
          <input id="clubs-q" type="search" enterKeyHint="search" value={p.search} onChange={e => p.onSearch(e.target.value)}
            placeholder="نامِ باشگاه یا شهر"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 sm:text-sub
                       [&::-webkit-search-cancel-button]:appearance-none" />
          {p.search && (
            <button type="button" aria-label="پاک‌کردنِ جست‌وجو" onClick={() => p.onSearch('')}
              className="-me-3 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        {/* روی گوشی پنج کنترل در ۳۴۳ پیکسل جا نمی‌شوند (~۳۶۰): جست‌وجو و نما
            ردیفِ اول، این سه ردیفِ دوم. از تبلت `contents` بسته‌بندی را حذف
            می‌کند و همه یک ردیف‌اند. (جداکننده‌ی `basis-full` پیشین خودش یک
            ردیفِ صفرارتفاع می‌ساخت و فاصله‌ی دو ردیف دوبرابر می‌شد.) */}
        <div className="order-last flex basis-full gap-2 sm:order-none sm:contents">
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
              className="absolute end-0 top-full z-50 mt-2 flex min-w-44 flex-col rounded-panel bg-surface p-2 shadow-e3 ring-1 ring-line/[.06] sm:end-auto sm:start-0">
              {p.sorts.map(k => (
                <button key={k} type="button" aria-pressed={p.sort === k}
                  onClick={() => { p.onSort(k); sortMenu.setOpen(false) }}
                  className={['flex min-h-11 items-center justify-between gap-3 rounded-card px-3 text-start text-sub',
                    'hover:bg-line/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep',
                    p.sort === k ? 'font-bold text-gold-text' : 'text-ink'].join(' ')}>
                  {SORT_LABEL[k]}
                  {p.sort === k && <Check size={16} aria-hidden />}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>

        {/* کنترلِ بخش‌بندی‌شده: شیارِ خاکستری با بخشِ انتخاب‌شده‌ی سفیدِ برجسته.
            هر بخش ۳۶ پیکسل دیده می‌شود؛ شبه‌عنصر هدفِ لمس را به ۴۴ می‌رساند. */}
        <div role="group" aria-label="نما" className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full bg-line/[.04] p-1">
          {([['grid', 'شبکه‌ای', LayoutGrid], ['list', 'فهرستی', List]] as const).map(([v, label, Icon]) => (
            <button key={v} type="button" aria-pressed={p.view === v} aria-label={`نمایشِ ${label}`} onClick={() => p.onView(v)}
              className={['relative flex h-9 w-11 items-center justify-center rounded-full transition-[background-color,box-shadow,color] duration-base ease-smooth',
                "after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']",
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep',
                p.view === v ? 'bg-surface text-gold-text shadow-e1' : 'text-ink-2 hover:text-ink'].join(' ')}>
              <Icon size={18} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {p.locError && (
        <p role="status" className="mx-auto my-0 max-w-screen-xl px-4 pb-3 text-sub text-danger-ink sm:px-6 lg:px-8">
          موقعیتِ مکانی در دسترس نیست. اجازه‌ی مکان‌یابی را در تنظیماتِ مرورگر بدهید و دوباره «نزدیکِ من» را بزنید.
        </p>
      )}
    </div>
  )
}
