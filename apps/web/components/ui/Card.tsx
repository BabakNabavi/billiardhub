'use client'

/* ─────────────────────────────────────────────────────────────
   کارت — ظرفِ پایه.

   ── چرا از نو نوشته شد ──
   نسخه‌ی قبلی پیش‌فرضش `variant='dark'` با `blur(24px)` و رنگ‌های
   تیره بود — روی سایتی که تمش روشن است. بازمانده‌ی یک طرحِ رهاشده،
   و مثل `Button` صفر مصرف‌کننده داشت.

   ── قاعده‌ای که این کامپوننت اعمال می‌کند ──
   ⚠️ کارت ظرفِ تنبل است. کارتِ داخلِ کارت همیشه اشتباه است، و شبکه‌ای
   از کارت‌های هم‌اندازه‌ی «آیکون + عنوان + متن» ساختارِ صفحه نیست.
   پس این کامپوننت عمداً `padding` را محدود می‌کند و هیچ واریانتِ
   تزئینی ندارد: فقط تفاوتِ *ارتفاع* (سطح در برابر برجسته) و اینکه
   تعاملی هست یا نه.
   ───────────────────────────────────────────────────────────── */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

type Elevation = 'flat' | 'raised'
type Pad = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  elevation?: Elevation
  pad?: Pad
  /** کارتِ کلیک‌شونده — دکمه می‌شود، نه `<div>`ِ کلیک‌دار */
  onSelect?: () => void
  /** وقتی کلیک‌شونده است، خواننده‌ی صفحه باید بداند چه چیزی را باز می‌کند */
  selectLabel?: string
  children: ReactNode
  className?: string
}

const PAD: Record<Pad, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const ELEV: Record<Elevation, string> = {
  flat: 'bg-surface border border-line/[.06]',
  raised: 'bg-surface border border-line/[.06] shadow-e1',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevation = 'flat', pad = 'md', onSelect, selectLabel, className = '', children, ...rest },
  ref,
) {
  const shell = ['rounded-card', ELEV[elevation], PAD[pad], className].join(' ')

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={selectLabel}
        className={[
          shell,
          'w-full text-start',
          'transition-[border-color,transform,box-shadow] duration-base ease-smooth',
          'hover:border-gold/[.45] hover:-translate-y-0.5 hover:shadow-e2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        ].join(' ')}
      >
        {children}
      </button>
    )
  }

  return <div ref={ref} className={shell} {...rest}>{children}</div>
})
