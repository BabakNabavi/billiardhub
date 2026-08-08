export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { rpc, audit, clientIp } from '@/lib/finance/db';
import {
  getTournament, registrationsOf, forOrganizer, seatsLeft,
  addOfflineRegistration, removeOfflineRegistration, expireStalePending,
} from '@/lib/tournaments/server';
import { promoteWaitlist } from '@/lib/tournaments/waitlist';

/* فهرست ثبت‌نام‌کنندگان یک مسابقه — فقط برای برگزارکننده.

   مالکیت از دیتابیس اثبات می‌شود (`ownsClub`)، نه از هر شناسه‌ای که
   کلاینت بفرستد. `forOrganizer` هم فقط فیلدهای مجاز را بیرون می‌دهد:
   شماره‌ی پیگیری تراکنش می‌آید ولی هیچ اطلاعات بانکی در کار نیست —
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

  /* پیش از خواندنِ فهرست، سفارش‌های از مهلت‌گذشته منقضی می‌شوند —
     وگرنه برگزارکننده نامی را «در انتظار پرداخت» می‌بیند که ساعت‌ها
     پیش رهایش کرده‌اند و صندلی‌اش هنوز اشغال است. */
  await expireStalePending();

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
    /* جمع مالی — بر پایه‌ی ثبت‌نام‌های قطعی */
    totals: {
      gross: confirmed.reduce((s, r) => s + r.amount, 0),
      refunded: rows.reduce((s, r) => s + r.refund_amount, 0),
    },
    registrations: rows.map(forOrganizer),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ── PUT · افزودنِ ثبت‌نامِ حضوری ──────────────────────────────────
   کسی که تلفنی یا دمِ در ثبت‌نام می‌کند هم یک صندلی می‌گیرد. تا
   امروز باشگاه‌دار هیچ راهی برای واردکردنش نداشت، پس عددِ ظرفیت در
   سایت با واقعیتِ سالن نمی‌خواند: مسابقه‌ی ۱۶ نفره‌ای که ۱۰ نفرش
   حضوری آمده بودند، در سایت «۶ نفر» نشان می‌داد و شش صندلیِ
   ناموجود را هم می‌فروخت.

   ظرفیت در خودِ تابعِ دیتابیس و با قفلِ ردیف سنجیده می‌شود، پس
   افزودنِ دستی و پرداختِ آنلاین نمی‌توانند هم‌زمان از سقف رد شوند. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.error) return g.error;

  const b = await req.json().catch(() => ({}));
  const name = String(b?.playerName ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ message: 'نام بازیکن را وارد کنید' }, { status: 400 });
  }

  /* مبلغ اختیاری است: باشگاه‌دار ممکن است تخفیف داده باشد یا بازیکن
     مهمان باشد. نبودنش یعنی «همان ورودیِ مسابقه». */
  const rawAmount = b?.amount;
  const amount = rawAmount === undefined || rawAmount === null || rawAmount === ''
    ? null
    : Math.max(0, Math.round(Number(rawAmount) || 0));

  const out = await addOfflineRegistration({
    tournamentId: id,
    name,
    phone: String(b?.phone ?? '').trim(),
    amount,
    note: String(b?.note ?? '').trim(),
    actorId: g.actor!.id,
  });

  if (!out.ok) {
    const msg = out.reason === 'full' ? 'ظرفیت مسابقه تکمیل است'
      : out.reason === 'tournament_closed' ? 'این مسابقه دیگر ثبت‌نام نمی‌پذیرد'
      : out.reason === 'name_required' ? 'نام بازیکن را وارد کنید'
      : 'ثبت‌نام حضوری انجام نشد';
    return NextResponse.json({ message: msg, reason: out.reason }, { status: 400 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'TOURNAMENT_OFFLINE_ADDED',
    entityType: 'tournament_registration', entityId: String(out.registrationId ?? ''),
    newValue: { tournamentId: id }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({
    ok: true, registrationId: out.registrationId,
    seatsLeft: await seatsLeft(id),
  }, { status: 201 });
}

/* ── DELETE · حذفِ ثبت‌نامِ حضوری ──
   فقط ردیفِ حضوری. ثبت‌نامِ آنلاین پولِ واقعی پشتش دارد و مسیرش
   بازپرداخت است (`POST`) نه حذف — وگرنه ردِ تراکنش گم می‌شود و
   دفترِ مالی با درگاه نمی‌خواند. */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.error) return g.error;

  const registrationId = req.nextUrl.searchParams.get('registrationId') ?? '';
  if (!UUID.test(registrationId)) {
    return NextResponse.json({ message: 'شناسه‌ی ثبت‌نام معتبر نیست' }, { status: 400 });
  }

  /* باید متعلق به همین مسابقه باشد، وگرنه مالکِ یک باشگاه می‌توانست
     ثبت‌نامِ باشگاهِ دیگری را پاک کند. */
  const rows = await registrationsOf(id);
  const target = rows.find(r => r.id === registrationId);
  if (!target) return NextResponse.json({ message: 'ثبت‌نام در این مسابقه پیدا نشد' }, { status: 404 });

  const out = await removeOfflineRegistration(registrationId);
  if (!out.ok) {
    return NextResponse.json({
      message: out.reason === 'not_offline'
        ? 'این ثبت‌نام آنلاین است و باید بازپرداخت شود، نه حذف'
        : 'حذف انجام نشد',
    }, { status: 400 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'TOURNAMENT_OFFLINE_REMOVED',
    entityType: 'tournament_registration', entityId: registrationId,
    newValue: { tournamentId: id }, ip: clientIp(req) ?? undefined,
  });

  /* صندلی آزاد شد ⇒ نفر اولِ صفِ انتظار بالا می‌آید */
  const promoted = await promoteWaitlist(id);

  return NextResponse.json({ ok: true, promoted, seatsLeft: await seatsLeft(id) });
}

/* بازپرداخت یک ثبت‌نام توسط برگزارکننده.

   خود انتقال پول به عهده‌ی درگاه است و تا نبود API رسمی آن انجام
   نمی‌شود؛ این‌جا فقط وضعیت و دفتر مالی به‌روز می‌شوند. عمداً وانمود
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

  /* ثبت‌نام باید متعلق به همین مسابقه باشد — وگرنه مالک یک باشگاه
     می‌توانست ثبت‌نام باشگاه دیگری را بازپرداخت کند. */
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

  /* یک صندلی آزاد شد ⇒ نفر اول صف انتظار بالا می‌آید.
     بدون این، لیست انتظار فقط یک فهرست بی‌اثر می‌بود. */
  const promoted = await promoteWaitlist(id);

  return NextResponse.json({
    ok: true, idempotent: data.idempotent ?? false,
    promoted,
    message: 'وضعیت بازپرداخت ثبت شد. انتقال وجه پس از فعال‌شدن درگاه انجام می‌شود.',
  });
}
