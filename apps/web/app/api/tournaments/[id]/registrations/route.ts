export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { rpc, audit, clientIp } from '@/lib/finance/db';
import { getTournament, registrationsOf, forOrganizer, seatsLeft } from '@/lib/tournaments/server';
import { promoteWaitlist } from '@/lib/tournaments/waitlist';

/* فهرستِ ثبت‌نام‌کنندگانِ یک مسابقه — فقط برای برگزارکننده.

   مالکیت از دیتابیس اثبات می‌شود (`ownsClub`)، نه از هر شناسه‌ای که
   کلاینت بفرستد. `forOrganizer` هم فقط فیلدهای مجاز را بیرون می‌دهد:
   شماره‌ی پیگیریِ تراکنش می‌آید ولی هیچ اطلاعاتِ بانکی در کار نیست —
   اصلاً چنین چیزی ذخیره نمی‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guard(req: NextRequest, tournamentId: string) {
  if (!UUID.test(tournamentId)) {
    return { error: NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 }) };
  }
  const actor = await actorOf(req);
  if (!actor) return { error: NextResponse.json(UNAUTHENTICATED, { status: 401 }) };

  const t = await getTournament(tournamentId);
  if (!t) return { error: NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 }) };

  if (!(await ownsClub(actor, t.club_id))) {
    return { error: NextResponse.json(FORBIDDEN, { status: 403 }) };
  }
  return { actor, tournament: t };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.error) return g.error;

  const rows = await registrationsOf(id);
  const confirmed = rows.filter(r => r.status === 'CONFIRMED');

  return NextResponse.json({
    tournament: {
      id: g.tournament!.id, title: g.tournament!.title,
      maxPlayers: g.tournament!.max_players, entryFee: g.tournament!.entry_fee,
      status: g.tournament!.status,
    },
    seatsLeft: await seatsLeft(id),
    counts: {
      total: rows.length,
      confirmed: confirmed.length,
      pending: rows.filter(r => r.status === 'PENDING_PAYMENT').length,
      refunded: rows.filter(r => r.status === 'REFUNDED').length,
    },
    /* جمعِ مالی — بر پایه‌ی ثبت‌نام‌های قطعی */
    totals: {
      gross: confirmed.reduce((s, r) => s + r.amount, 0),
      refunded: rows.reduce((s, r) => s + r.refund_amount, 0),
    },
    registrations: rows.map(forOrganizer),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* بازپرداختِ یک ثبت‌نام توسطِ برگزارکننده.

   خودِ انتقالِ پول به عهده‌ی درگاه است و تا نبودِ API رسمیِ آن انجام
   نمی‌شود؛ این‌جا فقط وضعیت و دفترِ مالی به‌روز می‌شوند. عمداً وانمود
   نمی‌کنیم پولی برگشته است. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.error) return g.error;

  const b = await req.json().catch(() => ({}));
  const registrationId = String(b?.registrationId ?? '');
  if (!UUID.test(registrationId)) {
    return NextResponse.json({ message: 'شناسه‌ی ثبت‌نام معتبر نیست' }, { status: 400 });
  }

  /* ثبت‌نام باید متعلق به همین مسابقه باشد — وگرنه مالکِ یک باشگاه
     می‌توانست ثبت‌نامِ باشگاهِ دیگری را بازپرداخت کند. */
  const rows = await registrationsOf(id);
  const target = rows.find(r => r.id === registrationId);
  if (!target) return NextResponse.json({ message: 'ثبت‌نام در این مسابقه پیدا نشد' }, { status: 404 });

  const amount = Math.max(0, Math.min(Math.round(Number(b?.amount) || target.amount), target.amount));
  const { data, error } = await rpc<{ ok: boolean; reason?: string; idempotent?: boolean }>(
    'bh_tournament_refund',
    { p_registration: registrationId, p_amount: amount, p_reason: String(b?.reason ?? 'لغو توسط برگزارکننده').slice(0, 300) },
  );

  if (error || !data?.ok) {
    return NextResponse.json({ message: data?.reason === 'not_paid' ? 'این ثبت‌نام پرداخت‌نشده است' : 'بازپرداخت انجام نشد' }, { status: 400 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'TOURNAMENT_REFUNDED',
    entityType: 'tournament_registration', entityId: registrationId,
    newValue: { amount }, ip: clientIp(req) ?? undefined,
  });

  /* یک صندلی آزاد شد ⇒ نفرِ اولِ صفِ انتظار بالا می‌آید.
     بدونِ این، لیستِ انتظار فقط یک فهرستِ بی‌اثر می‌بود. */
  const promoted = await promoteWaitlist(id);

  return NextResponse.json({
    ok: true, idempotent: data.idempotent ?? false,
    promoted,
    message: 'وضعیتِ بازپرداخت ثبت شد. انتقالِ وجه پس از فعال‌شدنِ درگاه انجام می‌شود.',
  });
}
