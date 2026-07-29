export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { computeRefund, bookingStartsAt, canCancelAt, MIN_CANCEL_HOURS } from '@/lib/finance/cancellation';

/* رزروهای کاربرِ جاری — همراه با پیش‌نمایشِ سیاستِ کنسلی برای هر رزرو،
   تا کاربر پیش از لغو بداند چقدر بازمی‌گردد. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const { data, error } = await sb().from('bookings')
    .select('id,booking_reference,"clubId","tableId","tableType","bookingDate","timeSlots","totalHours",final_amount,booking_status,payment_status,refund_amount,refund_status,"createdAt"')
    .eq('userId', actor.id).order('bookingDate', { ascending: false }).limit(60);

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ message: 'خطا در دریافتِ رزروها' }, { status: 500 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const clubIds = [...new Set(rows.map(r => String(r.clubId)).filter(Boolean))];
  const { data: clubs } = clubIds.length
    ? await sb().from('clubs').select('id,name,city').in('id', clubIds)
    : { data: [] as Record<string, unknown>[] };
  const clubMap = new Map((clubs ?? []).map((c: Record<string, unknown>) => [String(c.id), c]));

  const now = new Date();
  const out = rows.map(r => {
    const startsAt = bookingStartsAt(String(r.bookingDate), r.timeSlots as string | null);
    const isPaid = r.payment_status === 'PAID';
    const active = r.booking_status === 'CONFIRMED' || r.booking_status === 'PENDING_PAYMENT';
    /* طبق قوانین، لغو فقط تا ۲ ساعت پیش از شروع ممکن است */
    const inTime = canCancelAt(startsAt, now);
    const club = clubMap.get(String(r.clubId));
    return {
      ...r,
      clubName: club ? String(club.name) : '—',
      clubCity: club ? String(club.city ?? '') : '',
      startsAt: startsAt.toISOString(),
      canCancel: active && inTime,
      /* اگر لغو ممکن نیست، دلیلش هم برمی‌گردد. بدونِ این، دکمه فقط
         ناپدید می‌شد و کاربر فکر می‌کرد اصلاً امکانِ لغو وجود ندارد. */
      cancelBlockedReason: active && inTime ? null
        : !active ? (r.booking_status === 'CANCELLED' ? 'این رزرو قبلاً لغو شده است' : 'این رزرو به پایان رسیده است')
        : startsAt.getTime() <= now.getTime() ? 'زمانِ این رزرو گذشته است'
        : `مهلتِ لغو تمام شده — لغو تا ${MIN_CANCEL_HOURS} ساعت پیش از شروع ممکن است`,
      /* پیش‌نمایشِ بازپرداخت — فقط برای رزروِ پرداخت‌شده معنا دارد */
      refundPreview: isPaid && inTime ? computeRefund(Number(r.final_amount) || 0, startsAt, now) : null,
    };
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
