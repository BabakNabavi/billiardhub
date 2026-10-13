/* ─────────────────────────────────────────────────────────────
   سربرگِ صفحه‌های داخلی — روشن، جمع‌وجور، تیترِ دورنگ.

   ── چرا ──
   تا مهرِ ۱۴۰۵ هر فهرست سربرگِ خودش را می‌ساخت: نوارِ تیره‌ی تمام‌عرض
   با پوسترِ گرافیکی، برچسبِ انگلیسیِ فاصله‌دار («DISCOVER CLUBS»)، و در
   `/clubs` یک h1 که هر ۴٫۵ ثانیه عوض می‌شد و گاهی «مربیان» می‌گفت.
   مالک ۲۱ مهر تصمیم گرفت: فقط هیروی صفحه‌ی اصلی تیره و سینمایی است؛
   سربرگِ صفحه‌های داخلی روشن و کوتاه.

   ── تیترِ دورنگ ──
   الگوی صفحه‌های اپل («Store. The best way to buy…»): نامِ صفحه سیاه،
   و پشتش یک جمله‌ی خاکستری در همان اندازه که می‌گوید این‌جا به چه کار
   می‌آید. یک h1 است، نه تیتر + زیرتیتر: صفحه‌خوان یک جمله می‌شنود.
   نسخه‌ی اول (۲۲ مهر) تیترِ ۳۲ پیکسلی + زیرتیترِ ۱۳ پیکسلی بود — مالک
   گفت «هیچ نمایی از اپل نمی‌بینم»، و درست می‌گفت.

   · بدونِ کیکر و برچسبِ بالای تیتر.
   · `aside` کنارِ تیتر می‌نشیند (یک اقدامِ کوچک)، نه زیرِ آن.
   · Server Component است؛ هیچ JSای همراهش نمی‌رود.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'

export function PageHeader({ title, tagline, aside, className = '' }: {
  /** نامِ صفحه — سیاه */
  title: string
  /** ادامه‌ی همان جمله — خاکستری، هم‌اندازه */
  tagline?: string
  /** سمتِ مقابلِ تیتر: یک اقدامِ کوچک */
  aside?: ReactNode
  className?: string
}) {
  return (
    <header className={['mx-auto w-full max-w-screen-xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:px-8', className].join(' ')}>
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
        <h1 className="m-0 max-w-3xl text-balance text-page">
          <span className="text-ink">{title}</span>
          {tagline && <span className="text-ink-2"> {tagline}</span>}
        </h1>
        {aside && <div className="shrink-0 pb-2">{aside}</div>}
      </div>
    </header>
  )
}
