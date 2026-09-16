export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { computeRefund, bookingStartsAt, canCancelAt, MIN_CANCEL_HOURS } from '@/lib/finance/cancellation';
import { isVisibleBooking, HIDDEN_BOOKING_STATUSES } from '@/lib/bookings/visibility';

/* رزروهای کاربر جاری — همراه با پیش‌نمایش سیاست کنسلی برای هر رزرو،
   تا کاربر پیش از لغو بداند چقدر بازمی‌گردد. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  /* ── چرا رزروِ پرداخت‌نشده در فهرست نیست ──
     تا امروز هر تلاشِ ناتمامِ پرداخت یک ردیف «در انتظار پرداخت» یا
     «منقضی» در فهرستِ کاربر می‌گذاشت. کسی که سه بار پشتِ درگاه منصرف
     شده بود، سه رزروِ ناموجود می‌دید و فکر می‌کرد واقعا رزرو کرده.

     «رزرو» یعنی چیزی که پولش پرداخت شده. رزروِ پرداخت‌نشده هنوز یک
     سبدِ خرید است، نه یک رزرو — و اگر رها شود، اثری از خودش
     نمی‌گذارد. */
  const { data, error } = await sb().from('bookings')
    .select('id,booking_reference,"clubId","tableId","tableType","bookingDate","timeSlots","totalHours",final_amount,booking_status,payment_status,refund_amount,refund_status,"createdAt"')
    .eq('userId', actor.id)
    .not('booking_status', 'in', `(${HIDDEN_BOOKING_STATUSES.join(',')})`)
    .order('bookingDate', { ascending: false }).limit(60);

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ message: 'خطا در دریافت رزروها' }, { status: 500 });
  }

  /* CANCELLEDِ هرگز پرداخت‌نشده هم باید بیفتد — به 
     بستگی دارد پس سمتِ دیتابیس فیلتر نمی‌شود. */
  const rows = ((data ?? []) as Record<string, unknown>[]).filter(isVisibleBooking);
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
      /* اگر لغو ممکن نیست، دلیلش هم برمی‌گردد. بدون این، دکمه فقط
         ناپدید می‌شد و کاربر فکر می‌کرد اصلا امکان لغو وجود ندارد. */
      cancelBlockedReason: active && inTime ? null
        : !active ? (r.booking_status === 'CANCELLED' ? 'این رزرو قبلا لغو شده است' : 'این رزرو به پایان رسیده است')
        : startsAt.getTime() <= now.getTime() ? 'زمان این رزرو گذشته است'
        : `مهلت لغو تمام شده — لغو تا ${MIN_CANCEL_HOURS} ساعت پیش از شروع ممکن است`,
      /* پیش‌نمایش بازپرداخت — فقط برای رزرو پرداخت‌شده معنا دارد */
      refundPreview: isPaid && inTime ? computeRefund(Number(r.final_amount) || 0, startsAt, now) : null,
    };
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
