'use client'

import { useEffect, useRef, useState } from 'react'
import { createHeroRenderer } from '@/lib/about/hero-renderer'

/* ─────────────────────────────────────────────────────────────
   صحنه‌ی سه‌بعدیِ هیرو — WebGL، روی عکسِ SSR.

   عکسِ میز (سرور) نامزدِ LCP و جایگزینِ همیشگی است؛ بوم فقط بعد از اولین فریمِ
   موفق محو می‌آید و آن‌وقت عکس کنار می‌رود (about.css). هر شکستی — بی WebGL،
   رندرِ نرم‌افزاری، GPUِ کند، کاهشِ حرکت، صرفه‌جوییِ داده، از دست رفتنِ context
   روی موبایل — یعنی همان عکس، نه صفحه‌ی خالی.

   بوم داخلِ effect ساخته و در cleanup برداشته می‌شود: React در حالتِ Strict
   (dev) effect را دو بار اجرا می‌کند و contextی که یک بار lose شده روی همان
   بوم دیگر برنمی‌گردد. منطقِ GL در lib/about/hero-renderer است
   ───────────────────────────────────────────────────────────── */

export function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = wrap.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true) return

    let dispose: (() => void) | null = null
    /* کامپایلِ شیدر و اولین فریم پس از بارگذاریِ کاملِ صفحه و در لحظه‌ی بیکاریِ مرورگر
       (آذرِ ۱۴۰۵) — پیش‌تر ۴۰۰ میلی‌ثانیه پس از سوارشدن بود و وسطِ بارگذاری می‌افتاد:
       Lighthouse روی گوشی یک کارِ ۷ ثانیه‌ای و LCPِ ۸٫۵ ثانیه داد. عکسِ هیرو همان
       لحظه دیده می‌شود؛ فقط جلوه کمی دیرتر روشن می‌شود. */
    let timer = 0
    let idle = 0
    const boot = () => {
      dispose = createHeroRenderer(host, {
        onReady: () => setReady(true),
        onLost: () => setReady(false),
      })
    }
    const afterLoad = () => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(boot, { timeout: 2500 })
      else timer = window.setTimeout(boot, 600)
    }
    if (document.readyState === 'complete') afterLoad()
    else window.addEventListener('load', afterLoad, { once: true })
    return () => {
      window.removeEventListener('load', afterLoad)
      window.clearTimeout(timer)
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle)
      dispose?.()
      setReady(false)
    }
  }, [])

  return <div ref={wrap} aria-hidden className={`ab-scene ${ready ? 'is-ready' : ''}`} />
}
