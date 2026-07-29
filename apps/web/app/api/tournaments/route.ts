export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { listPublicTournaments, listClubTournaments, seatsLeft } from '@/lib/tournaments/server';

/* فهرستِ مسابقات + ساختِ مسابقه توسطِ باشگاه.

   ساخت فقط با اثباتِ مالکیتِ باشگاه از دیتابیس انجام می‌شود؛ `clubId`
   که کلاینت می‌فرستد تنها یک ادعاست و با `ownsClub` سنجیده می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES = new Set([
  'draft', 'published', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
]);

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get('clubId') ?? undefined;
  const mine = req.nextUrl.searchParams.get('mine') === '1';

  /* پنلِ باشگاه — شاملِ پیش‌نویس‌ها، فقط برای مالک */
  if (mine && clubId && UUID.test(clubId)) {
    const actor = await actorOf(req);
    if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
    if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403 });

    const rows = await listClubTournaments(clubId);
    const withSeats = await Promise.all(rows.map(async t => ({
      ...t, seatsLeft: await seatsLeft(t.id),
    })));
    return NextResponse.json({ tournaments: withSeats }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const rows = await listPublicTournaments(clubId && UUID.test(clubId) ? clubId : undefined);
  const withSeats = await Promise.all(rows.map(async t => ({
    ...t, seatsLeft: await seatsLeft(t.id),
  })));
  return NextResponse.json({ tournaments: withSeats }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const clubId = String(b?.clubId ?? '');
  if (!UUID.test(clubId)) return NextResponse.json({ message: 'باشگاه معتبر نیست' }, { status: 400 });

  /* مالکیت از دیتابیس، نه از ادعای کلاینت */
  if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const title = String(b?.title ?? '').trim();
  if (!title) return NextResponse.json({ message: 'عنوان مسابقه الزامی است' }, { status: 400 });

  const status = STATUSES.has(String(b?.status)) ? String(b.status) : 'draft';
  const maxPlayers = Math.max(2, Math.min(512, Math.round(Number(b?.maxPlayers) || 16)));
  const entryFee = Math.max(0, Math.min(500_000_000, Math.round(Number(b?.entryFee) || 0)));

  const row = {
    club_id: clubId,
    created_by: actor.id,
    title: title.slice(0, 200),
    description: String(b?.description ?? '').slice(0, 5000) || null,
    discipline: String(b?.discipline ?? 'snooker').slice(0, 40),
    max_players: maxPlayers,
    entry_fee: entryFee,
    prize: String(b?.prize ?? '').slice(0, 200) || null,
    venue: String(b?.venue ?? '').slice(0, 200) || null,
    province: String(b?.province ?? '').slice(0, 80) || null,
    city: String(b?.city ?? '').slice(0, 80) || null,
    starts_at: b?.startsAt || null,
    registration_ends_at: b?.registrationEndsAt || null,
    status,
  };

  const { data, error } = await sb().from('tournaments').insert(row).select().single();
  if (error) {
    console.error('[tournaments] insert:', error.message);
    return NextResponse.json({ message: 'ثبتِ مسابقه انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'TOURNAMENT_CREATED',
    entityType: 'tournament', entityId: String((data as { id?: string })?.id ?? ''),
    newValue: { clubId, title, entryFee }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ tournament: data }, { status: 201 });
}
