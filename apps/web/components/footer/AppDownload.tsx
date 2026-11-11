import { Smartphone } from 'lucide-react'
import { APP_STORES } from '@/lib/app-stores'
import { IosWebAppButton } from './IosWebAppButton'

/* ─────────────────────────────────────────────────────────────
   «دریافت اپلیکیشن» در فوتر: کافه‌بازار، مایکت، وب‌اپ آیفون.

   Server Component است؛ فقط دکمه‌ی آیفون کلاینتی است (باز کردنِ شیت).
   نشانِ فروشگاهی که هنوز `live` نیست غیرفعال و «به‌زودی» است — نشانیِ
   صفحه‌ی اپ تا پیش از انتشار ۴۰۴ می‌دهد (lib/app-stores).

   داخلِ خودِ اپ (TWA اندروید و وب‌اپِ نصب‌شده‌ی آیفون، هر دو standalone)
   پنهان است — بی جاوااسکریپت، با media query.
   ───────────────────────────────────────────────────────────── */

const BADGE_BASE =
  'inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-surface/70 pe-4 ps-2 text-start'
const BADGE_ACTIVE =
  `${BADGE_BASE} transition duration-200 hover:-translate-y-px hover:border-gold-deep/40 hover:shadow-sm ` +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep'

function Label({ top, name }: { top: string; name: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-xs text-ink-2">{top}</span>
      <span className="text-sm font-semibold text-ink">{name}</span>
    </span>
  )
}

export function AppDownload() {
  return (
    <div role="group" aria-labelledby="ft-app-title" className="mt-4 [@media(display-mode:standalone)]:hidden">
      <h2 id="ft-app-title" className="mb-2 text-xs font-semibold text-ink-2">
        دریافت اپلیکیشن بیلیارد هاب
      </h2>
      <ul className="flex flex-wrap gap-2">
        {APP_STORES.map(store => {
          const icon = (
            // eslint-disable-next-line @next/next/no-img-element -- آیکونِ ثابتِ ۲ کیلوبایتی؛ next/image سودی ندارد
            <img src={store.icon} alt="" width={32} height={32} loading="lazy" decoding="async"
              className="h-8 w-8 shrink-0 rounded-lg" />
          )
          return (
            <li key={store.id}>
              {store.live ? (
                <a href={store.url} target="_blank" rel="noopener noreferrer" className={BADGE_ACTIVE}>
                  {icon}
                  <Label top="دریافت از" name={store.name} />
                </a>
              ) : (
                <span className={`${BADGE_BASE} opacity-60`}>
                  {icon}
                  <Label top="به‌زودی در" name={store.name} />
                </span>
              )}
            </li>
          )
        })}
        <li>
          <IosWebAppButton className={BADGE_ACTIVE}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-surface">
              <Smartphone size={18} aria-hidden />
            </span>
            <Label top="نسخه وب‌اپ" name="مخصوص آیفون" />
          </IosWebAppButton>
        </li>
      </ul>
    </div>
  )
}
