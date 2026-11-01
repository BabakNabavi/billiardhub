'use client'

import { useEffect, useState, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/ui/reduced-motion'

/* ─────────────────────────────────────────────────────────────
   چرخشِ خودکارِ کارت‌های هیرو (باشگاه، آگهی، رنکینگ) — یک منطق.

   می‌ایستد وقتی: موس روی کارت است یا فوکوس داخلش، تب پنهان است، یا
   هیرو بیرونِ دید است (.hh-off را HeroTilt می‌گذارد). لمس هم ۸ ثانیه
   نگهش می‌دارد — کاربرِ گوشی هاور ندارد، و ضربه وسطِ چرخش نباید
   باشگاه/جدولِ دیگری را باز کند. «کاهشِ حرکت» ⟵ اصلاً نمی‌چرخد.
   هر کارت بازه‌ی خودش را دارد تا سه کارت هم‌زمان نپرند.

   ── نرمی (خواستِ مالک: «خیلی خشک عوض می‌شوند») ──
   دو گام: اول `leaving` محتوای فعلی را محو می‌کند (CSS: .hh-leaving)،
   بعد از LEAVE_MS اندیس عوض می‌شود و محتوای تازه با hh-swap وارد می‌شود.
   شرط‌های مکث در گامِ دوم دوباره سنجیده می‌شوند: لمس/فوکوس در همان
   ۳۲۰ms نباید ردیفِ زیرِ انگشت را عوض کند.
   ───────────────────────────────────────────────────────────── */

const LEAVE_MS = 320
const TOUCH_HOLD_MS = 8000

export function useHeroRotation(count: number, everyMs: number, ref: RefObject<HTMLElement | null>): { i: number; leaving: boolean } {
  const [i, setI] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || count < 2 || prefersReducedMotion()) return
    const hero = el.closest('section')
    let heldUntil = 0
    const hold = () => { heldUntil = Date.now() + TOUCH_HOLD_MS }
    const paused = () =>
      document.hidden || !!hero?.classList.contains('hh-off') || Date.now() < heldUntil
      || el.matches(':hover') || el.contains(document.activeElement)

    let swap: ReturnType<typeof setTimeout> | undefined
    const t = setInterval(() => {
      if (paused()) return
      setLeaving(true)
      swap = setTimeout(() => {
        swap = undefined
        if (!paused()) setI(n => (n + 1) % count)
        setLeaving(false)
      }, LEAVE_MS)
    }, everyMs)
    el.addEventListener('pointerdown', hold, { passive: true })

    return () => {
      clearInterval(t)
      el.removeEventListener('pointerdown', hold)
      /* وسطِ محوشدن جمع شد ⟵ محتوا نباید نامرئی بماند */
      if (swap) { clearTimeout(swap); setLeaving(false) }
    }
  }, [count, everyMs, ref])

  return { i: count > 0 ? i % count : 0, leaving }
}
