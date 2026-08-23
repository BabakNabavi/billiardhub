/* ─────────────────────────────────────────────────────────────
   کاتالوگِ خدماتِ متخصص — ستونِ فقراتِ پروفایل.

   ── مسیری که این کامپوننت طی کرده ──
   ۱) اول ابرِ چیپ بود: `{services.map(s => <span className="chip">)}`.
      «تعویض تیپ» (۹ نویسه) کنارِ «تعویض چرم و تور و ریل» (۲۱ نویسه)
      ردیف را بی‌ریتم می‌کرد، خدماتِ چوب و میز در هم می‌ریختند، و
      توضیحِ فنی اصلاً جایی نداشت.
   ۲) بعد فهرستِ ستونیِ داخلِ یک کارتِ سفید شد — بهتر، ولی هنوز یکی
      از پنج قابِ هم‌اندازه‌ی صفحه، با عنوانِ دسته‌ی ۱۴ پیکسلیِ
      کم‌رنگ. یعنی مهم‌ترین محتوای صفحه، هم‌وزنِ «محل فعالیت» بود.
   ۳) حالا: بدونِ ظرف. روی خودِ کاغذ می‌نشیند، عنوانِ دسته اندازه‌ی
      واقعیِ تیتر دارد، و جداکننده خطِ مویی است. بزرگ‌ترین ساختارِ
      صفحه، چون بازدیدکننده برای همین آمده.

   ⚠️ هیچ خدمتی برای پرکردنِ صفحه اضافه نمی‌شود؛ فقط آنچه متخصص
   انتخاب کرده. `resolveServices` مقادیرِ قدیمی را هم نگه می‌دارد.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'
import type { ResolvedServices } from '@/lib/tech-services'
import { toFaDigits } from '@/lib/jalali'
import './service-catalog.css'

function Group({ id, title, other, count, children }: {
  id: string
  title: string
  other?: boolean
  count: number
  children: ReactNode
}) {
  return (
    <section className={other ? 'tsc-other' : undefined} aria-labelledby={`tsc-${id}`}>
      <div className="tsc-cat">
        <h3 id={`tsc-${id}`}>{title}</h3>
        {/* شمار در سرِ دسته می‌نشیند نه کنارِ هر نام: یک عدد که
            وسعتِ کار را می‌گوید، نه هفده برچسبِ تکراری. */}
        <span className="tsc-n">{toFaDigits(count)} خدمت</span>
      </div>
      <ul className="tsc-list">{children}</ul>
    </section>
  )
}

export function ServiceCatalog({ data }: { data: ResolvedServices }) {
  /* ⚠️ بخشِ خالی رندر نمی‌شود — صفحه‌ی بدونِ خدمات نباید قابِ خالی
     نشان بدهد. تصمیمِ نمایش با صداکننده است؛ این گارد تورِ دوم است. */
  if (!data.count) return null

  return (
    <div className="tsc">
      {data.categories.map(c => (
        <Group key={c.id} id={c.id} title={c.title} count={c.services.length}>
          {c.services.map(s => (
            <li key={s.id} className="tsc-row">
              <span className="tsc-name">{s.title}</span>
              <span className="tsc-lead" aria-hidden />
              {s.description && <span className="tsc-desc">{s.description}</span>}
            </li>
          ))}
        </Group>
      ))}

      {/* ⚠️ مقادیرِ ثبت‌شده‌ی پیش از دسته‌بندی. پاک نمی‌شوند چون
          داده‌ی واقعیِ همین متخصص‌اند؛ ساخته هم نمی‌شوند. */}
      {data.legacy.length > 0 && (
        <Group id="other" title="سایر خدمات" other count={data.legacy.length}>
          {data.legacy.map(t => (
            <li key={t} className="tsc-row">
              <span className="tsc-name">{t}</span>
              <span className="tsc-lead" aria-hidden />
            </li>
          ))}
        </Group>
      )}
    </div>
  )
}
