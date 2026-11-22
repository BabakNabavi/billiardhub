import type { ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────────
   دکمه‌ی عملیاتِ هر ردیفِ فهرست‌های پنل (کاربران، محصولات، اخبار).

   تا آذرِ ۱۴۰۵ این دکمه‌ها فقط آیکون بودند و نامشان در `title` بود — یعنی
   فقط با هاورِ موس دیده می‌شد. در موبایل هاوری نیست و مالک نمی‌فهمید هر
   دکمه چه می‌کند. حالا:
     • زیرِ lg (گوشی و تبلتِ ایستاده — هیچ‌کدام هاور ندارند): آیکون + نامِ
       کوتاه، و دکمه‌ها در ردیفِ کاملِ زیرِ مشخصات (ROW_ACTIONS_CLASS)
     • lg به بالا: همان آیکونِ قبلی با راهنمای هاور
   ⚠️ lg نه md: در ۷۶۸ تا ۱۰۲۳ ستونِ «عملیات» (۲ از ۱۲) برای پنج آیکون جا نداشت
   و دو خط می‌شد. زیرِ ۷۰۰ پیکسل app/admin/layout شبکه را دوستونی می‌کند و
   ردیفِ کامل را با `.col-span-12 { grid-column: 1 / -1 }` نگه می‌دارد.
   ───────────────────────────────────────────────────────────── */

export type RowActionTone = 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple'

const HOVER: Record<RowActionTone, string> = {
  blue: 'hover:text-blue-600 hover:bg-blue-50',
  green: 'hover:text-green-600 hover:bg-green-50',
  red: 'hover:text-red-600 hover:bg-red-50',
  orange: 'hover:text-orange-600 hover:bg-orange-50',
  yellow: 'hover:text-yellow-700 hover:bg-yellow-50',
  purple: 'hover:text-purple-600 hover:bg-purple-50',
}

/* رنگِ پایه فقط برای کارِ خطرناک: روی لمس هاوری نیست تا «حذف» و «رد» را از
   «مشاهده» جدا کند */
const BASE: Partial<Record<RowActionTone, string>> = { red: 'text-red-600' }

/** ظرفِ دکمه‌ها در ردیفِ grid-cols-12: زیرِ lg ردیفِ کامل، lg به بالا ستونِ «عملیات» */
export const ROW_ACTIONS_CLASS =
  'col-span-12 mt-3 flex flex-wrap items-center gap-2 lg:col-span-2 lg:mt-0 lg:justify-center lg:gap-1'

/** سرستونِ «عملیات» فقط وقتی دکمه‌ها واقعا در آن ستون‌اند */
export const ROW_ACTIONS_HEAD_CLASS = 'col-span-2 hidden text-center lg:block'

export function RowAction({ label, short, icon, onClick, tone = 'blue', ariaLabel }: {
  /** نامِ کامل — راهنمای هاورِ دسکتاپ و نامِ دسترس‌پذیر */
  label: string
  /** نامِ کوتاهِ روی دکمه زیرِ lg؛ نبودش یعنی همان label */
  short?: string
  icon: ReactNode
  onClick: () => void
  tone?: RowActionTone
  /** وقتی نامِ دکمه باید موضوع را هم بگوید (مثلا «حذف عنوانِ خبر») */
  ariaLabel?: string
}) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={ariaLabel ?? label}
      className={`inline-flex h-11 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold ${BASE[tone] ?? 'text-gray-600'} transition-colors lg:h-auto lg:border-0 lg:bg-transparent lg:p-1.5 lg:text-gray-400 ${HOVER[tone]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep`}>
      {icon}
      <span className="lg:hidden">{short ?? label}</span>
    </button>
  )
}
