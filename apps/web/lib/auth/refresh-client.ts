/* تمدید نشست در مرورگر — یک درخواست در هر لحظه، برای کل صفحه.

   ⚠️ این کد قبلا داخل `SessionBridge` زندگی می‌کرد و وقتی `apiFetch`
   هم روی ۴۰۱ تمدید را اضافه کرد، نسخه‌ی دومی از آن با `fetch` خام
   ساخته شد. آن دو نگهبان `inflight` مشترکی نداشتند و همین یک خرابی
   نادر ولی بد می‌ساخت:

   کاربری که پانزده دقیقه بی‌کار مانده، با یک کلیک چند درخواست هم‌زمان
   می‌فرستد (پروفایل، نشان‌ها، پیام‌ها) و همه با هم ۴۰۱ می‌گیرند. اگر
   هر کدام جدا تمدید کند و آن لحظه مصادف با چرخش دوازده‌ساعته‌ی
   رفرش‌توکن باشد، دو پاسخ دو `refresh_hash` متفاوت می‌نویسند و دو
   `Set-Cookie` می‌فرستند. مرورگر یکی را نگه می‌دارد، دیتابیس شاید
   آن یکی را — و تمدید بعدی «استفاده‌ی دوباره از توکن» تشخیص داده
   می‌شود و نشست سالم باطل. پس هر دو مسیر باید از همین یک تابع
   بگذرند.

   مهر زمانی فقط روی موفقیت نوشته می‌شود؛ خطای گذرا نباید پنجره‌ی
   مشترک تب‌ها را بسوزاند. */

export const LAST_REFRESH_KEY = 'bh_last_refresh'

let lastRefreshAt = 0
let inflight: Promise<{ ok: boolean; status: number }> | null = null

export const readLastRefresh = (): number => {
  try { return Number(localStorage.getItem(LAST_REFRESH_KEY)) || 0 } catch { return lastRefreshAt }
}

export const writeLastRefresh = (t: number) => {
  lastRefreshAt = t
  try { localStorage.setItem(LAST_REFRESH_KEY, String(t)) } catch { /* ignore */ }
}

/** تا تمدیدِ در جریان تمام شود. پیش از هر `location.reload()` صدا زده
 *  شود: بازبارگذاری درخواستِ در راه را می‌بُرد، سرور `refresh_hash`ِ تازه
 *  را نوشته ولی `Set-Cookie` به مرورگر نرسیده، و تمدیدِ بعدی «استفاده‌ی
 *  دوباره از توکن» دیده می‌شود ⟵ خروجِ کاربر (components/AppBoot). */
export async function refreshIdle(): Promise<void> {
  /* هم تمدیدِ در جریان، هم همگام‌سازیِ SessionBridge که ممکن است *بعد از*
     پاسخِ ۴۰۱ِ پروفایل تمدید را شروع کند. تا وقتی هیچ‌کدام در راه نیست. */
  for (let i = 0; i < 5 && (inflight || pendingSync); i++) {
    await Promise.allSettled([inflight, pendingSync])
  }
}

let pendingSync: Promise<unknown> | null = null
/** SessionBridge کارِ همگام‌سازی‌اش را این‌جا ثبت می‌کند تا refreshIdle منتظرش بماند */
export function trackSync<T>(p: Promise<T>): Promise<T> {
  pendingSync = p
  const clear = () => { if (pendingSync === p) pendingSync = null }
  p.then(clear, clear)
  return p
}

/** `status: 0` یعنی درخواست اصلا نرسید (آفلاین) — نه رد سرور. */
export function refreshSession(): Promise<{ ok: boolean; status: number }> {
  if (inflight) return inflight
  inflight = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(r => {
      if (r.ok) writeLastRefresh(Date.now())
      return { ok: r.ok, status: r.status }
    })
    .catch(() => ({ ok: false, status: 0 }))
    .finally(() => { inflight = null })
  return inflight
}
