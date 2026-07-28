'use client'

/* ─────────────────────────────────────────────────────────────
   اسکرولِ افقی با چرخِ ماوس و درگ.

   نوارهای افقی با ماوس عملاً قفل بودند: چرخِ ماوس فقط عمودی اسکرول
   می‌کند و کاربر باید نوارِ اسکرول را می‌گرفت. این‌جا چرخِ عمودی به
   افقی ترجمه می‌شود و درگ هم کار می‌کند.

   دو نکته که بدونشان تجربه بد می‌شود:
   ● فقط وقتی preventDefault می‌کنیم که واقعاً جا برای حرکت باشد؛
     وگرنه در انتهای نوار، صفحه گیر می‌کند.
   ● ژستِ افقیِ ترک‌پد دست‌نخورده می‌ماند (deltaX غالب) تا با رفتارِ
     بومیِ سیستم نجنگیم.
   ───────────────────────────────────────────────────────────── */

import { useEffect, type RefObject } from 'react'

export function useHorizontalScroll(
  ref: RefObject<HTMLElement | null>,
  /* نوارهایی که خودکار حرکت می‌کنند باید حینِ دخالتِ کاربر بایستند،
     وگرنه با دستِ کاربر می‌جنگند و حس می‌شود «قفل است». */
  onInteract?: (busy: boolean) => void,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let idle: ReturnType<typeof setTimeout> | null = null
    const busy = () => {
      onInteract?.(true)
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => onInteract?.(false), 900)
    }

    const onWheel = (e: WheelEvent) => {
      /* ژستِ افقیِ ترک‌پد را دست نزن */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return

      const next = el.scrollLeft + e.deltaY
      /* در دو انتها، اسکرولِ صفحه را نگیر */
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return

      e.preventDefault()
      busy()
      el.scrollLeft = Math.max(0, Math.min(max, next))
    }

    /* درگ با ماوس — بدونِ کلیکِ اضافه روی کارت‌ها */
    let down = false, startX = 0, startLeft = 0, moved = 0

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      down = true; moved = 0
      startX = e.clientX; startLeft = el.scrollLeft
      busy()
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 3) {
        moved = Math.abs(dx)
        el.style.cursor = 'grabbing'
        el.style.userSelect = 'none'
        busy()
      }
      el.scrollLeft = startLeft - dx
    }
    const stop = () => {
      if (down) busy()
      down = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }
    /* درگ نباید به کلیکِ روی کارت تبدیل شود */
    const onClick = (e: MouseEvent) => {
      if (moved > 6) { e.preventDefault(); e.stopPropagation() }
      moved = 0
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
    el.addEventListener('click', onClick, true)

    return () => {
      if (idle) clearTimeout(idle)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', stop)
      el.removeEventListener('click', onClick, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}
