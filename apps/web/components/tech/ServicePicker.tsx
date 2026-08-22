'use client'

/* ─────────────────────────────────────────────────────────────
   انتخابِ خدمات در فرمِ ثبت‌نامِ متخصص.

   ── چه چیزی عوض شد ──
   نسخه‌ی قبلی همان ابرِ چیپِ صفحه‌ی عمومی بود، فقط کلیک‌شونده: نُه
   دکمه‌ی ریز با عرضِ متفاوت، بدونِ دسته، بدونِ توضیح. با هجده خدمتِ
   تازه اصلاً کار نمی‌کرد.

   ── حالا ──
   همان کاتالوگِ صفحه‌ی عمومی، ولی قابلِ انتخاب. هر ردیف یک
   `checkbox`ِ واقعی است — نه `div`ِ کلیک‌دار — پس کیبورد، صفحه‌خوان
   و `Space` بدونِ کدِ اضافه کار می‌کنند.

   ⚠️ حالتِ انتخاب‌شده فقط با *رنگ* گفته نمی‌شود: نشانِ تیک هم
   می‌آید. کاربری که رنگ را تشخیص نمی‌دهد باید بفهمد چه انتخاب شده.
   ───────────────────────────────────────────────────────────── */

import { Check } from 'lucide-react'
import { TECH_SERVICE_CATEGORIES } from '@/lib/tech-services'
import { toFaDigits } from '@/lib/jalali'
import './service-picker.css'

export function ServicePicker({ selected, onChange, legacy = [], onLegacyChange }: {
  /** شناسه‌های انتخاب‌شده */
  selected: readonly string[]
  onChange: (next: string[]) => void
  /** مقادیرِ ثبت‌شده‌ی پیش از دسته‌بندی که معادلِ تازه ندارند.
   *  ⚠️ باید دیده شوند: تا دیروز پنهان بودند ولی در صفحه‌ی عمومی
   *  نمایش داده می‌شدند — یعنی متخصص خدمتی را که دیگر انجام
   *  نمی‌داد نمی‌توانست بردارد. */
  legacy?: readonly string[]
  onLegacyChange?: (next: string[]) => void
}) {
  const has = (id: string) => selected.includes(id)
  const toggle = (id: string) =>
    onChange(has(id) ? selected.filter(x => x !== id) : [...selected, id])

  return (
    <div className="tsp">
      {TECH_SERVICE_CATEGORIES.map(c => {
        const ids = c.services.map(s => s.id)
        const on = ids.filter(has).length
        const all = on === ids.length
        return (
          <fieldset key={c.id} className="tsp-group">
            <legend className="tsp-legend">
              <span className="tsp-cat">{c.title}</span>
              {on > 0 && <span className="tsp-count">{toFaDigits(on)} انتخاب‌شده</span>}
            </legend>

            {/* ⚠️ یک دکمه که معنایش با حالت عوض می‌شود، بهتر از دو
                دکمه‌ی «همه»/«هیچ‌کدام» است که یکی‌شان همیشه بی‌اثر است. */}
            <button type="button" className="tsp-all"
              aria-label={`${all ? 'برداشتن همه' : 'انتخاب همه'} — ${c.title}`}
              onClick={() => onChange(all
                ? selected.filter(x => !ids.includes(x))
                : [...selected.filter(x => !ids.includes(x)), ...ids])}>
              {all ? 'برداشتن همه' : 'انتخاب همه'}
            </button>

            <ul className="tsp-list">
              {c.services.map(s => (
                <li key={s.id}>
                  <label className={`tsp-row${has(s.id) ? ' is-on' : ''}`}>
                    <input type="checkbox" className="tsp-box" checked={has(s.id)}
                      onChange={() => toggle(s.id)} />
                    <span className="tsp-mark" aria-hidden><Check size={13} /></span>
                    <span className="tsp-txt">
                      <span className="tsp-name">{s.title}</span>
                      {s.description && <span className="tsp-desc">{s.description}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )
      })}

      {legacy.length > 0 && (
        <fieldset className="tsp-group">
          <legend className="tsp-legend">
            <span className="tsp-cat">سایر خدمات</span>
            <span className="tsp-count">{toFaDigits(legacy.length)} مورد</span>
          </legend>
          <p className="tsp-note">
            این‌ها را پیش از دسته‌بندیِ تازه ثبت کرده بودید و همچنان در صفحه‌ی
            عمومی شما دیده می‌شوند. اگر دیگر انجامشان نمی‌دهید، برداریدشان.
          </p>
          <ul className="tsp-list">
            {legacy.map(t => (
              <li key={t}>
                <label className="tsp-row is-on">
                  <input type="checkbox" className="tsp-box" checked readOnly
                    onChange={() => onLegacyChange?.(legacy.filter(x => x !== t))} />
                  <span className="tsp-mark" aria-hidden><Check size={13} /></span>
                  <span className="tsp-txt"><span className="tsp-name">{t}</span></span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  )
}
