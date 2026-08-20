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

import { useCallback, useEffect, useRef, useState } from 'react'

const lessMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** هر عنصرِ `.ath-rev` وقتی وارد کادر شد، یک‌بار باز می‌شود.
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
    document.querySelector('.ath')?.classList.add('is-anim')
    const nodes = document.querySelectorAll<HTMLElement>('.ath-rev:not(.is-in)')
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
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 })
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** پارالاکسِ لایه‌های هیرو — سه سرعتِ متفاوت، فقط وقتی هیرو دیده می‌شود.
 *
 *  ⚠️ رفرنسِ ساده کار نمی‌کرد: صفحه اولین بار `<ProfileLoading/>` را
 *  می‌دهد، پس در همان یک اجرای اثر `ref.current` هنوز `null` است و
 *  چون `deps` خالی است هرگز دوباره اجرا نمی‌شد — کلِ پارالاکس مرده
 *  بود. حالا خودِ گره state است، پس با mount شدنِ هیرو اثر می‌آید. */
export function useParallax<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null)

  useEffect(() => {
    if (!el || typeof window === 'undefined') return

    /* حتی با حرکتِ کم، وضعیتِ دیده‌شدن لازم است تا انیمیشن‌های
       همیشگیِ صحنه بیرون از قاب متوقف شوند. */
    const still = lessMotion()
    let visible = true
    let raf = 0

    const paint = () => {
      raf = 0
      const y = window.scrollY
      /* سقف می‌گذاریم تا با اسکرولِ بلند، لایه‌ها از قاب بیرون نروند */
      const p = Math.min(y, 700)
      el.style.setProperty('--par-slow', `${p * 0.14}px`)
      el.style.setProperty('--par-fast', `${p * 0.3}px`)
      el.style.setProperty('--par-x', `${p * 0.05}px`)
    }
    const onScroll = () => { if (visible && !raf) raf = requestAnimationFrame(paint) }

    /* بیرون از کادر، شنونده کار نکند — روی موبایلِ ضعیف همین یک شرط
       تفاوتِ اسکرولِ روان و لرزان است. */
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => {
          visible = !!e?.isIntersecting
          el.classList.toggle('is-vis', visible)
          /* ⚠️ یک‌بار همین‌جا هم رنگ می‌زنیم: پرشِ فوری به بالای صفحه
             (Ctrl+Home یا دکمه‌ی «بازگشت به بالا») تنها رویدادِ اسکرولش
             را وقتی می‌فرستد که هنوز visible=false است؛ بعدش دیگر
             رویدادی نمی‌آید و هیرو روی افستِ یخ‌زده می‌ماند. */
          if (visible && !still) paint()
        }, { threshold: 0 })
      : null
    if (io) io.observe(el); else el.classList.add('is-vis')

    if (still) return () => io?.disconnect()

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [el])

  /* رفرنسِ تابعی — هویتش ثابت است پس هر رندر دوباره صدا زده نمی‌شود */
  return useCallback((node: T | null) => { setEl(node) }, [])
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
