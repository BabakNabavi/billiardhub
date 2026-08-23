/* ─────────────────────────────────────────────────────────────
   کاتالوگِ خدماتِ متخصص.

   ── مسیری که طی شده ──
   ۱) ابرِ چیپ — طولِ نامِ متفاوت ردیف را می‌شکست.
   ۲) فهرستِ خط‌دار با راهنمای نقطه‌چین — ریتم درست شد ولی صفحه
      روزنامه شد.
   ۳) حالا: هر دسته یک «صفحه‌ی رشته» با زمینِ خودش، و خدمات داخلش
      در شبکه‌ی کشسان. یک سطح برای هر دسته — نه یک کارت برای هر
      خدمت، نه یک خط برای هر ردیف.

   ⚠️ فقط خدماتی که متخصص انتخاب کرده. دسته‌ی بی‌خدمت اصلاً رندر
   نمی‌شود؛ `resolveServices` هم مقادیرِ قدیمی را نگه می‌دارد.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import type { ResolvedServices } from '@/lib/tech-services'
import { toFaDigits } from '@/lib/jalali'
import './service-catalog.css'

function Discipline({ id, title, count, other, children }: {
  id: string
  title: string
  count: number
  other?: boolean
  children: ReactNode
}) {
  return (
    <section className={`tsc-disc${other ? ' is-other' : ''}`} aria-labelledby={`tsc-${id}`}>
      <div className="tsc-disc-head">
        <h3 id={`tsc-${id}`}>{title}</h3>
        {/* شمار در سرِ دسته می‌نشیند، نه کنارِ هر نام */}
        <span className="tsc-n">{toFaDigits(count)} خدمت</span>
      </div>
      <ul className="tsc-grid" data-n={count}>{children}</ul>
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
