import type {
  PaymentProvider, CreatePaymentInput, CreatePaymentResult,
  VerifyPaymentInput, VerifyPaymentResult, RefundInput, RefundResult,
} from './provider'

/* آداپتور زرین‌پال — فعال می‌شود به‌محض تنظیم ZARINPAL_MERCHANT_ID.
   نکته‌ی واحد پول: سیستم به «تومان» کار می‌کند و زرین‌پال «ریال» می‌گیرد؛
   تبدیل فقط همین‌جا (مرز درگاه) انجام می‌شود. */
const BASE = 'https://payment.zarinpal.com/pg/v4/payment'
const PAY_PAGE = 'https://payment.zarinpal.com/pg/StartPay'
const toRial = (toman: number) => toman * 10

export class ZarinPalProvider implements PaymentProvider {
  readonly name = 'zarinpal'
  private merchant = process.env.ZARINPAL_MERCHANT_ID || ''

  isConfigured() { return this.merchant.length > 0 }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) return { ok: false, message: 'مرچنت‌کد زرین‌پال تنظیم نشده است' }
    try {
      const r = await fetch(`${BASE}/request.json`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: this.merchant,
          amount: toRial(input.amount),
          description: input.description,
          callback_url: input.callbackUrl,
          metadata: { mobile: input.mobile, email: input.email, order_id: input.paymentId },
        }),
      })
      const j = await r.json().catch(() => null) as { data?: { code?: number; authority?: string }; errors?: unknown } | null
      const authority = j?.data?.authority
      if (j?.data?.code === 100 && authority) {
        return { ok: true, authority, redirectUrl: `${PAY_PAGE}/${authority}`, raw: j }
      }
      return { ok: false, message: 'ایجاد پرداخت در زرین‌پال ناموفق بود', raw: j }
    } catch { return { ok: false, message: 'خطا در اتصال به زرین‌پال' } }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!this.isConfigured()) return { ok: false, paid: false, message: 'مرچنت‌کد تنظیم نشده است' }
    try {
      const r = await fetch(`${BASE}/verify.json`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: this.merchant, amount: toRial(input.amount), authority: input.authority }),
      })
      /* ⚠️ زرین‌پال v4 در شکست `data` را **آرایه‌ی خالی** می‌دهد و کد را
         در `errors.code` می‌گذارد. خواندن فقط از `data.code` یعنی کد
         همیشه `undefined` بود و هیچ شکستی «قطعی» تشخیص داده نمی‌شد. */
      const j = await r.json().catch(() => null) as
        { data?: { code?: number; ref_id?: number }; errors?: { code?: number } } | null
      const code = j?.data?.code ?? j?.errors?.code
      /* ۱۰۰ = تأیید موفق، ۱۰۱ = قبلا تأیید شده (هر دو یعنی پرداخت‌شده) */
      if (code === 100 || code === 101) {
        return { ok: true, paid: true, refId: String(j?.data?.ref_id ?? ''), amount: input.amount, raw: j }
      }
      /* بدنه‌ی خوانده‌نشده یا بی‌کد یعنی «نمی‌دانم»، نه «پرداخت نشد».
         بدونِ این تفکیک، یک خطای موقتِ زرین‌پال ساعتِ رزرو را آزاد
         می‌کرد در حالی که ممکن بود پول رفته باشد. */
      return {
        ok: true, paid: false,
        definitive: typeof code === 'number',
        message: 'پرداخت تأیید نشد', raw: j,
      }
    } catch { return { ok: false, paid: false, message: 'خطا در تأیید پرداخت' } }
  }

  async getPaymentStatus(authority: string): Promise<VerifyPaymentResult> {
    return { ok: false, paid: false, message: 'استعلام وضعیت در این آداپتور پیاده نشده است' }
  }

  async refundPayment(_input: RefundInput): Promise<RefundResult> {
    /* بازپرداخت خودکار زرین‌پال نیازمند توکن جداگانه است؛ فعلا دستی. */
    return { ok: false, message: 'بازپرداخت خودکار فعال نیست — تسویه/بازگشت به‌صورت دستی انجام شود' }
  }
}
