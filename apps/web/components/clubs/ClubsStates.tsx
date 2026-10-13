/* ─────────────────────────────────────────────────────────────
   حالت‌های فهرستِ باشگاه‌ها: در حالِ بارگذاری، خالی، خطا — و کاشیِ
   «ثبتِ باشگاه».

   ── خطا از «خالی» جداست ──
   پیش‌تر هر خطای شبکه به `setClubs([])` می‌رسید و صفحه می‌گفت «هنوز
   باشگاهی ثبت نشده» — یعنی قطعیِ اینترنتِ بازدیدکننده به‌صورتِ یک
   واقعیت درباره‌ی سایت گزارش می‌شد.

   ── کاشیِ ثبت، داخلِ شبکه ──
   فهرست الان یک باشگاه دارد. در شبکه‌ی سه‌ستونه یعنی یک کارت و دو
   سوم صفحه‌ی خالی. به‌جای پرکردنش با چیزِ ساختگی، خانه‌ی بعدی همان
   دعوتی است که پیش‌تر نوارِ تیره‌ی پایینِ صفحه بود. با رشدِ فهرست
   همین کاشی آخرین خانه می‌ماند و جای خالی‌ای نمی‌سازد.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertCircle, ChevronLeft, Plus, SearchX } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-classes'
import { TILE_SURFACE } from './tile-classes'

/** شبکه‌ی فهرست — ۱ ستون روی گوشی، ۲ از ۶۴۰، ۳ از ۱۰۲۴، ۴ از ۱۵۳۶ */
export const CLUBS_GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'

export function ClubsSkeleton({ view }: { view: 'grid' | 'list' }) {
  const n = view === 'grid' ? 6 : 4
  return (
    <div role="status" aria-label="در حالِ بارگذاریِ باشگاه‌ها" className={view === 'grid' ? CLUBS_GRID : 'flex flex-col gap-4'}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} aria-hidden
          className={[TILE_SURFACE, 'motion-safe:animate-pulse', view === 'list' ? 'flex' : ''].join(' ')}>
          <div className={view === 'grid' ? 'aspect-[3/2] bg-line/[.05]' : 'min-h-32 w-28 shrink-0 bg-line/[.05] sm:w-48'} />
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="h-5 w-1/2 rounded-full bg-line/[.07]" />
            <div className="h-3 w-1/3 rounded-full bg-line/[.05]" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-line/[.05]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function StateBlock({ icon, title, body, action }: {
  icon: ReactNode; title: string; body: string; action: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-line/[.05] text-ink-2">{icon}</span>
      <h3 className="m-0 text-tile text-ink">{title}</h3>
      <p className="m-0 text-sub text-ink-2">{body}</p>
      <div className="mt-2">{action}</div>
    </div>
  )
}

export function ClubsError({ onRetry }: { onRetry: () => void }) {
  return (
    <StateBlock icon={<AlertCircle size={22} aria-hidden />}
      title="فهرستِ باشگاه‌ها بارگذاری نشد"
      body="اتصال را بررسی کنید و دوباره امتحان کنید. اگر مشکل ماند، از ما خبر بگیرید."
      action={<button type="button" onClick={onRetry} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>تلاشِ دوباره</button>} />
  )
}

/** `filtering`: جست‌وجو یا فیلتر فعال است — «پیدا نشد» با «ثبت نشده» فرق دارد.
 *  ⚠️ فیلترِ نوعِ میز در سرور اعمال می‌شود، پس طولِ فهرست به‌تنهایی
 *  نمی‌گوید سایت باشگاه دارد یا نه. */
export function ClubsEmpty({ filtering, onClear }: { filtering: boolean; onClear: () => void }) {
  return filtering ? (
    <StateBlock icon={<SearchX size={22} aria-hidden />}
      title="باشگاهی با این شرایط پیدا نشد"
      body="فیلتر یا عبارتِ جست‌وجو را تغییر دهید."
      action={<button type="button" onClick={onClear} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>پاک‌کردنِ فیلترها</button>} />
  ) : (
    <StateBlock icon={<Plus size={22} aria-hidden />}
      title="هنوز باشگاهی ثبت نشده"
      body="اگر باشگاه دارید، می‌توانید همین حالا ثبتش کنید."
      action={<Link href="/clubs/new" className={buttonClasses({ size: 'sm' })}>ثبتِ باشگاه</Link>} />
  )
}

/** کاشیِ کمک به روشِ اپل («Need help? …»): سطحِ خاکستریِ روشن، نه حاشیه‌ی
 *  خط‌چین — خط‌چین می‌گوید «این‌جا چیزی کم است». پیوند متنی است با «›»،
 *  نه دکمه‌ی دوم: تنها دکمه‌ی قرصیِ صفحه مالِ کارتِ باشگاه است. */
export function RegisterClubTile({ view }: { view: 'grid' | 'list' }) {
  return (
    <aside className={['flex gap-4 rounded-panel bg-line/[.04] p-6',
      view === 'grid' ? 'h-full flex-col items-start justify-center' : 'flex-col items-start sm:flex-row sm:items-center sm:justify-between'].join(' ')}>
      <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/[.14] text-gold-text">
        <Plus size={22} />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="m-0 text-tile text-ink">باشگاهتان این‌جا نیست؟</h3>
        <p className="m-0 text-sub text-ink-2">ثبتش کنید تا بازیکن‌ها پیدایش کنند و میز را آنلاین رزرو کنند.</p>
      </div>
      <Link href="/clubs/new"
        className="-mx-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sub font-bold text-gold-text no-underline
                   hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
        ثبتِ باشگاه
        {/* ⚠️ در RTL «جلو» سمتِ چپ است */}
        <ChevronLeft size={16} aria-hidden />
      </Link>
    </aside>
  )
}
