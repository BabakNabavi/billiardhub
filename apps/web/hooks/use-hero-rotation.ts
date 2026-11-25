'use client'

import { useEffect, useState, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/ui/reduced-motion'

/* ─────────────────────────────────────────────────────────────
   چرخشِ خودکارِ کارت‌های هیرو (باشگاه، فروشگاه، آگهی، رنکینگ) — یک منطق.

   می‌ایستد وقتی: موس روی کارت است یا فوکوس داخلش، تب پنهان است، یا
   هیرو بیرونِ دید است (.hh-off را HeroTilt می‌گذارد). لمس هم ۸ ثانیه
   نگهش می‌دارد — کاربرِ گوشی هاور ندارد، و ضربه وسطِ چرخش نباید
   باشگاه/جدولِ دیگری را باز کند. «کاهشِ حرکت» ⟵ اصلاً نمی‌چرخد.
   هر کارت بازه‌ی خودش را دارد تا سه کارت هم‌زمان نپرند.

   ── نامنظم (خواستِ مالک: «همه با هم و در یک لحظه عوض نشوند») ──
   پیش‌تر هر کارت یک setIntervalِ ثابت داشت: بازه‌ها فرق می‌کردند ولی
   دوره‌ای بودند، پس هر چند ثانیه چند کارت با هم می‌پریدند. حالا:
     ۱) هر نوبت بازه‌ی تازه‌ای می‌گیرد: everyMs × (۰٫۷۵ تا ۱٫۲۵)
     ۲) نوبتِ اول هم تصادفی است، تا کارت‌ها از همان ابتدا هم‌فاز نباشند
     ۳) هیچ دو کارتی نزدیکِ هم عوض نمی‌شوند: اگر کارتِ دیگری کمتر از
        MIN_GAP_MS پیش عوض شده، این یکی کمی عقب می‌افتد (lastSwapAt مشترک)

   ── نرمی (خواستِ مالک: «خیلی خشک عوض می‌شوند») ──
   دو گام: اول `leaving` محتوای فعلی را محو می‌کند (CSS: .hh-leaving)،
   بعد از LEAVE_MS اندیس عوض می‌شود و محتوای تازه با hh-swap وارد می‌شود.
   شرط‌های مکث در گامِ دوم دوباره سنجیده می‌شوند: لمس/فوکوس در همان
   ۴۵۰ms نباید ردیفِ زیرِ انگشت را عوض کند.
   ───────────────────────────────────────────────────────────── */

/* همان مدتِ transitionِ .hh-swap در home-hero.css */
const LEAVE_MS = 450
const TOUCH_HOLD_MS = 8000
/* محوشدن (۴۵۰) + ورودِ تازه (۸۵۰) ≈ ۱٫۳ ثانیه؛ دو کارت نباید داخلِ هم بیفتند */
const MIN_GAP_MS = 1500
/* زمانِ آخرین چرخشِ هر کارتی در صفحه — مشترکِ همه‌ی نمونه‌های هوک */
let lastSwapAt = -Infinity
const jitter = (everyMs: number, lo = 0.75, hi = 1.25) => everyMs * (lo + Math.random() * (hi - lo))

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
      /* getClientRects خالی ⟵ کارت display:none است (فروشگاه‌ها در تبلت/دسکتاپ) */
      document.hidden || !!hero?.classList.contains('hh-off') || Date.now() < heldUntil
      || el.getClientRects().length === 0
      || el.matches(':hover') || el.contains(document.activeElement)

    let swap: ReturnType<typeof setTimeout> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = (ms: number) => { timer = setTimeout(tick, ms) }
    const tick = () => {
      if (paused()) return schedule(jitter(everyMs))
      /* کارتِ دیگری همین الان عوض شده ⟵ کمی عقب بیفت */
      const sinceOther = performance.now() - lastSwapAt
      if (sinceOther < MIN_GAP_MS) return schedule(MIN_GAP_MS - sinceOther + 300 + Math.random() * 1200)
      lastSwapAt = performance.now()
      setLeaving(true)
      swap = setTimeout(() => {
        swap = undefined
        if (!paused()) setI(n => (n + 1) % count)
        setLeaving(false)
        schedule(jitter(everyMs))
      }, LEAVE_MS)
    }
    /* نوبتِ اول تصادفی‌تر و زودتر: کارت‌ها از ابتدا هم‌فاز نشوند */
    schedule(jitter(everyMs, 0.5, 1.2))
    el.addEventListener('pointerdown', hold, { passive: true })

    return () => {
      clearTimeout(timer)
      el.removeEventListener('pointerdown', hold)
      /* وسطِ محوشدن جمع شد ⟵ محتوا نباید نامرئی بماند */
      if (swap) { clearTimeout(swap); setLeaving(false) }
    }
  }, [count, everyMs, ref])

  return { i: count > 0 ? i % count : 0, leaving }
}
