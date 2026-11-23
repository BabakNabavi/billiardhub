'use client'
/* ─────────────────────────────────────────────────────────────
   Google Analytics 4 و Microsoft Clarity.

   ── چرا نه فقط `lazyOnload` ──
   lazyOnload یعنی «بعد از رویدادِ load». در صفحه‌های داخلی load زود
   می‌رسد و gtag (۱۷۸ کیلوبایت) و clarity (۲۵ کیلوبایت) درست وسطِ
   hydration روی CPUِ ضعیفِ موبایل می‌نشستند — اندازه‌گیری آبانِ ۱۴۰۵:
   صفحه‌های داخلی ۴۱۰ تا ۵۰۰ کیلوبایت JS می‌کشیدند که ۲۰۳ کیلوبایتش همین دو بود.

   حالا اسکریپت‌ها با اولین تعاملِ کاربر (لمس، اسکرول، کلید) بار می‌شوند،
   یا حداکثر ۴ ثانیه بعد از load برای کسی که فقط نگاه می‌کند. بازدید
   همچنان ثبت می‌شود؛ فقط از مسیرِ رندر و تعاملِ اول بیرون رفته است.

   نشانیِ صفحه را GA4 خودش با تغییرِ history (ناوبریِ نرمِ Next) ثبت
   می‌کند — «Enhanced measurement» پیش‌فرض روشن است.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { SEO_IDS } from '@/lib/seo/config'

const SAFE_ID = /^[A-Za-z0-9-]{4,24}$/
const IDLE_AFTER_LOAD_MS = 4000
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

export function Analytics() {
  const ga = SAFE_ID.test(SEO_IDS.ga4) ? SEO_IDS.ga4 : ''
  const clarity = SAFE_ID.test(SEO_IDS.clarity) ? SEO_IDS.clarity : ''
  const [go, setGo] = useState(false)

  useEffect(() => {
    if (!ga && !clarity) return
    let timer = 0
    let idle = 0
    let late = 0
    let started = false
    const show = () => setGo(true)
    /* fromTimer: بازدیدکننده‌ی بی‌تعامل — مثلِ قبل همان ۴ ثانیه پس از load ثبت شود */
    const start = (fromTimer = false) => {
      if (started) return
      started = true
      window.clearTimeout(timer)
      EVENTS.forEach(e => window.removeEventListener(e, onEvent))
      window.removeEventListener('load', arm)
      /* ── لحظه‌ی بیکاری، نه وسطِ اولین لمس (آذرِ ۱۴۰۵) ──
         بارِ ۲۰۰ کیلوبایت اسکریپت دقیقاً هم‌زمان با اولین لمس، جوابِ همان
         لمس را کند می‌کرد (INP). حالا در اولین لحظه‌ی بیکاریِ مرورگر — حداکثر
         ۳ ثانیه بعد؛ سافاری requestIdleCallback ندارد و ۱٫۵ ثانیه صبر می‌کند */
      if (fromTimer) show()
      else if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(show, { timeout: 3000 })
      else late = window.setTimeout(show, 1500)
    }
    const onEvent = () => start()
    function arm() { timer = window.setTimeout(() => start(true), IDLE_AFTER_LOAD_MS) }

    EVENTS.forEach(e => window.addEventListener(e, onEvent, { once: true, passive: true }))
    if (document.readyState === 'complete') arm()
    else window.addEventListener('load', arm, { once: true })

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(late)
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle)
      EVENTS.forEach(e => window.removeEventListener(e, onEvent))
      window.removeEventListener('load', arm)
    }
  }, [ga, clarity])

  if (!go) return null
  return (
    <>
      {ga && (
        <>
          <Script id="ga4-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {clarity && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`}
        </Script>
      )}
    </>
  )
}
