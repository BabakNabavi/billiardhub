export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* «رویداد اصلی» صفحه‌ی مسابقات — انتخاب و برداشتنِ آن.
 *
 * ── چرا مسیرِ جدا و چرا فقط ادمین ──
 * بیلبوردِ بالای صفحه‌ی مسابقات تا امروز این‌طور پر می‌شد:
 *
 *     all.find(t => t.status === 'registration_open')
 *
 * یعنی اولین ردیفِ فهرست، که ترتیبش بر اساسِ تاریخِ شروع بود. پس هر
 * باشگاهی که مسابقه‌اش زودتر برگزار می‌شد، بی‌آنکه کسی تصمیم بگیرد
 * بزرگ‌ترین جای صفحه را می‌گرفت — جایگاهی که ارزشِ تبلیغاتی دارد و
 * نباید قرعه‌کشی باشد.
 *
 * انتخاب هم عمداً در مسیرِ باشگاه نیست: اگر باشگاه‌دار بتواند
 * مسابقه‌ی خودش را «اصلی» کند، همه می‌کنند و پرچم بی‌معنی می‌شود.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'tournaments'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const { data } = await sb().from('tournaments')
    .select('id,title,club_id,status,starts_at,featured_at')
    .eq('is_featured', true).maybeSingle();

  return NextResponse.json({ featured: data ?? null }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

/* PUT { tournamentId } — انتخاب. `null` یعنی برداشتنِ رویداد اصلی. */
export async function PUT(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'tournaments'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const raw = b.tournamentId;
  const id = raw === null || raw === undefined || raw === '' ? null : String(raw);

  if (id !== null && !UUID.test(id)) {
    return NextResponse.json({ message: 'شناسه‌ی مسابقه معتبر نیست' }, { status: 400 });
  }

  /* برداشتنِ پرچمِ قبلی و زدنِ تازه در یک تراکنش انجام می‌شود —
     وگرنه ایندکسِ یکتا وسطِ کار یکی را رد می‌کند. */
  const { data, error } = await rpc<{ ok: boolean; reason?: string; status?: string }>(
    'bh_set_featured_tournament', { p_tournament: id, p_actor: actor.id },
  );

  if (error || !data?.ok) {
    const msg = data?.reason === 'not_found' ? 'مسابقه پیدا نشد'
      : data?.reason === 'not_public' ? 'مسابقه‌ی پیش‌نویس یا لغوشده رویداد اصلی نمی‌شود'
      : 'انتخاب رویداد اصلی انجام نشد';
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'TOURNAMENT_FEATURED_SET',
    entityType: 'tournament', entityId: id ?? '',
    newValue: { featured: id }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, featured: id });
}
