/* ─────────────────────────────────────────────────────────────
   قراردادِ درگاهِ پرداخت — منطقِ رزرو هرگز به درگاهِ خاصی وابسته نیست.
   افزودنِ درگاهِ جدید = ساختِ یک فایل که این اینترفیس را پیاده کند و
   ثبتش در lib/payments/index.ts (بدونِ تغییر در Booking/Ledger).
   ───────────────────────────────────────────────────────────── */

export interface CreatePaymentInput {
  paymentId: string      // شناسه‌ی پرداختِ ما (مرجعِ داخلی)
  amount: number         // تومان
  description: string
  callbackUrl: string
  mobile?: string
  email?: string
}

export interface CreatePaymentResult {
  ok: boolean
  authority?: string     // شناسه‌ی درگاه (authority / token)
  redirectUrl?: string   // آدرسِ انتقالِ کاربر
  message?: string
  raw?: unknown
}

export interface VerifyPaymentInput {
  paymentId: string
  authority: string
  amount: number         // مبلغِ مورد انتظار (تومان) — باید با پرداختِ واقعی یکی باشد
}

export interface VerifyPaymentResult {
  ok: boolean
  paid: boolean
  refId?: string         // شماره‌ی پیگیریِ درگاه
  amount?: number        // مبلغی که واقعاً پرداخت شده
  message?: string
  raw?: unknown
}

export interface RefundInput { paymentId: string; authority?: string; refId?: string; amount: number; reason?: string }
export interface RefundResult { ok: boolean; providerRef?: string; message?: string; raw?: unknown }

export interface PaymentProvider {
  readonly name: string
  /** آیا آماده‌ی استفاده است؟ (کلید/تنظیمات موجود است) */
  isConfigured(): boolean
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>
  getPaymentStatus(authority: string): Promise<VerifyPaymentResult>
  refundPayment(input: RefundInput): Promise<RefundResult>
}
