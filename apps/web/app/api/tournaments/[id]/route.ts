export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { getTournament } from '@/lib/tournaments/server';
import { notifyTournamentCancelled } from '@/lib/notify';

/* یک مسابقه — خواندن، ویرایش، لغو.

   تا امروز این مسیر اصلاً وجود نداشت: مسابقه ساخته می‌شد و دیگر هیچ
   راهی برای اصلاحش نبود. غلط تایپی در عنوان، تاریخ اشتباه یا مبلغ
   نادرست ⇒ فقط لغو و ساخت دوباره.

   حذف فیزیکی عمداً نیست: مسابقه‌ای که ثبت‌نام یا پرداخت داشته سابقه‌ی
   مالی دارد و پاک‌کردنش یعنی گم‌شدن رد پول. «لغو» جای حذف را می‌گیرد
   و فقط مسابقه‌ی پیش‌نویس بدون ثبت‌نام واقعاً حذف می‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATS = new Set(['bo3', 'bo5', 'bo7', 'bo9', 'bo11']);

/* وضعیت‌هایی که بعدشان دیگر ویرایش محتوایی مجاز نیست — مسابقه‌ی در
   حال اجرا یا تمام‌شده نباید تاریخ و مبلغش عوض شود. */
const FROZEN = new Set(['ongoing', 'completed', 'cancelled']);

const isoOrNull = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

async function guard(req: NextRequest, id: string) {
  if (!UUID.test(id)) return { err: NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 }) };
  const actor = await actorOf(req);
  if (!actor) return { err: NextResponse.json(UNAUTHENTICATED, { status: 401 }) };
  const t = await getTournament(id);
  if (!t) return { err: NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 }) };
  if (!(await ownsClub(actor, t.club_id))) return { err: NextResponse.json(FORBIDDEN, { status: 403 }) };
  return { actor, t };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });
  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه یافت نشد' }, { status: 404 });
  return NextResponse.json({ tournament: t }, { headers: { 'Cache-Control': 'no-store' } });
}

/* PATCH — ویرایش مسابقه توسط مالک باشگاه */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;
  const t = g.t!;

  if (FROZEN.has(t.status)) {
    return NextResponse.json(
      { message: 'مسابقه‌ی در حال اجرا، تمام‌شده یا لغوشده ویرایش نمی‌شود' }, { status: 409 });
  }

  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof b.title === 'string') {
    const title = b.title.trim();
    if (!title) return NextResponse.json({ message: 'عنوان نمی‌تواند خالی باشد' }, { status: 400 });
    patch.title = title.slice(0, 200);
  }
  if (b.description !== undefined) patch.description = String(b.description ?? '').slice(0, 5000) || null;
  if (b.prize !== undefined) patch.prize = String(b.prize ?? '').slice(0, 200) || null;
  if (typeof b.discipline === 'string') patch.discipline = b.discipline.slice(0, 40);
  if (b.matchFormat !== undefined) {
    patch.match_format = FORMATS.has(String(b.matchFormat)) ? String(b.matchFormat) : null;
  }
  if (b.startsAt !== undefined) patch.starts_at = isoOrNull(b.startsAt);
  if (b.registrationEndsAt !== undefined) patch.registration_ends_at = isoOrNull(b.registrationEndsAt);

  /* ظرفیت را نمی‌شود زیر تعداد ثبت‌نام فعلی آورد — وگرنه مسابقه‌ای
     می‌ماند که بیش از ظرفیتش بازیکن دارد و قرعه‌کشی‌اش بی‌معنی است. */
  if (b.maxPlayers !== undefined) {
    const n = Math.max(2, Math.min(512, Math.round(Number(b.maxPlayers) || 16)));
    const { count } = await sb().from('tournament_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', id).eq('status', 'CONFIRMED');
    if ((count ?? 0) > n) {
      return NextResponse.json(
        { message: `ظرفیت نمی‌تواند کمتر از ${count} ثبت‌نام فعلی باشد` }, { status: 409 });
    }
    patch.max_players = n;
  }

  /* مبلغ فقط وقتی می‌تواند عوض شود که هنوز کسی پرداخت نکرده باشد.
     Snapshot مبلغ در هر ثبت‌نام ذخیره شده، ولی تغییر مبلغ پس از
     پرداخت یعنی دو نفر با دو قیمت متفاوت در یک مسابقه — و بازپرداخت
     هم مبهم می‌شود. */
  if (b.entryFee !== undefined) {
    const { count } = await sb().from('tournament_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', id).eq('payment_status', 'PAID');
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { message: 'پس از اولین پرداخت، مبلغ ورودی تغییر نمی‌کند' }, { status: 409 });
    }
    patch.entry_fee = Math.max(0, Math.min(500_000_000, Math.round(Number(b.entryFee) || 0)));
  }

  const startsAt = (patch.starts_at ?? t.starts_at) as string | null;
  const regEnds = (patch.registration_ends_at ?? t.registration_ends_at) as string | null;
  if (startsAt && regEnds && regEnds > startsAt) {
    return NextResponse.json(
      { message: 'مهلت ثبت‌نام نمی‌تواند بعد از تاریخ برگزاری باشد' }, { status: 400 });
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ message: 'تغییری فرستاده نشد' }, { status: 400 });
  }

  const { data, error } = await sb().from('tournaments')
    .update(patch).eq('id', id).select().single();
  if (error) {
    console.error('[tournaments/:id] update:', error.message);
    return NextResponse.json({ message: 'ویرایش انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: 'club_owner', action: 'TOURNAMENT_UPDATED',
    entityType: 'tournament', entityId: id, newValue: patch, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, tournament: data });
}

/* DELETE — لغو (یا حذف واقعی پیش‌نویس خالی) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;
  const t = g.t!;

  const { count: regs } = await sb().from('tournament_registrations')
    .select('id', { count: 'exact', head: true }).eq('tournament_id', id);

  /* پیش‌نویس بدون ثبت‌نام: چیزی برای نگه‌داشتن نیست ⇒ واقعاً حذف */
  if ((regs ?? 0) === 0 && (t.status === 'draft' || t.status === 'published')) {
    const { error } = await sb().from('tournaments').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
    void audit({
      actorId: g.actor!.id, actorRole: 'club_owner', action: 'TOURNAMENT_DELETED',
      entityType: 'tournament', entityId: id, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (t.status === 'cancelled') {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }

  /* ثبت‌نام دارد ⇒ فقط لغو، تا رد مالی و سابقه بماند.
     اعلان لغو پیش از هر چیز به ثبت‌نام‌کننده‌ها می‌رود. */
  const { error } = await sb().from('tournaments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ message: 'لغو انجام نشد' }, { status: 500 });

  void notifyTournamentCancelled(id).catch(() => { /* بی‌صدا */ });
  void audit({
    actorId: g.actor!.id, actorRole: 'club_owner', action: 'TOURNAMENT_CANCELLED',
    entityType: 'tournament', entityId: id,
    newValue: { registrations: regs ?? 0 }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, cancelled: true, registrations: regs ?? 0 });
}
