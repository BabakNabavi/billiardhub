'use client'

/* نشان اعتماد پی‌پینگ — کنار اینماد در فوتر.
   ─────────────────────────────────────────────────────────────

   ── چرا با useEffect و نه JSX ──
   اسکریپتی که با `dangerouslySetInnerHTML` یا داخل رشته‌ی HTML
   بیفتد **هرگز اجرا نمی‌شود** — مرورگر اسکریپت‌های تزریق‌شده با
   innerHTML را اجرا نمی‌کند. پس باید با createElement ساخته و به DOM
   افزوده شود.

   خود اسکریپت پی‌پینگ دو چیز لازم دارد:
     • `document.currentScript.getAttribute('theme'|'size')` — پس این
       خصیصه‌ها باید روی همان عنصر script باشند.
     • `document.getElementById('PPTrust')` — پس ظرف باید پیش از
       اجرای اسکریپت در DOM باشد. چون اسکریپت را داخل همان span
       می‌گذاریم، هر دو شرط برقرار است.

   ── چرا theme روشن نیست ──
   با `theme="light"` اسکریپت `logo/white.png` را می‌آورد: کارتی
   بسیار روشن با نوشته‌ی خاکستری کم‌رنگ. پس‌زمینه‌ی فوتر `#F5F3EF`
   است، یعنی آن نشان تقریبا نامرئی می‌شد — و نشان اعتمادی که دیده
   نشود کاری نمی‌کند. نسخه‌ی سرمه‌ای روی این پس‌زمینه خواناست.
   برای برگرداندن، `theme` را به `light` تغییر دهید.

   ⚠️ دامنه‌ی `statics.payping.ir` باید در CSP (هم script-src و هم
   img-src) مجاز باشد، وگرنه نشان بی‌صدا رندر نمی‌شود. */

import { useLayoutEffect, useRef } from 'react'

/* ── اسکریپتِ در راه وقتی فوتر می‌رود (آذرِ ۱۴۰۵) ──
   اسکریپت `#PPTrust` را *هنگامِ اجرا* می‌جوید، نه هنگامِ افزوده‌شدن، و
   اسکریپتِ async پس از جداشدن از DOM هم اجرا می‌شود. فوتر روی /login و
   /register و چند صفحه‌ی دیگر پنهان است (FooterGate)؛ روی شبکه‌ی کند AuthGuard
   کاربر را از /booking به /login می‌برد پیش از آنکه اسکریپت برسد، و اجرایش
   با «Cannot read properties of null (reading 'appendChild')» می‌شکست.

   پس اگر فوتر پیش از اجرا برود، یک ظرفِ پنهانِ موقت با همان شناسه در body
   می‌ماند تا اسکریپت جایی برای نشستن داشته باشد، و پس از اجرا برداشته می‌شود.
   اگر فوتر پیش از اجرا برگردد، ظرفِ موقت برداشته می‌شود تا اسکریپتِ در راه
   همان ظرفِ تازه را پیدا کند — اسکریپتِ دوم هم اضافه نمی‌شود، وگرنه دو نشان
   کنار هم می‌نشست. خودِ اسکریپتِ پی‌پینگ دست نمی‌خورد. */
let inflight: HTMLScriptElement | null = null
let parked: HTMLSpanElement | null = null

function park() {
  if (!inflight || parked) return
  parked = document.createElement('span')
  parked.id = 'PPTrust'
  parked.hidden = true
  document.body.appendChild(parked)
}

function unpark() {
  parked?.remove()
  parked = null
}

export default function PayPingSeal() {
  const ref = useRef<HTMLSpanElement>(null)

  /* ⚠️ useLayoutEffect نه useEffect: ظرفِ موقت باید در همان commitی برداشته شود که
     فوترِ تازه به DOM برمی‌گردد. با useEffect فاصله‌ای می‌ماند که دو #PPTrust هم‌زمان
     هست و getElementById اولی را می‌گیرد — اگر روزی فوتر پس از ظرفِ موقت در body
     بنشیند، نشان در ظرفِ پنهان می‌افتاد و گم می‌شد. */
  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return

    /* اسکریپتی هنوز در راه است (فوتر رفته و برگشته، یا اجرای دومِ افکت در حالتِ
       توسعه): همان این ظرف را پیدا می‌کند؛ اسکریپتِ دوم یعنی دو نشان */
    if (inflight) {
      host.dataset.ppLoaded = '1'
      unpark()
      return park
    }
    /* اسکریپتِ همین ظرف قبلا اجرا شده */
    if (host.dataset.ppLoaded === '1') return
    host.dataset.ppLoaded = '1'

    const s = document.createElement('script')
    s.src = 'https://statics.payping.ir/trust-v3.js'
    s.setAttribute('theme', 'dark')   // لوگوی سرمه‌ای — روی فوتر روشن خواناست
    s.setAttribute('size', 'md')      // ۹۶×۱۱۵ — نزدیک‌ترین اندازه به اینماد
    s.async = true
    /* `load` پس از اجرا می‌آید؛ `error` یعنی اصلا اجرا نشد — در هر دو حالت دیگر
       چیزی در راه نیست */
    const settle = () => {
      if (inflight === s) inflight = null
      unpark()
    }
    s.addEventListener('load', settle)
    s.addEventListener('error', settle)
    inflight = s
    host.appendChild(s)
    return park
  }, [])

  return (
    <span
      id="PPTrust" ref={ref}
      aria-label="نماد اعتماد پرداخت پی‌پینگ"
      className="bh-payping"
      style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
      <style>{`
        /* اسکریپت اندازه را اینلاین روی تصویر می‌گذارد و بدون
           important نمی‌شود عوضش کرد؛ پس مقیاس روی خود عنصر
           ۲۰٪ کوچک‌تر، هم‌اندازه‌ی اینماد. */
        .bh-payping img { max-width: 100%; height: auto; display: block;
                          transform: scale(0.8); transform-origin: bottom right; }
      `}</style>
    </span>
  )
}
