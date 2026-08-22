/* ─────────────────────────────────────────────────────────────
   کاتالوگِ خدماتِ متخصص — نه ابرِ برچسب.

   ── چه چیزی عوض شد و چرا ──
   تا امروز خدمات این‌طور رندر می‌شدند:
       {services.map(s => <span className="tp-chip">{s}</span>)}
   یعنی چیپ‌های ریزِ کنارِ هم با طولِ متنِ متفاوت. سه اشکالِ عینی
   داشت:
     ۱) «تعویض تیپ» (۹ نویسه) و «تعویض چرم و تور و ریل» (۲۱ نویسه)
        دو چیپ با عرضِ خیلی متفاوت می‌ساختند و ردیف را شکسته و
        بی‌ریتم می‌کرد.
     ۲) خدماتِ چوب و میز در هم می‌ریختند؛ بیننده نمی‌فهمید این
        متخصص چوب تعمیر می‌کند یا میز یا هر دو.
     ۳) توضیح‌های فنی (مثلاً «رزوه وسط و انتهای چوب») اصلاً جایی
        برای نشستن نداشتند.

   ── ساختارِ تازه ──
   فهرستِ ستونیِ گروه‌بندی‌شده: هر دسته یک تیتر، زیرش ردیف‌های
   هم‌ارتفاع با جداکننده‌ی نازک. عرضِ ستون ثابت است، پس طولِ متن
   ریتم را نمی‌شکند — متنِ بلند در همان ستون می‌پیچد و ردیف کمی
   بلندتر می‌شود، که طبیعی است.

   ⚠️ کارتِ سنگین نیست: یک سطح، جداکننده‌ی مویی، بدونِ سایه‌ی
   ردیف‌به‌ردیف. کاتالوگ باید مثلِ فهرستِ خدماتِ یک حرفه‌ای خوانده
   شود، نه مثلِ شبکه‌ای از کامپوننت.
   ───────────────────────────────────────────────────────────── */

import type { ResolvedServices } from '@/lib/tech-services'
import './service-catalog.css'

export function ServiceCatalog({ data }: { data: ResolvedServices }) {
  /* ⚠️ بخشِ خالی رندر نمی‌شود — صفحه‌ی بدونِ خدمات نباید قابِ خالی
     نشان بدهد. تصمیمِ نمایش با صداکننده است؛ این گارد تورِ دوم است. */
  if (!data.count) return null

  return (
    <div className="tsc">
      {data.categories.map(c => (
        <section key={c.id} className="tsc-group" aria-labelledby={`tsc-${c.id}`}>
          <h3 id={`tsc-${c.id}`} className="tsc-cat">{c.title}</h3>
          <ul className="tsc-list">
            {c.services.map(s => (
              <li key={s.id} className="tsc-row">
                <span className="tsc-name">{s.title}</span>
                {s.description && <span className="tsc-desc">{s.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* ⚠️ مقادیرِ ثبت‌شده‌ی پیش از دسته‌بندی. پاک نمی‌شوند چون
          داده‌ی واقعیِ همین متخصص‌اند؛ ساخته هم نمی‌شوند. */}
      {data.legacy.length > 0 && (
        <section className="tsc-group" aria-labelledby="tsc-other">
          <h3 id="tsc-other" className="tsc-cat">سایر خدمات</h3>
          <ul className="tsc-list">
            {data.legacy.map(t => (
              <li key={t} className="tsc-row"><span className="tsc-name">{t}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
