'use client'

/* ─────────────────────────────────────────────────────────────
   جنسیت + رشته‌ها + دسته/رده‌ی سنیِ بازیکن.

   هرجا نقشِ بازیکن گرفته می‌شود (انتخابِ نقش و پنلِ بازیکن) همین
   کامپوننت استفاده می‌شود تا دو جای مختلف دو لیستِ متفاوت نسازند —
   همان قاعده‌ای که برای استان/شهر داریم.
   ───────────────────────────────────────────────────────────── */

import { Check } from 'lucide-react'
import {
  AGE_GROUPS, DISCIPLINES, disciplineFa, divisionsFor, emptyEntry, isRanked,
  type Discipline, type DisciplineEntry, type Gender,
} from '../../lib/player-categories'

const CHIP = 'rounded-[10px] border px-3 py-2.5 text-[12.5px] font-bold transition'
const ON   = 'border-[rgba(199,166,106,0.4)] bg-[rgba(199,166,106,0.13)] text-[#9A6E38]'
const OFF  = 'border-[#E7E2D6] bg-white text-[#5B564B]'
const LABEL = 'mb-1.5 block text-[12.5px] font-bold text-[#5B564B]'

export interface PlayerDisciplinesValue {
  gender: Gender
  entries: DisciplineEntry[]
}

export default function PlayerDisciplines({
  value, onChange, error,
}: {
  value: PlayerDisciplinesValue
  onChange: (v: PlayerDisciplinesValue) => void
  error?: string
}) {
  const { gender, entries } = value
  const divs = divisionsFor(gender)

  const setGender = (g: Gender) => {
    /* بانوان «دسته یک» ندارند — انتخابِ نامعتبر را به دسته برتر برگردان */
    const fixed = g === 'f'
      ? entries.map(e => (e.division === 'first' ? { ...e, division: 'premier' as const } : e))
      : entries
    onChange({ gender: g, entries: fixed })
  }

  const toggle = (d: Discipline) => {
    const has = entries.some(e => e.discipline === d)
    onChange({
      gender,
      entries: has ? entries.filter(e => e.discipline !== d) : [...entries, emptyEntry(d)],
    })
  }

  const patch = (d: Discipline, p: Partial<DisciplineEntry>) =>
    onChange({ gender, entries: entries.map(e => (e.discipline === d ? { ...e, ...p } : e)) })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={LABEL}>جنسیت *</label>
        <div className="flex gap-2">
          {([['m', 'آقا'], ['f', 'خانم']] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setGender(k)}
              className={`flex-1 ${CHIP} ${gender === k ? ON : OFF}`}>{l}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL}>رشته‌ها * <span className="font-normal text-[#A69F8E]">— می‌توانید چند رشته انتخاب کنید</span></label>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map(d => {
            const on = entries.some(e => e.discipline === d.key)
            return (
              <button key={d.key} type="button" onClick={() => toggle(d.key)}
                className={`inline-flex items-center gap-1.5 ${CHIP} ${on ? ON : OFF}`}>
                {on && <Check size={13} />}{d.fa}
              </button>
            )
          })}
        </div>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-[#8A8474]">
            برای هر رشته، رده‌ی سنی و دسته را مشخص کنید — همان دسته‌بندی‌های بخشِ رنکینگ.
          </p>
          {entries.map(e => (
            <div key={e.discipline} className="rounded-xl border border-[#E7E2D6] bg-[#FAFAF7] p-3.5">
              <div className="mb-2.5 text-[13px] font-bold text-[#1C1B17]">{disciplineFa(e.discipline)}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>رده‌ی سنی</label>
                  <div className="flex gap-2">
                    {AGE_GROUPS.map(a => (
                      <button key={a.key} type="button"
                        onClick={() => patch(e.discipline, {
                          ageGroup: a.key,
                          division: a.key === 'adult' ? (e.division || 'premier') : '',
                        })}
                        className={`flex-1 ${CHIP} ${e.ageGroup === a.key ? ON : OFF}`}>{a.fa}</button>
                    ))}
                  </div>
                </div>
                {e.ageGroup === 'adult' && (
                  <div>
                    <label className={LABEL}>دسته</label>
                    <div className="flex gap-2">
                      {divs.map(d => (
                        <button key={d.key} type="button" onClick={() => patch(e.discipline, { division: d.key })}
                          className={`flex-1 ${CHIP} ${e.division === d.key ? ON : OFF}`}>{d.fa}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {!isRanked(e.discipline) && (
                <p className="mt-2.5 text-[11.5px] text-[#A69F8E]">
                  های‌بال هنوز جدولِ رنکینگ ملی ندارد؛ این دسته‌بندی فقط روی پروفایل شما نمایش داده می‌شود.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[12px] font-bold text-[#C0392B]">{error}</p>}
    </div>
  )
}
