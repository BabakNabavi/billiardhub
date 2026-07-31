'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { A2HS_CONFIG, decide, readEnv } from '../../lib/pwa/a2hs'

/* ─────────────────────────────────────────────────────────────
   گیت راهنمای «افزودن به صفحه‌ی اصلی».

   این تنها چیزی است که در layout می‌نشیند و به باندل *همه* می‌رود، پس
   عمداً کوچک نگه داشته شده. خود شیت با `dynamic(..., { ssr:false })`
   بارگذاری می‌شود؛ یعنی کاربر اندروید، ویندوز و مک هرگز کد آن را
   دانلود نمی‌کند.

   هیچ دسترسی‌ای به window/navigator/localStorage بیرون از useEffect
   وجود ندارد و خروجی رندر اول همیشه `null` است — پس نه SSR می‌شکند
   نه hydration mismatch می‌دهد.
   ───────────────────────────────────────────────────────────── */

const Sheet = dynamic(() => import('./AddToHomeScreenSheet'), { ssr: false })

/** آیا الان لحظه‌ی مناسبی برای مزاحمت است؟ */
function momentIsRight(): boolean {
  if (document.visibilityState !== 'visible') return false
  /* بدنه قفل است ⇒ مودال دیگری باز است (منوی موبایل Navbar، استوری، …) */
  if (document.body.style.overflow === 'hidden') return false
  /* کاربر در حال تایپ است ⇒ پریدن کیبورد و پاپ‌آپ روی هم، بدترین حالت */
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false
  return true
}

export default function AddToHomeScreenGate() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) return
    if (!pathname) return
    if (A2HS_CONFIG.mutedRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))) return

    /* بررسی ارزان و زودهنگام: اگر دستگاه iOS نیست یا اپ نصب است، حتی
       تایمر هم ساخته نمی‌شود. */
    if (!decide(readEnv()).show) return

    const t = window.setTimeout(() => {
      if (!momentIsRight()) return
      /* دوباره تصمیم می‌گیریم: ممکن است در همین فاصله کاربر در تب دیگری
         نصبش کرده باشد یا مقدار ذخیره‌شده عوض شده باشد. */
      if (!decide(readEnv()).show) return
      setOpen(true)
    }, A2HS_CONFIG.showDelayMs)

    return () => window.clearTimeout(t)
  }, [pathname, open])

  if (!open) return null
  return <Sheet onClose={() => setOpen(false)} />
}
