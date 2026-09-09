/* ─────────────────────────────────────────────────────────────
   سرعنوان بخش.

   ── سه چیزی که برداشته شد ──
   ۱) **کیکر** — برچسب ریز فاصله‌دار بالای عنوان. عنوان وزن خودش
      را دارد؛ برچسب بالایش فقط ارتفاع اسکرول اضافه می‌کند. (روی
      فارسی `text-transform: uppercase` هم اصلا کاری نمی‌کرد.)
   ۲) **خط درخشان** — `box-shadow: 0 0 10px` روی یک خط ۱ پیکسلی.
      هاله‌ی بی‌آفست عمق نیست، تزئین است.
   ۳) **لینک نامرئی** — «مشاهده همه» با `rgba(255,255,255,0.3)`
      نوشته شده بود، یعنی سفید کم‌رنگ روی زمینه‌ی *روشن*. بازمانده‌ی
      همان طرح تیره‌ی رهاشده؛ عملا دیده نمی‌شد.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionHeader({ title, sub, href, linkLabel = 'مشاهده همه', className = '' }: {
  title: string
  /** یک جمله‌ی توضیح — فقط وقتی عنوان به‌تنهایی گویا نیست */
  sub?: ReactNode
  href?: string
  linkLabel?: string
  className?: string
}) {
  return (
    <div className={['mb-6 flex items-end justify-between gap-4', className].join(' ')}>
      <div className="min-w-0">
        <h2 className="text-title m-0 text-ink">{title}</h2>
        {sub && <p className="text-sub mt-1 max-w-prose text-ink-2">{sub}</p>}
      </div>

      {href && (
        /* ⚠️ در RTL «جلو» سمت چپ است، پس `ArrowLeft` جهت درست است. */
        <Link href={href}
          className="text-sub inline-flex shrink-0 items-center gap-1.5 font-bold text-gold-deep
                     transition-colors duration-fast ease-smooth hover:text-ink
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep
                     focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-chip">
          {linkLabel}
          <ArrowLeft size={14} aria-hidden />
        </Link>
      )}
    </div>
  )
}
