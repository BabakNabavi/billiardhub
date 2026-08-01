export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';

/* تغییر وضعیتِ یک رزرو توسط باشگاه‌دار.

   این مسیر هم مثل `/bookings/club/:id` وجود نداشت و دکمه‌های تب رزروها
   بی‌صدا کار نمی‌کردند: درخواست ۴۰۴ می‌گرفت، `catch` خالی بلعیدش، و UI
   خوش‌بینانه وضعیت را عوض‌شده نشان می‌داد. یعنی باشگاه‌دار فکر می‌کرد
   رزرو را تأیید کرده در حالی که هیچ‌چیز ذخیره نشده بود.

   لغو عمداً این‌جا نیست: مسیرِ خودش را دارد
   (/api/bookings/:id/cancel) که بازپرداخت را هم حساب می‌کند. */

/* نگاشتِ وضعیتِ کوچک‌حرفِ قدیمی به ستونِ بزرگ‌حرفِ فاز مالی — هر دو
   به‌روز می‌شوند تا گزارش‌ها و UI یک چیز ببینند. */
const ALLOWED: Record<string, string> = {
  confirmed: 'CONFIRMED',
  active: 'CONFIRMED',
  completed: 'COMPLETED',
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const next = String(body?.status ?? '').trim().toLowerCase();

  if (!ALLOWED[next]) {
    return NextResponse.json(
      { message: next === 'cancelled' ? 'برای لغو از دکمه‌ی لغو استفاده کنید' : 'وضعیت معتبر نیست' },
      { status: 400 },
    );
  }

  const { data: row } = await sb().from('bookings').select('"clubId",status,booking_status').eq('id', id).maybeSingle();
  const b = row as { clubId?: string; status?: string; booking_status?: string } | null;
  if (!b) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });
  if (!(await ownsClub(actor, String(b.clubId)))) return NextResponse.json(FORBIDDEN, { status: 403 });

  /* رزروِ لغوشده دوباره فعال نمی‌شود — پول برگشته و ساعتش آزاد شده. */
  if (b.booking_status === 'CANCELLED' || b.status === 'cancelled') {
    return NextResponse.json({ message: 'این رزرو لغو شده و قابل تغییر نیست' }, { status: 409 });
  }

  const patch: Record<string, unknown> = {
    status: next,
    booking_status: ALLOWED[next],
    updatedAt: new Date().toISOString(),
  };

  let { error } = await sb().from('bookings').update(patch).eq('id', id);
  /* اسکیمای قدیمی ممکن است یکی از دو ستون را نداشته باشد */
  if (error && /does not exist|PGRST204/i.test(`${error.message} ${error.code ?? ''}`)) {
    const only = error.message.includes('booking_status')
      ? { status: next } : { booking_status: ALLOWED[next] };
    ({ error } = await sb().from('bookings').update(only).eq('id', id));
  }

  if (error) {
    console.error('[bookings/:id/status] update error:', error.message);
    return NextResponse.json({ message: 'تغییر وضعیت انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'club_owner', action: 'BOOKING_STATUS_CHANGED',
    entityType: 'booking', entityId: id,
    oldValue: { status: b.status ?? null }, newValue: { status: next },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, id, status: next, booking_status: ALLOWED[next] });
}
