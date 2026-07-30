export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb } from '@/lib/finance/db';
import { listMatches, buildBracket } from '@/lib/tournaments/matches';
import { getTournament } from '@/lib/tournaments/server';

/* براکتِ یک مسابقه.

   GET  عمومی است — براکت، لایو و نتایج همه برای تماشاگر هستند.
   POST قرعه‌کشی می‌کند و فقط از مالکِ باشگاه پذیرفته می‌شود.
   DELETE براکت را برای قرعه‌کشیِ دوباره پاک می‌کند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ownerGuard(req: NextRequest, tournamentId: string) {
  const actor = await actorOf(req);
  if (!actor) return { err: NextResponse.json(UNAUTHENTICATED, { status: 401 }) };
  const t = await getTournament(tournamentId);
  if (!t) return { err: NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 }) };
  if (!(await ownsClub(actor, t.club_id))) return { err: NextResponse.json(FORBIDDEN, { status: 403 }) };
  return { actor, tournament: t };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });

  const matches = await listMatches(id);
  const bracket = buildBracket(matches);

  return NextResponse.json(
    { tournament: t, matches, ...bracket },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

/* POST { shuffle?: boolean } — قرعه‌کشی */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const g = await ownerGuard(req, id);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({}));
  const shuffle = b?.shuffle !== false;

  /* کلِ براکت در یک تراکنش ساخته می‌شود — براکتِ نصفه از نبودش بدتر است */
  const { data, error } = await sb().rpc('bh_tournament_draw', {
    p_tournament_id: id, p_shuffle: shuffle,
  });
  if (error) {
    console.error('[tournaments/draw]', error.message);
    return NextResponse.json({ message: 'قرعه‌کشی انجام نشد' }, { status: 500 });
  }

  const res = data as { ok: boolean; message?: string; code?: string };
  if (!res?.ok) return NextResponse.json(res ?? { message: 'قرعه‌کشی انجام نشد' }, { status: 409 });

  return NextResponse.json(res, { status: 201 });
}

/* DELETE — پاک‌کردنِ براکت برای قرعه‌کشیِ دوباره */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const g = await ownerGuard(req, id);
  if (g.err) return g.err;

  const { data, error } = await sb().rpc('bh_tournament_reset_bracket', { p_tournament_id: id });
  if (error) return NextResponse.json({ message: 'حذفِ براکت انجام نشد' }, { status: 500 });

  return NextResponse.json(data);
}
