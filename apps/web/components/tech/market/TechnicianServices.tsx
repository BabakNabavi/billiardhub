'use client'

/* ─────────────────────────────────────────────────────────────
   خدمات ثبت‌شده‌ی متخصص — سطر، نه کارت محصول.

   هر سطر: نام خدمت، توضیح کوتاه (اگر کاتالوگ دارد)، و کنش درخواست.

   ⚠️ «قیمت از…» و «مدت تقریبی» این‌جا نیستند. بریف هر دو را
   خواسته، ولی هیچ‌کدام ستونی در دیتابیس ندارند — نه در `profiles`
   و نه در کاتالوگ. عدد ساختگی روی قیمت خدمت یک آدم واقعی از
   نبودش بدتر است.

   ⚠️ خدمات «قدیمی» (رشته‌هایی که به کاتالوگ نگاشت نمی‌شوند) هم
   نمایش داده می‌شوند، وگرنه بخشی از کار ثبت‌شده‌ی متخصص بی‌صدا
   ناپدید می‌شود.
   ───────────────────────────────────────────────────────────── */

import { Phone } from 'lucide-react'
import type { ResolvedServices } from '@/lib/tech-services'
import { ServiceIcon } from './ServiceIcons'

export interface TechnicianServicesProps {
  data: ResolvedServices
  /** شماره‌ی تماس — اگر نبود، کنش درخواست رندر نمی‌شود */
  phone?: string
}

export function TechnicianServices({ data, phone }: TechnicianServicesProps) {
  const empty = data.categories.length === 0 && data.legacy.length === 0
  if (empty) {
    return <p className="tmp-none">این متخصص هنوز خدماتی ثبت نکرده است</p>
  }

  const action = (title: string) =>
    phone ? (
      <a
        className="tm-btn tm-btn--outline tm-btn--sm"
        href={`tel:${phone}`}
        aria-label={`درخواست ${title}`}
      >
        <Phone size={14} aria-hidden />
        درخواست
      </a>
    ) : null

  return (
    <>
      {data.categories.map(cat => (
        <div key={cat.id}>
          <h3 className="tmp-svc-cat">{cat.title}</h3>
          <ul className="tmp-svc">
            {cat.services.map(s => (
              <li key={s.id}>
                <div className="tmp-svc-row">
                  {/* کاشیِ تیره‌ی آیکون در ابتدای ردیف */}
                  <span className="tmp-svc-ic" aria-hidden>
                    <ServiceIcon id={s.id} />
                  </span>
                  <span className="tmp-svc-b">
                    <span className="tmp-svc-t">{s.title}</span>
                    {s.description && <span className="tmp-svc-d">{s.description}</span>}
                  </span>
                  {action(s.title)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {data.legacy.length > 0 && (
        <div>
          <h3 className="tmp-svc-cat">سایر خدمات</h3>
          <ul className="tmp-svc">
            {data.legacy.map(t => (
              <li key={t}>
                <div className="tmp-svc-row">
                  <span className="tmp-svc-ic" aria-hidden>
                    {/* شناسه‌ی کاتالوگ ندارد ⟵ آیکون عمومی، نه جای خالی:
                        ردیفِ بی‌آیکون کنار بقیه شکسته به نظر می‌رسد. */}
                    <ServiceIcon id="" />
                  </span>
                  <span className="tmp-svc-b"><span className="tmp-svc-t">{t}</span></span>
                  {action(t)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
