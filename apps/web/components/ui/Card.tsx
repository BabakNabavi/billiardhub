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

   ── چرا کارتِ کلیک‌شونده پوششِ روی‌هم است، نه `<button>`ِ دربرگیرنده ──
   ⚠️ نسخه‌ی اولِ همین بازنویسی، وقتی `onSelect` داشت، *کلِ* محتوا را
   داخلِ `<button>` می‌گذاشت. کارتِ بیلیاردهاب تقریباً همیشه چیزی
   تعاملی هم دارد — لینکِ پروفایل، دکمه‌ی «افزودن»، تیکِ انتخاب — و
   `<a>` یا `<button>`ِ تودرتو HTMLِ نامعتبر است: مرورگرها آن را
   بیرون می‌کشند، کلیکِ داخلی و کلیکِ کارت با هم می‌جنگند، و
   صفحه‌خوان کلِ متنِ کارت را یک نامِ دکمه می‌خواند.

   پوششِ روی‌هم همان کلیکِ تمام‌کارت را می‌دهد ولی محتوا بیرونِ دکمه
   می‌ماند: کنترل‌های داخلی با `relative z-10` بالای پوشش می‌نشینند و
   طبیعی کار می‌کنند.
   ───────────────────────────────────────────────────────────── */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

type Elevation = 'flat' | 'raised'
type Pad = 'none' | 'sm' | 'md' | 'lg'

/**
 * کلاسی که هر چیزِ تعاملیِ داخلِ کارتِ کلیک‌شونده باید بگیرد.
 *
 * ⚠️ دکمه‌ی پوششی جای‌گرفته است و طبقِ ترتیبِ نقاشیِ CSS بالای همه‌ی
 * فرزندانِ درون‌جریان می‌نشیند — یعنی لینک یا دکمه‌ی داخلِ کارت
 * بی‌این کلاس اصلاً کلیک نمی‌شود.
 */
export const CARD_ABOVE_HIT = 'relative z-10'

interface CardBase extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onClick'> {
  elevation?: Elevation
  pad?: Pad
  children: ReactNode
  className?: string
}

/**
 * ⚠️ `onSelect` و `selectLabel` جفت‌اند، نه دو propِ اختیاری.
 * دکمه‌ی پوششی هیچ متنی داخلش ندارد، پس بدونِ برچسب صفحه‌خوان فقط
 * «دکمه» می‌گوید. با نوعِ اجتماعی، جاافتادنش خطای `tsc` می‌شود نه
 * یک کنترلِ بی‌نامِ ساکت.
 *
 * ⚠️ `onClick` عمداً از `CardBase` بیرون است: کلیکِ دکمه‌ی پوششی به
 * همین `div` حباب می‌کند، پس `onClick` و `onSelect` با هم یعنی دوبار
 * اجرا شدنِ کار.
 */
export type CardProps = CardBase &
  ({ onSelect: () => void; selectLabel: string } | { onSelect?: never; selectLabel?: never })

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
  const shell = ['rounded-card', ELEV[elevation], PAD[pad], className]

  if (!onSelect) {
    return <div ref={ref} className={shell.join(' ')} {...rest}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={[
        ...shell,
        /* ⚠️ لنگرِ پوشش. بدونِ `relative`، دکمه‌ی مطلق به نزدیک‌ترین
           جدِ جای‌گرفته می‌چسبد — یعنی جای دیگری از صفحه. */
        'relative',
        'transition-[border-color,transform,box-shadow] duration-base ease-smooth',
        /* حالت‌ها روی *کارت* می‌نشینند، نه روی دکمه‌ی نامرئی، چون چیزی
           که کاربر می‌بیند کارت است. */
        'hover:border-gold/[.45] hover:-translate-y-0.5 hover:shadow-e2',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        /* هر لینک/دکمه‌ی داخلِ کارت خودکار بالای پوشش می‌آید. قاعده‌ای
           که فقط در کامنت بماند، فردا رعایت نمی‌شود. */
        '[&_a]:relative [&_a]:z-10',
        '[&_button:not(.card-hit)]:relative [&_button:not(.card-hit)]:z-10',
      ].join(' ')}
      {...rest}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={selectLabel}
        /* ⚠️ حلقه‌ی فوکوس روی خودِ دکمه، نه با `:has()` روی کارت:
           `:has()` در فایرفاکسِ قدیمی و وب‌ویوهای اندرویدِ ارزان نیست
           و آن‌جا کاربرِ کیبورد *هیچ* نشانی نمی‌دید. پوشش تا لبه‌ی
           کارت کشیده شده، پس حلقه‌ی داخلی همان قابِ کارت است.

           `inset-0` نه `w-full h-full`: کارت `padding` دارد و ناحیه‌ی
           کلیک باید تا لبه برسد. */
        className="card-hit absolute inset-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-deep"
      />
      {children}
    </div>
  )
})
