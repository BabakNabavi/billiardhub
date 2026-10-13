'use client'

/* ─────────────────────────────────────────────────────────────
   دکمه — پرایمیتیو پایه.

   ── چرا از نو نوشته شد ──
   نسخه‌ی قبلی **صفر مصرف‌کننده** داشت در حالی که ۱۶۳ فایل `<button>`
   خام می‌نویسند. دلیلش سلیقه نبود، سه چیز عینی بود:
     ۱) واریانت `primary` **سبز** بود (`#12d492`)، نه طلایی برند.
     ۲) روی `lib/tokens` سوار بود که زمینه‌هایش تیره است — بازمانده‌ی
        یک طرح رهاشده روی سایتی با تم روشن.
     ۳) `focus-visible`، `loading` و `aria-busy` نداشت، یعنی قاعده‌ی
        «هر المان تعاملی چهار حالت» را رد می‌کرد.
   یک پرایمیتیوی که با برند نمی‌خواند، استفاده نمی‌شود — و نشد.

   ── مهرِ ۱۴۰۵: یک سیستم، نه هشت ──
   نقدِ ۲۱ مهر روی صفحه‌ی اصلی هفت و روی صفحه‌ی باشگاه یازده شکلِ دکمه
   شمرد. حالا سه نقش هست و بس:
     · primary   — «طرح LQ»: تینتِ طلایی با متنِ طلاییِ تیره. همان CTA که
                   مالک تأیید کرده؛ در هر صفحه یک یا دو بار، نه بیشتر.
     · secondary — خنثی: سطحِ سفید با خطِ مو. همه‌ی کنترل‌های دیگر.
     · danger    — فقط برای کارِ برگشت‌ناپذیر.
   `ghost` برای دکمه‌ی متنیِ داخلِ نوار و پنل می‌ماند.

   ⚠️ `primary` قبلاً طلاییِ **پُر** بود. هیچ مصرف‌کننده‌ای نداشت، پس
   عوض‌کردنش چیزی را بی‌صدا تغییر نمی‌دهد.

   ── لینکِ دکمه‌شکل ──
   `buttonClasses` (در `button-classes.ts`) همان کلاس‌ها را برای `<Link>` می‌دهد تا یک ظاهر دو
   پیاده‌سازی نداشته باشد. لینک `disabled` و `loading` ندارد، پس فقط
   ظاهر را می‌گیرد.
   ───────────────────────────────────────────────────────────── */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-classes'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** در حال کار — دکمه خاموش می‌شود و چرخنده می‌گیرد */
  loading?: boolean
  /** متنی که هنگام کار به‌جای فرزندان نشان داده می‌شود */
  loadingText?: string
  icon?: ReactNode
  block?: boolean
  className?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText,
    icon, block, className = '', children, disabled, type = 'button', onClick, ...rest },
  ref,
) {
  const off = disabled || loading
  return (
    <button
      ref={ref}
      type={type}
      /* ⚠️ `disabled` هنگام کار، دکمه را از ترتیب Tab بیرون می‌اندازد
         و فوکوس روی `<body>` می‌افتد؛ `aria-busy` روی المان غیرفعال هم
         مطمئن اعلام نمی‌شود. پس فقط `disabled` واقعی خاموش می‌کند. */
      disabled={disabled}
      aria-disabled={off || undefined}
      aria-busy={loading || undefined}
      /* ⚠️ `onClick` از `rest` بیرون کشیده شد. پیش‌تر `{...rest}` بعد از
         این خط پخش می‌شد و همان `onClick` را برمی‌گرداند — دکمه‌ی «در حال
         کار» با کلیکِ دوم دوباره اجرا می‌شد. */
      /* ⚠️ `preventDefault` هم لازم است: دکمه‌ی `type="submit"`ِ در حالِ کار
         بدونِ `onClick` هم فرمش را دوباره می‌فرستاد، چون `disabled` عمداً
         روشن نیست. */
      onClick={off ? e => e.preventDefault() : onClick}
      className={[
        buttonClasses({ variant, size, block, className }),
        loading ? 'cursor-progress' : '',
      ].join(' ')}
      {...rest}
    >
      {loading
        ? <><Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />{loadingText ?? children}</>
        : <>{icon}{children}</>}
    </button>
  )
})
