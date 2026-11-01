'use client'

import { useEffect, useState, type RefObject } from 'react'

/* ─────────────────────────────────────────────────────────────
   چرخشِ خودکارِ کارت‌های هیرو (باشگاه، آگهی، رنکینگ) — یک منطق.

   می‌ایستد وقتی: موس روی کارت است یا فوکوس داخلش (فرصتِ خواندن و
   کلیک — WCAG 2.2.2)، تب پنهان است، یا هیرو بیرونِ دید است (.hh-off
   را HeroTilt می‌گذارد). هر کارت بازه‌ی خودش را دارد تا سه کارت
   هم‌زمان نپرند.
   ───────────────────────────────────────────────────────────── */

export function useHeroRotation(count: number, everyMs: number, ref: RefObject<HTMLElement | null>): number {
  const [i, setI] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || count < 2) return
    const hero = el.closest('section')
    const t = setInterval(() => {
      if (document.hidden || hero?.classList.contains('hh-off')) return
      if (el.matches(':hover') || el.contains(document.activeElement)) return
      setI(n => (n + 1) % count)
    }, everyMs)
    return () => clearInterval(t)
  }, [count, everyMs, ref])

  return count > 0 ? i % count : 0
}
