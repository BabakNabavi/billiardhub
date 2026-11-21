import Link from 'next/link'
import { Smartphone } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   «دریافت اپلیکیشن» در فوتر — یک لینک به صفحه‌ی /app.

   همه‌ی راه‌های نصب (کافه‌بازار، دانلودِ مستقیم، وب‌اپ آیفون) با
   راهنما و تشخیصِ دستگاه همان‌جاست؛ فوتر فقط دروازه است.

   داخلِ خودِ اپ (TWA اندروید و وب‌اپِ نصب‌شده‌ی آیفون، هر دو standalone)
   پنهان است — بی جاوااسکریپت، با media query.
   ───────────────────────────────────────────────────────────── */

const BADGE =
  'inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-surface/70 pe-4 ps-2 text-start ' +
  'transition duration-200 hover:-translate-y-px hover:border-gold-deep/40 hover:shadow-sm ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0'

export function AppDownload() {
  return (
    <div className="mt-4 flex max-lg:justify-center [@media(display-mode:standalone)]:hidden">
      <Link href="/app" className={BADGE}>
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-surface">
          <Smartphone size={18} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-xs text-ink-2">اندروید و آیفون</span>
          <span className="text-sm font-semibold text-ink">دریافت اپلیکیشن بیلیارد هاب</span>
        </span>
      </Link>
    </div>
  )
}
