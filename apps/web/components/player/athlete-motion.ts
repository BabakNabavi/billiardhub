'use client'

/* حرکتِ صفحه‌ی بازیکن — یک هوکِ کوچک، بدونِ کتابخانه.

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

import { useEffect, useLayoutEffect } from 'react'

/* ⚠️ `useEffect` بعد از رنگ‌آمیزی اجرا می‌شود: محتوا یک فریم دیده
   می‌شود، بعد `is-anim` آن را پنهان می‌کند و بعد محو-ظاهر می‌شود —
   یک پرشِ کوتاه که فقط روی دستگاهِ کند دیده می‌شود.
   `useLayoutEffect` روی سرور هشدار می‌دهد، پس فقط در مرورگر. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const lessMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/** هر عنصرِ `.ath-r` وقتی وارد کادر شد، یک‌بار باز می‌شود.
 *
 *  ⚠️ `deps` باید *هویتِ داده* باشد نه طولِ چند آرایه. با طول، پروفایلی
 *  که از کشِ محلی رندر شده و بعد نسخه‌ی سرور با افتخاراتِ بیشتر می‌رسد
 *  اثر را دوباره اجرا نمی‌کرد و آن بخش‌ها برای همیشه نامرئی می‌ماندند. */
export function useReveal(deps: unknown[] = []) {
  useIsoLayoutEffect(() => {
    if (typeof window === 'undefined') return
    /* کلاسِ is-anim حالتِ پنهانِ CSS را روشن می‌کند. تا وقتی این خط
       اجرا نشده، محتوا دیده می‌شود — یعنی شکستِ جاوااسکریپت به
       صفحه‌ی خالی ختم نمی‌شود. */
    document.querySelector('.ath')?.classList.add('is-anim')
    const nodes = document.querySelectorAll<HTMLElement>('.ath-r:not(.is-in)')
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
  }, deps)
}
