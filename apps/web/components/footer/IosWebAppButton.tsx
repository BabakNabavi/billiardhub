'use client'
import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

/* دکمه‌ی «وب‌اپ آیفون» در فوتر.

   هیچ سایتی نمی‌تواند خودش آیکون روی صفحه‌ی اصلیِ آیفون بسازد — سافاری
   این را فقط از منوی Share اجازه می‌دهد. پس این دکمه همان شیتِ راهنمای
   سه‌مرحله‌ای را باز می‌کند که گیتِ خودکار هم نشان می‌دهد.

   شیت با dynamic جداست تا کدش به باندلِ همه نرود؛ با اولین لمس/هاور/فوکوس
   از پیش گرفته می‌شود تا روی شبکه‌ی کند کلیک بی‌واکنش نماند. */

const loadSheet = () => import('../pwa/AddToHomeScreenSheet')
const Sheet = dynamic(loadSheet, {
  ssr: false,
  loading: () => <span role="status" className="sr-only">در حال بارگذاری راهنما</span>,
})

export function IosWebAppButton({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const warm = () => { void loadSheet() }
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog"
        onPointerEnter={warm} onTouchStart={warm} onFocus={warm}
        onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <Sheet persist={false} onClose={() => setOpen(false)} />}
    </>
  )
}
