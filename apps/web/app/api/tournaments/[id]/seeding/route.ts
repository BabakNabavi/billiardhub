export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getTournament } from '@/lib/tournaments/server';

/* چیدنِ دستیِ براکت — فقط برگزارکننده.
 *
 * ── چرا مسیرِ جدا از `/matches` ──
 * آن مسیر ساختِ براکت و ثبتِ نتیجه است؛ این‌جا فقط جای بازیکن‌ها
 * عوض می‌شود. یکی‌کردنشان یعنی یک مسیر با چهار کارِ متفاوت و چهار
 * شکلِ بدنه، که هر تغییری در یکی می‌تواند بقیه را بشکند.
 *
 * ── چرا همه‌چیز در تابعِ دیتابیس ──
 * جابه‌جایی باید اتمیک باشد: اگر بینِ خواندنِ دو جایگاه و نوشتنشان
 * چیزی عوض شود، یک بازیکن دو جا می‌افتد و یکی حذف می‌شود. قفلِ
 * ردیف فقط در دیتابیس ممکن است.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REASONS: Record<string, string> = {
  already_started: 'نتیجه‌ای ثبت شده — دیگر نمی‌شود جایگاه‌ها را جابه‌جا کرد',
  not_first_round: 'فقط جایگاه‌های دور اول قابل جابه‌جایی‌اند',
  match_not_found: 'بازی پیدا نشد',
  registration_not_found: 'ثبت‌نام پیدا نشد',
  already_placed: 'این بازیکن از قبل در براکت جای دارد',
  bad_slot: 'جایگاه معتبر نیست',
  both_bye: 'هر دو طرفِ یک بازی نمی‌توانند بای باشند — آن بازی هیچ‌وقت برگزار نمی‌شود',
  empty_match: 'هنوز جایگاهِ بلاتکلیف مانده — یا بازیکن بگذارید یا بای',
};

async function guard(req: NextRequest, tournamentId: string) {
  if (!UUID.test(tournamentId)) {
    return { err: NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 }) };
  }
  const actor = await actorOf(req);
  if (!actor) return { err: NextResponse.json(UNAUTHENTICATED, { status: 401 }) };
  const t = await getTournament(tournamentId);
  if (!t) return { err: NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 }) };
  if (!(await ownsClub(actor, t.club_id))) return { err: NextResponse.json(FORBIDDEN, { status: 403 }) };
  return { actor, tournament: t };
}

/* GET — بازیکنانی که هنوز در براکت جایی ندارند («استخر»).
 *
 * بدونِ این فهرست، برگزارکننده باید خودش ثبت‌نام‌ها را با جایگاه‌های
 * پرشده مقایسه کند تا بفهمد چه کسی جا مانده. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;

  const [{ data: regs }, { data: ms }] = await Promise.all([
    sb().from('tournament_registrations')
      .select('id,player_name,source,status')
      .eq('tournament_id', id).eq('status', 'CONFIRMED')
      .order('created_at', { ascending: true }),
    sb().from('tournament_matches')
      .select('p1_registration_id,p2_registration_id')
      .eq('tournament_id', id),
  ]);

  const placed = new Set<string>();
  for (const m of (ms ?? []) as Record<string, string | null>[]) {
    if (m.p1_registration_id) placed.add(m.p1_registration_id);
    if (m.p2_registration_id) placed.add(m.p2_registration_id);
  }

  const all = ((regs ?? []) as { id: string; player_name: string | null; source: string }[])
    .map(r => ({ id: r.id, name: r.player_name ?? 'بی‌نام', source: r.source ?? 'online' }));

  return NextResponse.json({
    pool: all.filter(r => !placed.has(r.id)),
    placedCount: placed.size,
    confirmed: all.length,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* PATCH — یکی از سه کار:
 *   { action:'swap',  a:{matchId,slot}, b:{matchId,slot} }
 *   { action:'place', matchId, slot, registrationId|null }
 *   { action:'clear' }                       همه‌ی جایگاه‌های دور اول
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(b.action ?? '');

  const fail = (reason?: string, status = 400) =>
    NextResponse.json({ message: REASONS[reason ?? ''] ?? 'جابه‌جایی انجام نشد', reason }, { status });

  if (action === 'swap') {
    const a = b.a as { matchId?: string; slot?: number } | undefined;
    const c = b.b as { matchId?: string; slot?: number } | undefined;
    if (!UUID.test(String(a?.matchId)) || !UUID.test(String(c?.matchId))) return fail('match_not_found');

    const { data, error } = await rpc<{ ok: boolean; reason?: string }>('bh_bracket_swap_slots', {
      p_tournament: id, p_actor: g.actor!.id,
      p_match_a: a!.matchId, p_slot_a: Number(a!.slot),
      p_match_b: c!.matchId, p_slot_b: Number(c!.slot),
    });
    if (error || !data?.ok) return fail(data?.reason, data?.reason === 'already_started' ? 409 : 400);

    void audit({
      actorId: g.actor!.id, actorRole: g.actor!.role, action: 'BRACKET_SLOT_SWAPPED',
      entityType: 'tournament', entityId: id, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json(data);
  }

  if (action === 'place') {
    const matchId = String(b.matchId ?? '');
    if (!UUID.test(matchId)) return fail('match_not_found');
    const regRaw = b.registrationId;
    const registrationId = regRaw === null || regRaw === undefined || regRaw === ''
      ? null : String(regRaw);
    if (registrationId !== null && !UUID.test(registrationId)) return fail('registration_not_found');

    const { data, error } = await rpc<{ ok: boolean; reason?: string }>('bh_bracket_place', {
      p_tournament: id, p_match: matchId, p_slot: Number(b.slot),
      p_registration: registrationId, p_actor: g.actor!.id,
      p_bye: b.bye === true,
    });
    if (error || !data?.ok) return fail(data?.reason, data?.reason === 'already_started' ? 409 : 400);

    void audit({
      actorId: g.actor!.id, actorRole: g.actor!.role, action: 'BRACKET_SLOT_PLACED',
      entityType: 'tournament', entityId: id, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json(data);
  }

  if (action === 'clear') {
    const { data, error } = await rpc<{ ok: boolean; reason?: string }>('bh_bracket_clear_slots', {
      p_tournament: id,
    });
    if (error || !data?.ok) return fail(data?.reason, data?.reason === 'already_started' ? 409 : 400);

    void audit({
      actorId: g.actor!.id, actorRole: g.actor!.role, action: 'BRACKET_SLOTS_CLEARED',
      entityType: 'tournament', entityId: id, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json(data);
  }

  if (action === 'finalize') {
    /* بای‌ها بسته می‌شوند و برنده‌شان صعود می‌کند — همان کاری که
       قرعه‌کشیِ خودکار در لحظه‌ی ساخت می‌کند. بدونِ این، جدولی که
       دستی چیده شده جایگاه‌های دورِ دوم را خالی نگه می‌دارد. */
    const { data, error } = await rpc<{ ok: boolean; reason?: string; count?: number }>(
      'bh_bracket_finalize', { p_tournament: id },
    );
    if (error || !data?.ok) {
      const msg = data?.reason === 'empty_match'
        ? `${data.count} بازی هنوز هیچ بازیکنی ندارد — چیدمان کامل نیست`
        : REASONS[data?.reason ?? ''] ?? 'تأیید چیدمان انجام نشد';
      return NextResponse.json({ message: msg, reason: data?.reason }, { status: 400 });
    }

    void audit({
      actorId: g.actor!.id, actorRole: g.actor!.role, action: 'BRACKET_FINALIZED',
      entityType: 'tournament', entityId: id, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json(data);
  }

  return NextResponse.json({ message: 'عملیات نامشخص' }, { status: 400 });
}
