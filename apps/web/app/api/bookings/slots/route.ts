export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc } from '@/lib/finance/db';

/* ساعت‌های آزاد/اشغال یک میز در یک روز.
   ۱) ابتدا رزروهای پرداخت‌نشده‌ی منقضی آزاد می‌شوند (انقضای تنبل، دقیقاً در
      لحظه‌ای که کاربر ساعت‌ها را می‌بیند) تا هیچ ساعتی الکی قفل نماند.
   ۲) منبعِ اشغال، جدولِ booking_slots است (همان که یکتاییِ ضدِ دابل‌بوکینگ دارد)
      و در صورتِ نبودِ آن، به روشِ قدیمیِ timeSlots برمی‌گردیم. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId  = searchParams.get('clubId');
  const tableId = searchParams.get('tableId');
  const date    = searchParams.get('date'); // YYYY-MM-DD

  if (!clubId || !tableId || !date) {
    return NextResponse.json({ message: 'clubId، tableId و date الزامی هستند' }, { status: 400 });
  }

  /* آزادسازیِ رزروهای منقضی — خطایش نباید نمایشِ ساعت‌ها را متوقف کند */
  await rpc('bh_expire_bookings', {}).catch(() => null);

  const bookedHours = new Set<number>();

  const { data: slotRows, error: slotErr } = await sb()
    .from('booking_slots').select('hour')
    .eq('club_id', clubId).eq('table_id', tableId).eq('booking_date', date);

  if (!slotErr && slotRows) {
    (slotRows as { hour: number }[]).forEach(s => bookedHours.add(Number(s.hour)));
  } else {
    /* پشتیبان: نسخه‌ی قدیمی (اگر مایگریشن هنوز اجرا نشده باشد) */
    const { data: bookings } = await sb().from('bookings')
      .select('timeSlots').eq('clubId', clubId).eq('tableId', tableId)
      .eq('bookingDate', date).neq('status', 'cancelled');
    (bookings ?? []).forEach((b: { timeSlots?: string | null }) => {
      String(b.timeSlots ?? '').split(',').forEach(h => {
        const hour = parseInt(h.trim(), 10);
        if (!isNaN(hour)) bookedHours.add(hour);
      });
    });
  }

  // ساعت‌های ۸ تا ۲۳ (آخرین slot شروع ۲۳:۰۰)
  const slots = [];
  for (let hour = 8; hour < 24; hour++) {
    slots.push({
      hour,
      slotStart: `${date}T${String(hour).padStart(2, '0')}:00:00`,
      slotEnd:   `${date}T${String(hour + 1).padStart(2, '0')}:00:00`,
      isBooked:  bookedHours.has(hour),
    });
  }

  return NextResponse.json(slots, { headers: { 'Cache-Control': 'no-store' } });
}
