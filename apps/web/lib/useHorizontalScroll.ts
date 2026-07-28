'use client'

/* ─────────────────────────────────────────────────────────────
   اسکرولِ افقی با چرخِ ماوس و درگ — سازگار با RTL.

   ریشه‌ی «قفل‌بودن» نوارها: صفحه dir="rtl" است و در RTL مرورگرهای
   امروزی scrollLeft از -(scrollWidth-clientWidth) تا ۰ حرکت می‌کند،
   نه از ۰ به بالا. هر مقدارِ مثبتی که می‌نوشتیم به ۰ گیر می‌کرد؛
   یعنی نوار اصلاً تکان نمی‌خورد — حتی با کدِ درگی که از قبل بود.

   این‌جا جهت یک‌بار به‌صورتِ تجربی تشخیص داده می‌شود (نه فرض) و بعد
   همه‌چیز با یک «موقعیتِ نرمال‌شده»ی ۰ تا max کار می‌کند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, type RefObject } from 'react'

/** ‎+۱ یعنی scrollLeft مثبت است، ‎-۱ یعنی در RTL منفی می‌شود */
export function scrollSign(el: HTMLElement): 1 | -1 {
  if (getComputedStyle(el).direction !== 'rtl') return 1
  const orig = el.scrollLeft
  el.scrollLeft = -1
  const negative = el.scrollLeft < 0
  el.scrollLeft = orig
  return negative ? -1 : 1
}

export const maxScroll = (el: HTMLElement) => Math.max(0, el.scrollWidth - el.clientWidth)

/** موقعیتِ نرمال‌شده: همیشه ۰ (ابتدای نوار) تا max */
export const getPos = (el: HTMLElement, sign: 1 | -1) => Math.abs(el.scrollLeft) * (sign === -1 ? 1 : 1)

export function setPos(el: HTMLElement, sign: 1 | -1, p: number) {
  const clamped = Math.max(0, Math.min(maxScroll(el), p))
  el.scrollLeft = clamped * sign
}

export function useHorizontalScroll(
  ref: RefObject<HTMLElement | null>,
  /* نوارهایی که خودکار حرکت می‌کنند باید حینِ دخالتِ کاربر بایستند،
     وگرنه با دستِ کاربر می‌جنگند و باز هم «قفل» حس می‌شود. */
  onInteract?: (busy: boolean) => void,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const sign = scrollSign(el)

    let idle: ReturnType<typeof setTimeout> | null = null
    const busy = () => {
      onInteract?.(true)
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => onInteract?.(false), 900)
    }

    const onWheel = (e: WheelEvent) => {
      /* ژستِ افقیِ ترک‌پد را دست نزن */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

      const max = maxScroll(el)
      if (max <= 0) return

      const pos = getPos(el, sign)
      /* در دو انتها، اسکرولِ صفحه را نگیر — وگرنه صفحه گیر می‌کند */
      if ((e.deltaY < 0 && pos <= 0) || (e.deltaY > 0 && pos >= max - 1)) return

      e.preventDefault()
      busy()
      setPos(el, sign, pos + e.deltaY)
    }

    /* درگ با ماوس — بدونِ کلیکِ اضافه روی کارت‌ها */
    let down = false, startX = 0, startPos = 0, moved = 0

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      /* بدونِ این، کشیدنِ روی عکسِ کارت‌ها درگِ بومیِ تصویر را شروع
         می‌کند و مرورگر بعد از اولین حرکت، pointermove را قطع می‌کند —
         نوار یک تکان می‌خورد و می‌ایستد. */
      e.preventDefault()
      down = true; moved = 0
      startX = e.clientX; startPos = getPos(el, sign)
      try { el.setPointerCapture(e.pointerId) } catch { /* پشتیبانی نشد */ }
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
      /* در RTL، کشیدن به راست باید نوار را به همان سمت ببرد */
      setPos(el, sign, startPos + (sign === -1 ? dx : -dx))
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
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', stop)
    el.addEventListener('pointercancel', stop)
    window.addEventListener('pointerup', stop)
    el.addEventListener('click', onClick, true)

    return () => {
      if (idle) clearTimeout(idle)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', stop)
      el.removeEventListener('pointercancel', stop)
      window.removeEventListener('pointerup', stop)
      el.removeEventListener('click', onClick, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}
