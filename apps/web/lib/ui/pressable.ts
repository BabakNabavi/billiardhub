/* کنترلی که از نظرِ ظاهر `<div>` است ولی باید مثلِ دکمه کار کند.

   ⚠️ جای `<button>` را نمی‌گیرد. برای کنترلِ تازه همیشه `<button>` بساز.
   این فقط برای کارت‌ها و سرلوحه‌های موجودی است که ظاهرشان به چیدمانِ
   `div` گره خورده (کارتِ انتخابِ میز، سرلوحه‌ی آلبوم، ناحیه‌ی آپلود) و
   تبدیلشان به `<button>` سبکِ پیش‌فرضِ دکمه را رویشان می‌اندازد — مثلاً
   قاعده‌ی سراسریِ `button { font-weight: 600 }`.

   بدونِ این، کاربرِ کیبورد و صفحه‌خوان به این کنترل‌ها اصلاً نمی‌رسید:
   نه با Tab فوکوس می‌گرفتند، نه با Enter کار می‌کردند. */

import type { KeyboardEvent } from 'react'

export function pressable(onActivate: () => void, role: 'button' | 'link' = 'button') {
  return {
    role,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      /* کلیدی که روی یک فرزندِ فوکوس‌پذیر (دکمه، ورودی) زده شده، مالِ خودش است */
      if (e.target !== e.currentTarget) return
      /* فاصله برای پیوند نیست — صفحه را اسکرول می‌کند */
      if (e.key === 'Enter' || (role === 'button' && e.key === ' ')) {
        e.preventDefault()
        onActivate()
      }
    },
  }
}
