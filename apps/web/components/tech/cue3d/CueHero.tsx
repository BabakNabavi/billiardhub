'use client'

/* ─────────────────────────────────────────────────────────────
   قهرمانِ چوب — سه‌بعدیِ زنده روی دسکتاپ، تصویرِ ازپیش‌رندرشده
   روی بقیه.

   ── چرا این‌طور و نه با CSS ──
   ⚠️ اگر صحنه‌ی سه‌بعدی رندر شود و بعد با `display: none` پنهان
   گردد، موبایل **باز هم ۲۵۶ کیلوبایتِ فشرده** را دانلود کرده.
   تصمیم باید *پیش از* import گرفته شود، پس `next/dynamic` با
   بارگذاریِ شرطی: روی موبایل آن import هرگز اجرا نمی‌شود.

   ── تصویرِ جایگزین کیفیتش کمتر نیست ──
   همان صحنه است که با `scripts/prerender-cue.mjs` یک‌بار رندر و
   به WebP تبدیل شده — ~۶۰ کیلوبایت به‌جای ۲۵۶.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { CueView } from './CueScene'

const CueScene = dynamic(() => import('./CueScene').then(m => m.CueScene), {
  ssr: false,
  loading: () => null,
})

interface Props {
  view: CueView
  /** مسیرِ تصویرِ ازپیش‌رندرشده‌ی همین نما */
  still: string
  alt: string
  ground?: string
  className?: string
}

export function CueHero({ view, still, alt, ground, className }: Props) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    /* ⚠️ سه شرط، هر سه لازم:
       • عرضِ دسکتاپ — گوشی GPUِ ضعیف دارد و مخاطبِ اصلیِ این سایت است
       • حالتِ آرام نباشد — صحنه‌ی زنده حرکت دارد
       • کاربر «ذخیره‌ی داده» روشن نکرده باشد */
    const wide = window.matchMedia('(min-width: 1000px)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const decide = () => setLive(wide.matches && !calm.matches && !conn?.saveData)
    decide()
    wide.addEventListener('change', decide)
    calm.addEventListener('change', decide)
    return () => {
      wide.removeEventListener('change', decide)
      calm.removeEventListener('change', decide)
    }
  }, [])

  return (
    <div className={className} data-cue-hero>
      {/* ⚠️ تصویر همیشه رندر می‌شود و بومِ زنده *رویش* می‌نشیند.
          پیش از این با روشن‌شدنِ `live` تصویر برداشته می‌شد و تا
          رسیدنِ ۲۵۶ کیلوبایت، قاب سفیدِ خالی بود. */}
      {live && <div className="cue-live"><CueScene view={view} ground={ground} /></div>}
      {/* ⚠️ `<img>` خام و نه `next/image`: این فایل ازپیش در اندازه‌ی
          نهایی و WebP ساخته شده و بهینه‌سازیِ دوباره فقط یک پرشِ
          شبکه‌ی اضافه است. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={still} alt={alt} width={1400} height={900} decoding="async" />
    </div>
  )
}
