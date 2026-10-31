/* ─────────────────────────────────────────────────────────────
   Google Analytics 4 و Microsoft Clarity.

   `lazyOnload`: بعد از رویدادِ load و در زمانِ بیکاریِ مرورگر — هیچ‌کدام در
   مسیرِ رندر یا تعامل نیست. روی شبکه‌ی کند و CPUِ ضعیفِ موبایلِ ایرانی،
   آمار نباید حتی یک میلی‌ثانیه از نمایشِ صفحه بگیرد.

   نشانیِ صفحه را GA4 خودش با تغییرِ history (ناوبریِ نرمِ Next) ثبت
   می‌کند — «Enhanced measurement» پیش‌فرض روشن است.
   ───────────────────────────────────────────────────────────── */

import Script from 'next/script'
import { SEO_IDS } from '@/lib/seo/config'

const SAFE_ID = /^[A-Za-z0-9-]{4,24}$/

export function Analytics() {
  const ga = SAFE_ID.test(SEO_IDS.ga4) ? SEO_IDS.ga4 : ''
  const clarity = SAFE_ID.test(SEO_IDS.clarity) ? SEO_IDS.clarity : ''
  return (
    <>
      {ga && (
        <>
          <Script id="ga4-src" strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {clarity && (
        <Script id="clarity-init" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`}
        </Script>
      )}
    </>
  )
}
