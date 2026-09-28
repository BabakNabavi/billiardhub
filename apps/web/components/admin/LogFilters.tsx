'use client'

/* کارتِ فیلترِ ژورنال — فیلدها و تراشه‌های فیلترِ فعال.
   از `page.tsx` جدا شد چون آن فایل از ~۱۵۰ خطِ قاعده‌ی پروژه رد شده بود. */

import { X } from 'lucide-react'
import { faDate, gregorianToJalaliInput, jalaliInputToGregorian } from '../../lib/jalali'
import JalaliDatePicker from '../ui/JalaliDatePicker'
import { RING, LATIN, hasPersian } from './LogAtoms'

export type Tab = 'audit' | 'sessions'
export interface Filters { action: string; actor: string; ip: string; from: string; to: string; live: boolean }
export const EMPTY_FILTERS: Filters = { action: '', actor: '', ip: '', from: '', to: '', live: false }

const FIELD = `w-full rounded-[10px] border border-[#E7E2D6] bg-white px-3 py-2.5 text-[12.5px] text-[#1C1B17] focus:border-[#C7A66A] ${RING}`

/* ⚠️ `ltr` و `latin` عمدا جدا هستند: نامِ کنش جهتِ لاتین می‌خواهد
   ولی رقم ندارد پس نباید فونتش عوض شود؛ IP هر دو را می‌خواهد. */
interface Chip { k: keyof Filters; label: string; value?: string; ltr?: boolean; latin?: boolean }

/* ⚠️ برچسب و مقدار **جدا** برمی‌گردند، نه یک رشته‌ی به‌هم‌چسبیده.
   «رویداد: LOGIN_FAILED» در یک پاراگرافِ RTL، به‌خاطر دونقطه‌ی خنثی
   بینِ یک دنباله‌ی RTL و یک دنباله‌ی LTR، به شکلِ `LOGIN_FAILED :رویداد`
   رندر می‌شد. با دو عنصرِ جدا و `dir="ltr"` روی مقدار، ترتیب درست
   می‌ماند. تاریخ‌ها با `faDate` به «۶ مهر ۱۴۰۵» تبدیل می‌شوند —
   کلمه و بدونِ اسلش، پس ابهامِ دوجهته ندارند. */
function chipsOf(f: Filters, names: Record<string, string>): Chip[] {
  const out: Chip[] = []
  if (f.action) out.push({ k: 'action', label: 'رویداد', value: f.action, ltr: true })  // بدونِ latin — رقم ندارد
  if (f.actor) {
    const label = names[f.actor] ?? f.actor.slice(0, 8)
    /* برچسبِ غیرفارسی یا UUID است یا شماره — هر دو رقم دارند. */
    out.push({ k: 'actor', label: 'بازیگر', value: label, ltr: !hasPersian(label), latin: /[0-9]/.test(label) })
  }
  if (f.ip) out.push({ k: 'ip', label: 'IP', value: f.ip, ltr: true, latin: true })
  if (f.from) out.push({ k: 'from', label: 'از', value: faDate(f.from) })
  if (f.to) out.push({ k: 'to', label: 'تا', value: faDate(f.to) })
  if (f.live) out.push({ k: 'live', label: 'فقط نشست‌های فعال' })
  return out
}

export function LogFilters({ tab, f, setF, actionOptions, names }: {
  tab: Tab
  f: Filters
  setF: (fn: (p: Filters) => Filters) => void
  actionOptions: string[]
  names: Record<string, string>
}) {
  const chips = chipsOf(f, names)

  /* ⚠️ بازه‌ی وارونه صفر ردیف می‌دهد با پیامِ «چیزی پیدا نشد» — که
     گمراه‌کننده است. مثلِ `ClubFinance` خودش اصلاح می‌شود. */
  const setFrom = (g: string) => setF(p => ({ ...p, from: g, to: p.to && g > p.to ? g : p.to }))
  const setTo = (g: string) => setF(p => ({ ...p, to: g, from: p.from && g < p.from ? g : p.from }))
  const clearOne = (k: keyof Filters) => setF(p => ({ ...p, [k]: k === 'live' ? false : '' }))

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {tab === 'audit' ? (
          <label>
            <span className="mb-1 block text-[11.5px] text-[#6F6A5C]">رویداد</span>
            {/* ⚠️ دراپ‌داون و نه متنِ آزاد: پرس‌وجو `eq` است، پس یک
                حرفِ کم یعنی صفر ردیف بدونِ هیچ توضیحی. */}
            {/* ⚠️ بدونِ `bh-latin`: نامِ کنش رقم ندارد و گزینه‌ی
                پیش‌فرض فارسی است، پس آن کلاس فقط فونتِ فیلد را از
                بقیه‌ی سایت جدا می‌کرد. */}
            <select className={FIELD} dir="ltr" data-no-fa value={f.action}
              aria-label="فیلتر رویداد"
              onChange={e => setF(p => ({ ...p, action: e.target.value }))}>
              <option value="">همه‌ی رویدادها</option>
              {actionOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        ) : (
          <label className="flex items-end gap-2 pb-1">
            <input type="checkbox" checked={f.live}
              onChange={e => setF(p => ({ ...p, live: e.target.checked }))}
              className={`h-4 w-4 accent-[#128A4B] ${RING}`} />
            <span className="text-[12.5px] text-[#5B564B]">فقط نشست‌های فعال</span>
          </label>
        )}

        <label>
          <span className="mb-1 block text-[11.5px] text-[#6F6A5C]">IP</span>
          <input className={`${FIELD} ${LATIN}`} dir="ltr" value={f.ip} placeholder="127.0.0.1"
            onChange={e => setF(p => ({ ...p, ip: e.target.value.trim() }))} />
        </label>

        {/* ⚠️ `JalaliDatePicker` پروژه، نه `<input type="date">`. آن یکی
            تقویمِ میلادیِ مرورگر را می‌آورد و روی موبایل از کادر بیرون
            می‌زد. `direction="recent"` یعنی آینده بسته ولی نما روی همین
            ماه — با `past` روی بیست‌وپنج سال پیش باز می‌شد. */}
        <JalaliDatePicker id="logs-from" label="از تاریخ" direction="recent"
          value={gregorianToJalaliInput(f.from)}
          onChange={v => {
            if (!v) { setF(p => ({ ...p, from: '' })); return }
            const g = jalaliInputToGregorian(v); if (g) setFrom(g)
          }} />
        <JalaliDatePicker id="logs-to" label="تا تاریخ" direction="recent"
          value={gregorianToJalaliInput(f.to)}
          onChange={v => {
            if (!v) { setF(p => ({ ...p, to: '' })); return }
            const g = jalaliInputToGregorian(v); if (g) setTo(g)
          }} />
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F0ECE2] pt-3">
          {chips.map(c => (
            <button key={c.k} type="button" onClick={() => clearOne(c.k)}
              aria-label={`حذف فیلتر ${c.label}${c.value ? ` ${c.value}` : ''}`}
              className={`inline-flex items-center gap-1 rounded-[8px] bg-[rgba(199,166,106,0.12)] px-2 py-1 text-[11.5px] font-semibold text-[#8F6531] transition hover:bg-[rgba(199,166,106,0.22)] ${RING}`}>
              {/* دونقطه داخلِ همان span است تا فاصله‌ی flex بینشان
                  نیفتد؛ در فارسی دونقطه به برچسب می‌چسبد. */}
              <span>{c.label}{c.value ? ':' : ''}</span>
              {c.value && (
                <>
                  {c.ltr
                    ? <span dir="ltr" data-no-fa className={c.latin ? LATIN : undefined}>{c.value}</span>
                    : <span>{c.value}</span>}
                </>
              )}
              <X size={11} aria-hidden />
            </button>
          ))}
          <button type="button" onClick={() => setF(() => EMPTY_FILTERS)}
            className={`text-[11.5px] font-bold text-[#6F6A5C] underline underline-offset-4 ${RING}`}>
            پاک‌کردن همه
          </button>
        </div>
      )}
    </>
  )
}

export const hasActiveFilter = (f: Filters) => chipsOf(f, {}).length > 0
