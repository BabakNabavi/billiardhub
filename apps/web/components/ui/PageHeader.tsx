/* ─────────────────────────────────────────────────────────────
   سربرگِ صفحه‌های داخلی — روشن و جمع‌وجور.

   ── چرا ──
   تا مهرِ ۱۴۰۵ هر فهرست سربرگِ خودش را می‌ساخت: نوارِ تیره‌ی تمام‌عرض
   با پوسترِ گرافیکی، برچسبِ انگلیسیِ فاصله‌دار («DISCOVER CLUBS»)، و در
   `/clubs` یک h1 که هر ۴٫۵ ثانیه عوض می‌شد و گاهی «مربیان» می‌گفت.
   مالک ۲۱ مهر تصمیم گرفت: فقط هیروی صفحه‌ی اصلی تیره و سینمایی است؛
   سربرگِ صفحه‌های داخلی روشن و کوتاه.

   ── قاعده ──
   · یک h1 ثابت که بگوید صفحه چیست. بدونِ کیکر، بدونِ برچسبِ بالای تیتر.
   · حداکثر یک جمله زیرش — فقط وقتی تیتر به‌تنهایی کافی نیست.
   · `aside` کنارِ تیتر می‌نشیند (شمارش، یک اقدام)، نه زیرِ آن.
   · Server Component است؛ هیچ JSای همراهش نمی‌رود.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'

export function PageHeader({ title, sub, aside, className = '' }: {
  title: string
  sub?: ReactNode
  /** سمتِ مقابلِ تیتر: شمارش، یک دکمه */
  aside?: ReactNode
  className?: string
}) {
  return (
    <header className={['mx-auto w-full max-w-screen-xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8 lg:px-8', className].join(' ')}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="m-0 text-balance text-page text-ink">{title}</h1>
          {sub && <p className="m-0 mt-1 max-w-prose text-pretty text-sub text-ink-2">{sub}</p>}
        </div>
        {aside && <div className="flex shrink-0 items-center gap-3">{aside}</div>}
      </div>
    </header>
  )
}
