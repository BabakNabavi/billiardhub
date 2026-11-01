'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/ui/reduced-motion'

/* ─────────────────────────────────────────────────────────────
   کجیِ ملایمِ دسته‌ی کارت‌ها با حرکتِ موس — تنها جاوااسکریپتِ هیرو.

   فقط دو متغیرِ CSS روی گره نوشته می‌شود (در rAF)، React رندر
   نمی‌گیرد. لمسی و «کاهش حرکت» اصلاً گوش نمی‌دهند.
   ───────────────────────────────────────────────────────────── */

const MAX_DEG = 6

export function HeroTilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const area = el?.closest('section')
    if (!el || !area) return

    /* بیرونِ دید ⟵ انیمیشن‌های بی‌پایانِ هیرو می‌ایستند (CSS: .hh-off) */
    const io = new IntersectionObserver(([e]) => area.classList.toggle('hh-off', !e?.isIntersecting))
    io.observe(area)

    if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (min-width: 901px)').matches) {
      return () => io.disconnect()
    }

    let raf = 0
    const set = (rx: number, ry: number) => {
      el.style.setProperty('--hh-rx', `${rx.toFixed(2)}deg`)
      el.style.setProperty('--hh-ry', `${ry.toFixed(2)}deg`)
    }
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = area.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        set(-y * MAX_DEG, x * MAX_DEG)
      })
    }
    const onLeave = () => { cancelAnimationFrame(raf); set(0, 0) }

    area.addEventListener('pointermove', onMove, { passive: true })
    area.addEventListener('pointerleave', onLeave)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <div ref={ref} className={className}>{children}</div>
}
