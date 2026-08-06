'use client'

/* پل نشست — سه کار می‌کند:

   ۱) مهاجرت بی‌صدا: کاربرانی که توکنشان در localStorage است، بدون
      اینکه چیزی ببینند به نشست کوکی‌محور منتقل می‌شوند.

   ۲) تازه‌سازی توکن دسترسی: کوکی access فقط ۱۵ دقیقه عمر دارد، پس
      باید پیش از انقضا تمدید شود؛ وگرنه کاربری که نیم‌ساعت روی سایت
      بماند ناگهان ۴۰۱ می‌گیرد. چون بیشتر فراخوان‌ها fetch ساده‌اند و
      اینترسپتور ندارند، تمدید را «پیش‌دستانه» انجام می‌دهیم نه واکنشی.

   ۳) بازسازیِ نشست از روی کوکی: منبعِ حقیقتِ نشست کوکیِ httpOnly است،
      ولی رابط کاربر را از استورِ zustand می‌خواند که در localStorage
      می‌ماند. اگر آن پاک شود و کوکی بماند — پاک‌کردنِ دستیِ حافظه،
      تغییرِ نسخه‌ی استور، یا خرابیِ ذخیره‌سازی — کاربر با نشستِ کاملاً
      معتبر «خارج‌شده» دیده می‌شد و /dashboard/club او را به /login
      می‌فرستاد. حالا یک‌بار از سرور پرسیده می‌شود.

   این کامپوننت پس از پایان دوره‌ی گذار ساده‌تر می‌شود (بخش adopt حذف). */

import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth.store'

const DONE_KEY = 'bh_session_migrated'
/* مهر زمانی آخرین تمدید — مشترک بین همه‌ی تب‌ها */
const LAST_REFRESH_KEY = 'bh_last_refresh'
const REFRESH_EVERY_MS = 12 * 60 * 1000   // کوکی ۱۵ دقیقه‌ای، با حاشیه‌ی امن
const MIN_GAP_MS = 4 * 60 * 1000          // برای جلوگیری از تمدید پشت‌هم

/* نگهبانِ حلقه: اگر به هر دلیلی تشخیصِ تغییرِ هویت اشتباه بود، نباید
   صفحه بی‌نهایت بار بارگذاری شود. */
const RELOAD_GUARD = 'bh_identity_reload'

const readRaw = () => { try { return localStorage.getItem('auth-storage') } catch { return null } }
const legacyToken = (): string | null => {
  try { return JSON.parse(readRaw() || '{}')?.state?.token || null } catch { return null }
}
const storedUserId = (raw?: string | null): string | null => {
  try { return JSON.parse((raw ?? readRaw()) || '{}')?.state?.user?.id ?? null } catch { return null }
}

/* ── چرا بارگذاریِ کامل، نه فقط به‌روزرسانیِ استور ─────────────────────
   یک مرورگر = یک ظرفِ کوکی. پس دو تب نمی‌توانند دو حسابِ متفاوت داشته
   باشند: ورود در تبِ دوم، کوکیِ تبِ اول را هم عوض می‌کند و از آن لحظه
   نشستِ هر دو تب یکی است.

   تا امروز تبِ اول این را بی‌صدا می‌پذیرفت: استور را با کاربرِ تازه
   عوض می‌کرد ولی صفحه‌ای که روی آن نشسته بود همچنان با دادهٔ حسابِ
   قبلی رندر شده بود. نتیجه یک تبِ دورگه بود — هویتِ یکی، محتوای
   دیگری. همان چیزی که به‌نظر می‌رسید «تب خودش تبدیل به ادمین شد».

   خطرِ واقعی‌اش جهتِ عکس است: اگر روی رایانه‌ی مشترک کسی خارج شود و
   دیگری وارد، صفحهٔ رندرشده‌ی نفرِ قبلی روی صفحه می‌ماند.

   بارگذاریِ کامل تنها راهِ مطمئن است: کلِ درخت با هویتِ تازه دوباره
   ساخته می‌شود و هیچ تکه‌ی کهنه‌ای باقی نمی‌ماند. */
function reloadForIdentityChange() {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD)) return
    sessionStorage.setItem(RELOAD_GUARD, '1')
  } catch { /* حافظه در دسترس نبود — یک‌بار بارگذاری بهتر از هیچ */ }
  window.location.reload()
}

export default function SessionBridge() {
  const user = useAuthStore(s => s.user)
  const hydrated = useAuthStore(s => s._hydrated)
  const logout = useAuthStore(s => s.logout)
  const login = useAuthStore(s => s.login)

  /* ── همگام‌سازیِ کاربر با سرور، در هر بار بارگذاری ──

     دو کار با هم:

     ۱) بازسازیِ نشست وقتی استور خالی است. منبعِ حقیقتِ نشست کوکیِ
        httpOnly است، ولی رابط از استورِ zustand می‌خواند. اگر آن پاک
        شود و کوکی بماند، کاربر با نشستِ معتبر «خارج‌شده» دیده می‌شد.

     ۲) تازه‌کردنِ اطلاعاتِ کاربرِ موجود. این بخش تازه است و یک ایرادِ
        واقعی را می‌بندد: شیءِ کاربر در localStorage می‌ماند و تا امروز
        فقط لحظه‌ی *ورود* نوشته می‌شد. یعنی هر تغییری در نام، نقش یا
        عکسِ پروفایل — چه از پنلِ ادمین، چه از خودِ پروفایل، چه از
        دستگاهی دیگر — روی این دستگاه دیده نمی‌شد تا کاربر دستی خارج و
        دوباره وارد شود.

        نشانه‌اش دقیقاً همین بود: نامِ حساب روی موبایل درست و روی
        دسکتاپ قدیمی می‌ماند، فقط چون آن یکی دستگاه بعد از تغییر
        دوباره وارد شده بود.

     برای مهمان یک درخواست است که ۴۰۱ می‌گیرد و تمام. */
  useEffect(() => {
    if (!hydrated) return
    let stopped = false

    const sync = async () => {
      try {
        const r = await fetch('/api/users/profile', { credentials: 'include', cache: 'no-store' })
        if (stopped) return

        /* ── نشست تمام شده ولی صفحه هنوز کاربر را نشان می‌دهد ──
           روی رایانه‌ی مشترک یعنی محتوای حسابِ قبلی روی صفحه مانده. */
        if (r.status === 401) {
          if (useAuthStore.getState().user) reloadForIdentityChange()
          return
        }
        if (!r.ok) return

        const me = await r.json().catch(() => null)
        if (stopped || !me?.id) return

        const cur = useAuthStore.getState().user

        /* ── هویت عوض شده ──
           یعنی در تبی دیگر (یا پنجره‌ای دیگر) با حسابِ دیگری وارد
           شده‌اند و کوکیِ مشترک عوض شده. عوض‌کردنِ بی‌صدای استور یک
           تبِ دورگه می‌سازد؛ باید کلِ صفحه از نو ساخته شود. */
        if (cur && cur.id !== me.id) { reloadForIdentityChange(); return }

        /* هویت جور است ⇒ نگهبان آزاد می‌شود تا تعویضِ *بعدی* هم بتواند
           بارگذاری کند. بدونِ این، هر تب فقط یک‌بار در طولِ عمرش
           می‌فهمید حساب عوض شده. */
        try { sessionStorage.removeItem(RELOAD_GUARD) } catch { /* ignore */ }

        /* از این‌جا به بعد همان کاربر است و فقط جزئیاتش ممکن است عوض
           شده باشد — این‌جا به‌روزرسانیِ ساده کافی و درست است. */
        const same = cur
          && cur.firstName === me.firstName
          && cur.lastName === me.lastName
          && cur.primaryRole === me.primaryRole
          && (cur.avatar ?? '') === (me.avatar ?? '')
          && JSON.stringify(cur.secondaryRoles ?? []) === JSON.stringify(me.secondaryRoles ?? [])
        if (!same) login(me, '')
      } catch { /* شبکه قطع بود؛ همان چیزی که هست می‌ماند */ }
    }

    void sync()

    /* ── تبِ دیگر حساب را عوض کرد ──
       `storage` فقط در *سایر* تب‌ها شلیک می‌شود؛ یعنی دقیقاً همان تبی
       که باید بفهمد. بدونِ این، تبِ اول تا اولین ناوبری چیزی نمی‌فهمید
       — و همان چند دقیقه‌ی «تبِ دورگه» بود. */
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'auth-storage') return
      const next = storedUserId(e.newValue)
      const cur = useAuthStore.getState().user?.id ?? null
      if (next !== cur) reloadForIdentityChange()
    }

    /* ── برگشت از حافظه‌ی پشت/جلو ──
       مرورگر صفحه را عیناً از کش برمی‌گرداند؛ هیچ کدی دوباره اجرا
       نمی‌شود. اگر بین رفتن و برگشتن حساب عوض شده باشد، دقیقاً همان
       صفحه‌ی حسابِ قبلی برمی‌گردد. همین بود که با زدنِ «بازگشت» دیده
       شد. */
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) void sync() }

    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onShow)
    return () => {
      stopped = true
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onShow)
    }
    /* عمداً فقط به `hydrated` وابسته است: افزودنِ `user` این افکت را
       بعد از هر به‌روزرسانی دوباره اجرا می‌کرد و حلقه می‌ساخت.
       مقدارِ تازه‌ی کاربر از `getState()` خوانده می‌شود، نه از closure. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    let stopped = false
    let last = 0

    /* ── مهاجرت ── */
    const adopt = async () => {
      try {
        if (localStorage.getItem(DONE_KEY)) return
        const token = legacyToken()
        if (!token) return

        const r = await fetch('/api/auth/adopt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        })
        if (stopped) return

        if (r.ok) {
          localStorage.setItem(DONE_KEY, String(Date.now()))
          /* توکن از localStorage برداشته می‌شود؛ خود کاربر (نام/نقش)
             برای نمایش می‌ماند. از این پس کوکی منبع حقیقت است. */
          try {
            const parsed = JSON.parse(readRaw() || '{}')
            if (parsed?.state) {
              delete parsed.state.token
              localStorage.setItem('auth-storage', JSON.stringify(parsed))
            }
          } catch { /* ignore */ }
        } else if (r.status === 401) {
          localStorage.setItem(DONE_KEY, 'invalid')
        }
      } catch { /* شبکه قطع بود؛ دفعه‌ی بعد */ }
    }

    /* ── تمدید ──

       مهر زمانی در localStorage است، نه فقط در متغیر محلی. رفرش‌توکن با
       هر استفاده می‌چرخد، پس اگر دو تب هم‌زمان تمدید کنند، تب دوم توکنِ
       دیگر بی‌اعتبار را می‌فرستد و سرور آن را «سرقت» می‌بیند.

       متغیر محلی فقط داخل یک تب کار می‌کند و همین باعث می‌شد کاربری که
       دو تب باز دارد از حساب خودش بیرون بیفتد. localStorage بین تب‌ها
       مشترک است و همان یک محافظ را سراسری می‌کند. (سمت سرور هم پنجره‌ی
       مهلت گذاشته شد تا اگر باز هم مسابقه‌ای رخ داد، نشست باطل نشود.) */
    const readLast = (): number => {
      try { return Number(localStorage.getItem(LAST_REFRESH_KEY)) || 0 } catch { return last }
    }
    const writeLast = (t: number) => {
      last = t
      try { localStorage.setItem(LAST_REFRESH_KEY, String(t)) } catch { /* ignore */ }
    }

    const refresh = async () => {
      if (stopped || !user) return
      if (Date.now() - Math.max(last, readLast()) < MIN_GAP_MS) return
      writeLast(Date.now())
      try {
        const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
        if (stopped || r.ok || r.status === 503) return
        if (r.status === 401) {
          /* اگر هنوز توکن قدیمی داریم، هدر کار می‌کند و نباید کاربر را
             بیرون بیندازیم. در غیر این صورت نشست واقعاً تمام شده است. */
          if (legacyToken()) return
          logout()
          try { localStorage.removeItem(DONE_KEY) } catch { /* ignore */ }
        }
      } catch { /* بی‌صدا */ }
    }

    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }

    ;(async () => { await adopt(); await refresh() })()
    const timer = setInterval(refresh, REFRESH_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [hydrated, user, logout])

  return null
}
