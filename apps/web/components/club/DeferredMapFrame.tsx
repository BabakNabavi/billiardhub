'use client'

/* ─────────────────────────────────────────────────────────────
   نقشه‌ی گوگل که فقط وقتی واقعا به کادرِ دید می‌رسد ساخته می‌شود.

   `loading="lazy"` روی iframe کافی نبود: کروم iframeِ تنبل را از
   ۱۲۵۰ تا ۲۵۰۰ پیکسل جلوتر بار می‌کند، پس روی گوشی نقشه‌ی پایینِ صفحه‌ی
   باشگاه همان اول بار می‌شد — Lighthouse ۴۶۲ کیلوبایت اسکریپتِ گوگل و
   ۴٫۶ ثانیه کارِ رشته‌ی اصلی پیش از نمایشِ تصویرِ اصلی نشان داد.

   ظاهر و رفتار همان است: کادر همان‌جاست و نقشه با رسیدنِ کاربر به آن
   (۲۰۰ پیکسل زودتر) بار می‌شود — نه کاورِ «کلیک کنید».
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, type CSSProperties } from 'react'

export function DeferredMapFrame({ src, title, style }: { src: string; title: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || show) return
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setShow(true); io.disconnect() }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [show])

  return (
    <div ref={ref} className="h-full w-full">
      {show && (
        <iframe src={src} title={title} style={style} allowFullScreen loading="lazy"
          referrerPolicy="no-referrer-when-downgrade" />
      )}
    </div>
  )
}
