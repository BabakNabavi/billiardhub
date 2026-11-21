import { detectIosDevice } from './pwa/a2hs'

/* ─────────────────────────────────────────────────────────────
   نشانیِ دریافتِ اپ اندروید — منبعِ واحد.

   شناسه‌ی بسته همان mobile/android است (net.billiardhub.app) و نشانیِ
   صفحه‌ی اپ در کافه‌بازار از روی همان ساخته می‌شود. مایکت کنار گذاشته
   شد (خواستِ مالک، آبانِ ۱۴۰۵) — کافه‌بازار و دانلودِ مستقیم کافی است.
   مصرف‌کننده‌ی اصلی صفحه‌ی /app است؛ فوتر فقط به آن لینک می‌دهد.
   ───────────────────────────────────────────────────────────── */

export const ANDROID_PACKAGE = 'net.billiardhub.app'

export const BAZAAR = {
  name: 'کافه‌بازار',
  url: `https://cafebazaar.ir/app/${ANDROID_PACKAGE}`,
  icon: '/images/stores/bazaar.webp',
} as const

/* دانلودِ مستقیمِ APK از خودِ سایت.

   فایل در public/downloads است و Next آن را با نوعِ درستِ
   application/vnd.android.package-archive می‌فرستد (proxy.ts و sw.js
   روی این مسیر کاری نمی‌کنند). حجمِ فایل موقعِ بیلد از روی خودِ فایل
   خوانده می‌شود (lib/app-download-meta.ts)؛ نبودنِ فایل بیلد را می‌شکند.

   ⚠️ نسخه‌ی تازه: APKِ امضاشده با همان کلید را با نامِ تازه در
   public/downloads بگذار، فایلِ قبلی را بردار و `APK_VERSION` و
   `released` را همین‌جا عوض کن. نامِ نسخه‌دار عمدی است تا کشِ مرورگر
   فایلِ کهنه ندهد. */
const APK_VERSION = '1.0.1'

export const ANDROID_APK = {
  version: APK_VERSION,
  /** روزِ ساختِ همین فایل (میلادی) */
  released: '2026-11-12',
  href: `/downloads/billiardhub-${APK_VERSION}.apk`,
  fileName: `BilliardHub-${APK_VERSION}.apk`,
} as const

export type MobileOs = 'android' | 'ios' | 'other'

/** کدام راهِ نصب برای این دستگاه مناسب است. آیپد هم iOS حساب می‌شود
 *  (تشخیصِ آیپدِ «Macintosh»نما همان منطقِ راهنمای افزودن به صفحه اصلی است). */
export function detectMobileOs(ua: string, maxTouchPoints: number): MobileOs {
  if (detectIosDevice(ua, maxTouchPoints)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}
