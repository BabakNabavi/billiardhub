export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { getTournament } from '@/lib/tournaments/server';

/* لیستِ انتظارِ مسابقه.

   تا امروز ثبت‌نام در مسابقه‌ی پر فقط «ظرفیت تکمیل است» می‌گرفت و
   کاربر باید هر چند ساعت دستی سر می‌زد ببیند جا باز شده یا نه.

   جای صف اتمیک گرفته می‌شود (`bh_tournament_waitlist_join`): دو
   درخواستِ همزمان نمی‌توانند یک شماره بگیرند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* GET — وضعیتِ صف: جایگاهِ من، و برای مالکِ باشگاه کلِ فهرست */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });

  const { count } = await sb().from('tournament_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', id).eq('status', 'WAITLIST');

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json({ waiting: count ?? 0, myPosition: null });

  const { data: mine } = await sb().from('tournament_registrations')
    .select('id,status,waitlist_position')
    .eq('tournament_id', id).eq('user_id', actor.id).maybeSingle();
  const m = mine as { id: string; status: string; waitlist_position: number | null } | null;

  /* مالکِ باشگاه کلِ صف را می‌بیند تا بداند چند نفر منتظرند */
  let queue: { position: number; name: string | null }[] | undefined;
  if (await ownsClub(actor, t.club_id)) {
    const { data: all } = await sb().from('tournament_registrations')
      .select('player_name,waitlist_position')
      .eq('tournament_id', id).eq('status', 'WAITLIST')
      .order('waitlist_position', { ascending: true });
    queue = ((all ?? []) as { player_name: string | null; waitlist_position: number }[])
      .map(r => ({ position: r.waitlist_position, name: r.player_name }));
  }

  return NextResponse.json({
    waiting: count ?? 0,
    myPosition: m?.status === 'WAITLIST' ? m.waitlist_position : null,
    myStatus: m?.status ?? null,
    ...(queue ? { queue } : {}),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* POST — پیوستن به صف */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => ({}));

  const { data, error } = await sb().rpc('bh_tournament_waitlist_join', {
    p_tournament: id,
    p_user: actor.id,
    p_name: String(b?.playerName ?? '').slice(0, 120),
    p_phone: String(b?.phone ?? '').replace(/\D/g, '').slice(0, 15),
  });

  if (error) {
    console.error('[waitlist/join]', error.message);
    return NextResponse.json({ message: 'پیوستن به لیستِ انتظار انجام نشد' }, { status: 500 });
  }

  const res = data as { ok: boolean; message?: string; position?: number };
  if (!res?.ok) return NextResponse.json(res, { status: 409 });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'TOURNAMENT_WAITLIST_JOINED',
    entityType: 'tournament', entityId: id,
    newValue: { position: res.position }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json(res, { status: 201 });
}

/* DELETE — ترکِ صف */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const { data, error } = await sb().rpc('bh_tournament_waitlist_leave', {
    p_tournament: id, p_user: actor.id,
  });
  if (error) return NextResponse.json({ message: 'خروج از لیستِ انتظار انجام نشد' }, { status: 500 });

  const res = data as { ok: boolean; message?: string };
  return NextResponse.json(res, { status: res?.ok ? 200 : 409 });
}
