'use client'

/* ─────────────────────────────────────────────────────────────
   کاتالوگِ خدماتِ متخصص.

   هر دسته یک صحنه است: نقشه‌ی فنیِ همان رشته در قابِ سه‌بعدی، و
   خدمات کنارش. دسته‌ها یک‌درمیان آینه می‌شوند تا صفحه ریتم بگیرد.

   ⚠️ فقط خدماتی که متخصص انتخاب کرده. دسته‌ی بی‌خدمت رندر نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import type { ResolvedServices } from '@/lib/tech-services'
import { toFaDigits } from '@/lib/jalali'
import { PlateFor } from './CraftPlate'
import { useTilt } from './use-tilt'
import './craft-plate.css'
import './service-catalog.css'

function Discipline({ id, title, count, other, children }: {
  id: string
  title: string
  count: number
  other?: boolean
  children: ReactNode
}) {
  const tilt = useTilt()
  return (
    <section className={`tsc-disc${other ? ' is-other' : ''}`} aria-labelledby={`tsc-${id}`}>
      {!other && (
        <div className="tsc-stage" data-plate ref={tilt.ref}>
          <PlateFor id={id} />
        </div>
      )}
      <div className="tsc-body">
        <div className="tsc-disc-head">
          <h3 id={`tsc-${id}`}>{title}</h3>
          {/* شمار در سرِ دسته می‌نشیند، نه کنارِ هر نام */}
          <span className="tsc-n">{toFaDigits(count)} خدمت</span>
        </div>
        <ul className="tsc-grid">{children}</ul>
      </div>
    </section>
  )
}

export function ServiceCatalog({ data }: { data: ResolvedServices }) {
  /* گاردِ دوم؛ تصمیمِ نمایش با صداکننده است */
  if (!data.count) return null

  return (
    <div className="tsc">
      {data.categories.map(c => (
        <Discipline key={c.id} id={c.id} title={c.title} count={c.services.length}>
          {c.services.map(s => (
            <li key={s.id} className="tsc-item">
              <span className="tsc-dot" aria-hidden />
              <span>
                <span className="tsc-name">{s.title}</span>
                {s.description && <span className="tsc-desc">{s.description}</span>}
              </span>
            </li>
          ))}
        </Discipline>
      ))}

      {/* ⚠️ مقادیرِ ثبت‌شده‌ی پیش از دسته‌بندی: پاک نمی‌شوند چون
          داده‌ی واقعیِ همین متخصص‌اند؛ ساخته هم نمی‌شوند. */}
      {data.legacy.length > 0 && (
        <Discipline id="other" title="سایر خدمات" count={data.legacy.length} other>
          {data.legacy.map(t => (
            <li key={t} className="tsc-item">
              <span className="tsc-dot" aria-hidden />
              <span className="tsc-name">{t}</span>
            </li>
          ))}
        </Discipline>
      )}
    </div>
  )
}
