'use client'

/* پل نشست — سه کار می‌کند:

   ۱) مهاجرت بی‌صدا: کاربرانی که توکنشان در localStorage است، بدون
      اینکه چیزی ببینند به نشست کوکی‌محور منتقل می‌شوند.

   ۲) تازه‌سازی توکن دسترسی: کوکی access فقط ۱۵ دقیقه عمر دارد، پس
      باید پیش از انقضا تمدید شود؛ وگرنه کاربری که نیم‌ساعت روی سایت
      بماند ناگهان ۴۰۱ می‌گیرد. چون بیشتر فراخوان‌ها fetch ساده‌اند و
      اینترسپتور ندارند، تمدید را «پیش‌دستانه» انجام می‌دهیم نه واکنشی.

   ۳) بازسازی نشست از روی کوکی: منبع حقیقت نشست کوکی httpOnly است،
      ولی رابط کاربر را از استور zustand می‌خواند که در localStorage
      می‌ماند. اگر آن پاک شود و کوکی بماند — پاک‌کردن دستی حافظه،
      تغییر نسخه‌ی استور، یا خرابی ذخیره‌سازی — کاربر با نشست کاملا
      معتبر «خارج‌شده» دیده می‌شد و /dashboard/club او را به /login
      می‌فرستاد. حالا یک‌بار از سرور پرسیده می‌شود.

   این کامپوننت پس از پایان دوره‌ی گذار ساده‌تر می‌شود (بخش adopt حذف). */

import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { refreshSession, readLastRefresh } from '../../lib/auth/refresh-client'

const DONE_KEY = 'bh_session_migrated'
const REFRESH_EVERY_MS = 12 * 60 * 1000   // کوکی ۱۵ دقیقه‌ای، با حاشیه‌ی امن
const MIN_GAP_MS = 4 * 60 * 1000          // برای جلوگیری از تمدید پشت‌هم

/* نگهبان حلقه: اگر به هر دلیلی تشخیص تغییر هویت اشتباه بود، نباید
   صفحه بی‌نهایت بار بارگذاری شود. */
const RELOAD_GUARD = 'bh_identity_reload'

/* ── تمدید: یک درخواست در هر لحظه، مشترک بین همه‌ی مسیرها ──
   دو جا تمدید می‌خواستند: زمان‌سنج دوره‌ای و مسیر ۴۰۱ پایین — و از
   وقتی `apiFetch` هم روی ۴۰۱ تمدید می‌کند، سه‌جا. حالا هر سه از یک
   تابع مشترک می‌گذرند تا دو تمدید موازی رخ ندهد؛ چرایی‌اش در
   `lib/auth/refresh-client.ts` نوشته شده.

   ⚠️ نسخه‌ی اول این کار، مسیر ۴۰۱ را هم پشت همان فاصله‌ی چهار
   دقیقه‌ای زمان‌سنج گذاشت. نتیجه‌اش یک وارونگی کامل بود: زمان‌سنج در
   همان لحظه‌ی بارگذاری مهر را می‌زند (اثر دوم همین کامپوننت، پیش از
   رسیدن پاسخ پروفایل)، پس وقتی ۴۰۱ می‌رسید فاصله همیشه کمتر از
   چهار دقیقه بود، تمدید *رد می‌شد* و کد مستقیم به `logout` می‌رسید —
   یعنی دقیقا کاربر سالمی که فقط کوکی ۱۵ دقیقه‌ایش منقضی شده بود
   بیرون انداخته می‌شد.

   حالا فاصله فقط زمان‌سنج را عقب نگه می‌دارد. */

const readRaw = () => { try { return localStorage.getItem('auth-storage') } catch { return null } }
const legacyToken = (): string | null => {
  try { return JSON.parse(readRaw() || '{}')?.state?.token || null } catch { return null }
}
const storedUserId = (raw?: string | null): string | null => {
  try { return JSON.parse((raw ?? readRaw()) || '{}')?.state?.user?.id ?? null } catch { return null }
}

/* ── چرا بارگذاری کامل، نه فقط به‌روزرسانی استور ─────────────────────
   یک مرورگر = یک ظرف کوکی. پس دو تب نمی‌توانند دو حساب متفاوت داشته
   باشند: ورود در تب دوم، کوکی تب اول را هم عوض می‌کند و از آن لحظه
   نشست هر دو تب یکی است.

   تا امروز تب اول این را بی‌صدا می‌پذیرفت: استور را با کاربر تازه
   عوض می‌کرد ولی صفحه‌ای که روی آن نشسته بود همچنان با دادهٔ حساب
   قبلی رندر شده بود. نتیجه یک تب دورگه بود — هویت یکی، محتوای
   دیگری. همان چیزی که به‌نظر می‌رسید «تب خودش تبدیل به ادمین شد».

   خطر واقعی‌اش جهت عکس است: اگر روی رایانه‌ی مشترک کسی خارج شود و
   دیگری وارد، صفحهٔ رندرشده‌ی نفر قبلی روی صفحه می‌ماند.

   بارگذاری کامل تنها راه مطمئن است: کل درخت با هویت تازه دوباره
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

  /* ── همگام‌سازی کاربر با سرور، در هر بار بارگذاری ──

     دو کار با هم:

     ۱) بازسازی نشست وقتی استور خالی است. منبع حقیقت نشست کوکی
        httpOnly است، ولی رابط از استور zustand می‌خواند. اگر آن پاک
        شود و کوکی بماند، کاربر با نشست معتبر «خارج‌شده» دیده می‌شد.

     ۲) تازه‌کردن اطلاعات کاربر موجود. این بخش تازه است و یک ایراد
        واقعی را می‌بندد: شیء کاربر در localStorage می‌ماند و تا امروز
        فقط لحظه‌ی *ورود* نوشته می‌شد. یعنی هر تغییری در نام، نقش یا
        عکس پروفایل — چه از پنل ادمین، چه از خود پروفایل، چه از
        دستگاهی دیگر — روی این دستگاه دیده نمی‌شد تا کاربر دستی خارج و
        دوباره وارد شود.

        نشانه‌اش دقیقا همین بود: نام حساب روی موبایل درست و روی
        دسکتاپ قدیمی می‌ماند، فقط چون آن یکی دستگاه بعد از تغییر
        دوباره وارد شده بود.

     برای مهمان یک درخواست است که ۴۰۱ می‌گیرد و تمام. */
  useEffect(() => {
    if (!hydrated) return
    let stopped = false

    const sync = async () => {
      try {
        let r = await fetch('/api/users/profile', { credentials: 'include', cache: 'no-store' })
        if (stopped) return

        /* ── ۴۰۱ همیشه یعنی «بیرون» نیست ──
           کوکی دسترسی فقط ۱۵ دقیقه عمر دارد و رفرش‌توکن جدا و
           بلندعمرتر است. کاربری که تبش را نیم‌ساعت باز گذاشته این‌جا
           ۴۰۱ می‌گیرد در حالی که نشستش کاملا سالم است — همان حالتی که
           میدل‌ور هم عمدا ردش می‌کند. پس پیش از هر قضاوتی تمدید. */
        if (r.status === 401) {
          /* توکن قدیمی هدرمحور رفرش‌کوکی ندارد؛ درخواست تمدیدش فقط
             ۴۰۱ می‌گیرد و کوکی‌ها را پاک می‌کند. پیش از تمدید کنار
             گذاشته می‌شود، نه بعدش. */
          if (legacyToken()) return

          /* اگر همین چند لحظه پیش تمدید موفقی انجام شده، دوباره
             تمدید نمی‌کنیم — همان پاسخ کهنه را دور می‌ریزیم و فقط
             دوباره می‌پرسیم. */
          const justRenewed = Date.now() - readLastRefresh() < 30_000
          const res = justRenewed ? { ok: true, status: 200 } : await refreshSession()
          if (stopped) return

          if (res.ok) {
            r = await fetch('/api/users/profile', { credentials: 'include', cache: 'no-store' })
            if (stopped) return
          } else if (res.status !== 401) {
            /* ۵۰۳ («انبار نشست در دسترس نیست») یا خطای شبکه. سرور
               نگفته نشست باطل است، پس ما هم قضاوت نمی‌کنیم — همان
               قاعده‌ای که مسیر تمدید دوره‌ای رعایت می‌کند. */
            return
          }
        }

        /* ── نشست واقعا تمام شده ──
           تا امروز این‌جا فقط یک `reload` بود و کاربر کهنه در
           localStorage دست‌نخورده می‌ماند. نتیجه‌اش بن‌بست بود:
           میدل‌ور کوکی معتبر نمی‌دید و به `/login` می‌فرستاد، صفحه‌ی
           ورود هم چون `user` را می‌دید `null` رندر می‌کرد و دوباره به
           داشبورد برمی‌گرداند. کاربر روی هر لینک محافظت‌شده صفحه‌ی
           سفید بی‌واکنش می‌گرفت — و چون کاربر کهنه پاک نمی‌شد، با
           رفرش هم درست نمی‌شد؛ فقط پاک‌کردن دستی حافظه‌ی سایت.

           پاک‌کردن کاربر همان کاری را هم می‌کند که `reload` برایش
           بود (محتوای حساب قبلی روی رایانه‌ی مشترک نمی‌ماند)، ولی
           بن‌بست نمی‌سازد: نگهبان‌ها کاربر خالی را می‌بینند و صفحه‌ی
           ورود واقعی می‌آید. */
        if (r.status === 401) {
          if (useAuthStore.getState().user) logout()
          return
        }
        if (!r.ok) return

        const me = await r.json().catch(() => null)
        if (stopped || !me?.id) return

        const cur = useAuthStore.getState().user

        /* ── هویت عوض شده ──
           یعنی در تبی دیگر (یا پنجره‌ای دیگر) با حساب دیگری وارد
           شده‌اند و کوکی مشترک عوض شده. عوض‌کردن بی‌صدای استور یک
           تب دورگه می‌سازد؛ باید کل صفحه از نو ساخته شود. */
        if (cur && cur.id !== me.id) { reloadForIdentityChange(); return }

        /* هویت جور است ⇒ نگهبان آزاد می‌شود تا تعویض *بعدی* هم بتواند
           بارگذاری کند. بدون این، هر تب فقط یک‌بار در طول عمرش
           می‌فهمید حساب عوض شده. */
        try { sessionStorage.removeItem(RELOAD_GUARD) } catch { /* ignore */ }

        /* از این‌جا به بعد همان کاربر است و فقط جزئیاتش ممکن است عوض
           شده باشد — این‌جا به‌روزرسانی ساده کافی و درست است. */
        const same = cur
          && cur.firstName === me.firstName
          && cur.lastName === me.lastName
          && cur.primaryRole === me.primaryRole
          && (cur.avatar ?? '') === (me.avatar ?? '')
          && JSON.stringify(cur.secondaryRoles ?? []) === JSON.stringify(me.secondaryRoles ?? [])
        if (!same) login(me, '')
      } catch { /* شبکه قطع بود؛ همان چیزی که هست می‌ماند */ }
      finally {
        /* ── چرا حتی در خطا هم علامت می‌خورد ──
           صفحه‌هایی که منتظر این پرچم‌اند، تا نیامدنش لودر نشان
           می‌دهند. اگر شبکه قطع باشد و این‌جا علامت نخورد، آن صفحه‌ها
           برای همیشه در حال بارگذاری می‌مانند — که از پیام اشتباه هم
           بدتر است. */
        if (!stopped) useAuthStore.getState().setAuthChecked()
      }
    }

    void sync()

    /* ── تب دیگر حساب را عوض کرد ──
       `storage` فقط در *سایر* تب‌ها شلیک می‌شود؛ یعنی دقیقا همان تبی
       که باید بفهمد. بدون این، تب اول تا اولین ناوبری چیزی نمی‌فهمید
       — و همان چند دقیقه‌ی «تب دورگه» بود. */
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'auth-storage') return
      const next = storedUserId(e.newValue)
      const cur = useAuthStore.getState().user?.id ?? null
      if (next !== cur) reloadForIdentityChange()
    }

    /* ── برگشت از حافظه‌ی پشت/جلو ──
       مرورگر صفحه را عینا از کش برمی‌گرداند؛ هیچ کدی دوباره اجرا
       نمی‌شود. اگر بین رفتن و برگشتن حساب عوض شده باشد، دقیقا همان
       صفحه‌ی حساب قبلی برمی‌گردد. همین بود که با زدن «بازگشت» دیده
       شد. */
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) void sync() }

    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onShow)
    return () => {
      stopped = true
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onShow)
    }
    /* عمدا فقط به `hydrated` وابسته است: افزودن `user` این افکت را
       بعد از هر به‌روزرسانی دوباره اجرا می‌کرد و حلقه می‌ساخت.
       مقدار تازه‌ی کاربر از `getState()` خوانده می‌شود، نه از closure. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    let stopped = false

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

    /* ── تمدید دوره‌ای ──

       مهر زمانی در localStorage است، نه فقط در متغیر محلی: دو تب باز
       نباید هرکدام جداگانه تمدید کنند. متغیر محلی فقط داخل یک تب کار
       می‌کرد و همین باعث می‌شد کاربری که دو تب باز دارد از حساب خودش
       بیرون بیفتد.

       این فاصله فقط *این* مسیر را عقب نگه می‌دارد. بازیابی ۴۰۱ بالا
       عمدا از آن رد نمی‌شود؛ آن‌جا هم‌زمانی با `inflight` حل شده. */
    const refresh = async () => {
      if (stopped || !user) return
      if (Date.now() - readLastRefresh() < MIN_GAP_MS) return
      const { ok, status } = await refreshSession()
      /* `status: 0` یعنی شبکه نبود و ۵۰۳ یعنی انبار نشست موقتا بالا
         نیست — هیچ‌کدام «نشست باطل است» نیستند. */
      if (stopped || ok || status === 503 || status === 0) return
      if (status === 401) {
        /* اگر هنوز توکن قدیمی داریم، هدر کار می‌کند و نباید کاربر را
           بیرون بیندازیم. در غیر این صورت نشست واقعا تمام شده است. */
        if (legacyToken()) return
        logout()
        try { localStorage.removeItem(DONE_KEY) } catch { /* ignore */ }
      }
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
