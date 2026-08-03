/* واکشیِ مشترک — یک درخواست برای چند مصرف‌کننده.

   ── چرا لازم شد ──
   اندازه‌گیریِ صفحه‌ی اصلی نشان داد `/api/clubs` و `/api/sellers` هرکدام
   دو بار در بارگذاریِ اول گرفته می‌شوند: یک‌بار از `HomeClient` برای
   سکشن‌های ویژه و یک‌بار از `Stories` برای نوارِ استوری. هیچ‌کدام از
   دیگری خبر ندارد و هر دو در همان چند صد میلی‌ثانیه‌ی اول اجرا
   می‌شوند.

   این لایه‌ی نازک همان درخواست را یک‌بار می‌زند و وعده‌اش را به هر دو
   می‌دهد. عمداً کتابخانه‌ی کش نیاورده‌ام: مسئله فقط هم‌زمانیِ چند
   مصرف‌کننده در بارگذاریِ اول است، نه مدیریتِ حالتِ سراسری.

   عمرِ کوتاه (پیش‌فرض ۱۵ ثانیه) یعنی داده هیچ‌وقت بیات نمی‌ماند؛ اگر
   کاربر بعداً بخشی را تازه کند، درخواستِ نو می‌رود. */

type Entry = { at: number; p: Promise<unknown> }
const cache = new Map<string, Entry>()

export function sharedJson<T>(url: string, ttlMs = 15_000): Promise<T> {
  const now = Date.now()
  const hit = cache.get(url)
  if (hit && now - hit.at < ttlMs) return hit.p as Promise<T>

  const p = fetch(url, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null)

  cache.set(url, { at: now, p })
  return p as Promise<T>
}
