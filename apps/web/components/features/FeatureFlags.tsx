'use client'
import { createContext, useContext, useEffect, useState } from 'react'

/* ─────────────────────────────────────────────────────────────
   Feature Flagها در سمتِ کلاینت.

   چرا Context و نه خواندن در هر کامپوننت: مقدار یک‌بار در کلِ اپ
   گرفته می‌شود و در ناوبریِ سمتِ کلاینت دوباره درخواست نمی‌رود
   (کشِ سطحِ ماژول). یعنی حداکثر یک درخواستِ کوچک برای هر بارگذاریِ
   کامل، آن هم با کشِ لبه.

   چرا پیش‌فرض «خاموش»: تا وقتی پاسخ نرسیده، رابط چیزی از قابلیتِ
   خاموش نشان نمی‌دهد. اگر پیش‌فرض «روشن» بود، در هر بارگذاری یک
   لحظه دکمه‌های لایک/پاسخ ظاهر و بعد ناپدید می‌شدند.

   هیچ دسترسی‌ای به window/localStorage در رندرِ اول نیست، پس SSR و
   hydration دست‌نخورده می‌مانند: سرور و کلاینت هر دو با همان مقدارِ
   پیش‌فرض رندر می‌کنند و به‌روزرسانی بعد از mount می‌آید.
   ───────────────────────────────────────────────────────────── */

export interface Features {
  socialInteractions: boolean
}

const OFF: Features = { socialInteractions: false }

/* کشِ سطحِ ماژول: بینِ ناوبری‌های کلاینتی زنده می‌ماند. */
let cached: Features | null = null
let inflight: Promise<Features> | null = null

async function loadOnce(): Promise<Features> {
  if (cached) return cached
  if (inflight) return inflight
  inflight = fetch('/api/features')
    .then(r => (r.ok ? r.json() : OFF))
    .then((j: Partial<Features>) => {
      cached = { socialInteractions: j?.socialInteractions === true }
      return cached
    })
    .catch(() => OFF)          // شکستِ شبکه ⇒ خاموش بماند (fail-closed)
    .finally(() => { inflight = null })
  return inflight
}

const Ctx = createContext<Features>(OFF)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Features>(cached ?? OFF)

  useEffect(() => {
    let alive = true
    loadOnce().then(f => { if (alive) setFeatures(f) })
    return () => { alive = false }
  }, [])

  return <Ctx.Provider value={features}>{children}</Ctx.Provider>
}

/** همه‌ی پرچم‌ها */
export function useFeatures(): Features {
  return useContext(Ctx)
}

/** لایک، ری‌اکشن، پاسخ به استوری و پیام خصوصی.
 *  توجه: دیدنِ استوری زیرِ این پرچم نیست و همیشه در دسترس است. */
export function useSocialInteractions(): boolean {
  return useContext(Ctx).socialInteractions
}
