'use client'

import { Search, X } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   جعبه‌ی جست‌وجوی فهرست‌ها — باشگاه‌ها، فروشگاه‌ها، مربیان، تولیدکنندگان،
   مسابقات (خواستِ مالک، ۱۲ آبانِ ۱۴۰۵: «اسمِ شهر بزند و همه‌ی … آن شهر
   بیاید»). خودِ تطبیق در هر صفحه با `makeMatcher` (lib/search/filter) است
   که آ/ا، ی/ک عربی و اعراب را یکی می‌کند؛ این فقط ورودی است.
   ───────────────────────────────────────────────────────────── */

export function ListSearch({
  value, onChange, placeholder = 'جست‌وجوی نام یا شهر', label, className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** برچسبِ صفحه‌خوان — پیش‌فرض همان placeholder */
  label?: string
  className?: string
}) {
  return (
    <div role="search" className={`relative flex min-w-0 items-center ${className}`}>
      <Search size={16} aria-hidden className="pointer-events-none absolute start-3 text-ink-2" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        enterKeyHint="search"
        maxLength={60}
        /* ۱۶px روی موبایل: زیرِ آن سافاریِ آیفون با فوکوس زوم می‌کند */
        className="h-11 w-full min-w-0 rounded-xl border border-line/10 bg-white/90 pe-10 ps-10 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-sm placeholder:text-ink-2/70 hover:border-line/20 focus:border-gold/75 focus:ring-4 focus:ring-gold/15 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="پاک کردن جست‌وجو"
          className="absolute end-2 flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-black/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold/70"
        >
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}
