export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { sb, rpc, audit, clientIp } from '@/lib/finance/db';
import { getTournament, cancelTournament } from '@/lib/tournaments/server';
import { notifyTournamentCancelled } from '@/lib/notify';

/* تغییر وضعیت مسابقه توسط برگزارکننده.

   عمدا یک مسیر جدا از PATCH عمومی است: وضعیت تنها چیزی است که
   بعد از ساخت مرتب عوض می‌شود (باز/بستن ثبت‌نام، شروع، پایان، لغو)
   و گذارهایش قاعده دارد. یک PATCH باز روی کل ردیف یعنی مالک
   می‌توانست `entry_fee` را بعد از ساخت سفارش‌ها هم عوض کند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* از هر وضعیت به کدام‌ها می‌شود رفت */
const ALLOWED: Record<string, string[]> = {
  draft:                ['published', 'registration_open', 'cancelled'],
  published:            ['registration_open', 'draft', 'cancelled'],
  registration_open:    ['registration_closed', 'ongoing', 'cancelled'],
  registration_closed:  ['registration_open', 'ongoing', 'cancelled'],
  ongoing:              ['completed', 'cancelled'],
  completed:            [],
  cancelled:            [],
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const t = await getTournament(id);
  if (!t) return NextResponse.json({ message: 'مسابقه پیدا نشد' }, { status: 404 });
  if (!(await ownsClub(actor, t.club_id))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const next = String(b?.status ?? '');

  const allowed = ALLOWED[t.status] ?? [];
  if (!allowed.includes(next)) {
    return NextResponse.json({
      message: t.status === next
        ? 'مسابقه هم‌اکنون در همین وضعیت است'
        : 'این تغییر وضعیت مجاز نیست',
      from: t.status, allowed,
    }, { status: 409 });
  }

  /* ── پایانِ مسابقه یک رویدادِ مالی است، نه فقط تغییرِ وضعیت ──
     `bh_tournament_complete` کمیسیونِ پلتفرم و سهمِ برگزارکننده را از
     ثبت‌نام‌های پرداخت‌شده در دفتر می‌نویسد و خودش هم وضعیت را
     `completed` می‌کند.

     پیش‌تر این‌جا فقط یک UPDATE ساده بود و آن تابع در کلِ کد صدا زده
     نمی‌شد. نتیجه: پولِ ثبت‌نام به‌عنوان `TOURNAMENT_PAYMENT` وارد حسابِ
     مرکزی می‌شد و برای همیشه همان‌جا می‌ماند — نه کمیسیونش درآمد
     می‌شد، نه سهمِ باشگاه بدهی. */
  if (next === 'completed') {
    const { error: finErr } = await rpc('bh_tournament_complete', { p_tournament_id: id });
    if (finErr) {
      console.error('[tournaments/status] bh_tournament_complete:', finErr.message);
      return NextResponse.json(
        { message: 'ثبتِ مالیِ پایانِ مسابقه انجام نشد؛ وضعیت تغییر نکرد' }, { status: 500 });
    }
  } else if (next === 'cancelled') {
    /* ── لغو هم رویدادِ مالی است ──
       پیش‌تر به شاخه‌ی UPDATEِ ساده می‌رفت: پولِ بازیکن‌های آنلاین در
       حسابِ مرکزی می‌ماند، درخواستِ بازپرداختی ساخته نمی‌شد و — برخلافِ
       مسیرِ DELETE — به هیچ بازیکنی هم خبر داده نمی‌شد. */
    const c = await cancelTournament(id);
    if (!c.ok) {
      if (c.reason === 'completed') {
        return NextResponse.json(
          { message: 'مسابقه‌ی پایان‌یافته لغو نمی‌شود' }, { status: 409 });
      }
      return NextResponse.json({
        message: c.migrationMissing ? 'مایگریشن دیتابیس اجرا نشده است' : 'لغو انجام نشد؛ وضعیت تغییر نکرد',
      }, { status: c.migrationMissing ? 503 : 500 });
    }
    /* گیرندگان را تابعِ دیتابیس پیش از لغو جمع کرده؛ خواندن از جدول
       بعد از لغو هیچ‌کس را پیدا نمی‌کرد. */
    if (!c.idempotent) void notifyTournamentCancelled(id, c.notify ?? []).catch(() => { /* بی‌صدا */ });
  } else {
    const { error } = await sb().from('tournaments')
      .update({ status: next, updated_at: new Date().toISOString() }).eq('id', id);

    if (error) {
      console.error('[tournaments/status]', error.message);
      return NextResponse.json({ message: 'تغییر وضعیت انجام نشد' }, { status: 500 });
    }
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'TOURNAMENT_STATUS_CHANGED',
    entityType: 'tournament', entityId: id,
    oldValue: { status: t.status }, newValue: { status: next },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, status: next });
}
