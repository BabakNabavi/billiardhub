import Link from 'next/link'
import type { Metadata } from 'next'
import { Home, MapPin } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button-classes'
import { ExploreCards, EXPLORE_ITEMS } from '@/components/home/ExploreCards'
import { MissedShot } from '@/components/not-found/MissedShot'
import { BackLink, RequestedPath } from '@/components/not-found/NotFoundClient'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی ۴۰۴ — «این ضربه به پاکت نرسید».

   بدون این فایل، Next صفحه‌ی پیش‌فرضِ انگلیسیِ خودش را نشان می‌داد —
   وسطِ یک سایتِ کاملاً فارسی. نسخه‌ی اول (یک کارتِ سفید و عددِ ۴۰۴)
   درست کار می‌کرد ولی می‌توانست مالِ هر سایتی باشد. مالک خواست «انگار
   مخصوصِ بیلیارد هاب ساخته شده باشد».

   ── ایده ──
   صفرِ فارسی خودش یک نقطه است؛ این‌جا همان نقطه توپِ سفید است: «۴ ● ۴».
   کنارش میزِ اسنوکر، ضربه‌ای که تا لبه‌ی پاکت می‌رود و نمی‌افتد. و بعد
   راهِ ادامه: صفحه‌ی اصلی، باشگاه‌ها، و همان کارت‌های رنگیِ بخش‌ها که در
   صفحه‌ی اصلی هست (یک منبع: `ExploreCards`).

   ⚠️ جست‌وجو عمداً نیست: سایت هنوز صفحه‌ی جست‌وجو ندارد و کادری که
   نتیجه‌ای نمی‌دهد، از نبودنش بدتر است.
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  /* `absolute`: ۴۰۴ زیرِ هر لایه‌ای رندر می‌شود و بعضی (مثلاً media) قالبِ عنوان
     را قطع کرده‌اند — رشته‌ی ساده آن‌جا بی‌نامِ سایت می‌ماند. */
  title: { absolute: 'صفحه پیدا نشد | بیلیارد هاب' },
  robots: { index: false, follow: true },
}

/** توپِ سفید به‌جای صفرِ وسطِ «۴۰۴» */
function CueBallZero() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className="size-[0.6em] shrink-0 drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]">
      <defs>
        <radialGradient id="nf-zero" cx=".36" cy=".32" r=".78">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#F4F1EA" />
          <stop offset="1" stopColor="#C9C2B3" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#nf-zero)" />
      {/* نقطه‌ی قرمزِ توپِ تمرینی — توپِ سفیدِ ساده روی زمینه‌ی روشن گم می‌شد */}
      <circle cx="27" cy="25" r="3" fill="#C8102E" opacity=".85" />
    </svg>
  )
}

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-paper">
      {/* لکه‌های محیطی — همان طلایی و سبزِ نمدیِ نوارِ «بیشتر ببینید» */}
      <div aria-hidden className="pointer-events-none absolute -top-24 end-[8%] size-96 rounded-full bg-[radial-gradient(circle,rgba(199,166,106,0.26)_0%,transparent_65%)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 start-[10%] size-80 rounded-full bg-[radial-gradient(circle,rgba(20,83,45,0.14)_0%,transparent_65%)] blur-3xl" />

      <div className="relative mx-auto grid max-w-screen-xl items-center gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-16 lg:pt-16">
        {/* متن — در RTL ستونِ اول سمتِ راست است. روی گوشی هم اول می‌آید: راهِ
            بیرون (دکمه‌ها) باید بی‌اسکرول دیده شود؛ میز زیرش. */}
        <div>
          <p aria-hidden className="m-0 flex items-center gap-2 text-[clamp(3.5rem,2.4rem+5vw,6.5rem)] font-extrabold leading-none text-gold-deep">
            <span>۴</span><CueBallZero /><span>۴</span>
          </p>
          <h1 className="m-0 mt-6 text-balance text-display text-ink">
            <span className="sr-only">خطای ۴۰۴ — </span>این ضربه به پاکت نرسید
          </h1>
          <p className="m-0 mt-3 max-w-md text-pretty text-body text-ink-2">
            صفحه‌ای که دنبالش بودید این‌جا نیست. شاید نشانی اشتباه تایپ شده، یا این صفحه برداشته شده است.
          </p>
          <RequestedPath />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonClasses({ size: 'lg' })}>
              <Home size={18} aria-hidden />صفحه‌ی اصلی
            </Link>
            <Link href="/clubs" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
              <MapPin size={18} aria-hidden />باشگاه‌ها
            </Link>
            <BackLink />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <MissedShot />
        </div>
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="m-0 mb-6 text-section text-ink">شاید دنبالِ یکی از این‌ها بودید</h2>
        <ExploreCards items={EXPLORE_ITEMS.slice(0, 6)} className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4" />
      </div>
    </section>
  )
}
