export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit, clientIp } from '@/lib/finance/db';

/* مسابقاتِ باشگاه‌ها برای ادمین.

   چرا این مسیر لازم بود: `/admin/events` جدولِ `events` را می‌خواند —
   رویدادهای محتوایی که ادمین دستی می‌سازد. مسابقاتی که باشگاه‌ها
   می‌سازند در جدولِ `tournaments` هستند و هیچ‌جای پنلِ ادمین دیده
   نمی‌شدند. یعنی مسابقه‌ای با ثبت‌نام و پول، بدونِ هیچ نظارتی. */

const STATUSES = new Set([
  'draft', 'published', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
]);

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') ?? '';
  const clubId = req.nextUrl.searchParams.get('clubId') ?? '';

  let q = sb().from('tournaments').select('*').order('created_at', { ascending: false }).limit(300);
  if (status) q = q.eq('status', status);
  if (clubId) q = q.eq('club_id', clubId);

  const { data, error } = await q;
  if (error) {
    console.error('[admin/tournaments]', error.message);
    return NextResponse.json({ message: 'خواندن مسابقات انجام نشد' }, { status: 500 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = rows.map(r => String(r.id));

  const [clubs, regs] = await Promise.all([
    sb().from('clubs').select('id,name'),
    ids.length
      ? sb().from('tournament_registrations')
          .select('tournament_id,status,payment_status,amount,commission_amount,net_amount')
          .in('tournament_id', ids)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const clubName = new Map(((clubs.data ?? []) as Record<string, unknown>[])
    .map(c => [String(c.id), String(c.name)]));
  const regRows = ((regs as { data?: Record<string, unknown>[] }).data ?? []);

  const tournaments = rows.map(r => {
    const mine = regRows.filter(x => String(x.tournament_id) === String(r.id));
    const paid = mine.filter(x => x.payment_status === 'PAID' && x.status !== 'CANCELLED');
    return {
      ...r,
      clubName: clubName.get(String(r.club_id)) ?? '—',
      registrations: mine.length,
      paidRegistrations: paid.length,
      /* درآمدِ ناخالص و تفکیکش — همان اعدادی که در دفتر هم هست */
      grossRevenue: paid.reduce((s, x) => s + Number(x.amount || 0), 0),
      platformCommission: paid.reduce((s, x) => s + Number(x.commission_amount || 0), 0),
      clubShare: paid.reduce((s, x) => s + Number(x.net_amount || 0), 0),
    };
  });

  return NextResponse.json({
    tournaments,
    clubs: clubs.data ?? [],
    counts: [...STATUSES].reduce((acc, s) => {
      acc[s] = rows.filter(r => r.status === s).length; return acc;
    }, {} as Record<string, number>),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ادمین می‌تواند وضعیتِ مسابقه را عوض کند — مثلاً مسابقه‌ای که باشگاه
   رهایش کرده یا محتوایش نامناسب است. برخلافِ مسیرِ باشگاه، این‌جا
   محدودیتِ گذر نداریم چون ادمین باید بتواند هر وضعیتِ گیرکرده‌ای را
   درست کند؛ ولی هر تغییر در ممیزی ثبت می‌شود. */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(b.id ?? '');
  const status = String(b.status ?? '');
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });
  if (!STATUSES.has(status)) return NextResponse.json({ message: 'وضعیت نامعتبر است' }, { status: 400 });

  const { data: before } = await sb().from('tournaments').select('*').eq('id', id).maybeSingle();
  if (!before) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });

  /* بردنِ مسابقه‌ی دارای ثبت‌نامِ پرداخت‌شده به پیش‌نویس یعنی رویدادی که
     مردم پولش را داده‌اند از سایت غیب شود. راهِ درستش لغو است. */
  if (status === 'draft') {
    const { count } = await sb().from('tournament_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', id).eq('payment_status', 'PAID');
    if ((count ?? 0) > 0) {
      return NextResponse.json({
        message: `این مسابقه ${count} ثبت‌نامِ پرداخت‌شده دارد و به پیش‌نویس برنمی‌گردد. آن را لغو کنید.`,
      }, { status: 409 });
    }
  }

  const { data, error } = await sb().from('tournaments')
    .update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) {
    console.error('[admin/tournaments] update', error.message);
    return NextResponse.json({ message: 'تغییر وضعیت انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'TOURNAMENT_STATUS_CHANGED_BY_ADMIN',
    entityType: 'tournament', entityId: id,
    oldValue: { status: (before as { status: string }).status },
    newValue: { status },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, tournament: data });
}
