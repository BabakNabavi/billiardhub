'use client'

/* ─────────────────────────────────────────────────────────────
   ارتفاع واقعی نوار ثابت سایت را در `--nr-nav` می‌گذارد.

   ⚠️ نوار بخش‌ها `sticky` است و باید دقیقا زیر نوار سراسری بنشیند.
   عدد ثابت جواب نمی‌دهد: در حالت نصب‌شده‌ی آی‌اواس، `safe-area`
   نوار را بلندتر می‌کند و نوار بخش‌ها می‌رود زیرش. همان تله‌ای که در
   پروفایل خدمات فنی اندازه‌گیری و رفع شد.

   تنها بخش کلاینتی صفحه‌ی اخبار است و هیچ چیزی رندر نمی‌کند.
   ───────────────────────────────────────────────────────────── */

import { useEffect } from 'react'

export default function NavOffset() {
  useEffect(() => {
    const nav = document.querySelector('body > nav, header nav')
    if (!nav) return
    const root = document.documentElement
    const apply = () => {
      const h = Math.round(nav.getBoundingClientRect().height)
      if (h > 0) root.style.setProperty('--nr-nav', `${h}px`)
    }
    apply()
    window.addEventListener('resize', apply)
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply)
    ro?.observe(nav)
    return () => {
      window.removeEventListener('resize', apply)
      ro?.disconnect()
      root.style.removeProperty('--nr-nav')
    }
  }, [])
  return null
}
