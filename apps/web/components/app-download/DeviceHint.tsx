'use client'
import { useSyncExternalStore, type ReactNode } from 'react'
import { detectMobileOs, type MobileOs } from '@/lib/app-stores'

/* ─────────────────────────────────────────────────────────────
   «مناسب گوشی شما» در صفحه‌ی /app.

   تنها تکه‌ی کلاینتیِ صفحه: سیستم‌عامل را از navigator می‌خواند و روی
   ظرف `data-os` می‌گذارد. برچسب و حلقه‌ی کارتِ مناسب با
   `group-data-[os=…]/os` در خودِ کارت‌های سروری است، پس این‌جا فقط یک
   ویژگی عوض می‌شود و صفحه استاتیک می‌ماند. ترتیبِ کارت‌ها عمداً عوض
   نمی‌شود: بعد از هیدریت یعنی پرشِ یک کارت (CLS) روی گوشیِ کند.

   useSyncExternalStore و نه useEffect: روی سرور و در هیدریت «other»
   است (هیچ کارتی برجسته نیست، پس ناهمخوانی نیست) و بلافاصله بعد از
   هیدریت مقدارِ واقعی را می‌گیرد. دستگاه عوض نمی‌شود، پس اشتراکی نیست.
   ───────────────────────────────────────────────────────────── */

const subscribe = () => () => {}
const readOs = (): MobileOs => detectMobileOs(navigator.userAgent || '', navigator.maxTouchPoints || 0)
const serverOs = (): MobileOs => 'other'

export function DeviceHint({ className, children }: { className: string; children: ReactNode }) {
  const os = useSyncExternalStore(subscribe, readOs, serverOs)
  return <div data-os={os} className={`group/os ${className}`}>{children}</div>
}
