'use client'

/* نشانِ اعتمادِ پی‌پینگ — کنارِ اینماد در فوتر.
   ─────────────────────────────────────────────────────────────

   ── چرا با useEffect و نه JSX ──
   اسکریپتی که با `dangerouslySetInnerHTML` یا داخلِ رشته‌ی HTML
   بیفتد **هرگز اجرا نمی‌شود** — مرورگر اسکریپت‌های تزریق‌شده با
   innerHTML را اجرا نمی‌کند. پس باید با createElement ساخته و به DOM
   افزوده شود.

   خودِ اسکریپتِ پی‌پینگ دو چیز لازم دارد:
     • `document.currentScript.getAttribute('theme'|'size')` — پس این
       خصیصه‌ها باید روی همان عنصرِ script باشند.
     • `document.getElementById('PPTrust')` — پس ظرف باید پیش از
       اجرای اسکریپت در DOM باشد. چون اسکریپت را داخلِ همان span
       می‌گذاریم، هر دو شرط برقرار است.

   ── چرا theme روشن نیست ──
   با `theme="light"` اسکریپت `logo/white.png` را می‌آورد: کارتی
   بسیار روشن با نوشته‌ی خاکستریِ کم‌رنگ. پس‌زمینه‌ی فوتر `#F5F3EF`
   است، یعنی آن نشان تقریباً نامرئی می‌شد — و نشانِ اعتمادی که دیده
   نشود کاری نمی‌کند. نسخه‌ی سرمه‌ای روی این پس‌زمینه خواناست.
   برای برگرداندن، `theme` را به `light` تغییر دهید.

   ⚠️ دامنه‌ی `statics.payping.ir` باید در CSP (هم script-src و هم
   img-src) مجاز باشد، وگرنه نشان بی‌صدا رندر نمی‌شود. */

import { useEffect, useRef } from 'react'

export default function PayPingSeal() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    /* در حالتِ توسعه، React افکت را دوبار اجرا می‌کند و بدونِ این
       نگهبان دو نشان کنارِ هم می‌نشست. */
    if (host.dataset.ppLoaded === '1') return
    host.dataset.ppLoaded = '1'

    const s = document.createElement('script')
    s.src = 'https://statics.payping.ir/trust-v3.js'
    s.setAttribute('theme', 'dark')   // لوگوی سرمه‌ای — روی فوترِ روشن خواناست
    s.setAttribute('size', 'md')      // ۹۶×۱۱۵ — نزدیک‌ترین اندازه به اینماد
    s.async = true
    host.appendChild(s)
  }, [])

  return (
    <span
      id="PPTrust" ref={ref}
      aria-label="نماد اعتماد پرداخت پی‌پینگ"
      className="bh-payping"
      style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
      <style>{`
        /* اسکریپت اندازه را اینلاین روی تصویر می‌گذارد (۱۴۴×۱۷۳).
           این‌جا فقط سقفِ عرض گذاشته می‌شود تا روی صفحه‌ی باریک
           سرریز نکند؛ نسبت حفظ می‌شود. */
        .bh-payping img { max-width: 100%; height: auto; display: block; }
      `}</style>
    </span>
  )
}
