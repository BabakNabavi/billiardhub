/* ─────────────────────────────────────────────────────────────
   برچسب — وضعیت، نه تزئین.

   ── چرا از نو نوشته شد ──
   نسخه‌ی قبلی رنگ‌ها را با *نام رنگ* می‌گرفت (`green`, `cyan`,
   `violet`, `amber`) و پیش‌فرضش `green` بود که در عمل طلایی رنگ
   می‌کرد — نام دروغ می‌گفت. `cyan`/`violet` هم هیچ‌جای این برند
   معنا ندارند. علاوه بر آن یک `blur(10px)` روی برچسب ۱۲ پیکسلی
   داشت و یک هاله‌ی `0 0 8px` بی‌آفست؛ هر دو تزئین محض.

   ── قاعده ──
   رنگ از *معنا* می‌آید نه از انتخاب نویسنده. پنج لحن بیشتر نیست، و
   هیچ‌کدام تزئینی نیستند: طلایی تأکید است، سبز و قرمز وضعیت واقعی
   محصول‌اند (باز/بسته، تأییدشده/ردشده)، کهربایی انتظار، و خنثی
   فراداده. اگر برچسبی هیچ‌کدام از این‌ها نیست، احتمالا اصلا نباید
   برچسب باشد.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'

export type BadgeTone = 'accent' | 'positive' | 'warning' | 'critical' | 'neutral'

const TONE: Record<BadgeTone, string> = {
  accent: 'text-gold-deep bg-gold/[.12] border-gold/[.28]',
  positive: 'text-[#0E7A38] bg-[#0E7A38]/[.10] border-[#0E7A38]/[.24]',
  warning: 'text-[#8A5A00] bg-[#F59E0B]/[.12] border-[#F59E0B]/[.30]',
  critical: 'text-[#B23B2E] bg-[#B23B2E]/[.10] border-[#B23B2E]/[.24]',
  neutral: 'text-ink-2 bg-line/[.04] border-line/[.10]',
}

export function Badge({ children, tone = 'neutral', dot, className = '' }: {
  children: ReactNode
  tone?: BadgeTone
  /** نقطه‌ی وضعیت — فقط وقتی برچسب یک حالت *زنده* را نشان می‌دهد */
  dot?: boolean
  className?: string
}) {
  return (
    <span className={[
      'inline-flex items-center gap-1.5 rounded-full border',
      'px-2.5 py-1 text-meta font-bold leading-none',
      TONE[tone], className,
    ].join(' ')}>
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}
