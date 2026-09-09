'use client'

/* ─────────────────────────────────────────────────────────────
   انتخاب خدمات در فرم ثبت‌نام/ویرایش متخصص.

   ── مسیر ──
   ۱) ابر چیپ کلیک‌شونده — با هجده خدمت کار نمی‌کرد.
   ۲) ردیف‌های چک‌باکسی — کار می‌کرد ولی «فرم اداری» بود.
   ۳) حالا: کاشی انتخاب‌شونده در شبکه‌ی کشسان، با شمار زنده در سر
      هر دسته و یک خلاصه‌ی زنده — همان زبان بصری صفحه‌ی عمومی.

   ⚠️ ورودی همچنان `checkbox` واقعی است (پنهان ولی در درخت
   دسترسی)، پس کیبورد و صفحه‌خوان و `Space` بدون کد اضافه کار
   می‌کنند. حالت با سه نشانه گفته می‌شود: زمین، مرز، تیک — نه فقط
   رنگ.

   ⚠️ منبع خدمات همان `TECH_SERVICE_CATEGORIES` صفحه‌ی عمومی است.
   فهرست دوم، حتی درست، فردا از اولی عقب می‌افتد.
   ───────────────────────────────────────────────────────────── */

import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { TECH_SERVICE_CATEGORIES, ALL_TECH_SERVICES } from '@/lib/tech-services'
import { toFaDigits } from '@/lib/jalali'
import './service-picker.css'

export function ServicePicker({ selected, onChange, legacy = [], onLegacyChange }: {
  /** شناسه‌های انتخاب‌شده */
  selected: readonly string[]
  onChange: (next: string[]) => void
  /** مقادیر ثبت‌شده‌ی پیش از دسته‌بندی که معادل تازه ندارند.
   *  ⚠️ باید دیده شوند: تا دیروز پنهان بودند ولی در صفحه‌ی عمومی
   *  نمایش داده می‌شدند — یعنی متخصص خدمتی را که دیگر انجام
   *  نمی‌داد نمی‌توانست بردارد. */
  legacy?: readonly string[]
  /** ⚠️ اجباری وقتی `legacy` می‌دهی — وگرنه تایپ اجازه می‌دهد
   *  کنترلی رندر شود که هیچ کاری نمی‌کند. */
  onLegacyChange?: (next: string[]) => void
}) {
  const has = (id: string) => selected.includes(id)
  const toggle = (id: string) =>
    onChange(has(id) ? selected.filter(x => x !== id) : [...selected, id])

  /* خلاصه از همان انتخاب ساخته می‌شود، نه از یک حالت موازی —
     وگرنه دو منبع حقیقت و اولین باگ «شمار جا مانده». */
  const picked = useMemo(
    () => TECH_SERVICE_CATEGORIES
      .map(c => ({ ...c, services: c.services.filter(s => selected.includes(s.id)) }))
      .filter(c => c.services.length > 0),
    [selected],
  )
  const total = useMemo(
    () => ALL_TECH_SERVICES.filter(s => selected.includes(s.id)).length + legacy.length,
    [selected, legacy],
  )

  return (
    <div className="tsp">
      {TECH_SERVICE_CATEGORIES.map(c => {
        const ids = c.services.map(s => s.id)
        const on = ids.filter(has).length
        const all = on === ids.length
        return (
          <fieldset key={c.id} className="tsp-group">
            {/* ⚠️ `legend` فقط عنوان است و چیز دیگری داخلش نمی‌رود:
                نام دسترس‌پذیر `fieldset` از متن `legend` ساخته
                می‌شود و به‌ازای *هر* چک‌باکس تکرار می‌شود. با دکمه‌ی
                «انتخاب همه» داخلش، صفحه‌خوان هشت بار می‌گفت
                «تعمیرات میز ۳ از ۸ انتخاب شده انتخاب همه».
                ⚠️ و `legend` را ظرف فلکس هم نمی‌کنیم: چیدمانش در
                موتورهای مختلف ویژه است و `inline-size` را همه‌جا
                رعایت نمی‌کند. سر دسته یک `div` خواهر است. */}
            <legend className="tsp-legend">{c.title}</legend>
            <div className="tsp-head">
              <span className="tsp-cat" aria-hidden>{c.title}</span>
              <span className={`tsp-count${on ? '' : ' is-zero'}`}>
                {on ? `${toFaDigits(on)} از ${toFaDigits(ids.length)} انتخاب شده` : 'انتخاب نشده'}
              </span>
              {/* یک دکمه که معنایش با حالت عوض می‌شود، بهتر از دو
                  دکمه‌ای است که یکی‌شان همیشه بی‌اثر است. */}
              <button type="button" className="tsp-all"
                aria-label={`${all ? 'برداشتن همه' : 'انتخاب همه'} — ${c.title}`}
                onClick={() => onChange(all
                  ? selected.filter(x => !ids.includes(x))
                  : [...selected.filter(x => !ids.includes(x)), ...ids])}>
                {all ? 'برداشتن همه' : 'انتخاب همه'}
              </button>
            </div>

            <ul className="tsp-list">
              {c.services.map(s => (
                <li key={s.id}>
                  <label className={`tsp-tile${has(s.id) ? ' is-on' : ''}`}>
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
        <section className="tsp-group" aria-labelledby="tsp-legacy">
          <div className="tsp-head">
            <span className="tsp-cat" id="tsp-legacy">سایر خدمات</span>
            <span className="tsp-count">{toFaDigits(legacy.length)} مورد</span>
          </div>
          <p className="tsp-note">
            این‌ها را پیش از دسته‌بندی تازه ثبت کرده بودید و همچنان در صفحه‌ی
            عمومی شما دیده می‌شوند. اگر دیگر انجامشان نمی‌دهید، برداریدشان.
          </p>
          <ul className="tsp-list">
            {legacy.map(t => (
              <li key={t}>
                {/* ⚠️ دکمه، نه چک‌باکس. `readOnly` روی چک‌باکس اصلا
                    اثری ندارد (HTML آن را برای این نوع تعریف نکرده)،
                    پس کنترلی داشتیم که «علامت‌زده» اعلام می‌شد ولی
                    تنها کارش *حذف* بود. کاری که فقط یک جهت دارد،
                    دکمه است. */}
                <button type="button" className="tsp-tile is-on tsp-rm"
                  aria-label={`برداشتن ${t}`}
                  onClick={() => onLegacyChange?.(legacy.filter(x => x !== t))}>
                  <span className="tsp-mark" aria-hidden><X size={13} /></span>
                  <span className="tsp-txt"><span className="tsp-name">{t}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── خلاصه‌ی زنده ──
          ⚠️ ناحیه‌ی زنده *فقط* یک جمله‌ی کوتاه است، نه کل بخش: با
          `aria-live` روی کل خلاصه، هر تیک هم «علامت‌زده» می‌گفت هم
          کل فهرست را دوباره می‌خواند، و «انتخاب همه» هشت بار. */}
      <p className="tsp-sr" role="status">
        {total > 0 ? `${toFaDigits(total)} تخصص انتخاب شده` : 'هیچ تخصصی انتخاب نشده'}
      </p>

      <section className="tsp-sum">
        <div className="tsp-sum-head">
          <h4>خدمات انتخاب‌شده</h4>
          {total > 0 && <span>{toFaDigits(total)} تخصص</span>}
        </div>

        {total === 0
          ? <p className="tsp-note">هنوز تخصصی انتخاب نشده است. از فهرست بالا، خدماتی را که واقعا ارائه می‌دهید انتخاب کنید — همین‌ها در صفحه‌ی عمومی شما نشان داده می‌شوند.</p>
          : (
            <>
              {picked.map(c => (
                <div key={c.id}>
                  <p className="tsp-sum-cat">{c.title}</p>
                  <ul className="tsp-sum-list">
                    {c.services.map(s => (
                      <li key={s.id}><span className="d" aria-hidden />{s.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {legacy.length > 0 && (
                <div>
                  <p className="tsp-sum-cat">سایر خدمات</p>
                  <ul className="tsp-sum-list">
                    {legacy.map(t => <li key={t}><span className="d" aria-hidden />{t}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
      </section>
    </div>
  )
}
