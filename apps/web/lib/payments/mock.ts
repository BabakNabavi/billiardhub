import { createHmac } from 'crypto'
import type {
  PaymentProvider, CreatePaymentInput, CreatePaymentResult,
  VerifyPaymentInput, VerifyPaymentResult, RefundInput, RefundResult,
} from './provider'

/* درگاهِ شبیه‌سازی‌شده — کلِ چرخه‌ی پرداخت را بدونِ درگاهِ واقعی اجرا می‌کند.
   کاربر به صفحه‌ی /payment/mock می‌رود و «پرداخت موفق/ناموفق» را می‌زند.
   authority با HMAC امضا می‌شود تا از جعل جلوگیری شود. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock'
  /* بدونِ fallbackِ هاردکد: امضای authority باید به کلیدِ محیط گره بخورد،
     وگرنه با رشته‌ی ثابتِ داخلِ مخزن قابلِ جعل می‌شد. */
  private get secret() {
    const s = process.env.JWT_SECRET
    if (!s) throw new Error('JWT_SECRET is not set — mock payment signing unavailable')
    return s
  }

  isConfigured() { return true }

  private sign(paymentId: string, amount: number) {
    return createHmac('sha256', this.secret).update(`${paymentId}:${amount}`).digest('hex').slice(0, 32)
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const authority = `MOCK-${input.paymentId}-${this.sign(input.paymentId, input.amount)}`
    const url = `/payment/mock?authority=${encodeURIComponent(authority)}&amount=${input.amount}&callback=${encodeURIComponent(input.callbackUrl)}`
    return { ok: true, authority, redirectUrl: url }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const expected = `MOCK-${input.paymentId}-${this.sign(input.paymentId, input.amount)}`
    if (input.authority !== expected) return { ok: false, paid: false, message: 'authority نامعتبر است' }
    return { ok: true, paid: true, refId: `MOCKREF-${Date.now().toString(36).toUpperCase()}`, amount: input.amount }
  }

  async getPaymentStatus(authority: string): Promise<VerifyPaymentResult> {
    return { ok: true, paid: authority.startsWith('MOCK-') }
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    return { ok: true, providerRef: `MOCKRFND-${Date.now().toString(36).toUpperCase()}`, message: 'بازپرداختِ شبیه‌سازی‌شده' }
  }
}
