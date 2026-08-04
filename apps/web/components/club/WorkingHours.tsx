'use client'

/* ─────────────────────────────────────────────────────────────
   ساعات کاری باشگاه.

   نسخه‌ی قبلی یک ردیف لخت بود: چک‌باکس بی‌برچسب کنار دو `input
   type=time` که در فارسی هم AM/PM لاتین نشان می‌دهند. این نسخه هر روز
   را یک کارت مستقل می‌کند، وضعیت باز/تعطیل را با کلید روشن‌وخاموش
   واضح نشان می‌دهد، و ساعت را از دو `select` می‌گیرد تا همه‌ی ارقام
   فارسی بمانند.

   دکمه‌ی «برای همه‌ی روزها» به‌خواستِ کاربر برداشته شد.
   ───────────────────────────────────────────────────────────── */

import { Clock } from 'lucide-react'
import FaTimeSelect from '../ui/FaTimeSelect'

const INK = '#1C1B17', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

export interface DayHours { open: string; close: string; isOpen: boolean }
export type Hours = Record<string, DayHours>

export const DAYS: { key: string; label: string; short: string }[] = [
  { key: 'saturday',  label: 'شنبه',     short: 'ش' },
  { key: 'sunday',    label: 'یکشنبه',   short: 'ی' },
  { key: 'monday',    label: 'دوشنبه',   short: 'د' },
  { key: 'tuesday',   label: 'سه‌شنبه',  short: 'س' },
  { key: 'wednesday', label: 'چهارشنبه', short: 'چ' },
  { key: 'thursday',  label: 'پنجشنبه',  short: 'پ' },
  { key: 'friday',    label: 'جمعه',     short: 'ج' },
]

const toFa = (v: string | number) => String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINS = ['00', '15', '30', '45']

/** «۰۹:۳۰» از «09:30» */
const faTime = (t: string) => toFa(t.replace(/:(\d\d)$/, ':$1'))

/** طول کار به ساعت — برای نمایش خلاصه؛ عبور از نیمه‌شب هم درست حساب می‌شود */
function span(o: string, c: string): number {
  const [oh = 0, om = 0] = o.split(':').map(Number)
  const [ch = 0, cm = 0] = c.split(':').map(Number)
  let d = (ch * 60 + cm) - (oh * 60 + om)
  if (d <= 0) d += 24 * 60
  return Math.round((d / 60) * 10) / 10
}

/* کشوهای بومی جایشان را به `FaTimeSelect` دادند.

   دلیلش فقط هماهنگیِ ظاهری نبود: استایلِ سراسریِ `select` برای جای
   فلش ۳۶ پیکسل padding می‌گذارد، پس هر کشو دستِ‌کم ۷۰ پیکسل پهن
   می‌شد. چهار کشو در یک ردیف — به‌علاوه‌ی نام روز و نشانِ مدت — در
   موبایل از عرضِ صفحه بیرون می‌زد. */
function TimeSelect({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label: string
}) {
  return (
    <div className="wh-time" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span className="wh-time-lb" style={{ fontSize: 11.5, color: MUT }}>{label}</span>
      <FaTimeSelect value={value} onChange={onChange} ariaLabel={label} minuteStep={15} compact />
    </div>
  )
}

export default function WorkingHours({ value, onChange }: {
  value: Hours
  onChange: (next: Hours) => void
}) {
  const setDay = (key: string, patch: Partial<DayHours>) =>
    onChange({ ...value, [key]: { ...value[key]!, ...patch } })

  const openCount = DAYS.filter(d => value[d.key]?.isOpen).length

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12,
        fontSize: 12.5, color: MUT,
      }}>
        <Clock size={14} style={{ color: GOLD_D }} />
        {openCount === 7
          ? 'همه‌ی روزهای هفته باز است'
          : openCount === 0
            ? 'هیچ روزی باز نیست'
            : <>{toFa(openCount)} روز از هفته باز است</>}
      </div>

      {/* ── چیدمانِ موبایل ──
          تا امروز هیچ قاعده‌ی موبایلی نبود: ردیف `flex` با `flexWrap`
          بود و روی عرضِ کم، دو کشوی ساعت و نشانِ مدت روی هم می‌افتادند
          و خوانده نمی‌شدند.

          حالا زیر ۵۲۰ پیکسل ردیف دو طبقه می‌شود — نامِ روز بالا، دو
          کشوی ساعت پایین با عرضِ برابر — و نشانِ «چند ساعت» پنهان
          می‌شود چون همان اطلاعات از خودِ دو ساعت خوانده می‌شود. */}
      <style>{`
        @media (max-width: 520px) {
          .wh-row { gap: 8px !important; padding: 9px 10px !important; }
          .wh-row .wh-toggle { width: 100%; }
          .wh-times { display: flex !important; gap: 8px; width: 100%; }
          .wh-times > * { flex: 1; min-width: 0; }
          .wh-span { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'grid', gap: 8 }}>
        {DAYS.map(d => {
          const v = value[d.key] ?? { open: '09:00', close: '23:00', isOpen: true }
          return (
            <div key={d.key} className="wh-row" style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              background: v.isOpen ? '#fff' : '#FAFAF7',
              border: `1px solid ${v.isOpen ? LINE : '#EFEBE1'}`,
              borderRadius: 12, padding: '10px 12px',
              opacity: v.isOpen ? 1 : 0.72, transition: 'opacity .2s, background .2s',
            }}>
              {/* نام روز + کلید باز/تعطیل */}
              <button type="button" onClick={() => setDay(d.key, { isOpen: !v.isOpen })}
                aria-pressed={v.isOpen} className="wh-toggle"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                }}>
                <span style={{
                  width: 34, height: 20, borderRadius: 20, flexShrink: 0, position: 'relative',
                  background: v.isOpen ? 'rgba(14,122,56,0.85)' : '#D9D3C6', transition: 'background .2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, insetInlineStart: v.isOpen ? 16 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'inset-inline-start .2s',
                  }} />
                </span>
                <span className="wh-day" style={{ fontSize: 13.5, fontWeight: 800, color: INK, minWidth: 62, textAlign: 'start' }}>
                  {d.label}
                </span>
              </button>

              {v.isOpen ? (
                <>
                  <span className="wh-times" style={{ display: 'contents' }}>
                    <TimeSelect label="از" value={v.open} onChange={x => setDay(d.key, { open: x })} />
                    <TimeSelect label="تا" value={v.close} onChange={x => setDay(d.key, { close: x })} />
                  </span>

                  <span className="wh-span" style={{
                    fontSize: 11.5, color: FELT, background: 'rgba(14,122,56,0.08)',
                    border: '1px solid rgba(14,122,56,0.2)', borderRadius: 20, padding: '3px 10px',
                    fontWeight: 700, whiteSpace: 'nowrap',
                  }}>
                    {toFa(span(v.open, v.close))} ساعت
                  </span>

                </>
              ) : (
                <span style={{
                  fontSize: 12, color: RED, background: 'rgba(178,59,46,0.07)',
                  border: '1px solid rgba(178,59,46,0.2)', borderRadius: 20,
                  padding: '3px 12px', fontWeight: 700,
                }}>
                  تعطیل
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { faTime }
