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

/* ساختِ مسابقه توسطِ ادمین — برای باشگاهی که خودش انتخاب می‌کند.
   بدنه: { clubId, title, entryFee, maxPlayers, startsAt?, discipline?, status? } */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const clubId = String(b.clubId ?? '');
  const title = String(b.title ?? '').trim();
  if (!clubId) return NextResponse.json({ message: 'باشگاه را انتخاب کنید' }, { status: 400 });
  if (!title) return NextResponse.json({ message: 'عنوان مسابقه الزامی است' }, { status: 400 });

  const { data: club } = await sb().from('clubs').select('id,name,city').eq('id', clubId).maybeSingle();
  if (!club) return NextResponse.json({ message: 'باشگاه پیدا نشد' }, { status: 404 });

  const status = STATUSES.has(String(b.status)) ? String(b.status) : 'registration_open';
  const entryFee = Math.max(0, Math.min(500_000_000, Math.round(Number(b.entryFee) || 0)));
  const maxPlayers = Math.max(2, Math.min(512, Math.round(Number(b.maxPlayers) || 16)));

  const startsAt = (() => {
    const s = String(b.startsAt ?? '').trim();
    if (!s) return null;
    const t = Date.parse(s);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  })();

  const c = club as { name?: string; city?: string };
  const { data, error } = await sb().from('tournaments').insert({
    club_id: clubId, created_by: actor.id, title,
    description: String(b.description ?? '').slice(0, 5000) || null,
    discipline: String(b.discipline ?? 'snooker'),
    max_players: maxPlayers, entry_fee: entryFee,
    venue: c.name ?? null, city: c.city ?? null,
    starts_at: startsAt, status,
  }).select().single();

  if (error) {
    console.error('[admin/tournaments] create', error.message);
    return NextResponse.json({ message: 'ثبت مسابقه انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'TOURNAMENT_CREATED_BY_ADMIN',
    entityType: 'tournament', entityId: String((data as { id: string }).id),
    newValue: { clubId, title, entryFee, status }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, tournament: data }, { status: 201 });
}

/* حذفِ فیزیکیِ مسابقه.
   فقط وقتی هیچ ثبت‌نامِ پرداخت‌شده‌ای ندارد: حذفِ مسابقه‌ای که پول
   جابه‌جا کرده، ردیف‌های دفتر را یتیم می‌کند و ردِ پول گم می‌شود.
   در آن حالت راهِ درست «لغو» است که سابقه را نگه می‌دارد. */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });

  const { data: t } = await sb().from('tournaments').select('*').eq('id', id).maybeSingle();
  if (!t) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });

  const { count: paid } = await sb().from('tournament_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', id).eq('payment_status', 'PAID');
  if ((paid ?? 0) > 0) {
    return NextResponse.json({
      message: `این مسابقه ${paid} ثبت‌نامِ پرداخت‌شده دارد و حذف نمی‌شود — سابقه‌ی مالی باید بماند. به‌جایش لغوش کنید.`,
    }, { status: 409 });
  }

  /* ثبت‌نام‌های پرداخت‌نشده مانعی ندارند و با خودِ مسابقه می‌روند */
  await sb().from('tournament_registrations').delete().eq('tournament_id', id);
  const { error } = await sb().from('tournaments').delete().eq('id', id);
  if (error) {
    console.error('[admin/tournaments] delete', error.message);
    return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'TOURNAMENT_DELETED_BY_ADMIN',
    entityType: 'tournament', entityId: id, oldValue: t, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true });
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
