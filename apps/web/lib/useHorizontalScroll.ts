'use client'

/* ─────────────────────────────────────────────────────────────
   درگِ افقیِ نوارهای کارت — با اینرسی، سازگار با RTL.

   ── دو تصمیمِ اصلی ──

   ۱) چرخِ ماوس دیگر ربوده نمی‌شود.
      کاربر می‌خواهد صفحه پایین برود و به‌جایش کارت‌ها می‌لغزیدند.
      نکته‌ی مهم: حذفِ شنونده‌ی `wheel` به‌تنهایی کافی نیست — خودِ
      کروم روی هر عنصری که `overflow-x` دارد و عمودی اسکرول نمی‌شود،
      چرخِ عمودی را به حرکتِ افقی ترجمه می‌کند. با آزمایشِ واقعی هم
      دیده شد (نوارِ بازار با یک چرخِ ۳۲۰تایی ۱۱۶۵ پیکسل جابه‌جا شد).
      پس چرخ را می‌گیریم، جلوی ترجمه‌اش را می‌گیریم و همان مقدار را به
      صفحه می‌دهیم. ژستِ افقیِ ترک‌پد (deltaX غالب) دست‌نخورده می‌ماند.

   ۲) درگ اینرسی دارد.
      نسخه‌ی قبلی در هر `pointermove` مستقیم `scrollLeft` را می‌نوشت؛
      یعنی نوار دقیقاً به‌اندازه‌ی حرکتِ دست جابه‌جا می‌شد و لحظه‌ی
      رهاشدن خشک می‌ایستاد. حالا سرعت از چند نمونه‌ی آخر تخمین زده
      می‌شود و پس از رهاکردن، حرکت با کاهشِ نمایی ادامه می‌یابد —
      همان حسی که از اسکرولِ بومی انتظار می‌رود.

   ── نکته‌ی RTL ──
   صفحه `dir="rtl"` است و در RTL مرورگرهای امروزی `scrollLeft` از
   ‎-(scrollWidth-clientWidth) تا ۰ حرکت می‌کند، نه از ۰ به بالا. جهت
   یک‌بار به‌صورت تجربی تشخیص داده می‌شود (نه فرض) و بعد همه‌چیز با یک
   «موقعیتِ نرمال‌شده»ی ۰ تا max کار می‌کند.

   ── لمس ──
   دستگاه‌های لمسی عمداً دست‌نخورده می‌مانند: اسکرولِ بومیِ آن‌ها از هر
   شبیه‌سازی‌ای نرم‌تر است و ربودنش فقط کیفیت را پایین می‌آورد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, type RefObject } from 'react'

/** ‎+۱ یعنی scrollLeft مثبت است، ‎-۱ یعنی در RTL منفی می‌شود */
export function scrollSign(el: HTMLElement): 1 | -1 {
  if (getComputedStyle(el).direction !== 'rtl') return 1
  const orig = el.scrollLeft
  el.scrollLeft = -1
  const negative = el.scrollLeft < 0
  el.scrollLeft = orig
  return negative ? -1 : 1
}

export const maxScroll = (el: HTMLElement) => Math.max(0, el.scrollWidth - el.clientWidth)

/** موقعیتِ نرمال‌شده: همیشه ۰ (ابتدای نوار) تا max.
 *  آرگومانِ `sign` برای سازگاری با فراخوان‌های موجود نگه داشته شده. */
export const getPos = (el: HTMLElement, _sign?: 1 | -1) => Math.abs(el.scrollLeft)

export function setPos(el: HTMLElement, sign: 1 | -1, p: number) {
  const clamped = Math.max(0, Math.min(maxScroll(el), p))
  el.scrollLeft = clamped * sign
}

/* ── ثابت‌های حسِ حرکت ──
   اصطکاکِ کمتر یعنی لغزشِ طولانی و بی‌کنترل، بیشتر یعنی همان خشکیِ
   قبلی. این مقادیر با آزمایش انتخاب شده‌اند. */
const FRICTION = 0.94        // کاهشِ سرعت در هر فریمِ ۶۰Hz
const MIN_VELOCITY = 0.03    // زیر این مقدار حرکت تمام‌شده حساب می‌شود
const MAX_VELOCITY = 4.5     // سقفِ سرعت (پیکسل بر میلی‌ثانیه)
const SAMPLE_MS = 90         // پنجره‌ی تخمینِ سرعت
const DRAG_THRESHOLD = 4     // زیر این جابه‌جایی هنوز «کلیک» است
const WHEEL_EASE = 0.22      // کسری از فاصله‌ی باقی‌مانده در هر فریم

export function useHorizontalScroll(
  ref: RefObject<HTMLElement | null>,
  /* نوارهایی که خودکار حرکت می‌کنند باید حین دخالتِ کاربر بایستند،
     وگرنه با دستِ کاربر می‌جنگند و باز هم «قفل» حس می‌شود. */
  onInteract?: (busy: boolean) => void,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const sign = scrollSign(el)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let idle: ReturnType<typeof setTimeout> | null = null
    const busy = () => {
      onInteract?.(true)
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => onInteract?.(false), 900)
    }

    let down = false
    let startX = 0
    let startPos = 0
    let moved = 0
    let raf = 0
    /* نمونه‌های اخیر برای تخمینِ سرعت — یک نقطه کافی نیست، چون آخرین
       حرکت ممکن است لرزشِ دست باشد نه قصدِ کاربر. */
    let samples: { t: number; x: number }[] = []

    const stopInertia = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }

    /** حرکتِ آزاد پس از رهاکردن، با کاهشِ نمایی */
    const glide = (v0: number) => {
      if (reduced) { onInteract?.(false); return }   // احترام به تنظیمِ کاربر
      let v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v0))
      let last = performance.now()

      const step = (now: number) => {
        const dt = Math.min(32, now - last)          // پرشِ فریم نباید جهش بسازد
        last = now
        const next = getPos(el) + v * dt
        setPos(el, sign, next)

        const max = maxScroll(el)
        if (next <= 0 || next >= max) { raf = 0; onInteract?.(false); return }

        v *= FRICTION ** (dt / 16.67)                // مستقل از نرخِ فریم
        if (Math.abs(v) < MIN_VELOCITY) { raf = 0; onInteract?.(false); return }
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }

    const onDown = (e: PointerEvent) => {
      /* لمس دست‌نخورده می‌ماند: اسکرولِ بومی نرم‌تر است */
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      stopInertia()
      /* بدونِ این، کشیدن روی عکسِ کارت‌ها درگِ بومیِ تصویر را شروع
         می‌کند و مرورگر پس از اولین حرکت pointermove را قطع می‌کند —
         نوار یک تکان می‌خورد و می‌ایستد. */
      e.preventDefault()
      down = true
      moved = 0
      startX = e.clientX
      startPos = getPos(el)
      samples = [{ t: performance.now(), x: e.clientX }]
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
      try { el.setPointerCapture(e.pointerId) } catch { /* پشتیبانی نشد */ }
      busy()
    }

    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > DRAG_THRESHOLD) moved = Math.abs(dx)

      const now = performance.now()
      /* یک حرکتِ اشاره‌گر می‌تواند دوبار برسد (هدف و مسیرِ حباب). نمونه‌ی
         تکراری با زمانِ یکسان، پنجره را از دو نقطه‌ی هم‌زمان پر می‌کرد و
         سرعت را صفر می‌ساخت. */
      const tail = samples[samples.length - 1]
      if (tail && tail.t === now && tail.x === e.clientX) { /* تکراری */ }
      else samples.push({ t: now, x: e.clientX })
      /* نمونه‌ی خارج از پنجره تنها وقتی حذف می‌شود که نمونه‌ی بعدی هم
         هنوز داخلِ پنجره باشد — وگرنه ممکن است فقط دو نقطه‌ی هم‌زمان
         باقی بماند و تخمینِ سرعت از بین برود. */
      while (samples.length > 2 && now - samples[1]!.t > SAMPLE_MS) samples.shift()

      /* در RTL، کشیدن به راست باید نوار را به همان سمت ببرد */
      setPos(el, sign, startPos + (sign === -1 ? dx : -dx))
      busy()
    }

    const stop = () => {
      if (!down) return
      down = false
      el.style.cursor = ''
      el.style.userSelect = ''

      /* سرعت از قدیمی‌ترین نمونه‌ی پنجره تا آخرین حساب می‌شود، نه از دو
         فریمِ آخر که نویزِ دست را بزرگ‌نمایی می‌کند. */
      const last = samples[samples.length - 1]
      /* اگر چند نمونه‌ی آخر هم‌زمان‌اند، عقب‌تر می‌رویم تا نقطه‌ای با
         زمانِ متفاوت پیدا شود؛ وگرنه یک فلیکِ سریع بدونِ اینرسی می‌ماند. */
      let first = samples[0]
      for (let i = 0; i < samples.length; i++) {
        if (last && samples[i]!.t < last.t) { first = samples[i]; break }
      }
      samples = []
      if (!first || !last || moved <= DRAG_THRESHOLD) { onInteract?.(false); return }

      const dt = last.t - first.t
      if (dt <= 0) { onInteract?.(false); return }

      const vx = (last.x - first.x) / dt             // پیکسل بر میلی‌ثانیه
      glide(sign === -1 ? vx : -vx)
    }

    /* درگ نباید به کلیکِ روی کارت تبدیل شود */
    const onClick = (e: MouseEvent) => {
      if (moved > DRAG_THRESHOLD + 2) { e.preventDefault(); e.stopPropagation() }
      moved = 0
    }

    /* ── چرخِ ماوس: بازگرداندنِ اسکرولِ صفحه ──
       شنونده فقط برای *خنثی‌کردن* ترجمه‌ی خودکارِ مرورگر است، نه برای
       حرکت‌دادنِ کارت‌ها. مقدار به یک هدف انباشته می‌شود و صفحه با
       کاهشِ نمایی به آن می‌رسد؛ این هم نرم‌تر از پرشِ خام است و هم
       چند چرخِ پشتِ‌هم را روی هم جمع می‌کند. */
    let target = 0
    let wheelRaf = 0

    /* `html` در این پروژه `scroll-behavior: smooth` دارد. یعنی
       `scrollTo` پیش‌فرض خودش انیمیشن می‌سازد و `window.scrollY`
       بلافاصله عوض نمی‌شود — که هم با میراییِ ما می‌جنگد و هم تشخیصِ
       «به ته رسیدیم» را خراب می‌کند. پس صریحاً `instant` می‌خواهیم. */
    let stalled = 0
    const follow = () => {
      const cur = window.scrollY
      const gap = target - cur
      if (Math.abs(gap) < 0.5) { window.scrollTo({ top: target, behavior: 'instant' }); wheelRaf = 0; return }
      window.scrollTo({ top: cur + gap * WHEEL_EASE, behavior: 'instant' })
      /* دو فریمِ پشتِ‌هم بی‌حرکت یعنی صفحه به ته/سرِ خود رسیده */
      stalled = Math.abs(window.scrollY - cur) < 0.5 ? stalled + 1 : 0
      if (stalled >= 2) { wheelRaf = 0; return }
      wheelRaf = requestAnimationFrame(follow)
    }

    const onWheel = (e: WheelEvent) => {
      /* ژستِ افقیِ ترک‌پد قصدِ صریحِ کاربر است — بومی بماند */
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
      if (e.ctrlKey) return                        // زوم

      e.preventDefault()
      const px = e.deltaMode === 1 ? e.deltaY * 16
               : e.deltaMode === 2 ? e.deltaY * window.innerHeight
               : e.deltaY

      if (reduced) { window.scrollBy(0, px); return }

      const max = document.documentElement.scrollHeight - window.innerHeight
      /* هدف از موقعیتِ فعلی شروع می‌شود مگر آن‌که هنوز در حالِ رسیدن
         به هدفِ قبلی باشیم — وگرنه چرخِ دوم، چرخِ اول را باطل می‌کند. */
      const base = wheelRaf ? target : window.scrollY
      target = Math.max(0, Math.min(max, base + px))
      if (!wheelRaf) { stalled = 0; wheelRaf = requestAnimationFrame(follow) }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    /* حرکت و رهاکردن فقط روی `window` گوش داده می‌شود: با گرفتنِ
       اشاره‌گر، رویدادها به هر حال تا `window` حباب می‌کنند، و ثبتِ
       هم‌زمان روی خودِ نوار هر حرکت را دوبار می‌رساند. */
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('pointercancel', stop)
    window.addEventListener('pointerup', stop)
    el.addEventListener('click', onClick, true)

    return () => {
      if (idle) clearTimeout(idle)
      stopInertia()
      if (wheelRaf) cancelAnimationFrame(wheelRaf)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointercancel', stop)
      window.removeEventListener('pointerup', stop)
      el.removeEventListener('click', onClick, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}
