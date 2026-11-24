export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb } from '@/lib/finance/db';
import { listMatches, buildBracket } from '@/lib/tournaments/matches';
import { getTournament, VIEWABLE_STATUSES } from '@/lib/tournaments/server';
import { REFRESH_COOKIE } from '@/lib/auth/constants';

/* براکت یک مسابقه.

   GET  عمومی است — براکت، لایو و نتایج همه برای تماشاگر هستند.
   POST قرعه‌کشی می‌کند و فقط از مالک باشگاه پذیرفته می‌شود.
   DELETE براکت را برای قرعه‌کشی دوباره پاک می‌کند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ownerGuard(req: NextRequest, tournamentId: string) {
  const actor = await actorOf(req);
  if (!actor) return { err: NextResponse.json(UNAUTHENTICATED, { status: 401 }) };
  const t = await getTournament(tournamentId);
  if (!t) return { err: NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 }) };
  if (!(await ownsClub(actor, t.club_id, 'tournaments'))) return { err: NextResponse.json(FORBIDDEN, { status: 403 }) };
  return { actor, tournament: t };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });
  /* ⚠️ همان قاعده‌ی GET /api/tournaments/[id] (آذرِ ۱۴۰۵): تا امروز این مسیر وضعیت را
     نمی‌سنجید و جدول و نامِ بازیکنانِ مسابقه‌ی پیش‌نویس با داشتنِ شناسه برای هر کسی
     خوانده می‌شد. صاحبِ باشگاه (پنلِ برگزاری، قرعه‌کشی) و ادمین همچنان می‌بینند.
     ۴۰۴ نه ۴۰۳: ۴۰۳ خودش وجودِ مسابقه را تأیید می‌کرد. */
  if (!VIEWABLE_STATUSES.has(t.status)) {
    const actor = await actorOf(req);
    /* توکنِ دسترسیِ ۱۵ دقیقه‌ای منقضی ولی نشستِ تمدیدپذیر هست ⟵ ۴۰۱، تا apiFetch تمدید کند و
       دوباره بپرسد. با ۴۰۴ تمدیدی رخ نمی‌داد و برگزارکننده‌ی پیش‌نویس در پنلِ برگزاری
       «در دسترس نیست» می‌دید (بازبینی، آذرِ ۱۴۰۵). بی‌نشست همان ۴۰۴. */
    if (!actor && req.cookies.get(REFRESH_COOKIE)) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
    const allowed = !!actor && await ownsClub(actor, t.club_id, 'tournaments');
    if (!allowed) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });
  }

  const matches = await listMatches(id);
  const bracket = buildBracket(matches);

  /* ── شناسه‌ی ثبت‌نام فقط برای برگزارکننده (آذرِ ۱۴۰۵) ──
     همان شناسه مرجعِ پرداخت است (paymentId/clientRefId در callbackِ مسابقه) و از صفحه‌های
     عمومی هیچ‌کدام نمی‌خوانندش — فقط پنلِ قرعه‌کشی (BracketSeeding). جدول از ردیف‌های
     کامل ساخته و بعد پاک می‌شود، تا منطقِ قهرمان و استراحت همان بماند. */
  const actor = await actorOf(req);
  const organizer = !!actor && await ownsClub(actor, t.club_id, 'tournaments');
  if (organizer) {
    return NextResponse.json(
      { tournament: t, matches, ...bracket },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const hide = <M extends { p1_registration_id?: unknown; p2_registration_id?: unknown }>(m: M) =>
    ({ ...m, p1_registration_id: null, p2_registration_id: null });
  return NextResponse.json(
    {
      tournament: t,
      matches: matches.map(hide),
      ...bracket,
      rounds: bracket.rounds.map(r => ({ ...r, matches: r.matches.map(hide) })),
      champion: bracket.champion ? { ...bracket.champion, registrationId: null } : null,
    },
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
  /* حالت خالی: ساختار جدول ساخته می‌شود ولی جایگاه‌ها خالی می‌مانند
     تا برگزارکننده دستی بچیند. تا امروز تنها راه ساخت جدول،
     قرعه‌کشی تصادفی بود. */
  const empty = b?.empty === true;

  /* کل براکت در یک تراکنش ساخته می‌شود — براکت نصفه از نبودش بدتر است */
  const { data, error } = await sb().rpc('bh_tournament_draw', {
    p_tournament_id: id, p_shuffle: shuffle, p_empty: empty,
  });
  if (error) {
    console.error('[tournaments/draw]', error.message);
    return NextResponse.json({ message: 'قرعه‌کشی انجام نشد' }, { status: 500 });
  }

  const res = data as { ok: boolean; message?: string; code?: string };
  if (!res?.ok) return NextResponse.json(res ?? { message: 'قرعه‌کشی انجام نشد' }, { status: 409 });

  return NextResponse.json(res, { status: 201 });
}

/* DELETE — پاک‌کردن براکت برای قرعه‌کشی دوباره */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const g = await ownerGuard(req, id);
  if (g.err) return g.err;

  const { data, error } = await sb().rpc('bh_tournament_reset_bracket', { p_tournament_id: id });
  if (error) return NextResponse.json({ message: 'حذف براکت انجام نشد' }, { status: 500 });

  return NextResponse.json(data);
}
