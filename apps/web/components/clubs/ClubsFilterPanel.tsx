'use client'

/* ─────────────────────────────────────────────────────────────
   پنلِ فیلترِ باشگاه‌ها.

   ⚠️ کلیدهای روشن/خاموش پیش‌تر `<div onClick>` بودند — با کیبورد و
   صفحه‌خوان دست‌نیافتنی. حالا `<button role="switch">`.
   ⚠️ «فقط بازها» فقط وقتی پیشنهاد می‌شود که وضعیتِ باز/بسته واقعاً
   معلوم باشد؛ با دادهٔ فعلی (بی‌ساعتِ کاری) همه را حذف می‌کرد.
   ───────────────────────────────────────────────────────────── */

import { X } from 'lucide-react'
import { AMENITIES } from './ClubCardParts'
import { NO_FILTERS, TABLE_FILTERS, countFilters, type ClubFilters } from '@/lib/clubs/filters'

const chip = (on: boolean) => [
  'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sub font-bold',
  'transition-colors duration-fast ease-smooth',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep',
  on ? 'border-gold/[.34] bg-gold/[.12] text-gold-text' : 'border-line/10 bg-surface text-ink hover:border-line/20',
].join(' ')

function Switch({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-field px-2 text-start text-sub text-ink
                 hover:bg-line/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
      {label}
      <span aria-hidden className={['relative h-6 w-10 shrink-0 rounded-full transition-colors duration-base ease-smooth',
        on ? 'bg-gold-deep' : 'bg-line/15'].join(' ')}>
        <span className={['absolute start-1 top-1 size-4 rounded-full bg-surface shadow-e1',
          'transition-transform duration-base ease-smooth motion-reduce:transition-none',
          on ? 'ltr:translate-x-4 rtl:-translate-x-4' : ''].join(' ')} />
      </span>
    </button>
  )
}

export function ClubsFilterPanel({ value, onChange, onClose, canFilterOpen }: {
  value: ClubFilters
  onChange: (next: ClubFilters) => void
  onClose: () => void
  canFilterOpen: boolean
}) {
  const toggle = <K extends 'types' | 'amens'>(k: K, item: ClubFilters[K][number]) => {
    const list = value[k] as ClubFilters[K][number][]
    onChange({ ...value, [k]: list.includes(item) ? list.filter(x => x !== item) : [...list, item] })
  }
  const active = countFilters(value)

  return (
    /* ⚠️ سقفِ ارتفاع با اسکرولِ داخلی: نوار از تبلت می‌چسبد، پس پنلِ ۵۲۰
       پیکسلی روی گوشیِ افقی یا پنجره‌ی کوتاه با اسکرولِ صفحه هم پایینش
       دیده نمی‌شد. */
    <div id="clubs-filter" role="dialog" aria-label="فیلترها"
      className="absolute start-0 top-full z-50 mt-2 flex max-h-[calc(100dvh-var(--nav-offset)-6rem)] w-80 max-w-[calc(100vw-2rem)]
                 flex-col gap-4 overflow-y-auto overscroll-contain rounded-panel border border-line/10 bg-surface p-4 shadow-e3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-section text-ink">فیلترها</h2>
        <div className="flex items-center gap-1">
          {active > 0 && (
            <button type="button" onClick={() => onChange(NO_FILTERS)}
              className="min-h-11 rounded-field px-3 text-sub font-bold text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
              پاک‌کردن
            </button>
          )}
          <button type="button" aria-label="بستنِ فیلترها" onClick={onClose}
            className="flex size-11 items-center justify-center rounded-field text-ink-2 hover:bg-line/[.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sub font-bold text-ink-2">نوعِ میز</legend>
        <div className="flex flex-wrap gap-2">
          {TABLE_FILTERS.map(t => (
            <button key={t.key} type="button" aria-pressed={value.types.includes(t.key)} onClick={() => toggle('types', t.key)}
              className={chip(value.types.includes(t.key))}>{t.label}</button>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sub font-bold text-ink-2">امکانات</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => (
            <button key={a.key} type="button" aria-pressed={value.amens.includes(a.key)} onClick={() => toggle('amens', a.key)}
              className={chip(value.amens.includes(a.key))}>{a.icon}{a.label}</button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col border-t border-line/[.06] pt-2">
        {canFilterOpen && <Switch label="فقط باشگاه‌های باز" on={value.onlyOpen} onToggle={() => onChange({ ...value, onlyOpen: !value.onlyOpen })} />}
        <Switch label="فقط تأییدشده‌ها" on={value.onlyVerified} onToggle={() => onChange({ ...value, onlyVerified: !value.onlyVerified })} />
        <Switch label="ثبت‌نامِ مسابقه باز است" on={value.onlyTournament} onToggle={() => onChange({ ...value, onlyTournament: !value.onlyTournament })} />
      </div>
    </div>
  )
}
