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

  /* ── تورِ ایمنیِ chunkِ گمشده ──
     بررسیِ نسخه فقط وقتی اجرا می‌شود که صفحه visible یا focus شود.
     ولی کاربری که تبِ باز و کهنه دارد ممکن است پیش از آن روی لینکی
     بزند؛ آن‌جا Next دنبالِ فایلی می‌گردد که با دیپلویِ تازه دیگر
     وجود ندارد، import شکست می‌خورد، و چون داخلِ رندر نیست هیچ
     مرزِ خطایی نمی‌گیردش — صفحه سفید می‌ماند.

     همان‌جا یک‌بار reload می‌کنیم.

     ── چرا نگهبان به نسخه گره خورده، نه به «یک‌بار برای همیشه» ──
     نسخه‌ی اول یک پرچمِ ساده‌ی `'1'` می‌گذاشت و هرگز پاکش نمی‌کرد.
     یعنی هر تب فقط **یک‌بار در تمامِ عمرش** بازیابی می‌شد. شبی که سه
     دیپلوی پشتِ‌هم رفت، همان یک شانس در دیپلویِ اول سوخت و
     دیپلوی‌های بعدی صفحه‌ی سفیدی دادند که دیگر خودش را درست
     نمی‌کرد — کاربر روی هر لینکی می‌زد سفید می‌ماند.

     حالا کلید شناسه‌ی همین build است: هر نسخه یک بازیابی می‌گیرد.
     حلقه هم ممکن نیست، چون بعد از reload شناسه عوض می‌شود و اگر
     بازهم بشکند دیگر برای آن نسخه تلاش نمی‌کند. */
  useEffect(() => {
    const STALE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported|Importing a module script failed|error loading dynamically imported module/i
    const KEY = 'bh-chunk-reload'
    const mine = process.env.NEXT_PUBLIC_BUILD_SHA || 'dev'
    const recover = (msg: string) => {
      if (!STALE.test(msg)) return
      if (sessionStorage.getItem(KEY) === mine) return
      /* این یکی بازیابیِ خرابیِ واقعی است، ولی باز هم نباید فرمِ
         نیمه‌پرشده را ببلعد. */
      if (isMidTask()) return
      sessionStorage.setItem(KEY, mine)
      location.reload()
    }
    const onErr = (e: ErrorEvent) => recover(String(e?.message ?? ''))
    const onRej = (e: PromiseRejectionEvent) => {
      const r = e?.reason as { name?: string; message?: string } | undefined
      recover(`${r?.name ?? ''} ${r?.message ?? String(r ?? '')}`)
    }
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    return () => {
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
    }
  }, [])

  /* آیا کاربر وسطِ کاری است؟ اگر بله، بازبارگذاری صبر می‌کند. */
  const isMidTask = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true
    if (el?.isContentEditable) return true
    /* فرمی که کاربر شروع به پرکردنش کرده — حتی اگر همین حالا فوکوس
       جای دیگری باشد.  و  حساب نمی‌شوند چون
       مقدارِ پیش‌فرض دارند. */
    const filled = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'form input:not([type=hidden]):not([type=checkbox]):not([type=radio]), form textarea',
    )
    for (const f of filled) if (f.value && f.value.trim()) return true
    return false
  }

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

        /* ── چرا وسطِ کار بازبارگذاری نمی‌کنیم ──
           این بازبارگذاری برای رفعِ صفحه‌ی سفید است، ولی خودش می‌تواند
           بدترین کار را بکند: کاربری که وسطِ ثبتِ فروشگاه یا آگهی است،
           فرمش را از دست می‌دهد و حس می‌کند «پرت شده بیرون».

           پس اگر چیزی در حالِ نوشتن است — فوکوس روی ورودی، یا فرمی که
           مقدارِ پرشده دارد — صبر می‌کنیم. نسخه‌ی تازه در بازدیدِ بعدی
           می‌آید و هیچ‌چیز از دست نمی‌رود. */
        if (isMidTask()) return

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
