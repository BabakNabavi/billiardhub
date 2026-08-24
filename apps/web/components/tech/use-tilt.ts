'use client'

/* ─────────────────────────────────────────────────────────────
   کجیِ سه‌بعدی با حرکتِ نشانگر + رسمِ نقشه هنگامِ رسیدن به دید.

   ── چرا refِ تابعی و نه `useEffect` با `[]` ──
   ⚠️ نسخه‌ی اول با `useRef` + `useEffect([])` نوشته شد و بی‌صدا
   شکست: صفحه‌ی پروفایل اول `ProfileLoading` را برمی‌گرداند و قابِ
   نقشه *بعداً* ساخته می‌شود. پس لحظه‌ی اجرای افکت، `ref.current`
   هنوز `null` بود، افکت زود برمی‌گشت و چون وابستگی نداشت دیگر
   اجرا نمی‌شد — نقشه‌ی سرلوحه برای همیشه نکشیده می‌ماند در حالی
   که نقشه‌ی کاتالوگ (که بعد از داده mount می‌شود) درست کار می‌کرد.

   refِ تابعی دقیقاً وقتی صدا زده می‌شود که گره به DOM بچسبد، پس
   ترتیبِ رندر اهمیتی ندارد. React 19 تابعِ پاک‌سازیِ برگشتی از ref
   را هم اجرا می‌کند.

   ── قواعدی که رعایت می‌شود ──
   ⚠️ فقط `transform` تکان می‌خورد (روی متغیرهای CSS)، پس کار روی
   لایه‌ی کامپوزیت می‌ماند و CPUِ ضعیفِ موبایل درگیرِ layout نمی‌شود.
   ⚠️ لمس نادیده گرفته می‌شود: روی موبایل «کجی» یعنی قابی که بعد از
   لمس کج مانده.
   ───────────────────────────────────────────────────────────── */

import { useCallback } from 'react'

const MAX_DEG = 5

const calm = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** نقشه وقتی رسم می‌شود که واقعاً دیده شود، نه موقعِ لود. */
function drawOnView(el: HTMLElement, cls: string, threshold: number, rootMargin = '0px') {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      e.target.classList.add(cls)
      io.unobserve(e.target)
    }
  }, { threshold, rootMargin })
  io.observe(el)
  return () => io.disconnect()
}

export function useTilt() {
  /* ⚠️ `useCallback` واجب است، نه آرایش: بدونِ آن هر رندر یک تابعِ
     تازه می‌سازد، React ref را جدا و دوباره وصل می‌کند، و هر
     `setDock` (که با اسکرول شلیک می‌شود) ناظر و شنونده‌ها را از
     نو می‌سازد — یعنی ناظرِ ورود ممکن است پیش از شلیکِ callback
     قطع شود و بخش برای همیشه نامرئی بماند.
     ⚠️ وابستگی‌ها خالی است: تابع به هیچ propی تکیه نمی‌کند. */
  const ref = useCallback((el: HTMLElement | null) => {
      if (!el) return
      const stopDraw = drawOnView(el, 'is-drawn', 0.2)

      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (calm() || !fine) return stopDraw

      let frame = 0
      const onMove = (ev: PointerEvent) => {
        if (ev.pointerType !== 'mouse' || frame) return
        frame = requestAnimationFrame(() => {
          frame = 0
          const r = el.getBoundingClientRect()
          const x = (ev.clientX - r.left) / r.width - 0.5
          const y = (ev.clientY - r.top) / r.height - 0.5
          el.style.setProperty('--ry', `${(x * MAX_DEG * 2).toFixed(2)}deg`)
          el.style.setProperty('--rx', `${(-y * MAX_DEG * 2).toFixed(2)}deg`)
        })
      }
      const onLeave = () => {
        if (frame) { cancelAnimationFrame(frame); frame = 0 }
        el.style.setProperty('--ry', '0deg')
        el.style.setProperty('--rx', '0deg')
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        stopDraw()
        if (frame) cancelAnimationFrame(frame)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
  }, [])
  return { ref }
}

/**
 * ورودِ بخش هنگامِ رسیدن به دید — یک‌بار، بدونِ برگشت.
 *
 * ⚠️ کلاسِ پنهان‌کننده را *JS* اضافه می‌کند، نه CSS. اگر این اسکریپت
 * به هر دلیلی اجرا نشود، محتوا باید دیده شود؛ `opacity:0`ِ پیش‌فرض
 * در CSS یعنی یک باگِ کوچک، کلِ بخش را نامرئی می‌کند.
 */
export function useReveal() {
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el || calm()) return
    el.classList.add('tpx-reveal')
    /* ⚠️ آستانه‌ی نسبی نه: ارتفاعِ این بخش‌ها داده‌محور است و
       متخصصِ هجده‌خدمتی بخشی چند برابرِ ویوپورت می‌سازد که هرگز
       ۱۰٪ـش دیده نمی‌شود — بخش برای همیشه نامرئی می‌ماند. */
    return drawOnView(el, 'is-in', 0, '0px 0px -12% 0px')
  }, [])
  return { ref }
}
