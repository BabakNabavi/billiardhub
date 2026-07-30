export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { notifyTournamentRegistered } from '@/lib/notify';
import { getPaymentProvider, hasRealGateway } from '@/lib/payments';
import { confirmRegistrationPayment } from '@/lib/tournaments/server';

/* بازگشت از درگاه برای ثبت‌نامِ مسابقه.

   چهار حفاظ که این مسیر را امن می‌کنند:

     ۱) **هیچ چیزی از کلاینت باور نمی‌شود.** نه مبلغ، نه وضعیت، نه
        «پرداخت شد». تنها ورودیِ معتبر، شناسه‌ی سفارش و authority است
        و صحتِ پرداخت را خودِ سرور از درگاه می‌پرسد.

     ۲) **مبلغ از سفارش خوانده می‌شود، نه از پاسخِ درگاه.** آنچه درگاه
        می‌گوید پرداخت شده، با Snapshotِ سفارش مقایسه می‌شود؛ اختلاف
        یعنی رد.

     ۳) **Idempotent.** تابعِ دیتابیس اگر ثبت‌نام از قبل CONFIRMED باشد
        دوباره کاری نمی‌کند. رفرشِ چندباره‌ی صفحه یا Callbackِ تکراری
        بی‌خطر است.

     ۴) **ضدِ Replay.** ایندکسِ یکتا روی provider_ref_id اجازه نمی‌دهد
        یک شماره‌ی پیگیری دو ثبت‌نام را تأیید کند.

   این مسیر در proxy.ts از CSRF معاف است (درگاه کوکیِ ما را ندارد)؛
   امنیت از راهِ verifyِ سرورساید می‌آید، نه از توکن. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function handle(req: NextRequest, providerName: string) {
  const url = new URL(req.url);
  const q = url.searchParams;

  /* شناسه‌ی سفارش را خودمان هنگامِ ساختِ پرداخت داده‌ایم */
  const registrationId = q.get('paymentId') || q.get('registrationId') || '';
  const authority = q.get('Authority') || q.get('authority') || q.get('token') || '';
  const result = (q.get('Status') || q.get('status') || '').toLowerCase();

  const back = (state: string, extra = '') =>
    NextResponse.redirect(`${url.origin}/tournaments/result?state=${state}${extra}`, { status: 303 });

  if (!UUID.test(registrationId)) return back('invalid');

  const { data: regRow } = await sb().from('tournament_registrations')
    .select('id,amount,status,payment_status,provider_authority,tournament_id')
    .eq('id', registrationId).maybeSingle();

  const reg = regRow as {
    id: string; amount: number; status: string; payment_status: string;
    provider_authority: string | null; tournament_id: string;
  } | null;

  if (!reg) return back('invalid');

  /* از قبل قطعی شده ⇒ همان نتیجه (رفرشِ صفحه‌ی بازگشت) */
  if (reg.status === 'CONFIRMED' && reg.payment_status === 'PAID') {
    return back('ok', `&r=${reg.id}`);
  }

  /* authority باید همانی باشد که خودمان ذخیره کرده‌ایم — وگرنه کسی
     می‌تواند با authorityِ پرداختِ دیگری این سفارش را تأیید کند. */
  if (reg.provider_authority && authority && reg.provider_authority !== authority) {
    void audit({
      action: 'TOURNAMENT_PAYMENT_AUTHORITY_MISMATCH', entityType: 'tournament_registration',
      entityId: reg.id, ip: clientIp(req) ?? undefined,
    });
    return back('failed', `&r=${reg.id}`);
  }

  /* کاربر در درگاه انصراف داد */
  if (result && result !== 'ok' && result !== 'success') {
    await sb().from('tournament_registrations')
      .update({ payment_status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', reg.id);
    return back('cancelled', `&r=${reg.id}`);
  }

  const provider = getPaymentProvider();
  const v = await provider.verifyPayment({
    paymentId: reg.id,
    authority: authority || reg.provider_authority || '',
    amount: reg.amount,          // مبلغِ موردِ انتظار از سفارش، نه از درخواست
  });

  if (!v.ok || !v.paid) {
    await sb().from('tournament_registrations')
      .update({ payment_status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', reg.id);
    void audit({
      action: 'TOURNAMENT_PAYMENT_FAILED', entityType: 'tournament_registration',
      entityId: reg.id, newValue: { message: v.message }, ip: clientIp(req) ?? undefined,
    });
    return back('failed', `&r=${reg.id}`);
  }

  const out = await confirmRegistrationPayment({
    registrationId: reg.id,
    expectedAmount: reg.amount,
    paidAmount: Number(v.amount ?? reg.amount),
    provider: providerName,
    refId: String(v.refId ?? ''),
  });

  if (!out.ok) {
    void audit({
      action: 'TOURNAMENT_PAYMENT_REJECTED', entityType: 'tournament_registration',
      entityId: reg.id, newValue: { reason: out.reason }, ip: clientIp(req) ?? undefined,
    });
    /* پول گرفته شده ولی نتوانستیم قطعی کنیم (مثلاً ظرفیت پر شد یا
       مبلغ نخواند) — نیازمندِ بازپرداخت است و باید دیده شود. */
    return back(out.reason === 'full_after_payment' ? 'full' : 'mismatch', `&r=${reg.id}`);
  }

  void audit({
    action: 'TOURNAMENT_PAYMENT_CONFIRMED', entityType: 'tournament_registration',
    entityId: reg.id, newValue: { amount: reg.amount, refId: v.refId },
    ip: clientIp(req) ?? undefined,
  });

  /* ثبت‌نام قطعی شد ⇒ رسیدِ پیامکی. بی‌صدا، چون شکستِ پیامک نباید
     پرداختِ موفق را به صفحه‌ی خطا ببرد. */
  void notifyTournamentRegistered(reg.id).catch(() => { /* بی‌صدا */ });

  return back('ok', `&r=${reg.id}`);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}

/* بعضی درگاه‌ها با POSTِ مرورگری برمی‌گردند */
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  return handle(req, provider);
}
