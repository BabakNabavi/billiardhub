export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';
import { audit, clientIp, sb } from '@/lib/finance/db';
import { getTournament, registerForTournament, seatsLeft } from '@/lib/tournaments/server';
import { getPaymentProvider, hasRealGateway } from '@/lib/payments';

/* ثبت‌نام در مسابقه + شروع پرداخت.

   ترتیب کار عمداً همین است:
     ۱) هویت از نشست
     ۲) سفارش در دیتابیس ساخته می‌شود و مبلغ **همان‌جا** از جدول
        مسابقه خوانده و Snapshot می‌شود
     ۳) تازه بعد از آن به درگاه می‌رویم

   هر مبلغی که کلاینت بفرستد نادیده گرفته می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REASON_FA: Record<string, string> = {
  not_found: 'مسابقه پیدا نشد',
  registration_closed: 'ثبت‌نام این مسابقه باز نیست',
  deadline_passed: 'مهلت ثبت‌نام تمام شده است',
  already_registered: 'شما قبلاً در این مسابقه ثبت‌نام کرده‌اید',
  full: 'ظرفیت مسابقه تکمیل است',
  server_error: 'ثبت‌نام انجام نشد',
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const rl = await hitRateLimit(req, { action: 'tournament_register', max: 10, windowSec: 600 }, actor.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  /* نام نمایشی از پروفایل خوانده می‌شود؛ آنچه کلاینت می‌فرستد فقط
     برای نمایش است و روی مبلغ یا مالکیت اثری ندارد. */
  const { data: me } = await sb().from('users')
    .select('"firstName","lastName",phone').eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as { firstName?: string; lastName?: string; phone?: string };
  const playerName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
    || String(body?.playerName ?? '').slice(0, 120)
    || 'بازیکن';

  const out = await registerForTournament(id, actor.id, playerName, u.phone ?? '');
  if (!out.ok) {
    const msg = REASON_FA[out.reason ?? 'server_error'] ?? 'ثبت‌نام انجام نشد';
    const code = out.reason === 'full' ? 409
      : out.reason === 'already_registered' ? 409
      : out.reason === 'not_found' ? 404 : 400;
    return NextResponse.json({ message: msg, reason: out.reason }, { status: code });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'TOURNAMENT_REGISTERED',
    entityType: 'tournament_registration', entityId: out.registrationId ?? '',
    newValue: { tournamentId: id, amount: out.amount }, ip: clientIp(req) ?? undefined,
  });

  /* مسابقه‌ی رایگان — همان‌جا قطعی شد، درگاهی لازم نیست */
  if (out.free) {
    return NextResponse.json({
      ok: true, free: true, registrationId: out.registrationId,
      message: 'ثبت‌نام شما قطعی شد.',
    });
  }

  /* ── پرداخت ──
     عمداً `hasRealGateway()` پرسیده می‌شود، نه `isConfigured()`:
     رجیستری درگاه وقتی چیزی تنظیم نباشد به mock برمی‌گردد و mock
     همیشه «پیکربندی‌شده» است. تکیه بر آن یعنی اعلام «پرداخت موفق»
     بدون جابه‌جایی ریالی — همان اشتباهی که این ماژول قبلاً داشت. */
  if (!hasRealGateway()) {
    /* صادقانه: سفارش ساخته شد ولی درگاه فعال نیست. هیچ رسید ساختگی
       صادر نمی‌شود و ثبت‌نام در PENDING_PAYMENT می‌ماند. */
    return NextResponse.json({
      ok: false, pendingPayment: true, registrationId: out.registrationId,
      amount: out.amount,
      message: 'پرداخت آنلاین هنوز فعال نشده است. ثبت‌نام شما در انتظار پرداخت ثبت شد؛ برای هماهنگی با باشگاه تماس بگیرید.',
    }, { status: 503 });
  }

  const provider = getPaymentProvider();
  const origin = callbackOrigin();
  const pay = await provider.createPayment({
    paymentId: out.registrationId!,
    amount: out.amount ?? 0,
    description: `ثبت‌نام در ${t.title}`,
    callbackUrl: `${origin}/api/tournaments/callback/${provider.name}`,
    mobile: u.phone,
  });

  if (!pay.ok || !pay.redirectUrl) {
    return NextResponse.json({ message: pay.message ?? 'اتصال به درگاه انجام نشد' }, { status: 502 });
  }

  await sb().from('tournament_registrations').update({
    payment_status: 'INITIATED', provider: provider.name,
    provider_authority: pay.authority ?? null, updated_at: new Date().toISOString(),
  }).eq('id', out.registrationId);

  return NextResponse.json({
    ok: true, registrationId: out.registrationId, amount: out.amount,
    redirectUrl: pay.redirectUrl,
  });
}

/* وضعیت ظرفیت — برای نمایش در صفحه */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });
  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });
  return NextResponse.json({
    seatsLeft: await seatsLeft(id),
    maxPlayers: t.max_players,
    entryFee: t.entry_fee,
    status: t.status,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
