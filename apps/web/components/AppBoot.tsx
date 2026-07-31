'use client'
import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'
import { enablePush, pushPermission } from '../lib/push-client'
import { useSocialInteractions } from './features/FeatureFlags'

/* راه‌اندازی سراسری: ثبت Service Worker، نگه‌داری اشتراک پوش، و آپدیت خودکار
   نسخه‌ی کهنه‌ی PWA (روی iOS اپ گرم بعد از دیپلوی کد قدیمی را نگه می‌دارد). */
export default function AppBoot() {
  const { user } = useAuthStore()
  const interactionsOn = useSocialInteractions()

  // SW را همه‌جا ثبت کن (پوش به آن نیاز دارد)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  /* اگر کاربر لاگین است و مجوز داده، اشتراک پوش را زنده نگه دار (از هر صفحه‌ای).

     با خاموش‌بودن تعاملات اجتماعی این کار بی‌مورد است: امروز تنها
     فرستنده‌ی پوش، پیام دایرکت است و آن مسیر بسته است. اشتراک‌های
     ذخیره‌شده حذف نمی‌شوند — فقط تازه نمی‌شوند — پس با روشن‌شدن دوباره‌ی
     پرچم همه‌چیز سر جایش است. */
  useEffect(() => {
    if (!user || !interactionsOn) return
    if (pushPermission() === 'granted') {
      const key = user.phone || user.id || (user.firstName ?? 'user')
      enablePush(key, true)
    }
  }, [user, interactionsOn])

  // آپدیت خودکار: هر بار اپ visible/focus شد، نسخه‌ی سرور را چک کن؛ اگر فرق داشت reload
  useEffect(() => {
    const check = async () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        const { sha } = await r.json()
        const mine = process.env.NEXT_PUBLIC_BUILD_SHA
        if (!sha || !mine || sha === 'dev' || mine === 'dev' || sha === mine) return
        if (sessionStorage.getItem('bh-reloaded-for') === sha) return   // فقط یک‌بار برای هر نسخه
        sessionStorage.setItem('bh-reloaded-for', sha)
        location.reload()
      } catch { /* آفلاین ⇒ بی‌خیال */ }
    }
    check()
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  return null
}
