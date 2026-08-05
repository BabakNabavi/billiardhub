import type {
  PaymentProvider, CreatePaymentInput, CreatePaymentResult,
  VerifyPaymentInput, VerifyPaymentResult, RefundInput, RefundResult,
} from './provider'

/* ─────────────────────────────────────────────────────────────
   آداپتور پی‌پینگ — نسخه‌ی ۳ سرویسِ پرداخت.

   ── واحد پول ──
   پی‌پینگ **تومان** می‌گیرد، پس برخلافِ زرین‌پال هیچ تبدیلی لازم
   نیست. این را از مستنداتشان گرفته‌ام («واحد پول در تمام سرویس‌ها
   تومان می‌باشد») و عمداً این‌جا نوشته شده: یک ضربدرِ ده اشتباهی
   یعنی ده برابر گرفتن از مشتری.

   ── بازگشت از درگاه ──
   پی‌پینگ مثل بقیه با GET و پارامترِ کوئری برنمی‌گردد؛ به `returnUrl`
   یک **POST با `application/x-www-form-urlencoded`** می‌زند. خواندنِ
   آن در `readGatewayReturn` انجام می‌شود، نه این‌جا.

   ── تأیید ──
   تأیید به سه چیز نیاز دارد: `paymentCode` (همان authority ما)،
   `paymentRefId` (کدِ رهگیری که در بازگشت می‌آید) و مبلغ. برای همین
   `VerifyPaymentInput.refId` اضافه شد.
   ───────────────────────────────────────────────────────────── */

const BASE = 'https://api.payping.ir'

interface PayPingError {
  detail?: string; title?: string
  metaData?: { code?: number; message?: string }
}

export class PayPingProvider implements PaymentProvider {
  readonly name = 'payping'
  private token = process.env.PAYPING_TOKEN || ''

  isConfigured() { return this.token.length > 0 }

  private headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) return { ok: false, message: 'توکن پی‌پینگ تنظیم نشده است' }
    try {
      const r = await fetch(`${BASE}/v3/pay`, {
        method: 'POST', headers: this.headers(),
        body: JSON.stringify({
          amount: Math.round(input.amount),          // تومان — بدونِ تبدیل
          returnUrl: input.callbackUrl,
          description: input.description.slice(0, 200),
          /* شناسه‌ی خودمان. مستندات صریحاً می‌گوید در بازگشت باید با
             همین در پایگاه داده جست‌وجو شود — پس اگر روزی پارامترِ
             کوئریِ `returnUrl` گم شود، باز هم می‌دانیم کدام پرداخت
             است. */
          clientRefId: input.paymentId,
          ...(input.mobile ? { payerIdentity: input.mobile } : {}),
          /* بازگشتِ وجه فقط تا ۳۰ دقیقه پس از پرداخت ممکن است و باید
             از همین‌جا فعال شود. پیش‌فرض خاموش است چون رفتارِ تسویه را
             عوض می‌کند و باید آگاهانه روشن شود. */
          ...(process.env.PAYPING_REVERSIBLE === 'on' ? { isReversible: true } : {}),
        }),
      })

      const j = await r.json().catch(() => null) as
        ({ paymentCode?: string; url?: string } & PayPingError) | null

      if (r.ok && j?.paymentCode && j?.url) {
        return { ok: true, authority: j.paymentCode, redirectUrl: j.url, raw: j }
      }
      /* کدِ HTTP در پاسخِ خطا نیست ولی برای تشخیص حیاتی است: ۴۰۱ یعنی
         توکن، ۴۰۳ یعنی دسترسی، ۴۰۰ یعنی خودِ درخواست. بدونِ آن، یک
         «PolicyException» تنها هیچ نمی‌گوید. */
      return {
        ok: false,
        message: errText(j) || 'ایجاد پرداخت در پی‌پینگ ناموفق بود',
        raw: { httpStatus: r.status, body: j },
      }
    } catch { return { ok: false, message: 'خطا در اتصال به پی‌پینگ' } }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!this.isConfigured()) return { ok: false, paid: false, message: 'توکن پی‌پینگ تنظیم نشده است' }

    const refId = String(input.refId ?? '').replace(/[^0-9]/g, '')
    if (!refId) return { ok: false, paid: false, message: 'کد رهگیری پرداخت نامعتبر است' }

    try {
      const r = await fetch(`${BASE}/v3/pay/verify`, {
        method: 'POST', headers: this.headers(),
        body: JSON.stringify({
          paymentRefId: Number(refId),
          paymentCode: input.authority,
          amount: Math.round(input.amount),
        }),
      })
      const j = await r.json().catch(() => null) as
        ({ amount?: number; paymentRefId?: number; cardNumber?: string } & PayPingError) | null

      if (r.ok) {
        return {
          ok: true, paid: true,
          refId: String(j?.paymentRefId ?? refId),
          amount: typeof j?.amount === 'number' ? j.amount : input.amount,
          raw: j,
        }
      }

      /* ۴۰۹ با کدِ ۱۱۰ یعنی «قبلاً تأیید شده». این خطا نیست — پول
         گرفته شده و کالبکِ تکراری نباید سفارش را ناموفق کند. */
      if (r.status === 409 && j?.metaData?.code === 110) {
        return { ok: true, paid: true, refId, amount: input.amount, raw: j }
      }

      /* ۲۰۲ و ۵۰۲ یعنی «در حالِ پردازش، دوباره تلاش کنید». نه تأیید
         است نه رد؛ `ok: false` برمی‌گردد تا سفارش «ناموفق» علامت
         نخورد و بشود دوباره امتحان کرد. */
      if (r.status === 202 || r.status === 502) {
        return { ok: false, paid: false, message: 'تأیید پرداخت در حال پردازش است؛ لحظاتی بعد دوباره تلاش کنید', raw: j }
      }

      return { ok: true, paid: false, message: errText(j) || 'پرداخت تأیید نشد', raw: j }
    } catch { return { ok: false, paid: false, message: 'خطا در تأیید پرداخت' } }
  }

  async getPaymentStatus(_authority: string): Promise<VerifyPaymentResult> {
    /* پی‌پینگ استعلامِ وضعیت بدونِ کدِ رهگیری ندارد؛ گزارشِ تراکنش‌ها
       مسیرِ جداست و برای این کاربرد لازم نشده. */
    return { ok: false, paid: false, message: 'استعلام وضعیت در این آداپتور پیاده نشده است' }
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    if (!this.isConfigured()) return { ok: false, message: 'توکن پی‌پینگ تنظیم نشده است' }
    if (!input.authority || !input.refId) {
      return { ok: false, message: 'برای بازگشت وجه، کد پرداخت و کد رهگیری لازم است' }
    }
    try {
      const r = await fetch(`${BASE}/v3/pay/reverse`, {
        method: 'POST', headers: this.headers(),
        body: JSON.stringify({
          paymentRefId: Number(String(input.refId).replace(/[^0-9]/g, '')),
          paymentCode: input.authority,
        }),
      })
      if (r.ok) return { ok: true, providerRef: String(input.refId) }

      const j = await r.json().catch(() => null) as PayPingError | null
      /* محدودیتِ ۳۰ دقیقه‌ی پی‌پینگ در عمل یعنی بازگشتِ خودکار فقط
         برای لغوِ بلافاصله کار می‌کند. پیام باید این را روشن بگوید،
         وگرنه ادمین فکر می‌کند خرابی است. */
      return { ok: false, message: errText(j) || 'بازگشت وجه ناموفق بود — بازه‌ی ۳۰ دقیقه‌ای ممکن است گذشته باشد', raw: j }
    } catch { return { ok: false, message: 'خطا در اتصال به پی‌پینگ' } }
  }
}

/* پیامِ خطای پی‌پینگ در چند جای مختلف می‌آید */
function errText(j: PayPingError | null): string {
  return String(j?.metaData?.message || j?.detail || j?.title || '').trim()
}
