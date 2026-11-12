import { Globe } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-classes'

/* ─────────────────────────────────────────────────────────────
   مالکیت و برند — «پلاک»، نه کارتِ سفیدِ اطلاعات.

   قابِ دوخطیِ شامپاینی مثلِ پلاکِ حک‌شده‌ی روی بدنه‌ی میزهای دست‌ساز؛
   دو نشان با یک خطِ ریل و خالِ لوزی به هم وصل‌اند: برند و شرکتِ مالک.
   فقط اطلاعاتِ واقعی: نامِ شرکت، برندِ ثبت‌شده، وب‌سایت. هیچ شماره‌ی
   ثبت، جایزه یا آمارِ ساختگی
   ───────────────────────────────────────────────────────────── */

export function Ownership() {
  return (
    <div className="ab-plaque mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-12 text-center sm:px-12 sm:py-16">
      <div className="flex items-center gap-4" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- لوگوی ثابت */}
        <img src="/images/Logo/bh-tile-256-v13.webp" alt="" width={64} height={64} loading="lazy" decoding="async" className="h-12 w-12 rounded-card sm:h-16 sm:w-16" />
        <span className="ab-plaque-link"><span className="ab-rail-sight" /></span>
        {/* eslint-disable-next-line @next/next/no-img-element -- لوگوی ثابت */}
        <img src="/images/Logo/Arta.svg" alt="" width={64} height={64} loading="lazy" decoding="async" className="h-12 w-12 object-cover object-left sm:h-16 sm:w-16" />
      </div>
      <h2 id="ab-company" className="text-display">
        بیلیارد هاب متعلق به{' '}
        <span className="block text-gold-text">شرکت بازرگانی آرتا تجارت بین‌الملل آپادانا میباشد</span>
      </h2>
      <p className="max-w-prose text-body text-ink-2">
        <span dir="ltr">Billiard Hub</span> برند ثبت‌شده این شرکت است و همه خدمات پلتفرم با همین برند ارائه می‌شود
      </p>
      <a href="https://www.artaintl.com" target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary' })}>
        <Globe size={16} aria-hidden />
        وب‌سایت آرتا تجارت
        <span dir="ltr" className="text-ink-2">www.artaintl.com</span>
        <span className="sr-only">(در پنجره جدید)</span>
      </a>
    </div>
  )
}
