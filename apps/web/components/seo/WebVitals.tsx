'use client'
/* سرعتِ واقعیِ کاربران ⟵ رویدادهای Google Analytics (منطق در lib/perf/web-vitals).
   هیچ چیزی نمایش نمی‌دهد. اگر GA هنوز بار نشده باشد (بازدیدِ خیلی کوتاه)،
   آن بازدید فرستاده نمی‌شود — چیزی هم در صف نمی‌ماند. */

import { useEffect } from 'react'
import { startWebVitals } from '@/lib/perf/web-vitals'

type Gtag = (command: 'event', name: string, params: Record<string, string | number | boolean>) => void

export function WebVitals() {
  useEffect(() => {
    /* صفحه‌ی ورود، نه صفحه‌ای که کاربر هنگامِ ترک رویش بود — LCPِ صفحه‌ی اصلی
       نباید پس از ناوبریِ نرم به نامِ /shop/… ثبت شود */
    const landing = location.pathname
    return startWebVitals((name, value) => {
      const gtag = (window as Window & { gtag?: Gtag }).gtag
      if (typeof gtag !== 'function') return
      gtag('event', name, {
        /* GA مقدارِ صحیح می‌خواهد؛ CLS عددی کوچک است و ×۱۰۰۰ می‌شود */
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        metric_value: value,
        page_path: landing,
        non_interaction: true,
      })
    })
  }, [])
  return null
}
