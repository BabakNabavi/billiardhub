'use client'

/* بستنِ منوی بازشو با کلیکِ بیرون یا کلیدِ Esc.

   ⚠️ نقدِ ۲۱ مهر: منوهای بازشوی سایت با Esc بسته نمی‌شدند — کاربرِ
   کیبورد راهی جز Tab زدن تا انتهای منو نداشت. با Esc فوکوس به دکمه‌ای
   برمی‌گردد که منو را باز کرده بود، وگرنه روی `<body>` می‌افتد. */

import { useEffect, useRef, useState } from 'react'

export function useDismissable<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      ref.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, ref }
}
