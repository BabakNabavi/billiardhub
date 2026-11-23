/* ─────────────────────────────────────────────────────────────
   سنجشِ سرعتِ واقعیِ کاربران (Core Web Vitals) — بی بسته‌ی بیرونی.

   مالک خواست سرعتی را که کاربرانِ واقعی تجربه می‌کنند ببیند (آذرِ ۱۴۰۵)؛
   ابزارِ آزمایشگاهی فقط یک گوشیِ شبیه‌سازی‌شده را می‌سنجد. این پنج عدد با
   PerformanceObserverِ خودِ مرورگر گرفته و هنگامِ ترکِ صفحه به Google
   Analyticsِ موجود فرستاده می‌شوند — رویدادهای LCP، INP، CLS، FCP و TTFB،
   با «value» به میلی‌ثانیه (CLS ×۱۰۰۰).

   محاسبه همان تعریفِ گوگل است، ساده‌شده:
   - LCP: آخرین «بزرگ‌ترین نقاشی» (مرورگر خودش پس از اولین تعامل متوقفش می‌کند)
   - CLS: بزرگ‌ترین پنجره‌ی جابه‌جایی (فاصله‌ی ۱ ثانیه، سقفِ ۵ ثانیه)
   - INP: کندترین تعامل؛ از ۵۰ تعامل به بالا یکی به ازای هر ۵۰ کنار می‌رود
   مرورگری که عددی را نمی‌سنجد آن عدد را نمی‌فرستد — صفرِ ساختگی نه (سافاری
   CLS ندارد؛ «۰» میانگینِ کاربرانِ آیفون را بی‌معنا می‌کرد). تبی که پنهان باز
   شده FCP/LCPِ معنادار ندارد و نمی‌فرستد.
   ───────────────────────────────────────────────────────────── */

export type VitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'
export type VitalSink = (name: VitalName, value: number) => void

type ShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean }
type EventEntry = PerformanceEntry & { interactionId?: number }

function observe(type: string, cb: (list: PerformanceEntryList) => void, extra?: Record<string, unknown>): PerformanceObserver | null {
  try {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return null
    const po = new PerformanceObserver(l => cb(l.getEntries()))
    po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit)
    return po
  } catch {
    /* مرورگرِ قدیمی گزینه‌ای را نمی‌شناسد — آن عدد فقط فرستاده نمی‌شود */
    return null
  }
}

/** شروعِ سنجش؛ هنگامِ ترکِ صفحه هر عدد یک بار به sink می‌رود */
export function startWebVitals(sink: VitalSink): () => void {
  const hiddenAtStart = document.visibilityState === 'hidden'
  let lcp = 0
  let cls = 0
  let win = 0
  let winStart = 0
  let winLast = 0
  let fcp = 0
  const interactions = new Map<number, number>()
  const note = (id: number | undefined, d: number) => {
    if (id) interactions.set(id, Math.max(interactions.get(id) ?? 0, d))
  }

  const lcpPo = observe('largest-contentful-paint', es => { for (const e of es) lcp = e.startTime })
  const clsPo = observe('layout-shift', es => {
    for (const e of es as ShiftEntry[]) {
      if (e.hadRecentInput) continue
      if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) win += e.value
      else { win = e.value; winStart = e.startTime }
      winLast = e.startTime
      cls = Math.max(cls, win)
    }
  })
  const evPo = observe('event', es => { for (const e of es as EventEntry[]) note(e.interactionId, e.duration) }, { durationThreshold: 40 })
  /* اولین تعامل حتی اگر تند باشد — بی آن، جلسه‌ای که همه‌ی لمس‌هایش سریع بود
     INP نمی‌فرستاد و توزیع به سمتِ کند کج می‌شد */
  const fiPo = observe('first-input', es => { for (const e of es as EventEntry[]) note(e.interactionId ?? 1, e.duration) })
  const fcpPo = observe('paint', es => { for (const e of es) if (e.name === 'first-contentful-paint') fcp = e.startTime })

  let sent = false
  const flush = () => {
    if (sent) return
    sent = true
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav && nav.responseStart > 0) sink('TTFB', nav.responseStart)
    if (!hiddenAtStart && fcp) sink('FCP', fcp)
    if (!hiddenAtStart && lcp) sink('LCP', lcp)
    if (clsPo) sink('CLS', cls)
    if (interactions.size) {
      const d = [...interactions.values()].sort((a, b) => b - a)
      /* مخرجِ صدک: شمارِ کلِ تعامل‌ها (کروم) — نه فقط کندهای بالای ۴۰ms */
      const total = (performance as Performance & { interactionCount?: number }).interactionCount ?? d.length
      sink('INP', d[Math.min(d.length - 1, Math.floor(total / 50))]!)
    }
  }
  const onHide = () => { if (document.visibilityState === 'hidden') flush() }
  addEventListener('visibilitychange', onHide, { capture: true })
  /* سافاری روی بستنِ تب همیشه visibilitychange نمی‌دهد */
  addEventListener('pagehide', flush, { capture: true })

  return () => {
    for (const po of [lcpPo, clsPo, evPo, fiPo, fcpPo]) po?.disconnect()
    removeEventListener('visibilitychange', onHide, { capture: true })
    removeEventListener('pagehide', flush, { capture: true })
  }
}
