/* ─────────────────────────────────────────────────────────────
   نشانیِ اپ در فروشگاه‌ها — منبعِ واحد.

   شناسه‌ی بسته همان mobile/android است (net.billiardhub.app) و نشانیِ
   صفحه‌ی اپ در هر دو فروشگاه از روی همان ساخته می‌شود.

   ⚠️ `live` تا وقتی اپ در آن فروشگاه منتشر نشده false بماند: نشانی تا آن
   موقع ۴۰۴ می‌دهد و نشان در فوتر «به‌زودی» و غیرفعال است. بعد از تأییدِ
   انتشار، فقط همین‌جا true کن.
   ───────────────────────────────────────────────────────────── */

export const ANDROID_PACKAGE = 'net.billiardhub.app'

export interface AppStore {
  id: 'bazaar' | 'myket'
  name: string
  url: string
  icon: string
  live: boolean
}

export const APP_STORES: readonly AppStore[] = [
  {
    id: 'bazaar',
    name: 'کافه‌بازار',
    url: `https://cafebazaar.ir/app/${ANDROID_PACKAGE}`,
    icon: '/images/stores/bazaar.webp',
    live: false,
  },
  {
    id: 'myket',
    name: 'مایکت',
    url: `https://myket.ir/app/${ANDROID_PACKAGE}`,
    icon: '/images/stores/myket.webp',
    live: false,
  },
]
