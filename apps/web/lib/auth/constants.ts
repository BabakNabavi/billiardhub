/* نام کوکی‌ها و عمرها — بدونِ هیچ وابستگی.
   عمداً از session.ts جدا است: middleware روی Edge اجرا می‌شود و اگر
   فایلی که jsonwebtoken را import می‌کند به آن برسد، باندلِ Edge
   می‌شکند. این فایل هرجا امن است. */

export const ACCESS_COOKIE  = 'bh_at'
export const REFRESH_COOKIE = 'bh_rt'
export const CSRF_COOKIE    = 'bh_csrf'
export const CSRF_HEADER    = 'x-csrf-token'

export const ACCESS_TTL_SEC  = 15 * 60             // ۱۵ دقیقه
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60   // ۳۰ روز
/* عمرِ توکن‌های نسلِ قدیم که هنوز در localStorage بعضی کاربران است */
export const LEGACY_TTL_SEC  = 7 * 24 * 60 * 60

/* مسیرهایی که بدونِ نشست دیده نمی‌شوند */
export const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/profile',
  '/messages',
  '/direct',
  '/referees/dashboard',
]

/** فقط ادمین */
export const ADMIN_PREFIXES = ['/admin']
