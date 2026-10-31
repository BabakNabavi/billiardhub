import 'server-only'
import type { StreamProvider } from './provider'
import { MockStreamProvider } from './mock'

/* رجیستریِ سرویس‌های پخش — افزودنِ آروان/میزبان فقط همین‌جا ثبت می‌شود.
   انتخاب با env: STREAM_PROVIDER=mock | arvan | mizban

   آداپتورِ آروان و میزبان عمداً هنوز نوشته نشده: باید از روی مستنداتِ
   واقعیِ API پس از خرید نوشته شوند، نه از حدس. تا آن روز این دو نام
   «تنظیم‌نشده» حساب می‌شوند و سایت صادقانه می‌گوید سرویس وصل نیست. */
const registry: Record<string, () => StreamProvider> = {
  mock: () => new MockStreamProvider(),
}

export function streamProviderName(): string {
  return (process.env.STREAM_PROVIDER || '').trim().toLowerCase()
}

/** سرویسِ پخشِ فعال، یا null اگر هیچ سرویسی وصل نیست.
 *  برخلافِ پرداخت، به mock برنمی‌گردد (توضیح در mock.ts). */
export function getStreamProvider(name = streamProviderName()): StreamProvider | null {
  const make = registry[name]
  if (!make) return null
  try {
    const p = make()
    return p.isConfigured() ? p : null
  } catch (e) {
    console.error('[streaming] provider init failed', e)
    return null
  }
}

export type { StreamProvider } from './provider'
export { StreamProviderError } from './provider'
