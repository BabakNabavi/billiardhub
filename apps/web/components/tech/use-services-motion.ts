'use client'

/* ─────────────────────────────────────────────────────────────
   سیستمِ حرکتِ صفحه‌ی خدماتِ فنی.

   ── سه چیز، نه بیشتر ──
   ۱) ورودِ هیرو — پرده‌برداریِ ماسک‌دار از تیتر و ورودِ شیء
   ۲) دوربینِ آناتومی — بخشِ پین‌شده که قاب را از بات تا تیپ می‌برد
   ۳) پرده‌برداریِ سطرهای فهرست

   بقیه‌ی صفحه عمداً حرکت ندارد. اگر همه‌چیز حرکت کند، هیچ‌چیز
   سلسله‌مراتب نمی‌سازد.

   ── دوربین چطور کار می‌کند ──
   ⚠️ `scale`ِ CSS استفاده *نمی‌شود*. مرورگر لایه را یک‌بار رَستر
   می‌کند و در بزرگ‌نماییِ ~۲۰ برابر خروجی تار است. به‌جایش خودِ
   `viewBox`ِ SVG تویین می‌شود: زومِ برداریِ واقعی که در هر مقیاسی
   تیز می‌ماند. GSAP رشته‌ی چهارعددی را جزءبه‌جزء درون‌یابی می‌کند.

   ── موبایل ──
   ⚠️ هیچ pin و هیچ scrub. روی CPUِ ضعیف، پینِ ۵۰۰vh یعنی محاسبه‌ی
   هر فریمِ اسکرول. موبایل ایستگاه‌ها را به‌صورت عمودی و ایستا
   می‌گیرد — تصمیمِ چیدمانی، نه نسخه‌ی ناقصِ دسکتاپ.
   ───────────────────────────────────────────────────────────── */

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { CUE_STATIONS } from './cue-stations'

let registered = false
function register() {
  if (registered) return
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase)
  CustomEase.create('bh-out', 'M0,0 C0.16,1 0.3,1 1,1')
  registered = true
}

/** ایستگاهِ فعال — بیرون برای هم‌گام‌کردنِ متن با دوربین لازم است */
export type OnStation = (index: number) => void

export function useServicesMotion(
  root: RefObject<HTMLElement | null>,
  onStation: OnStation,
  /** شمارِ متخصصانِ رسیده — فقط برای اندازه‌گیریِ دوباره */
  rowCount: number,
) {
  /* ⚠️ ایندکسِ آخر نگه داشته می‌شود: `onUpdate`ِ یک scrubِ ۳۹۰vh
     حدودِ ۶۰ بار در ثانیه صدا زده می‌شود و بدونِ این، هر فریم یک
     `setState` می‌فرستد. React مقدارِ برابر را دور می‌ریزد ولی
     هزینه‌ی ارسال و زمان‌بندی هر فریم پرداخت می‌شود. */
  const lastStation = useRef(-1)

  /* ⚠️ داده‌ی راه‌دور *بعد از* اندازه‌گیریِ ScrollTrigger می‌رسد و
     `setRegistered(remote)` فهرست را جایگزین می‌کند، نه اضافه — پس
     ارتفاعِ سند عوض می‌شود. ScrollTrigger تغییرِ ارتفاعِ DOM را خودش
     نمی‌بیند (فقط resize/load)، و اگر صفحه کوتاه‌تر شود، یک
     `once: true`ِ اندازه‌گیری‌شده ممکن است از حداکثرِ اسکرول عقب
     بماند و آن سطرها *برای همیشه* روی `opacity: 0` بمانند. */
  useEffect(() => {
    if (rowCount > 0) ScrollTrigger.refresh()
  }, [rowCount])

  useGSAP(() => {
    const el = root.current
    if (!el) return
    register()

    /* ⚠️ پیش از ساختنِ هر تایم‌لاینی. حالتِ آرام نباید صحنه را
       بسازد و بعد خنثی کند. */
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) {
      onStation(0)
      return
    }

    /* ⚠️ SplitText باید صریح برگردانده شود: `autoSplit` یک شنونده‌ی
       تغییرِ اندازه/فونت زنده نگه می‌دارد و بدونِ revert، هر چرخشِ
       گوشی تیترِ هیرو را دوباره از اول می‌رقصاند. */
    let split: SplitText | null = null

    /* ── ۱) ورودِ هیرو ── */
    const title = el.querySelector<HTMLElement>('[data-hero-title]')
    if (title) {
      /* ⚠️ هرگز `chars` در فارسی: حروف به هم می‌چسبند و شکلِ هر حرف
         به همسایه‌اش بستگی دارد. تقسیمِ حرف‌به‌حرف اتصال را می‌شکند. */
      split = SplitText.create(title, {
        type: 'words,lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          for (const m of (self.masks ?? []) as HTMLElement[]) {
            m.style.paddingBlockEnd = '.2em'
            m.style.marginBlockEnd = '-.2em'
          }
          return gsap.from(self.words, {
            yPercent: 118, opacity: 0, duration: 1.15,
            stagger: { each: 0.07 }, ease: 'bh-out',
          })
        },
      })
    }
    gsap.timeline({ defaults: { ease: 'bh-out' } })
      .from('[data-hero-eyebrow]', { y: 14, opacity: 0, duration: .7 }, 0.1)
      /* ⚠️ `xPercent` حذف شد: این عنصر حالا لایه‌ی تمام‌قاب است و
         لغزاندنش تصویر را از زیرِ پرده‌ی ثابت بیرون می‌کشید. */
      .from('[data-hero-cue]', { opacity: 0, duration: 1.5 }, 0.15)
      .from('[data-hero-meta] > *', { y: 16, opacity: 0, duration: .7, stagger: .08 }, 0.6)

    /* ── ۳) پرده‌برداریِ سطرها ──
       روی هر دو اندازه اجرا می‌شود: یک تویینِ یک‌باره‌ی `once` هزینه‌ی
       هر-فریمی ندارد. */
    gsap.utils.toArray<HTMLElement>('[data-rows]').forEach(group => {
      const rows = group.querySelectorAll(':scope > *')
      if (!rows.length) return
      gsap.from(rows, {
        yPercent: 40, opacity: 0, duration: .85, stagger: .055, ease: 'bh-out',
        scrollTrigger: { trigger: group, start: 'top 84%', once: true },
      })
    })
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(sec => {
      gsap.from(sec, {
        y: 26, opacity: 0, duration: .8, ease: 'bh-out',
        scrollTrigger: { trigger: sec, start: 'top 86%', once: true },
      })
    })

    /* ── ۲) دوربینِ آناتومی — فقط دسکتاپ ── */
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1000px)', () => {
      const section = el.querySelector<HTMLElement>('[data-anatomy]')
      const frame = el.querySelector<HTMLElement>('[data-cam]')
      if (!section || !frame) return

      /* ⚠️ به‌جای تویینِ `viewBox`ِ یک SVG، پنج رندرِ واقعی روی هم
         محو/ظاهر می‌شوند. `opacity` روی لایه‌ی کامپوزیت است؛ تویینِ
         `viewBox` هر فریم کلِ برداری را دوباره رَستر می‌کرد. */
      const shots = Array.from(frame.querySelectorAll<HTMLImageElement>('img'))
      if (shots.length !== CUE_STATIONS.length) return

      const marks: number[] = []
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          /* ⚠️ نه `top top`: ناوبرِ ثابتِ ۷۲ پیکسلی بالای صفحه است. */
          start: 'top 72px',
          end: () => `+=${CUE_STATIONS.length * 78}%`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: self => {
            let i = 0
            for (let k = 0; k < marks.length; k++) {
              if (self.progress >= marks[k]! - 1e-4) i = k
            }
            if (i !== lastStation.current) {
              lastStation.current = i
              onStation(i)
            }
          },
        },
      })

      gsap.set(shots, { opacity: 0 })
      gsap.set(shots[0]!, { opacity: 1 })

      const arrive: number[] = []
      shots.forEach((img, i) => {
        if (i > 0) {
          tl.to(shots[i - 1]!, { opacity: 0, duration: 1, ease: 'power1.inOut' }, '<')
            .to(img, { opacity: 1, duration: 1, ease: 'power1.inOut' }, '<')
        } else {
          tl.to(img, { opacity: 1, duration: 1 })
        }
        arrive.push(tl.duration())
        if (i < shots.length - 1) tl.to({}, { duration: 0.35 })
      })

      const total = tl.duration()
      arrive.forEach(t => marks.push(Math.max(0, (t - 0.5) / total)))

      return () => { gsap.set(shots, { clearProps: 'opacity' }) }
    })

    /* موبایل: بدونِ دوربین، ایستگاهِ اول ثابت می‌ماند */
    mm.add('(max-width: 999px)', () => { onStation(0) })

    return () => {
      split?.revert()
      mm.revert()
    }
  }, { scope: root, dependencies: [] })
}
