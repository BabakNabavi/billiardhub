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

    /* ── نرمی ──
       پیش‌تر هر pointermove یک transition تازه روی دسته شروع می‌کرد؛ هر
       رویداد ترنزیشنِ قبلی را وسطِ راه می‌برید و حرکت تکه‌تکه می‌شد.
       حالا هدف ذخیره می‌شود و یک حلقه‌ی rAF هر فریم ۱۲٪ به آن نزدیک
       می‌شود — و وقتی رسید، خودش می‌ایستد. */
    let raf = 0
    let tx = 0, ty = 0, cx = 0, cy = 0
    const tick = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      el.style.setProperty('--hh-rx', `${cx.toFixed(3)}deg`)
      el.style.setProperty('--hh-ry', `${cy.toFixed(3)}deg`)
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(tick) : 0
    }
    const aim = (x: number, y: number) => {
      tx = x; ty = y
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect()
      aim(-((e.clientY - r.top) / r.height - 0.5) * MAX_DEG, ((e.clientX - r.left) / r.width - 0.5) * MAX_DEG)
    }
    const onLeave = () => aim(0, 0)

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
