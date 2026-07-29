import type { PaymentProvider } from './provider'
import { MockPaymentProvider } from './mock'
import { ZarinPalProvider } from './zarinpal'

/* رجیستریِ درگاه‌ها — افزودنِ درگاهِ جدید فقط همین‌جا ثبت می‌شود.
   انتخابِ درگاهِ فعال با env: PAYMENT_PROVIDER=mock | zarinpal */
const registry: Record<string, () => PaymentProvider> = {
  mock: () => new MockPaymentProvider(),
  zarinpal: () => new ZarinPalProvider(),
}

export function getPaymentProvider(name?: string): PaymentProvider {
  const key = (name || process.env.PAYMENT_PROVIDER || 'mock').toLowerCase()
  const make = registry[key] ?? registry.mock!
  const p = make()
  /* اگر درگاهِ انتخابی تنظیم نشده باشد، به‌جای شکست، mock استفاده می‌شود
     تا فلوی سایت هرگز قطع نشود (در لاگِ سرور هشدار ثبت می‌شود). */
  if (!p.isConfigured()) {
    console.warn(`[payments] provider "${key}" is not configured — falling back to mock`)
    return new MockPaymentProvider()
  }
  return p
}

/* آیا یک درگاهِ **واقعی** پیکربندی شده است؟

   `getPaymentProvider` عمداً وقتی درگاه تنظیم نباشد به mock برمی‌گردد
   تا فلوی سایت قطع نشود. این رفتار برای رزرو قابلِ قبول است، ولی
   برای پولِ واقعی خطرناک: باعث می‌شود سیستم «پرداختِ موفق» اعلام کند
   بدونِ آنکه ریالی جابه‌جا شده باشد.

   هر جریانی که پولِ واقعی می‌گیرد باید **اول** این را بپرسد و اگر
   false بود، صادقانه بگوید پرداخت فعال نیست — نه اینکه رسید بدهد. */
export function hasRealGateway(): boolean {
  const key = (process.env.PAYMENT_PROVIDER || '').toLowerCase()
  if (!key || key === 'mock') return false
  const make = registry[key]
  if (!make) return false
  try { return make().isConfigured() } catch { return false }
}

export type { PaymentProvider } from './provider'
