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
    /* کامپایلِ شیدر بعد از نقاشیِ اولیه، تا LCPِ عکس و hydration معطلِ GPU نمانند */
    const start = window.setTimeout(() => {
      dispose = createHeroRenderer(host, {
        onReady: () => setReady(true),
        onLost: () => setReady(false),
      })
    }, 400)
    return () => { window.clearTimeout(start); dispose?.(); setReady(false) }
  }, [])

  return <div ref={wrap} aria-hidden className={`ab-scene ${ready ? 'is-ready' : ''}`} />
}
