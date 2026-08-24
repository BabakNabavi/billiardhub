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
import { CUE_STATIONS, CUE_VIEW_W, CUE_VIEW_H, camBox } from './CueObject'

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
      .from('[data-hero-cue]', { xPercent: 12, opacity: 0, duration: 1.5 }, 0.15)
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
      const svg = el.querySelector<SVGSVGElement>('[data-cam]')
      if (!section || !svg) return

      const box = { v: `0 0 ${CUE_VIEW_W} ${CUE_VIEW_H}` }
      const setBox = () => svg.setAttribute('viewBox', box.v)

      /* ⚠️ پیشرفتِ اسکرول **خطی نیست نسبت به ایستگاه‌ها**: بینِ هر
         دو حرکت یک مکث هست، پس `floor(progress × ۵)` نامِ ایستگاه را
         از دوربین جدا می‌کرد — در ۰٫۶۰۵ برچسب «فرول» می‌شد در حالی
         که قاب هنوز روی شفت بود. این آرایه نقطه‌ی *رسیدنِ* واقعیِ هر
         ایستگاه را از خودِ تایم‌لاین می‌گیرد. */
      const marks: number[] = []

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          /* ⚠️ نه `top top`: ناوبرِ ثابتِ ۷۲ پیکسلی بالای صفحه است و
             با پینِ چسبیده به لبه، هفتاد و دو پیکسلِ اولِ صحنه در کلِ
             ۳۹۰vh زیرِ نوارِ مات می‌ماند. */
          start: 'top 72px',
          end: () => `+=${CUE_STATIONS.length * 78}%`,
          pin: true,
          scrub: 0.8,
          /* ⚠️ `invalidateOnRefresh`: طولِ end با درصدِ ارتفاعِ ویوپورت
             حساب می‌شود و بدونِ این، بعد از چرخشِ صفحه یا تغییرِ
             اندازه با عددِ کهنه کار می‌کند. */
          invalidateOnRefresh: true,
          /* ⚠️ بدونِ این، یک `refresh` در میانه‌ی پین مقدارهای شروعِ
             تویین را از `box.v`ِ *همان لحظه* دوباره ضبط می‌کند و کلِ
             مسیرِ دوربین تا بارگذاریِ بعدی خراب می‌ماند. */
          onRefreshInit: () => {
            box.v = `0 0 ${CUE_VIEW_W} ${CUE_VIEW_H}`
            setBox()
          },
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

      /* از نمای کامل به ایستگاهِ اول، بعد ایستگاه‌به‌ایستگاه */
      const arrive: number[] = []
      CUE_STATIONS.forEach((st, i) => {
        tl.to(box, {
          v: camBox(st.cx, st.cw),
          duration: 1,
          ease: i === 0 ? 'power2.inOut' : 'power1.inOut',
          onUpdate: setBox,
        })
        /* لحظه‌ای که دوربین *رسیده* — نه لحظه‌ای که راه افتاده */
        arrive.push(tl.duration())
        /* مکثِ کوتاه روی هر ایستگاه تا متن خوانده شود.
           ⚠️ مکث روی یک شیءِ خالی است، نه `{ v: box.v }` — آن مقدار
           هنگامِ *ساختِ* تایم‌لاین خوانده می‌شود (یعنی نمای کامل)، پس
           به‌جای ایستادن، دوربین هر بار به عقب پرواز می‌کرد. */
        if (i < CUE_STATIONS.length - 1) tl.to({}, { duration: 0.35 })
      })

      /* ⚠️ آستانه در *میانه‌ی* هر حرکت است، نه لحظه‌ی رسیدن: با
         آستانه‌ی رسیدن، نام تا پایانِ سفر روی ایستگاهِ قبلی می‌ماند و
         وقتی دوربین عملاً روی جوینت است هنوز «بات» نوشته. نیم‌واحد
         عقب‌تر یعنی برچسب همان‌جا عوض می‌شود که چشم هم قانع شده. */
      const total = tl.duration()
      arrive.forEach(t => marks.push(Math.max(0, (t - 0.5) / total)))

      return () => { svg.setAttribute('viewBox', `0 0 ${CUE_VIEW_W} ${CUE_VIEW_H}`) }
    })

    /* موبایل: بدونِ دوربین، ایستگاهِ اول ثابت می‌ماند */
    mm.add('(max-width: 999px)', () => { onStation(0) })

    return () => {
      split?.revert()
      mm.revert()
    }
  }, { scope: root, dependencies: [] })
}
