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

export type { PaymentProvider } from './provider'
