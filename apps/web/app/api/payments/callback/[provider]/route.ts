export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';
import { notifyBookingConfirmed } from '@/lib/notify';

/* بازگشت از درگاه — هرگز به گفته‌ی کلاینت اعتماد نمی‌شود:
   ۱) پرداخت سمت سرور verify می‌شود
   ۲) مبلغ پرداخت‌شده با مبلغ مورد انتظار مقایسه می‌شود
   ۳) تأیید idempotent است (کالبک تکراری هیچ اثر مالی دوباره ندارد)
   ۴) همه‌ی اثرات مالی در یک تراکنش اتمیک دیتابیس ثبت می‌شوند */

async function handle(req: NextRequest, providerName: string) {
  const url = req.nextUrl;
  /* درگاه‌ها یک‌شکل برنمی‌گردند — بعضی GET با کوئری، پی‌پینگ POST با
     فرم. `readGatewayReturn` تفاوت را می‌خورد. */
  const ret = await readGatewayReturn(req);
  const authority = ret.authority;

  /* شناسه‌ی سفارش معمولا در کوئری returnUrl است؛ اگر درگاهی آن را
     نگه ندارد، `clientRefId` که خودمان هنگام ساخت فرستادیم جایش را
     می‌گیرد. */
  const paymentId = url.searchParams.get('payment') || ret.clientRefId || '';

  const fail = (msg: string) => NextResponse.redirect(new URL(`/booking/result?ok=0&reason=${encodeURIComponent(msg)}`, callbackOrigin()), { status: 303 });
  if (!paymentId) return fail('پرداخت نامعتبر');

  const { data: pRow } = await sb().from('payments')
    .select('id,booking_id,amount,status,provider,provider_authority').eq('id', paymentId).maybeSingle();
  if (!pRow) return fail('پرداخت یافت نشد');
  const pay = pRow as { id: string; booking_id: string; amount: number; status: string; provider: string; provider_authority: string | null };

  /* قبلا تأیید شده ⇒ فقط به نتیجه هدایت کن (بدون هیچ عملیات مالی تکراری) */
  if (pay.status === 'PAID') {
    return NextResponse.redirect(new URL(`/booking/result?ok=1&booking=${pay.booking_id}`, callbackOrigin()), { status: 303 });
  }

  /* ── رهاکردنِ رزروِ پرداخت‌نشده ──
     تا امروز فقط *پرداخت* لغو می‌شد و خودِ رزرو تا پایانِ مهلت در
     `PENDING_PAYMENT` می‌ماند و ساعتش را نگه می‌داشت. کاربری که پشتِ
     درگاه منصرف می‌شد، همان ساعت را برای خودش و برای بقیه ربعِ ساعت
     قفل می‌کرد — و هر تلاشِ دوباره یک ساعتِ تازه هم قفل می‌کرد.

     ⚠️ گاردِ وضعیت حیاتی است. این مسیر احراز هویت ندارد و تنها رازش
     شناسه‌ی پرداخت است که در مرورگرِ خودِ کاربر می‌گردد. بدونِ گارد،
     یک درخواستِ تکراری یا ساختگی با `status=0` می‌توانست رزروی را که
     **پول داده شده** نابود کند: `bh_cancel_booking` روی رزروِ PAID
     شاخه‌ی مالی را می‌رود و با `p_refund=0` کلِ مبلغ را جریمه‌ی لغو
     می‌نویسد و ساعت را برای فروشِ دوباره آزاد می‌کند. */
  const releaseBooking = async (reason: string) => {
    if (!pay.booking_id) return;

    const { data: bk } = await sb().from('bookings')
      .select('booking_status,payment_status').eq('id', pay.booking_id).maybeSingle();
    const b = bk as { booking_status?: string; payment_status?: string } | null;
    if (!b || b.booking_status !== 'PENDING_PAYMENT' || b.payment_status === 'PAID') return;

    const { error } = await rpc('bh_cancel_booking', {
      p_booking_id: pay.booking_id, p_refund: 0, p_reason: reason,
    });
    if (error) {
      console.error('[payments/callback] release failed:', error.message);
      /* ساعتِ گیرکرده باید در پنل دیده شود، نه فقط در ژورنالِ سرور */
      audit({ action: 'BOOKING_RELEASE_FAILED', entityType: 'booking',
              entityId: pay.booking_id, newValue: { reason, error: error.message } });
    }
  };

  const provider = getPaymentProvider(pay.provider || providerName);

  /* ── شناسه‌ی درگاه از دیتابیس می‌آید، نه از نوار نشانی ──
     پیش‌تر `authority || pay.provider_authority` بود، یعنی مقدار
     کوئری‌استرینگ اولویت داشت. با آن، کسی می‌توانست شناسه‌ی یک پرداخت
     واقعا موفق *دیگر* را روی این پرداخت سوار کند و درگاه آن را تأیید
     می‌کرد. حالا فقط همان شناسه‌ای معتبر است که موقع ساخت پرداخت
     ذخیره شده؛ اگر درگاه شناسه‌ی دیگری برگرداند، ناسازگاری است. */
  const auth = pay.provider_authority || '';
  if (!auth) return fail('شناسه‌ی پرداخت نامعتبر است');
  if (authority && pay.provider_authority && authority !== pay.provider_authority) {
    console.error('[payments/callback] authority mismatch', { paymentId: pay.id });
    /* ⚠️ این خطا نیست، نشانه است: یا درگاه چیزِ عجیبی برگردانده یا
       کسی شناسه‌ی پرداختِ دیگری را روی این پرداخت سوار کرده. تا امروز
       فقط در journald می‌ماند و هیچ‌کس نمی‌دیدش. */
    /* ⚠️ هر دو مقدار بریده می‌شوند و این تزئین نیست. این مسیر
       احراز هویت ندارد، `authority` خام از کوئری/فرم می‌آید و nginx
       تا ۶۰ مگابایت بدنه می‌پذیرد — و چون این شاخه پیش از هر تغییرِ
       وضعیتی برمی‌گردد، مهاجم می‌تواند بی‌نهایت بار تکرارش کند. بدونِ
       سقف، هر تکرار یک ردیفِ ۶۰مگابایتی در `audit_logs` و در WAL و
       در بکاپِ هر شبه می‌نوشت. پیشوند برای تشخیصِ شناسه‌ی جعلی بس است. */
    audit({ action: 'PAYMENT_AUTHORITY_MISMATCH', entityType: 'payment',
            entityId: pay.id, ip: clientIp(req),
            userAgent: req.headers.get('user-agent'),
            newValue: {
              expected: pay.provider_authority?.slice(0, 32) ?? null,
              got: String(authority).slice(0, 64),
            } });
    return fail('شناسه‌ی پرداخت با درخواست اولیه هم‌خوانی ندارد');
  }

  /* ── دقیقا یک بار استعلام ──
     ⚠️ نسخه‌ی اولِ این اصلاح دو بار `verifyPayment` می‌زد (یک‌بار در
     شاخه‌ی «لغو» و یک‌بار این‌جا). استعلامِ پی‌پینگ idempotent هست ولی
     **پایدار نیست**: بارِ اول می‌تواند ۲۰۰ بدهد (پول گرفته شده) و
     بارِ دوم ۲۰۲/۵۰۲ که به `ok:false` نگاشت می‌شود — آن‌وقت پرداخت
     FAILED علامت می‌خورد در حالی که پول رفته، و هیچ ردیفِ بازپرداختی
     هم ساخته نمی‌شود. یعنی پول بی‌ردّ گم می‌شود. */
  const v = await provider.verifyPayment({
    paymentId: pay.id, authority: auth, amount: pay.amount, refId: ret.refId,
    canceled: ret.canceled,
  });

  /* ── «لغو» ادعای درگاه است، نه حقیقت ──
     `ret.canceled` از پارامترهای بازگشتیِ درگاه با یک قاعده‌ی تقریبی
     ساخته می‌شود (`nok|cancel|fail`, `status=0`, …) و امضا ندارد. تا
     وقتی نتیجه‌اش فقط یک پیام بود، اشتباهش بی‌ضرر بود؛ حالا که
     رهاکردن فوری است، تصمیم را استعلام می‌گیرد نه ادعا.

     اگر استعلام بگوید پول رفته، «لغو» نادیده گرفته می‌شود و رزرو
     قطعی می‌شود. وضعیتِ پرداخت هم **پیش از** استعلام دست نمی‌خورد:
     نوشتنِ زودهنگامِ CANCELED می‌توانست کلیدِ یکتای idempotency را
     بسوزاند و تلاشِ دوباره را ۵۰۰ کند. */
  if (!v.paid) {
    const canceled = ret.canceled;
    await sb().from('payments').update({
      status: canceled ? 'CANCELED' : 'FAILED',
      raw_response: (v.raw ?? { message: v.message, canceled }) as object,
      updated_at: new Date().toISOString(),
    }).eq('id', pay.id);

    /* ⚠️ `!v.paid` به‌تنهایی کافی **نیست**. آداپتورها هر پاسخِ
       ناموفقی را `paid: false` می‌دادند — از جمله ۴۰۱ (توکنِ منقضی)،
       ۴۲۹ و ۵xx. یعنی یک قطعیِ نیم‌ساعته‌ی درگاه می‌توانست ساعتِ
       همه‌ی رزروهای در جریان را آزاد کند در حالی که پول رفته بود.

       `definitive` فقط برای پاسخ‌هایی ست می‌شود که واقعا یعنی «این
       پرداخت هرگز تأیید نمی‌شود». استثنا: وقتی درگاه خودش «لغو» اعلام
       کرده و اصلا کدِ رهگیری نداده، پرداخت هیچ‌وقت قابلِ تأیید نخواهد
       بود — انتظارِ پانزده‌دقیقه‌ای چیزی به دست نمی‌آورد. */
    const neverVerifiable = ret.canceled && !ret.refId;
    if ((v.ok && v.definitive) || neverVerifiable) {
      await releaseBooking(ret.canceled ? 'انصراف از پرداخت' : 'پرداخت انجام نشد');
    }

    return fail(ret.canceled ? 'پرداخت توسط شما لغو شد' : (v.message || 'پرداخت تأیید نشد'));
  }

  /* بررسی مبلغ — اگر مبلغ واقعی با مورد انتظار نخواند، هرگز تأیید نکن */
  if (typeof v.amount === 'number' && v.amount !== pay.amount) {
    await sb().from('payments').update({ status: 'FAILED', raw_response: { reason: 'amount_mismatch', got: v.amount, want: pay.amount }, updated_at: new Date().toISOString() }).eq('id', pay.id);
    audit({ action: 'PAYMENT_AMOUNT_MISMATCH', entityType: 'payment', entityId: pay.id, newValue: { got: v.amount, want: pay.amount }, ip: clientIp(req) ?? undefined });
    return fail('مبلغ پرداخت با مبلغ رزرو مطابقت ندارد');
  }

  /* تأیید اتمیک: پرداخت + رزرو + دفتر مالی + کمیسیون + موجودی باشگاه */
  const { data: confirmed, error } = await rpc<{ booking_status?: string }>('bh_confirm_payment', {
    p_payment_id: pay.id, p_provider_ref: v.refId ?? '', p_amount: pay.amount,
  });
  if (error) {
    const m = error.message || '';
    audit({ action: 'PAYMENT_CONFIRM_FAILED', entityType: 'payment', entityId: pay.id, newValue: { error: m } });
    if (/amount_mismatch/.test(m)) return fail('مغایرت مبلغ');
    return fail('خطا در نهایی‌کردن رزرو — با پشتیبانی تماس بگیرید');
  }

  /* ── کالبکِ دیرهنگام ──
     `bh_confirm_payment` روی رزروی که دیگر `PENDING_PAYMENT` نیست
     عمدا خطا **نمی‌دهد**: پرداخت را PAID می‌کند، ردیفِ دفتر می‌نویسد
     و یک بدهیِ بازپرداخت باز می‌کند، بعد عادی برمی‌گردد — و کامنتِ
     مهاجرت ۰۴۱ می‌گوید فراخوان باید `booking_status` را بخواند.

     تا دیروز این مسیر تقریبا دست‌نیافتنی بود چون رزرو تمامِ پانزده
     دقیقه سرِ جایش می‌ماند. حالا که انصراف فوری رزرو را لغو می‌کند،
     مسیرِ زنده‌ای است: بدونِ این بررسی، به کاربر «رزرو قطعی شد»
     پیامک می‌رفت و به باشگاه‌دار «میزت پر شد» — برای ساعتی که لغو
     شده و شاید به دیگری فروخته شده باشد. */
  /* ⚠️ خواندن باید **تام** باشد. `RETURNS bookings` از PostgREST یک
     شیء برمی‌گردد نه آرایه، ولی اگر روزی این عوض شود، «نتوانستم
     بخوانم» نباید «دیر رسید» تفسیر شود — آن‌وقت هر پرداختِ موفق پیام
     شکست می‌گرفت. پس در نبودِ مقدار، مستقیم از خودِ رزرو می‌پرسیم. */
  const raw = confirmed as unknown;
  let bookingStatus = (Array.isArray(raw) ? raw[0] : raw as { booking_status?: string } | null)?.booking_status;
  if (!bookingStatus) {
    const { data: bk } = await sb().from('bookings')
      .select('booking_status').eq('id', pay.booking_id).maybeSingle();
    bookingStatus = (bk as { booking_status?: string } | null)?.booking_status;
  }

  if (bookingStatus !== 'CONFIRMED') {
    audit({ action: 'PAYMENT_LATE_CALLBACK', entityType: 'payment', entityId: pay.id,
            newValue: { bookingStatus: bookingStatus ?? null, refId: v.refId }, ip: clientIp(req) ?? undefined });
    return fail('پرداخت شما دریافت شد ولی مهلت این رزرو گذشته بود — مبلغ بازگردانده می‌شود');
  }

  audit({ action: 'PAYMENT_CONFIRMED', entityType: 'payment', entityId: pay.id,
          newValue: { refId: v.refId, amount: pay.amount }, ip: clientIp(req) ?? undefined });

  /* اطلاع‌رسانی — بی‌صدا و بدون انتظار؛ نباید ریدایرکت کاربر را کند کند */
  void notifyBookingConfirmed(pay.booking_id).catch(() => { /* بی‌صدا */ });

  return NextResponse.redirect(new URL(`/booking/result?ok=1&booking=${pay.booking_id}`, callbackOrigin()), { status: 303 });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}
