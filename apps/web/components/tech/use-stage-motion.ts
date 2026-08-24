'use client'

/* ─────────────────────────────────────────────────────────────
   سیستمِ حرکتِ صفحه‌ی متخصص.

   ── چرا این فایل وجود دارد ──
   تا پیش از این، حرکتِ صفحه چند `@keyframes`ِ دست‌ساز بود: هر عنصر
   جدا محو می‌شد و هیچ‌چیز با هیچ‌چیز هماهنگ نبود.

   اندازه‌گیری روی برنده‌های واقعی نشان داد همه یک چیز دارند:
   **تایم‌لاینِ کوریوگرافی‌شده**. `by-kin.com` (چهار جایزه) GSAP دارد،
   `landonorris.com` (سایتِ سالِ Awwwards) GSAP + ScrollTrigger +
   Lenis + Three.js. تفاوت «افکتِ بیشتر» نیست؛ *هماهنگیِ زمانی* است.

   ── قواعدِ اجرا که با اندازه‌گیری درآمدند ──
   • **موبایل اسکرولِ نرم نمی‌گیرد.** با Lenis روشن، اسکرول روی CPUِ
     ۴ برابر کند ۲۲ فریم بر ثانیه بود؛ بدونش ۵۵. موبایل اینرسیِ
     بومیِ خودش را دارد و مخاطبِ اصلیِ این سایت همان دستگاه است.
   • **هیچ `scrub`ی روی موبایل** — هر فریمِ اسکرول محاسبه می‌خواهد.
   • `prefers-reduced-motion` پیش از ساختنِ هر چیزی برمی‌گردد.
   • همه‌چیز داخلِ `useGSAP` است تا پاک‌سازی واقعاً کامل باشد.
   ───────────────────────────────────────────────────────────── */

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'
import type { RefObject } from 'react'

let registered = false
function register() {
  if (registered) return
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase)
  /* ⚠️ منحنیِ اختصاصی، نه `power2.out`ِ پیش‌فرض. تفاوتِ «حرکت دارد»
     با «حرکتش درست است» دقیقاً همین است: شتابِ اول تند، فرودِ آرام. */
  CustomEase.create('bh-out', 'M0,0 C0.16,1 0.3,1 1,1')
  registered = true
}

export function useStageMotion(root: RefObject<HTMLElement | null>, key: string) {
  useGSAP(() => {
    const el = root.current
    if (!el || !key) return
    register()

    /* ⚠️ پیش از ساختنِ هر چیزی: حالتِ آرام نباید Lenis یا تایم‌لاینی
       بسازد و بعد خنثی کند. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* ── حالتِ اولیه از JS می‌آید، نه CSS ──
       ⚠️ اگر `opacity:0` پیش‌فرضِ CSS باشد، هر شکستِ JS محتوا را
       *برای همیشه* نامرئی می‌کند. این‌طوری بدترین حالت «بدونِ
       انیمیشن» است، نه «بدونِ محتوا». */
    const plates = Array.from(el.querySelectorAll<HTMLElement>('[data-plate]'))
    plates.forEach(p => gsap.set(p.querySelectorAll('[data-fill], [data-pop]'), { opacity: 0 }))

    /* ── ورودِ سرلوحه ── */
    const name = el.querySelector<HTMLElement>('[data-split]')
    const tl = gsap.timeline({ defaults: { ease: 'bh-out' } })

    if (name) {
      /* ⚠️ **هرگز `chars` در فارسی.** حروف به هم می‌چسبند و شکلشان
         به همسایه بستگی دارد؛ جداکردنِ حرف‌به‌حرف اتصال را می‌شکند و
         «بابک نبوی» روی صفحه «ب اب ک ن ب وی» دیده می‌شود. این تله در
         سایت‌های لاتین اصلاً وجود ندارد.

         ⚠️ `autoSplit`: تقسیم وقتی داده می‌رسد انجام می‌شود، که روی
         شبکه‌ی کند *پیش از* رسیدنِ فونتِ نمایشی است. بدونِ این، خطوط
         با متریکِ فونتِ اشتباه اندازه می‌شوند و بعد فونت زیرشان عوض
         می‌شود؛ چرخشِ گوشی هم ماسکِ کهنه روی متنِ نو می‌گذارد. */
      SplitText.create(name, {
        type: 'words,lines',
        mask: 'lines',
        autoSplit: true,
        /* تیکِ آبی نباید تکه شود */
        ignore: '.vb',
        onSplit(self) {
          /* ⚠️ `overflow: clip`ِ ماسک دقیقاً روی جعبه‌ی خط می‌بُرد و
             فرودِ «ی/ج/پ» و هاله‌ی متن را می‌خورد. پدینگ مرزِ برش را
             پایین‌تر می‌برد و حاشیه‌ی منفی جای اضافه را پس می‌گیرد. */
          for (const m of (self.masks ?? []) as HTMLElement[]) {
            m.style.paddingBlockEnd = '.22em'
            m.style.marginBlockEnd = '-.22em'
          }
          return gsap.from(self.words, {
            yPercent: 115, opacity: 0, duration: 1.1,
            stagger: { each: 0.08, from: 'start' }, ease: 'bh-out',
          })
        },
      })
    }

    /* ⚠️ همه‌ی انتخابگرها به سرلوحه محدودند: `[data-anim="act"]`
       دکمه‌های بندِ پایانی را هم می‌گرفت و آن‌ها چند ویوپورت پایین‌تر
       نامرئی می‌ماندند تا کاربر برسد. */
    tl.from('.tpx-hero [data-anim="lede"]', { y: 22, opacity: 0, duration: .8 }, 0.28)
      .from('.tpx-hero [data-anim="intro"]', { y: 20, opacity: 0, duration: .8 }, 0.36)
      .from('.tpx-hero [data-anim="stat"]', { y: 18, opacity: 0, duration: .7, stagger: .07 }, 0.44)
      .from('.tpx-hero [data-anim="act"]', { y: 16, opacity: 0, duration: .7, stagger: .08 }, 0.56)
      .from('.tpx-hero [data-plate]', { y: 40, opacity: 0, duration: 1.3 }, 0.1)

    /* ── رسمِ نقشه‌ها ──
       ⚠️ DrawSVG به‌جای `stroke-dasharray`ِ دستی: طولِ واقعیِ مسیر را
       خودش می‌گیرد، پس قابِ میز که محیطش ~۲۲۰۰ است هم کامل رسم
       می‌شود — چیزی که دشِ عددیِ ثابت نمی‌توانست.
       ⚠️ `[data-pop]` فقط محو می‌شود و مقیاس نمی‌گیرد: `transform`
       روی فرزندِ SVG کامپوزیت نمی‌شود و هر فریم کلِ نقشه را دوباره
       رَستر می‌کند — و این تایم‌لاین روی موبایل هم اجرا می‌شود. */
    plates.forEach(plate => {
      const strokes = plate.querySelectorAll('[data-draw]')
      const fills = plate.querySelectorAll('[data-fill]')
      const pops = plate.querySelectorAll('[data-pop]')
      if (!strokes.length && !fills.length) return
      gsap.timeline({
        scrollTrigger: { trigger: plate, start: 'top 88%', once: true },
        defaults: { ease: 'bh-out' },
      })
        .fromTo(strokes, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, stagger: .08 }, 0)
        .to(fills, { opacity: 1, duration: .9 }, .35)
        .to(pops, { opacity: 1, duration: .5, stagger: .045 }, .55)
    })

    /* ── ورودِ بخش‌ها ──
       ⚠️ تنها فرزندِ `.tpx-sec` یک `.tpx-wrap` است؛ استگر روی یک
       عنصر یعنی هیچ. یک لایه پایین‌تر می‌رویم. */
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(sec => {
      const kids = sec.querySelectorAll(':scope > .tpx-wrap > *')
      if (!kids.length) return
      gsap.from(kids, {
        y: 30, opacity: 0, duration: .9, stagger: .1, ease: 'bh-out',
        scrollTrigger: { trigger: sec, start: 'top 82%', once: true },
      })
    })

    /* ── کارهایی که فقط روی دسکتاپ ارزشِ هزینه‌شان را دارند ──
       ⚠️ `gsap.matchMedia` نه یک `matchMedia().matches`ِ یک‌باره: با
       تغییرِ اندازه یا چرخشِ تبلت، حالت باید واقعاً عوض شود — وگرنه
       Lenis در عرضِ ۵۰۰ پیکسل روشن می‌ماند. */
    const mm = gsap.matchMedia()
    mm.add('(min-width: 940px)', () => {
      /* اسکرولِ وزن‌دار — همان حسِ «یک سطحِ پیوسته» */
      const lenis = new Lenis({ autoRaf: false, duration: 1.05, smoothWheel: true })
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (t: number) => lenis.raf(t * 1000)
      gsap.ticker.add(raf)
      /* ⚠️ تنظیمِ سراسری است و باید در پاک‌سازی برگردد، وگرنه بقیه‌ی
         عمرِ همین نشست، هر انیمیشنِ دیگری در کلِ اپ بدونِ هموارسازیِ
         تأخیر اجرا می‌شود. */
      gsap.ticker.lagSmoothing(0)
      /* ⚠️ `scroll-behavior: smooth`ِ سراسری با Lenis می‌جنگد: هر
         پرشِ لنگر دو بار نرم می‌شود. */
      document.documentElement.classList.add('lenis-on')

      /* پارالاکس: نام کندتر از قاب — عمقِ واقعی، بدونِ هیچ تصویری */
      gsap.to('.tpx-hero [data-anim="idcol"]', {
        yPercent: -14, ease: 'none',
        scrollTrigger: { trigger: '.tpx-hero', start: 'top top', end: 'bottom top', scrub: .8 },
      })

      /* وزنِ فونتِ متغیر با اسکرول — همان تکنیکِ سایتِ سالِ Awwwards
         با Mona Sans Variable.
         ⚠️ روی *کلمه‌ها* اعمال می‌شود نه روی `h1`: بعد از تقسیم، متن
         در گره‌های فرزند است و `h1` دیگر متنی ندارد. */
      if (name) {
        const words = name.querySelectorAll('div')
        if (words.length) {
          gsap.to(words, {
            fontVariationSettings: '"wght" 540', ease: 'none',
            scrollTrigger: { trigger: '.tpx-hero', start: 'top top', end: '+=520', scrub: .6 },
          })
        }
      }

      /* نوارِ حرکتی با شتابِ اسکرول کمی خم می‌شود و برمی‌گردد.
         ⚠️ سقفِ ۷ درجه: بیشتر از این «افکت» می‌شود، نه «وزن».
         ⚠️ روی لایه‌ی `-skew` نوشته می‌شود نه روی `ul`: حلقه‌ی
         بی‌پایان یک انیمیشنِ CSS روی `transform` است و اعلانِ
         انیمیشن در آبشار از استایلِ اینلاین بالاتر است.
         ⚠️ انتخاب از `el` نه از `document`: تنها انتخابگرِ ناحصورِ
         این فایل بود و روزی که نوارِ دیگری در لِی‌اوت اضافه شود،
         بی‌صدا آن را می‌گرفت. */
      const mq = el.querySelector('[data-marquee] .tpx-marquee-skew')
      if (mq) {
        const skew = gsap.quickTo(mq, 'skewX', { duration: .5, ease: 'bh-out' })
        ScrollTrigger.create({
          trigger: el, start: 'top top', end: 'bottom top',
          onUpdate: self => skew(gsap.utils.clamp(-7, 7, self.getVelocity() / -380)),
        })
        /* ⚠️ `onUpdate` تنها جایی است که اسکیو نوشته می‌شود، پس اگر
           به‌روزرسانی در سرعتِ بالا قطع شود (پرشِ لنگر، کلیدِ End،
           فلیکِ تند از انتهای ناحیه) نوار تا بازگشتِ کاربر روی ۷
           درجه *یخ می‌زند*. این شنونده صفرش می‌کند و چون داخلِ همین
           `mm.add` ساخته می‌شود، با `mm.revert()` برداشته می‌شود. */
        ScrollTrigger.addEventListener('scrollEnd', () => skew(0))
      }

      /* قابِ نقشه با اسکرول می‌چرخد و بزرگ می‌شود — عمقی که با
         حرکت ساخته می‌شود، نه با سایه.
         ⚠️ `transformPerspective` روی خودِ تویین لازم است: `perspective`
         در CSS روی `.tpx-plate` نشسته و در CSS این خاصیت به *فرزندانِ*
         عنصر اثر می‌کند نه به تبدیلِ خودِ عنصر — و `[data-plate]`
         دقیقاً همان `.tpx-plate` است. بدونِ آن `rotateX` فقط یک
         لهیدگیِ عمودیِ تخت بود، نه عمق. */
      gsap.fromTo('.tpx-hero [data-plate]',
        { scale: .94, rotateX: 6, transformPerspective: 1400 },
        { scale: 1, rotateX: 0, transformPerspective: 1400, ease: 'none',
          scrollTrigger: { trigger: '.tpx-hero', start: 'top top', end: '+=620', scrub: .7 } })

      return () => {
        gsap.ticker.remove(raf)
        gsap.ticker.lagSmoothing(500, 33)
        document.documentElement.classList.remove('lenis-on')
        lenis.destroy()
      }
    })

    return () => { mm.revert() }
  }, { scope: root, dependencies: [key] })
}
