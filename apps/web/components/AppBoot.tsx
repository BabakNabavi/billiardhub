'use client'
import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'
import { refreshIdle } from '../lib/auth/refresh-client'
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

  /* ── تور ایمنی chunk گمشده ──
     بررسی نسخه فقط وقتی اجرا می‌شود که صفحه visible یا focus شود.
     ولی کاربری که تب باز و کهنه دارد ممکن است پیش از آن روی لینکی
     بزند؛ آن‌جا Next دنبال فایلی می‌گردد که با دیپلوی تازه دیگر
     وجود ندارد، import شکست می‌خورد، و چون داخل رندر نیست هیچ
     مرز خطایی نمی‌گیردش — صفحه سفید می‌ماند.

     همان‌جا یک‌بار reload می‌کنیم.

     ── چرا نگهبان به نسخه گره خورده، نه به «یک‌بار برای همیشه» ──
     نسخه‌ی اول یک پرچم ساده‌ی `'1'` می‌گذاشت و هرگز پاکش نمی‌کرد.
     یعنی هر تب فقط **یک‌بار در تمام عمرش** بازیابی می‌شد. شبی که سه
     دیپلوی پشت‌هم رفت، همان یک شانس در دیپلوی اول سوخت و
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
      /* این یکی بازیابی خرابی واقعی است، ولی باز هم نباید فرم
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

  /* آیا کاربر وسط کاری است؟ اگر بله، بازبارگذاری صبر می‌کند. */
  const isMidTask = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true
    if (el?.isContentEditable) return true
    /* فرمی که کاربر شروع به پرکردنش کرده — حتی اگر همین حالا فوکوس
       جای دیگری باشد.  و  حساب نمی‌شوند چون
       مقدار پیش‌فرض دارند.
       ⚠️ نه فقط داخلِ <form>: نوشتنِ دایرکت (app/direct) ورودیِ بی‌فرم
       است و با بازبارگذاری پس از برگشت به اپ پیش‌نویسش می‌رفت. */
    const filled = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      /* range/color/file همیشه مقدار دارند (نوارِ صدای پخشِ زنده) و «وسطِ کار» نیستند */
      'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=search]):not([type=range]):not([type=color]):not([type=file]):not([readonly]):not([disabled]):not([data-volatile]), textarea:not([readonly]):not([disabled]):not([data-volatile])',
    )
    for (const f of filled) if (f.value && f.value.trim()) return true
    return false
  }

  /* ── داده‌ی تازه پس از برگشت به اپ ──
     گزارشِ مالک (آبانِ ۱۴۰۵): کاربری باشگاه ساخت؛ در کروم و سافاری دیده
     می‌شد، در اپِ نصب‌شده روی صفحه‌ی اصلی نه.

     اپِ نصب‌شده بسته نمی‌شود، فقط به پس‌زمینه می‌رود. برگشتن به آن
     ناوبری نیست: همان صفحه با همان داده‌ای که ساعت‌ها پیش گرفته بود
     دوباره دیده می‌شود. فهرست‌ها داده را در mount می‌گیرند و صفحه‌ی
     اصلی داده را از HTMLِ سرور دارد، پس هیچ‌کدام خودبه‌خود تازه
     نمی‌شوند. در مرورگر، تایپِ نشانی بارگذاریِ تازه است و همین تفاوت
     را می‌سازد.

     یک قاعده برای همه‌ی صفحه‌ها، نه وصله در هر فهرست: پس از سه دقیقه
     غیبت اپِ نصب‌شده، و سی دقیقه غیبتِ تبِ مرورگر، صفحه بازبارگذاری
     می‌شود. (`router.refresh` کافی نبود: فهرست‌ها کلاینتی‌اند و
     HomeClient دادهٔ سرور را در state کپی می‌کند، پس چیزی عوض نمی‌شد.)

     هر بازبارگذاری — این یا نسخه‌ی تازه — از یک مسیر می‌گذرد:
       · فقط پس از پاسخِ موفقِ `/api/version`. بی‌شبکه، اپِ نصب‌شده
         صفحه‌ی «باز نمی‌شود» می‌گیرد، بی‌نوارِ مرورگر و بی‌راهِ برگشت —
         صفحه‌ی کهنه از آن بهتر است.
       · پس از پایانِ تمدیدِ نشست (`refreshIdle`). SessionBridge روی همین
         visibilitychange تمدید می‌کند؛ بریدنِ آن درخواست کاربر را بیرون
         می‌اندازد (lib/auth/refresh-client).
       · فرمِ نیمه‌پر و ویدیویی که پیش از رفتن پخش می‌شد (iOS در
         پس‌زمینه مکثش می‌کند، پس لحظه‌ی رفتن سنجیده می‌شود) دست نمی‌خورند.
       · حداکثر یک بار برای هر برگشت. */
  useEffect(() => {
    const STANDALONE_AWAY_MS = 3 * 60_000
    const TAB_AWAY_MS = 30 * 60_000
    const standalone = () =>
      window.matchMedia?.('(display-mode: standalone)').matches === true
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    const playing = () =>
      Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio')).some(m => !m.paused && !m.ended)

    /* اجرای سردِ اپِ نصب‌شده: صفحه‌ی اصلی ISR است و سرآیندش
       `stale-while-revalidate`ِ یک‌ساله دارد که WebKit ممکن است در کشِ
       خودش هم اعمال کند — سندِ کهنه بی‌تماس با سرور. `transferSize === 0`
       همین را می‌گوید. ⚠️ نمی‌دانم WebKit این عدد را در حالتِ نصب‌شده
       درست پر می‌کند یا نه: اگر نکند این شرط هیچ‌وقت روشن نمی‌شود، و اگر
       همیشه ۰ بدهد هر اجرای سرد یک بازبارگذاریِ ۳۰۴ِ ارزان دارد. نوعِ
       reload دوباره روشنش نمی‌کند، پس حلقه ممکن نیست. */
    const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined
    let coldStale = standalone() && !!nav && nav.type !== 'reload'
      && nav.transferSize === 0 && nav.decodedBodySize > 0

    let hiddenAt = 0, wasPlaying = false, busy = false

    const check = async () => {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible' || busy) return
      busy = true
      const away = hiddenAt ? Date.now() - hiddenAt : 0
      const played = wasPlaying
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        if (!r.ok) return
        /* غیبت فقط پس از پاسخِ موفق پاک می‌شود — بی‌شبکه، focus یا برگشتِ
           بعدی دوباره امتحان می‌کند */
        hiddenAt = 0; wasPlaying = false
        const { sha } = await r.json() as { sha?: string }
        const mine = process.env.NEXT_PUBLIC_BUILD_SHA
        let seen: string | null = null
        try { seen = sessionStorage.getItem('bh-reloaded-for') } catch { /* حافظه‌ی نشست در دسترس نیست */ }
        const newBuild = !!sha && !!mine && sha !== 'dev' && mine !== 'dev' && sha !== mine
          && seen !== sha   // فقط یک‌بار برای هر نسخه
        const stale = coldStale
          || (!played && away >= (standalone() ? STANDALONE_AWAY_MS : TAB_AWAY_MS))
        coldStale = false
        if (!newBuild && !stale) return

        /* ── چرا وسط کار بازبارگذاری نمی‌کنیم ──
           این بازبارگذاری برای رفع صفحه‌ی سفید است، ولی خودش می‌تواند
           بدترین کار را بکند: کاربری که وسط ثبت فروشگاه یا آگهی است،
           فرمش را از دست می‌دهد و حس می‌کند «پرت شده بیرون».

           پس اگر چیزی در حال نوشتن است — فوکوس روی ورودی، یا فرمی که
           مقدار پرشده دارد — صبر می‌کنیم. نسخه‌ی تازه در بازدید بعدی
           می‌آید و هیچ‌چیز از دست نمی‌رود. */
        if (isMidTask()) return

        /* تمدید و همگام‌سازیِ SessionBridge روی همین رویداد شروع شده‌اند
           (پیش از رفت‌وبرگشتِ /api/version)؛ تا پایانشان */
        await refreshIdle()
        if (isMidTask()) return
        if (newBuild && sha) {
          try { sessionStorage.setItem('bh-reloaded-for', sha) } catch { /* حافظه‌ی نشست در دسترس نیست */ }
        }
        location.reload()
      } catch { /* آفلاین ⇒ بی‌خیال، صفحه‌ی فعلی می‌ماند */ } finally { busy = false }
    }
    const onVis = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); wasPlaying = playing(); return }
      void check()
    }
    void check()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', check)
    }
  }, [])

  return null
}
