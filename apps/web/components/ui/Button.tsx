'use client'

/* ─────────────────────────────────────────────────────────────
   دکمه — پرایمیتیوِ پایه.

   ── چرا از نو نوشته شد ──
   نسخه‌ی قبلی **صفر مصرف‌کننده** داشت در حالی که ۱۶۳ فایل `<button>`ِ
   خام می‌نویسند. دلیلش سلیقه نبود، سه چیزِ عینی بود:
     ۱) واریانتِ `primary` **سبز** بود (`#12d492`)، نه طلاییِ برند.
     ۲) روی `lib/tokens` سوار بود که زمینه‌هایش تیره است — بازمانده‌ی
        یک طرحِ رهاشده روی سایتی با تمِ روشن.
     ۳) `focus-visible`، `loading` و `aria-busy` نداشت، یعنی قاعده‌ی
        «هر المانِ تعاملی چهار حالت» را رد می‌کرد.
   یک پرایمیتیوی که با برند نمی‌خواند، استفاده نمی‌شود — و نشد.

   ── حالا ──
   روی توکن‌های Tailwind سوار است (که خودشان به `globals.css` اشاره
   می‌کنند)، پس رنگ فقط یک‌جا عوض می‌شود. چهار حالت دارد و
   `disabled` را از `loading` جدا نگه می‌دارد: دکمه‌ی در حالِ کار
   باید *بگوید* در حال کار است، نه فقط خاموش شود.
   ───────────────────────────────────────────────────────────── */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: Variant
  size?: Size
  /** در حالِ کار — دکمه خاموش می‌شود و چرخنده می‌گیرد */
  loading?: boolean
  /** متنی که هنگامِ کار به‌جای فرزندان نشان داده می‌شود */
  loadingText?: string
  icon?: ReactNode
  block?: boolean
  className?: string
}

/* ⚠️ هدفِ لمس ۴۴ پیکسل حتی در اندازه‌ی کوچک: `CLAUDE.md` این را
   قاعده‌ی سخت گذاشته و مخاطبِ اصلی موبایل است. */
const SIZE: Record<Size, string> = {
  sm: 'min-h-11 px-4 text-sub',
  md: 'min-h-11 px-6 text-body',
  lg: 'min-h-12 px-8 text-body',
}

const VARIANT: Record<Variant, string> = {
  /* تنها رنگِ تأکیدِ سایت. سایه آفست و تاری دارد — هاله‌ی بی‌آفست تزئین است. */
  primary:
    'bg-gold text-[#241B08] shadow-cta ' +
    'hover:enabled:-translate-y-px hover:enabled:bg-gold-light active:enabled:translate-y-0',
  /* تینتِ طلاییِ کم‌رنگ — همان «طرح LQ» که مالک قبلاً تأیید کرده */
  secondary:
    'bg-gold/[.12] text-gold-deep border border-gold/[.34] ' +
    'hover:enabled:-translate-y-px hover:enabled:bg-gold/[.18]',
  ghost:
    'text-ink-2 hover:enabled:text-ink hover:enabled:bg-line/[.04]',
  danger:
    'bg-[#B23B2E] text-white hover:enabled:-translate-y-px hover:enabled:bg-[#9C3226]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText,
    icon, block, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  const off = disabled || loading
  return (
    <button
      ref={ref}
      type={type}
      /* ⚠️ `disabled` هنگامِ کار، دکمه را از ترتیبِ Tab بیرون می‌اندازد
         و فوکوس روی `<body>` می‌افتد؛ `aria-busy` روی المانِ غیرفعال هم
         مطمئن اعلام نمی‌شود. پس فقط `disabled`ِ واقعی خاموش می‌کند. */
      disabled={disabled}
      aria-disabled={off || undefined}
      aria-busy={loading || undefined}
      onClick={off ? undefined : rest.onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-field',
        'font-extrabold leading-none whitespace-nowrap',
        'transition-[background-color,transform,box-shadow] duration-base ease-smooth',
        /* حلقه‌ی فوکوس روی جوهر می‌نشیند تا روی هر چهار واریانت دیده شود */
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0',
        'motion-reduce:transition-none motion-reduce:hover:enabled:translate-y-0',
        SIZE[size],
        VARIANT[variant],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading
        ? <><Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />{loadingText ?? children}</>
        : <>{icon}{children}</>}
    </button>
  )
})
