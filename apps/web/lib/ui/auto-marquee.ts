/* ─────────────────────────────────────────────────────────────
   حرکتِ خودکارِ نوارِ افقی (مارکیِ بازار و فروشگاه‌های صفحه‌ی اصلی).

   ── چرا از HomeClient بیرون آمد (آذرِ ۱۴۰۵) ──
   هر دو حلقه‌ی قبلی در *هر فریم* `scrollWidth` و `clientWidth` را
   می‌خواندند (یک بار برای نصفِ نوار، یک بار داخلِ `setPos`) و بلافاصله
   `scrollLeft` را می‌نوشتند. هر تغییرِ DOM بینِ دو فریم این خواندن را به
   چیدمانِ هم‌زمانِ کلِ سکشن تبدیل می‌کرد — و حلقه حتی وقتی نوار بیرون از
   دید بود هم می‌چرخید. Lighthouse (موبایل، CPU ۴×) روی سایتِ زنده ۴۷
   ثانیه زمانِ اجرای اسکریپت و TBTِ ۹٫۳ ثانیه برای همین چانک داد.

   حالا:
   - اندازه فقط با تغییرِ اندازه (ResizeObserver) و ثانیه‌ای یک بار (برای
     عکس‌هایی که دیر می‌رسند) خوانده می‌شود، نه هر فریم
   - موقعیت در متغیر نگه داشته می‌شود و فقط پس از دخالتِ کاربر (کشیدن،
     هاور) از خودِ نوار خوانده می‌شود
   - بیرون از دید حلقه می‌خوابد (IntersectionObserver) — چیزی که دیده
     نمی‌شود لازم نیست حرکت کند

   رفتارِ دیده‌شده همان است: همان سرعت، همان جهت، همان حلقه‌ی بی‌درز.
   ───────────────────────────────────────────────────────────── */

import { scrollSign, getPos } from '../useHorizontalScroll'

export interface AutoMarqueeOptions {
  /** پیکسل بر ثانیه */
  speed: number
  /** ‎+۱ به سمتِ انتهای نوار، ‎-۱ به سمتِ ابتدا */
  dir: 1 | -1
  /** شروع از ابتدای نوار یا از وسطش (برای حرکتِ رو به عقب) */
  startAt: 'start' | 'middle'
  /** کاربر دارد می‌کشد یا رویش هاور کرده */
  isPaused: () => boolean
}

/** حلقه را راه می‌اندازد و تابعِ پاک‌سازی برمی‌گرداند (برای useEffect) */
export function startAutoMarquee(el: HTMLElement, opts: AutoMarqueeOptions): () => void {
  const sign = scrollSign(el)
  let half = 0
  let max = 0
  const measure = () => {
    half = el.scrollWidth / 2
    max = Math.max(0, el.scrollWidth - el.clientWidth)
  }
  let pos = 0
  /* آخرین مقداری که خودِ حلقه نوشته — هر اسکرولِ دیگری (کشیدنِ لمسی که
     isPaused را روشن نمی‌کند، فوکوسِ کیبورد روی کارت) از این فاصله شناخته
     می‌شود و حلقه از همان‌جا ادامه می‌دهد، مثلِ حلقه‌ی قبلی که هر فریم
     موقعیت را از نوار می‌خواند */
  let written = -1
  /* مقدار مثلِ قبل محدود به [۰، max] است — وقتی max < half، حلقه‌ی قبلی هم
     همین مقدارِ بریده را دوباره می‌خواند */
  const write = (p: number) => {
    pos = Math.max(0, Math.min(max, p))
    written = pos
    el.scrollLeft = pos * sign
  }

  measure()
  write(opts.startAt === 'middle' ? half : 0)

  let raf = 0
  let last = 0
  let synced = true
  let frames = 0
  let visible = true
  let stopped = false

  const onScroll = () => {
    if (Math.abs(getPos(el) - written) > 1) synced = false
  }
  el.addEventListener('scroll', onScroll, { passive: true })

  const tick = (t: number) => {
    raf = 0
    if (stopped || !visible) return
    if (opts.isPaused()) {
      /* کاربر نوار را جابه‌جا می‌کند — پس از رها کردن از جای تازه ادامه */
      synced = false
      last = t
      raf = requestAnimationFrame(tick)
      return
    }
    if (!synced) { pos = getPos(el); synced = true }
    /* عکس‌هایی که دیر می‌رسند عرض را عوض می‌کنند — ثانیه‌ای یک بار کافی است */
    if (++frames % 60 === 0) measure()
    if (last && half > 0) {
      pos += (opts.dir * opts.speed * (t - last)) / 1000
      if (opts.dir > 0 && pos >= half) pos -= half
      if (opts.dir < 0 && pos <= 0) pos += half
      write(pos)
    }
    last = t
    raf = requestAnimationFrame(tick)
  }

  const ro = new ResizeObserver(measure)
  ro.observe(el)
  const io = new IntersectionObserver(entries => {
    if (stopped) return
    /* فقط آخرین وضعیت — جفتِ «آمد/رفت»ِ هم‌دسته نباید حلقه را بیرون از دید روشن کند */
    visible = entries[entries.length - 1]?.isIntersecting ?? visible
    if (visible && !raf) {
      last = 0
      synced = false
      raf = requestAnimationFrame(tick)
    }
  })
  io.observe(el)
  raf = requestAnimationFrame(tick)

  return () => {
    /* اعلانِ صف‌شده‌ی observer ممکن است پس از disconnect هم برسد */
    stopped = true
    cancelAnimationFrame(raf)
    ro.disconnect()
    io.disconnect()
    el.removeEventListener('scroll', onScroll)
  }
}
