/* ─────────────────────────────────────────────────────────────
   قرارداد درگاه پرداخت — منطق رزرو هرگز به درگاه خاصی وابسته نیست.
   افزودن درگاه جدید = ساخت یک فایل که این اینترفیس را پیاده کند و
   ثبتش در lib/payments/index.ts (بدون تغییر در Booking/Ledger).
   ───────────────────────────────────────────────────────────── */

export interface CreatePaymentInput {
  paymentId: string      // شناسه‌ی پرداخت ما (مرجع داخلی)
  amount: number         // تومان
  description: string
  callbackUrl: string
  mobile?: string
  email?: string
}

export interface CreatePaymentResult {
  ok: boolean
  authority?: string     // شناسه‌ی درگاه (authority / token)
  redirectUrl?: string   // آدرس انتقال کاربر
  message?: string
  raw?: unknown
}

export interface VerifyPaymentInput {
  paymentId: string
  authority: string
  amount: number         // مبلغ مورد انتظار (تومان) — باید با پرداخت واقعی یکی باشد
  /* کد رهگیری درگاه، اگر هنگام بازگشت داده شده باشد.
     زرین‌پال با `authority` تنهایی تأیید می‌کند، ولی پی‌پینگ هم
     `paymentCode` می‌خواهد هم `paymentRefId`. اختیاری است تا
     آداپتورهای موجود دست نخورند. */
  refId?: string
  /** آیا درگاه در بازگشت ادعای «لغو» کرده؟
   *
   *  ادعاست نه حقیقت، پس آداپتورهای واقعی نادیده‌اش می‌گیرند و
   *  همچنان از خودِ درگاه می‌پرسند. فقط درگاهِ ساختگی که پشتِ صحنه‌ای
   *  ندارد به آن تکیه می‌کند. */
  canceled?: boolean
}

export interface VerifyPaymentResult {
  ok: boolean
  paid: boolean
  /** آیا درگاه **قطعا** گفت پرداخت نشده؟
   *
   *  ── چرا این جدا از `ok` لازم است ──
   *  `ok` یعنی «استعلام انجام شد»، ولی آداپتورها هر پاسخِ ناموفقی را
   *  هم `ok: true, paid: false` می‌دادند — از جمله ۴۰۱ (توکنِ منقضی)،
   *  ۴۲۹ و ۵۰۰. یعنی یک قطعیِ درگاه از «پرداخت نشد» قابلِ تشخیص نبود.
   *
   *  هرجا بر اساسِ «پرداخت نشده» کارِ **برگشت‌ناپذیر** انجام می‌شود
   *  (آزادکردنِ ساعتِ رزرو و فروشش به دیگری) باید این پرچم را ببیند،
   *  نه `!paid` را. نبودش یعنی «نمی‌دانم» و در آن حالت هیچ کاری
   *  نباید کرد. */
  definitive?: boolean
  refId?: string         // شماره‌ی پیگیری درگاه
  amount?: number        // مبلغی که واقعا پرداخت شده
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
