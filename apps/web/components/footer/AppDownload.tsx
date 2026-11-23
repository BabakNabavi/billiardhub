import { Download, Smartphone } from 'lucide-react'
import { ANDROID_APK, BAZAAR, SHOW_APK_IN_FOOTER } from '@/lib/app-stores'
import { IosWebAppButton } from './IosWebAppButton'

/* ─────────────────────────────────────────────────────────────
   «دریافت اپلیکیشن» در فوتر: کافه‌بازار، دانلودِ مستقیمِ APK، وب‌اپ آیفون.
   (خواستِ مالک: همین سه دکمه، مستقیم — بی رفتن به صفحه‌ی دیگر)
   ⚠️ دانلودِ مستقیم موقتاً پنهان است: SHOW_APK_IN_FOOTER در lib/app-stores.

   Server Component است؛ فقط دکمه‌ی آیفون کلاینتی است (باز کردنِ شیت).
   نشانی‌ها از lib/app-stores می‌آیند.

   داخلِ خودِ اپ (TWA اندروید و وب‌اپِ نصب‌شده‌ی آیفون، هر دو standalone)
   پنهان است — بی جاوااسکریپت، با media query.
   ───────────────────────────────────────────────────────────── */

const BADGE =
  'inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-surface/70 pe-4 ps-2 text-start ' +
  'transition duration-200 hover:-translate-y-px hover:border-gold-deep/40 hover:shadow-sm ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep'

const ICON_TILE = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-surface'

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
      <h2 id="ft-app-title" className="mb-2 text-xs font-semibold text-ink-2 max-lg:text-center">
        دریافت اپلیکیشن بیلیارد هاب
      </h2>
      <ul className="flex flex-wrap gap-2 max-lg:justify-center">
        <li>
          <a href={BAZAAR.url} target="_blank" rel="noopener noreferrer" className={BADGE}>
            {/* eslint-disable-next-line @next/next/no-img-element -- آیکونِ ثابتِ ۲ کیلوبایتی؛ next/image سودی ندارد */}
            <img src={BAZAAR.icon} alt="" width={32} height={32} loading="lazy" decoding="async"
              className="h-8 w-8 shrink-0 rounded-lg" />
            <Label top="دریافت از" name={BAZAAR.name} />
          </a>
        </li>
        {/* موقتاً خاموش — SHOW_APK_IN_FOOTER در lib/app-stores */}
        {SHOW_APK_IN_FOOTER && (
          <li>
            <a href={ANDROID_APK.href} download={ANDROID_APK.fileName}
              type="application/vnd.android.package-archive" className={BADGE}>
              <span className={ICON_TILE}>
                <Download size={18} aria-hidden />
              </span>
              <Label top="دانلود مستقیم" name="فایل نصبی اندروید" />
            </a>
          </li>
        )}
        <li>
          <IosWebAppButton className={BADGE}>
            <span className={ICON_TILE}>
              <Smartphone size={18} aria-hidden />
            </span>
            <Label top="نسخه وب‌اپ" name="مخصوص آیفون" />
          </IosWebAppButton>
        </li>
      </ul>
    </div>
  )
}
