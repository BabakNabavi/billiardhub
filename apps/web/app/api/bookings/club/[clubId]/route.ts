export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { bookingStartsAt } from '@/lib/finance/cancellation';

/* رزروهای یک باشگاه — برای تبِ «رزروها»ی پنلِ باشگاه‌دار.

   این مسیر وجود نداشت. داشبورد به `/bookings/club/:id` درخواست می‌داد
   که بازمانده‌ی بک‌اندِ NestJS بود و روی Next هرگز ساخته نشد؛ نتیجه‌اش
   ۴۰۴ بود که در `.catch(() => {})` بی‌صدا بلعیده می‌شد. پس تب همیشه
   خالی می‌ماند و هیچ خطایی هم دیده نمی‌شد — حتی وقتی رزروهای واقعی در
   دیتابیس بودند.

   وضعیت‌ها در دو ستون زندگی می‌کنند: `status` قدیمیِ کوچک‌حرف و
   `booking_status` بزرگ‌حرفِ فاز مالی. خروجی هر دو را می‌دهد تا UI
   موجود دست‌نخورده کار کند. */

export async function GET(req: NextRequest, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });
  if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403 });

  const { data, error } = await sb().from('bookings')
    .select('*').eq('clubId', clubId)
    .order('bookingDate', { ascending: false }).limit(200);

  if (error) {
    console.error('[bookings/club] read error:', error.message);
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  /* نام و شماره‌ی رزروکننده — باشگاه‌دار باید بداند چه کسی می‌آید.
     در یک کوئری، نه یکی به‌ازای هر رزرو. */
  const userIds = [...new Set(rows.map(r => String(r.userId)).filter(Boolean))];
  const { data: users } = userIds.length
    ? await sb().from('users').select('id,"firstName","lastName",phone').in('id', userIds)
    : { data: [] as Record<string, unknown>[] };
  const byId = new Map((users ?? []).map((u: Record<string, unknown>) => [String(u.id), u]));

  const tableIds = [...new Set(rows.map(r => String(r.tableId)).filter(Boolean))];
  const { data: tables } = tableIds.length
    ? await sb().from('tables').select('id,number,type').in('id', tableIds)
    : { data: [] as Record<string, unknown>[] };
  const tableById = new Map((tables ?? []).map((t: Record<string, unknown>) => [String(t.id), t]));

  const out = rows.map(r => {
    const u = byId.get(String(r.userId));
    const t = tableById.get(String(r.tableId));
    return {
      ...r,
      /* `status` قدیمی ممکن است خالی باشد؛ آن‌وقت از ستون تازه ساخته
         می‌شود تا فیلترهای موجودِ UI بی‌اثر نشوند. */
      status: r.status ?? String(r.booking_status ?? '').toLowerCase() ?? null,
      user: u ? { firstName: u.firstName ?? '', lastName: u.lastName ?? '', phone: u.phone ?? '' } : null,
      tableNumber: t ? t.number : null,
      tableTypeKey: t ? t.type : (r.tableType ?? null),
      startsAt: bookingStartsAt(String(r.bookingDate), r.timeSlots as string | null).toISOString(),
    };
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
