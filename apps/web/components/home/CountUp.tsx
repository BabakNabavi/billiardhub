'use client'

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/ui/reduced-motion'

/* شمارنده‌ی آرام از صفر تا عدد، وقتی به دید می‌آید — همان سبکِ صفحه‌ی مربیان.
   HTMLِ سرور خودِ عدد را دارد (خزنده و بی‌جاوااسکریپت)؛ انیمیشن فقط بارِ اولی
   است که بخش دیده می‌شود. «کاهشِ حرکت» ⟵ بی‌انیمیشن. */

const DURATION = 1400

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / DURATION)
        /* easeOutCubic — تند شروع، نرم ایستادن */
        setShown(Math.round(value * (1 - (1 - p) ** 3)))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      setShown(0)
      raf = requestAnimationFrame(step)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value])

  return <span ref={ref}>{shown.toLocaleString('fa-IR')}</span>
}
