'use client'

/* حرکتِ صفحه‌ی بازیکن — سه هوکِ کوچک، بدونِ کتابخانه.

   ── چرا دستی و نه GSAP ──
   سایت‌های ورزشیِ برنده‌ی Awwwards با GSAP و Locomotive ساخته می‌شوند.
   همان جنسِ حرکت این‌جا با سه چیزِ بومی درمی‌آید: IntersectionObserver،
   یک شنونده‌ی اسکرولِ passive با rAF، و requestAnimationFrame برای
   شمارش. مخاطبِ این سایت موبایلِ ایرانی با شبکه‌ی کند است؛ ۵۰ کیلوبایت
   جاوااسکریپتِ اضافه برای چیزی که مرورگر خودش دارد، هزینه‌ی واقعی است.

   ⚠️ هر سه به `prefers-reduced-motion` احترام می‌گذارند و در آن حالت
   *وضعیتِ نهایی* را می‌گذارند، نه هیچ — کاربر نباید محتوا را از دست
   بدهد چون حرکت را خاموش کرده.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'

const lessMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** هر عنصرِ `.ap-r` وقتی وارد کادر شد، یک‌بار باز می‌شود.
 *
 *  ⚠️ `deps` باید *هویتِ داده* باشد نه طولِ چند آرایه. با طول، پروفایلی
 *  که از کشِ محلی رندر شده و بعد نسخه‌ی سرور با افتخاراتِ بیشتر می‌رسد
 *  اثر را دوباره اجرا نمی‌کرد و آن بخش‌ها برای همیشه نامرئی می‌ماندند. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    /* کلاسِ is-anim حالتِ پنهانِ CSS را روشن می‌کند. تا وقتی این خط
       اجرا نشده، محتوا دیده می‌شود — یعنی شکستِ جاوااسکریپت به
       صفحه‌ی خالی ختم نمی‌شود. */
    document.querySelector('.ap')?.classList.add('is-anim')
    const nodes = document.querySelectorAll<HTMLElement>('.ap-r:not(.is-in)')
    if (!nodes.length) return
    if (lessMotion() || !('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-in')
        /* یک‌بار بس است: ظهورِ دوباره هنگامِ اسکرولِ برگشتی، حواس‌پرتی
           است نه جلوه. */
        io.unobserve(e.target)
      }
    }, { rootMargin: '0px 0px -12% 0px' })   // threshold بی‌اثر بود: isIntersecting با اولین پیکسل true می‌شود
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** شمارشِ عدد وقتی به کادر رسید. خروجی همان عددِ لحظه‌ای است. */
export function useCountUp<T extends HTMLElement>(target: number, ms = 1100) {
  const ref = useRef<T | null>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return
    if (lessMotion() || !('IntersectionObserver' in window)) { setN(target); return }

    let raf = 0
    const run = () => {
      const t0 = performance.now()
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / ms)
        /* easeOutExpo — سریع شروع می‌شود و نرم می‌ایستد؛ عدد «فرود
           می‌آید» به‌جای اینکه بپرد. */
        const e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k)
        setN(Math.round(target * e))
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return
      io.disconnect()
      run()
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf) }
  }, [target, ms])

  return { ref, n }
}
