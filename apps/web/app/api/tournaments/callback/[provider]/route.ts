export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { notifyTournamentRegistered, notifyOrganizerOfRegistration } from '@/lib/notify';
import { getPaymentProvider } from '@/lib/payments';
import { readGatewayReturn } from '@/lib/payments/return';
import { confirmRegistrationPayment } from '@/lib/tournaments/server';
import { promoteWaitlist } from '@/lib/tournaments/waitlist';

/* بازگشت از درگاه برای ثبت‌نام مسابقه.

   چهار حفاظ که این مسیر را امن می‌کنند:

     ۱) **هیچ چیزی از کلاینت باور نمی‌شود.** نه مبلغ، نه وضعیت، نه
        «پرداخت شد»، نه «لغو شد». صحتِ پرداخت را خود سرور از درگاه
        می‌پرسد.

     ۲) **مبلغ از سفارش خوانده می‌شود، نه از پاسخ درگاه.**

     ۳) **Idempotent.** تابع دیتابیس اگر ثبت‌نام از قبل پرداخت شده باشد
        دوباره کاری نمی‌کند.

     ۴) **ضد Replay.** یک کدِ پیگیری فقط یک ثبت‌نام را تأیید می‌کند —
        از مهاجرتِ ۱۰۹ واقعا، چون تا آن موقع `provider_ref_id` اصلا
        نوشته نمی‌شد و ایندکسِ یکتا روی ستونِ خالی نشسته بود.

   ⚠️ این مسیر همه‌ی اصلاح‌های مسیرِ بازگشتِ رزرو
   (`/api/payments/callback`) را جا انداخته بود — شناسه‌ی درگاه از نوار
   نشانی اولویت داشت، «لغو» بدونِ استعلام باور می‌شد، و قطعیِ لحظه‌ایِ
   درگاه پرداختِ موفق را FAILED می‌کرد. حالا همان قواعد این‌جا هم هست.

   این مسیر در proxy.ts از CSRF معاف است (درگاه کوکی ما را ندارد)؛
   امنیت از راه verify سرورساید می‌آید، نه از توکن. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* دلیل‌هایی که یعنی «پول رسید ولی صندلی نخرید» — دیتابیس (۱۰۹) همان‌جا
   درخواستِ بازپرداخت را ساخته است. */
const REFUND_REASONS = new Set(['registration_closed', 'tournament_closed', 'refund_pending']);

async function handle(req: NextRequest, providerName: string) {
  const url = new URL(req.url);
  const q = url.searchParams;

  /* درگاه‌ها یک‌شکل برنمی‌گردند — پی‌پینگ با POST و فرم می‌آید، نه با
     کوئری. `readGatewayReturn` هر دو را می‌خواند. */
  const ret = await readGatewayReturn(req);

  /* شناسه‌ی سفارش را خودمان هنگام ساخت پرداخت داده‌ایم */
  const registrationId = q.get('paymentId') || q.get('registrationId') || ret.clientRefId || '';
  const authority = ret.authority || q.get('token') || '';

  const back = (state: string, extra = '') =>
    NextResponse.redirect(`${callbackOrigin()}/tournaments/result?state=${state}${extra}`, { status: 303 });

  if (!UUID.test(registrationId)) return back('invalid');

  const { data: regRow } = await sb().from('tournament_registrations')
    .select('id,amount,status,payment_status,provider,provider_authority,tournament_id')
    .eq('id', registrationId).maybeSingle();

  const reg = regRow as {
    id: string; amount: number; status: string; payment_status: string;
    provider: string | null; provider_authority: string | null; tournament_id: string;
  } | null;

  if (!reg) return back('invalid');

  /* از قبل قطعی شده ⇒ همان نتیجه (رفرش صفحه‌ی بازگشت) */
  if (reg.status === 'CONFIRMED' && reg.payment_status === 'PAID') {
    return back('ok', `&r=${reg.id}`);
  }

  /* پولِ همین دور قبلا رسیده و بازپرداختش باز شده ⇒ فقط همان پیام.
     ⚠️ نباید دوباره به استعلام و تأیید برود: پی‌پینگ برای پرداختِ از قبل
     تأییدشده کدِ پیگیری را از **خودِ درخواست** برمی‌گرداند، پس بازگشتِ
     تکراری با کدِ دیگر یک جفت پرداخت/بازپرداختِ دوم می‌ساخت. */
  if (reg.payment_status === 'REFUNDED') {
    return back('refund', `&r=${reg.id}`);
  }

  /* ── شناسه‌ی درگاه از دیتابیس می‌آید، نه از نوار نشانی ──
     پیش‌تر `authority || reg.provider_authority` بود و حفاظِ ناسازگاری
     فقط وقتی کار می‌کرد که **هر دو** پر بودند. یعنی اگر ثبت‌نام هنوز
     شناسه‌ی ذخیره‌شده نداشت، شناسه‌ی یک پرداختِ موفقِ *دیگر* از نوار
     نشانی مستقیم به درگاه می‌رفت و تأیید می‌شد. */
  const auth = reg.provider_authority || '';
  if (!auth) return back('invalid', `&r=${reg.id}`);
  if (authority && authority !== auth) {
    /* ⚠️ هر دو مقدار بریده می‌شوند: این مسیر احراز هویت ندارد و تکرارِ
       بی‌نهایتش با بدنه‌ی بزرگ، ژورنال را پر می‌کرد. */
    void audit({
      action: 'TOURNAMENT_PAYMENT_AUTHORITY_MISMATCH', entityType: 'tournament_registration',
      entityId: reg.id, ip: clientIp(req) ?? undefined,
      newValue: { expected: auth.slice(0, 32), got: String(authority).slice(0, 64) },
    });
    return back('failed', `&r=${reg.id}`);
  }

  /* ── دقیقا یک بار استعلام ──
     «لغو» ادعای درگاه است، نه حقیقت: از پارامترهای بازگشت با یک قاعده‌ی
     تقریبی ساخته می‌شود و امضا ندارد. پیش‌تر همان‌جا FAILED می‌نوشت و
     اصلا استعلام نمی‌کرد — اگر پول رفته بود، کسی نمی‌فهمید. حالا تصمیم
     را استعلام می‌گیرد؛ «لغو» فقط به درگاه گفته می‌شود. */
  const provider = getPaymentProvider(reg.provider || providerName);
  const v = await provider.verifyPayment({
    paymentId: reg.id,
    authority: auth,
    amount: reg.amount,          // مبلغ مورد انتظار از سفارش، نه از درخواست
    refId: ret.refId,
    canceled: ret.canceled,
  });

  if (!v.paid) {
    /* ⚠️ `!v.paid` به‌تنهایی «پرداخت نشد» نیست: ۴۰۱/۴۲۹/۵xxِ درگاه هم
       `paid: false` می‌دهند. فقط پاسخِ **قطعی** صندلی را آزاد می‌کند؛
       بقیه ثبت‌نام را همان‌طور نگه می‌دارند تا استعلامِ بعدی بتواند
       تأییدش کند. استثنا: درگاه خودش «لغو» گفته و کدِ رهگیری هم نداده —
       چنین پرداختی هرگز تأییدشدنی نیست. */
    const final = (v.ok && v.definitive) || (ret.canceled && !ret.refId);
    let releasedSeat = false;
    if (final) {
      /* شرط‌دار: فقط اگر هنوز در انتظارِ پرداخت است. تأییدِ هم‌زمان ردیف
         را قفل می‌کند؛ این UPDATE پشتِ قفل می‌ماند و بعد شرطش نمی‌خواند. */
      const { data: released } = await sb().from('tournament_registrations')
        .update({ status: 'EXPIRED', payment_status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('id', reg.id).eq('status', 'PENDING_PAYMENT').neq('payment_status', 'PAID')
        .select('id');
      releasedSeat = !!released && released.length > 0;
      /* صندلی آزاد شد ⇒ نفرِ اولِ صفِ انتظار */
      if (releasedSeat) void promoteWaitlist(reg.tournament_id);
    }
    void audit({
      action: 'TOURNAMENT_PAYMENT_FAILED', entityType: 'tournament_registration',
      entityId: reg.id, ip: clientIp(req) ?? undefined,
      /* `released` یعنی واقعا ردیفی آزاد شد، نه فقط اینکه قصدش بود */
      newValue: { message: v.message, canceled: ret.canceled, definitive: !!v.definitive, released: releasedSeat },
    });
    return back(ret.canceled ? 'cancelled' : 'failed', `&r=${reg.id}`);
  }

  const out = await confirmRegistrationPayment({
    registrationId: reg.id,
    expectedAmount: reg.amount,
    paidAmount: Number(v.amount ?? reg.amount),
    /* نامِ درگاهی که واقعا استعلام کرد — نه قطعه‌ی نشانی که هرکسی
       می‌تواند عوضش کند. */
    provider: provider.name,
    refId: String(v.refId ?? ''),
  });

  if (!out.ok) {
    void audit({
      action: 'TOURNAMENT_PAYMENT_REJECTED', entityType: 'tournament_registration',
      entityId: reg.id, newValue: { reason: out.reason, refundPending: !!out.refundPending, refId: v.refId },
      ip: clientIp(req) ?? undefined,
    });
    /* پول گرفته شده ولی صندلی نخرید. از ۱۰۹ دیتابیس همان‌جا پرداخت و
       درخواستِ بازپرداختش را ثبت کرده؛ این‌جا فقط پیامِ درست. */
    const state = out.reason === 'full_after_payment' ? 'full'
      : out.refundPending || REFUND_REASONS.has(out.reason ?? '') ? 'refund'
      : 'mismatch';
    return back(state, `&r=${reg.id}`);
  }

  void audit({
    action: 'TOURNAMENT_PAYMENT_CONFIRMED', entityType: 'tournament_registration',
    entityId: reg.id, newValue: { amount: reg.amount, refId: v.refId },
    ip: clientIp(req) ?? undefined,
  });

  /* ثبت‌نام قطعی شد ⇒ رسید پیامکی — فقط بارِ اول. کالبکِ تکراری
     (پی‌پینگ POST می‌زند و کاربر رفرش می‌کند) پیامکِ دوم نفرستد. */
  if (!out.idempotent) {
    /* بی‌صدا، چون شکست پیامک نباید پرداخت موفق را به صفحه‌ی خطا ببرد. */
    void notifyTournamentRegistered(reg.id).catch(() => { /* بی‌صدا */ });
    /* و خبر همین ثبت‌نام برای برگزارکننده، با شمارنده‌ی ظرفیت */
    void notifyOrganizerOfRegistration(reg.id).catch(() => { /* بی‌صدا */ });
  }

  return back('ok', `&r=${reg.id}`);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}

/* بعضی درگاه‌ها با POST مرورگری برمی‌گردند */
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}
