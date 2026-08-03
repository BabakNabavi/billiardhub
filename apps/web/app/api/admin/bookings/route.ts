export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import { computeRefund, bookingStartsAt, canCancelAt } from '@/lib/finance/cancellation';

/* فهرست رزروها برای ادمین — با فیلتر وضعیت/جستجو و پیش‌نمایش بازپرداخت.
   لغو خود رزرو از همان مسیر /api/bookings/[id]/cancel انجام می‌شود تا
   کل اثر مالی (بازپرداخت، دفتر کل، رکورد refund) یکجا و اتمیک بماند. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await can(actor.id, 'bookings'))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(200, Math.max(10, Number(searchParams.get('limit')) || 100));

  let query = sb().from('bookings')
    .select('id,booking_reference,"userId","clubId","tableId","tableType","bookingDate","timeSlots","totalHours",base_amount,final_amount,booking_status,payment_status,refund_amount,refund_status,cancelled_at,cancellation_reason,"createdAt"')
    .order('createdAt', { ascending: false }).limit(limit);

  if (status) query = query.eq('booking_status', status);
  if (q) query = query.ilike('booking_reference', `%${q}%`);

  const { data, error } = await query;
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ rows: [], pending: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    console.error('[admin/bookings] db error:', error.message);
    return NextResponse.json({ message: 'خطا در دریافت رزروها' }, { status: 500 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  /* نام باشگاه و کاربر — دو کوئری گروهی، نه N کوئری */
  const clubIds = [...new Set(rows.map(r => String(r.clubId)).filter(Boolean))];
  const userIds = [...new Set(rows.map(r => String(r.userId)).filter(Boolean))];

  const [{ data: clubs }, { data: users }] = await Promise.all([
    clubIds.length ? sb().from('clubs').select('id,name,city').in('id', clubIds) : Promise.resolve({ data: [] }),
    userIds.length ? sb().from('users').select('id,"firstName","lastName",phone').in('id', userIds) : Promise.resolve({ data: [] }),
  ]);

  const clubMap = new Map((clubs ?? []).map((c: Record<string, unknown>) => [String(c.id), c]));
  const userMap = new Map((users ?? []).map((u: Record<string, unknown>) => [String(u.id), u]));

  const now = new Date();
  const out = rows.map(r => {
    const startsAt = bookingStartsAt(String(r.bookingDate), r.timeSlots as string | null);
    const club = clubMap.get(String(r.clubId));
    const user = userMap.get(String(r.userId));
    const active = r.booking_status === 'CONFIRMED' || r.booking_status === 'PENDING_PAYMENT';
    return {
      ...r,
      clubName: club ? String(club.name) : '—',
      clubCity: club ? String(club.city ?? '') : '',
      userName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || '—' : '—',
      userPhone: user ? String(user.phone ?? '') : '',
      startsAt: startsAt.toISOString(),
      inCancelWindow: canCancelAt(startsAt, now),
      canCancel: active,   /* ادمین حتی خارج از مهلت هم می‌تواند لغو کند */
      refundPreview: r.payment_status === 'PAID'
        ? computeRefund(Number(r.final_amount) || 0, startsAt, now) : null,
    };
  });

  return NextResponse.json({ rows: out }, { headers: { 'Cache-Control': 'no-store' } });
}
