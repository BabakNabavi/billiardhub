/* ─────────────────────────────────────────────────────────────
   نشانیِ دریافتِ اپ اندروید — منبعِ واحد.

   شناسه‌ی بسته همان mobile/android است (net.billiardhub.app) و نشانیِ
   صفحه‌ی اپ در کافه‌بازار از روی همان ساخته می‌شود. مایکت کنار گذاشته
   شد (خواستِ مالک، آبانِ ۱۴۰۵) — کافه‌بازار و دانلودِ مستقیم کافی است.
   ───────────────────────────────────────────────────────────── */

export const ANDROID_PACKAGE = 'net.billiardhub.app'

export interface AppStore {
  id: 'bazaar'
  name: string
  url: string
  icon: string
}

export const APP_STORES: readonly AppStore[] = [
  {
    id: 'bazaar',
    name: 'کافه‌بازار',
    url: `https://cafebazaar.ir/app/${ANDROID_PACKAGE}`,
    icon: '/images/stores/bazaar.webp',
  },
]

/* دانلودِ مستقیمِ APK از خودِ سایت.

   فایل در public/downloads است و Next آن را با نوعِ درستِ
   application/vnd.android.package-archive می‌فرستد (proxy.ts و sw.js
   روی این مسیر کاری نمی‌کنند).

   ⚠️ نسخه‌ی تازه: APKِ امضاشده با همان کلیدِ کافه‌بازار را با نامِ تازه
   در public/downloads بگذار، فایلِ قبلی را بردار و فقط همین‌جا `version`
   را عوض کن. نامِ نسخه‌دار عمدی است تا کشِ مرورگر فایلِ کهنه ندهد. */
const APK_VERSION = '1.0.1'

export const ANDROID_APK = {
  href: `/downloads/billiardhub-${APK_VERSION}.apk`,
  fileName: `BilliardHub-${APK_VERSION}.apk`,
} as const
