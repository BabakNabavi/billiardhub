/* کلاس‌های دکمه — جدا از `Button.tsx` چون آن فایل `'use client'` است.
   تابعی که از ماژولِ کلاینت صادر شود، در Server Component فقط یک ارجاع
   است و صدا زدنش خطا می‌دهد؛ `<Link>`های دکمه‌شکلِ صفحه‌های سرور هم
   باید همین کلاس‌ها را بگیرند. نقش‌ها و دلیلشان: `Button.tsx`. */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/* ⚠️ هدف لمس ۴۴ پیکسل حتی در اندازه‌ی کوچک: `CLAUDE.md` این را
   قاعده‌ی سخت گذاشته و مخاطب اصلی موبایل است. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-sub',
  md: 'min-h-11 px-6 text-body',
  lg: 'min-h-12 px-8 text-body',
}

const VARIANT: Record<ButtonVariant, string> = {
  /* متن `gold-text` است نه `gold`: طلاییِ خام روی تینتِ خودش ۲٫۱:۱ بود
     و نقد همین را روی دکمه‌ی «رزرو آنلاین» گرفت. این ۵٫۸:۱ روی سفید است. */
  primary:
    'bg-gold/[.12] text-gold-text border border-gold/[.34] ' +
    'hover:bg-gold/20 hover:border-gold-deep/50 hover:-translate-y-px',
  secondary:
    'bg-surface text-ink border border-line/10 shadow-e0 ' +
    'hover:border-line/20 hover:bg-paper',
  ghost:
    'text-ink-2 hover:text-ink hover:bg-line/[.04]',
  danger:
    'bg-danger text-white hover:bg-danger-ink',
}

const BASE = [
  /* قرص، نه گوشه‌ی ۱۰ پیکسلی — دکمه‌ی اپل همیشه تمام‌گرد است و کارت‌های
     گوشه‌گرد را از دکمه جدا می‌کند. (طرحِ LQ پیشین شعاعِ ۱۰ داشت.) */
  'inline-flex items-center justify-center gap-2 rounded-full',
  'font-bold leading-none whitespace-nowrap no-underline select-none',
  'transition-[background-color,border-color,color,transform] duration-base ease-smooth',
  /* بازخورد روی فشردن، نه روی رهاکردن — فشردگیِ کوچک، بدونِ پرش */
  'active:translate-y-0 active:scale-[.98]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
  /* ⚠️ خاموش یعنی بی‌هاور هم. `enabled:hover` نشد: `<a>` هیچ‌وقت `:enabled`
     نیست و لینک‌های دکمه‌شکل هاورشان را از دست می‌دادند. `pointer-events`
     هر دو را می‌پوشاند و `<button disabled>`ِ خام هم ظاهرِ خاموش می‌گیرد. */
  'disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none',
  'aria-disabled:pointer-events-none aria-disabled:opacity-55',
].join(' ')

export function buttonClasses({ variant = 'primary', size = 'md', block = false, className = '' }: {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
} = {}): string {
  return [BASE, SIZE[size], VARIANT[variant], block ? 'w-full' : '', className].join(' ')
}

