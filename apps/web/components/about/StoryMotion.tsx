'use client'

import { useEffect } from 'react'

/* ─────────────────────────────────────────────────────────────
   حرکتِ فصل‌های روایت — GSAP + ScrollTrigger، فقط این‌جا و با import پویا تا
   باندلِ صفحه‌های دیگر سنگین نشود (gsap از قبل در وابستگی‌ها بود و جایی استفاده
   نمی‌شد). کلاسِ is-scrub روی بخش، فصل‌ها را روی هم می‌چیند؛ بدونِ آن (بی JS،
   کاهشِ حرکت، خطای بارگذاری) همان چیدمانِ ایستا و کامل می‌ماند.
   هیچ چیز از opacity صفر شروع نمی‌شود مگر فصل‌های ۲ و ۳ که پیش از نوبتشان
   پشتِ فصلِ ۱ هستند
   ───────────────────────────────────────────────────────────── */

export function StoryMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const section = document.getElementById('ab-chapters')
    if (!section) return
    let cancelled = false
    let revert: (() => void) | null = null

    void (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
        if (cancelled) return
        gsap.registerPlugin(ScrollTrigger)
        const stage = section.querySelector<HTMLElement>('.ab-chap-stage')
        const tiles = Array.from(section.querySelectorAll<HTMLElement>('.ab-tile'))
        const texts = Array.from(section.querySelectorAll<HTMLElement>('.ab-chap-text'))
        const [t1, t2, t3] = texts
        if (!stage || tiles.length === 0 || !t1 || !t2 || !t3) return
        section.classList.add('is-scrub')

        const ctx = gsap.context(() => {
          const W = () => stage.clientWidth
          const H = () => stage.clientHeight
          /* موبایل: قاب‌ها زیرِ متن‌اند، پس پراکندگیِ عمودی فقط رو به پایین و نصف */
          const mobile = () => window.innerWidth < 1024
          const n = (el: HTMLElement, k: string) => {
            const v = Number(el.dataset[k] ?? 0)
            if (!mobile()) return v
            return k === 'dy' ? Math.abs(v) * 0.5 : k === 'dx' ? v * 0.5 : v
          }

          /* opacity، نه autoAlpha: visibility:hidden فصل‌های ۲ و ۳ را از درختِ دسترس‌پذیری
             حذف می‌کرد. حالتِ پراکنده داخلِ timeline (fromTo) است تا refreshِ ScrollTrigger
             بعد از resize آن را با اندازه‌ی تازه دوباره بسازد */
          gsap.set([t2, t3], { opacity: 0, y: 32 })

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            /* سنجاق زیرِ سربرگِ ثابتِ سایت شروع می‌شود، نه زیرِ آن */
            /* فاصله‌ی زیرِ نوارِ ناوبری (با safe-area) در CSS است، نه این‌جا */
            scrollTrigger: { trigger: section, start: 'top top', end: '+=220%', pin: stage, scrub: 0.6, invalidateOnRefresh: true },
          })
          /* فصلِ ۲: جدا افتادن — دورتر، کوچک‌تر، کم‌رنگ‌تر */
          tl.fromTo(tiles, {
            x: (_: number, el: HTMLElement) => n(el, 'dx') * W(),
            y: (_: number, el: HTMLElement) => n(el, 'dy') * H(),
            rotate: (_: number, el: HTMLElement) => n(el, 'r'),
            scale: 0.86,
          }, {
            x: (_: number, el: HTMLElement) => n(el, 'dx') * 1.5 * W(),
            y: (_: number, el: HTMLElement) => n(el, 'dy') * 1.5 * H(),
            scale: 0.8, duration: 1,
          }, 0)
            .to(t1, { opacity: 0, y: -32, duration: 0.3 }, 0.55)
            .to(t2, { opacity: 1, y: 0, duration: 0.3 }, 0.75)
          /* فصلِ ۳: یکپارچه — همه سرِ جای خودشان در یک ترکیب */
            .to(tiles, { x: 0, y: 0, rotate: 0, scale: 1, duration: 1.3, ease: 'power2.inOut', stagger: 0.05 }, 1.25)
            .to(t2, { opacity: 0, y: -32, duration: 0.3 }, 1.5)
            .to(t3, { opacity: 1, y: 0, duration: 0.3 }, 1.7)
        }, section)
        revert = () => { ctx.revert(); section.classList.remove('is-scrub') }
      } catch (err) {
        console.error('[about/story] motion failed', err)
        section.classList.remove('is-scrub')
      }
    })()

    return () => { cancelled = true; revert?.() }
  }, [])
  return null
}
