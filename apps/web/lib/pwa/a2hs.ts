/* ─────────────────────────────────────────────────────────────
   منطق راهنمای «افزودن به صفحه‌ی اصلی» (Add to Home Screen) — iOS

   این فایل عمداً هیچ Reactای، هیچ DOMای و هیچ side-effectای در سطح
   ماژول ندارد. همه‌ی ورودی‌ها از بیرون تزریق می‌شوند (`A2hsEnv`) تا
   بشود بدون مرورگر و بدون شبیه‌ساز دستگاه، با UAهای واقعی تستش کرد.

   جدایی منطق از UI عمدی است: تصمیم «نشان بده یا نه» چیزی است که باید
   اثبات‌پذیر باشد، نه چیزی که فقط روی یک آیفون واقعی معلوم شود.
   ───────────────────────────────────────────────────────────── */

/** کلید localStorage — با پیشوند `bh_` مثل بقیه‌ی کلیدهای پروژه.
 *
 *  شماره‌ی نسخه عمدی است. سیاست سکوت که عوض شود، وضعیت ذخیره‌شده‌ی
 *  قدیمی دیگر معنای همان را نمی‌دهد: کسی که با نسخه‌ی قبلی «بعداً» زده
 *  بود، یک هفته سکوت خریده بود؛ حالا آن یک هفته باید دو روز باشد.
 *
 *  بالا بردن نسخه یعنی یک‌بار برای همه از صفر شروع می‌شود. این تنها
 *  راه بیرون آمدن از سکوتی است که با قواعد قدیمی نوشته شده — کاربری که
 *  یک‌بار پنجره را بست، وگرنه تا ماه‌ها دیگر آن را نمی‌دید. */
export const A2HS_STORAGE_KEY = 'bh_a2hs_ios_v2'

const DAY = 24 * 60 * 60 * 1000

export const A2HS_CONFIG = {
  /** تأخیر پس از ورود به صفحه — کاربر اول باید صفحه را ببیند، نه پاپ‌آپ را */
  showDelayMs: 1600,
  /** «متوجه شدم» ⇒ دو روز سکوت.
   *
   *  تنها دکمه‌ی تصمیم‌گیرنده همین است. «بعداً» حذف شد چون دو دکمه با دو
   *  مدت سکوت متفاوت، هم انتخاب را سخت می‌کرد هم رفتار را غیرقابل‌پیش‌بینی.
   *  حالا یک دکمه و یک عدد: هر دو روز یک یادآوری، تا وقتی کاربر نصب کند. */
  gotItCooldownMs: 2 * DAY,
  /** بستن با × یا کلیک روی پس‌زمینه ⇒ فقط تا پایان همین بازدید.
   *
   *  پس‌زمینه کل صفحه را می‌پوشاند، پس یک لمس اتفاقی نباید به‌اندازه‌ی یک
   *  تصمیم آگاهانه وزن داشته باشد. */
  dismissCooldownMs: 0,
  /* سقف تعداد نمایش عمداً حذف شد: با سکوت دوروزه، «سقف» هم دقیقاً همان
     دو روز می‌شد و هیچ اثر جداگانه‌ای نداشت.

     نتیجه‌اش این است که راهنما هر دو روز یک‌بار برمی‌گردد و تا نصب‌شدن
     اپ متوقف نمی‌شود — همان چیزی که خواسته شده. تنها چیزی که برای همیشه
     خاموشش می‌کند، خودِ نصب است (تشخیص standalone). */
  /** مسیرهایی که کاربر وسط کار حساس است و نباید مزاحمش شد */
  mutedRoutes: ['/login', '/register', '/forgot-password', '/direct', '/admin'] as const,
} as const

/* ── تشخیص دستگاه ───────────────────────────────────────────── */

export type IosDevice = 'iphone' | 'ipad' | null

/**
 * تشخیص iOS.
 *
 * فقط UA کافی نیست: iPadOS ۱۳ به بعد خودش را «Macintosh» معرفی می‌کند و
 * از یک مک واقعی قابل تفکیک نیست — مگر با یک نشانه‌ی واقعی سخت‌افزاری.
 * `maxTouchPoints` همان نشانه است: مک دسکتاپ صفحه‌ی لمسی ندارد (۰)،
 * آیپد دارد (۵).
 */
export function detectIosDevice(ua: string, maxTouchPoints: number): IosDevice {
  if (/iPhone|iPod/.test(ua)) return 'iphone'
  if (/iPad/.test(ua)) return 'ipad'
  if (/Mac(intosh| OS X)/.test(ua) && maxTouchPoints > 1) return 'ipad'
  return null
}

/* مرورگرهای غیر سافاری روی iOS و وب‌ویوهای درون‌برنامه‌ای.
   همه‌ی این‌ها روی iOS موتور WebKit دارند، پس رشته‌ی «Safari» در UAشان
   هست — یعنی تشخیص مثبت (`/Safari/`) بی‌فایده است و باید فهرست منفی
   داشت. در هیچ‌کدام این‌ها منوی Share گزینه‌ی افزودن به صفحه‌ی اصلی
   ندارد، پس نمایش راهنما فقط کاربر را سردرگم می‌کند. */
const NON_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|GSA\/|Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|MicroMessenger|Snapchat|Pinterest|TikTok|Bytedance/

export type SafariConfidence = 'no' | 'likely' | 'yes'

/**
 * «سافاری هست؟» — با اطمینان درجه‌بندی‌شده، نه یک بول شکننده.
 *
 * `navigator.standalone` یک ویژگی اختصاصی WebKit سافاری iOS است و در
 * هیچ مرورگر دیگری تعریف نشده. **بودنش** تأیید قطعی است؛ **نبودنش**
 * رد نیست (ممکن است نسخه‌ای در آینده حذفش کند) — در آن حالت به `likely`
 * بسنده می‌کنیم و باز هم نشان می‌دهیم. این همان «رفتار امن» است:
 * شکست تشخیص به «مخفی‌شدن همیشگی» منجر نمی‌شود.
 */
export function safariConfidence(ua: string, standaloneFlag: unknown): SafariConfidence {
  if (NON_SAFARI.test(ua)) return 'no'
  return typeof standaloneFlag === 'boolean' ? 'yes' : 'likely'
}

/* ── وضعیت ذخیره‌شده ────────────────────────────────────────── */

/* `later` دیگر تولید نمی‌شود (دکمه‌اش حذف شد) ولی در نوع می‌ماند: هر
   مرورگری که با نسخه‌ی قبلی این مقدار را ذخیره کرده باید همچنان خوانده
   شود، نه اینکه رکوردش خراب حساب شود. */
export type A2hsAction = 'ok' | 'dismiss'
type StoredAction = A2hsAction | 'later'

export interface A2hsState {
  /** آخرین اقدام کاربر */
  s: StoredAction
  /** زمان آن اقدام */
  t: number
  /** چند بار تا حالا نشانش داده‌ایم (فقط برای سابقه؛ دیگر سقفی نیست) */
  n: number
}

const COOLDOWN: Record<StoredAction, number> = {
  ok: A2HS_CONFIG.gotItCooldownMs,
  /* رکوردهای قدیمی «بعداً» با همان قاعده‌ی امروز سنجیده می‌شوند، پس
     کسی که دیروز آن دکمه را زده در سکوت قدیمی گیر نمی‌ماند. */
  later: A2HS_CONFIG.gotItCooldownMs,
  dismiss: A2HS_CONFIG.dismissCooldownMs,
}

export function parseState(raw: string | null): A2hsState | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as Partial<A2hsState>
    if (o?.s !== 'later' && o?.s !== 'ok' && o?.s !== 'dismiss') return null
    return { s: o.s, t: Number(o.t) || 0, n: Number(o.n) || 0 }
  } catch {
    return null   // مقدار خراب = انگار چیزی ذخیره نشده
  }
}

/** آیا هنوز در دوره‌ی سکوت هستیم؟ */
export function isMuted(state: A2hsState | null, now: number): boolean {
  if (!state) return false
  return now - state.t < (COOLDOWN[state.s] ?? A2HS_CONFIG.gotItCooldownMs)
}

/** بستن ساده (× یا پس‌زمینه) شمارنده را بالا نمی‌برد — انتخاب آگاهانه نبوده */
export function nextState(prev: A2hsState | null, action: A2hsAction, now: number): A2hsState {
  return { s: action, t: now, n: (prev?.n ?? 0) + (action === 'dismiss' ? 0 : 1) }
}

/* ── تصمیم نهایی ────────────────────────────────────────────── */

export interface A2hsEnv {
  ua: string
  maxTouchPoints: number
  /** `navigator.standalone` — عمداً `unknown` است چون در اکثر مرورگرها وجود ندارد */
  standaloneFlag: unknown
  /** نتیجه‌ی `matchMedia('(display-mode: standalone)')` و هم‌خانواده‌هایش */
  displayModeApp: boolean
  now: number
  stored: string | null
}

export type A2hsDecision =
  | { show: true; device: Exclude<IosDevice, null> }
  | { show: false; reason: 'not-ios' | 'not-safari' | 'installed' | 'muted' }

/**
 * هر دو راه تشخیص نصب‌بودن پوشش داده می‌شود:
 *   • `navigator.standalone` — راه قدیمی و مخصوص iOS
 *   • `display-mode: standalone|fullscreen|minimal-ui` — استاندارد PWA
 * (مانیفست پروژه `display: standalone` دارد، ولی دوتای دیگر هم چک
 *  می‌شوند تا اگر روزی مانیفست عوض شد این‌جا بی‌صدا خراب نشود.)
 */
export function isInstalled(env: A2hsEnv): boolean {
  return env.standaloneFlag === true || env.displayModeApp
}

export function decide(env: A2hsEnv): A2hsDecision {
  const device = detectIosDevice(env.ua, env.maxTouchPoints)
  if (!device) return { show: false, reason: 'not-ios' }
  if (safariConfidence(env.ua, env.standaloneFlag) === 'no') return { show: false, reason: 'not-safari' }
  if (isInstalled(env)) return { show: false, reason: 'installed' }
  if (isMuted(parseState(env.stored), env.now)) return { show: false, reason: 'muted' }
  return { show: true, device }
}

/* ── پل به مرورگر ───────────────────────────────────────────────
   تنها جایی از این فایل که به window/navigator دست می‌زند. هرگز در
   SSR صدا زده نمی‌شود (فقط از داخل useEffect). */

export function readEnv(): A2hsEnv {
  const nav = navigator as Navigator & { standalone?: boolean }
  const mm = (q: string) => {
    try { return window.matchMedia?.(q).matches === true } catch { return false }
  }
  let stored: string | null = null
  try { stored = localStorage.getItem(A2HS_STORAGE_KEY) } catch { /* حالت خصوصی/محدود */ }

  return {
    ua: nav.userAgent || '',
    maxTouchPoints: nav.maxTouchPoints || 0,
    standaloneFlag: nav.standalone,
    displayModeApp:
      mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || mm('(display-mode: minimal-ui)'),
    now: Date.now(),
    stored,
  }
}

/** ثبت اقدام کاربر. شکست نوشتن بی‌صدا رد می‌شود — نبود حافظه نباید
 *  به خطای زمان اجرا تبدیل شود؛ بدترین حالتش این است که دفعه‌ی بعد
 *  دوباره نشان داده می‌شود. */
export function persistDismissal(action: A2hsAction): void {
  try {
    const prev = parseState(localStorage.getItem(A2HS_STORAGE_KEY))
    localStorage.setItem(A2HS_STORAGE_KEY, JSON.stringify(nextState(prev, action, Date.now())))
  } catch { /* ignore */ }
}
