export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId  = searchParams.get('clubId');
  const tableId = searchParams.get('tableId');
  const date    = searchParams.get('date'); // YYYY-MM-DD

  if (!clubId || !tableId || !date) {
    return NextResponse.json(
      { message: 'clubId، tableId و date الزامی هستند' },
      { status: 400 },
    );
  }

  const { data: bookings, error } = await getSupabaseServer()
    .from('bookings')
    .select('timeSlots')
    .eq('clubId', clubId)
    .eq('tableId', tableId)
    .eq('bookingDate', date)
    .neq('status', 'cancelled');

  if (error) {
    return NextResponse.json({ message: 'خطا در دریافت رزروها: ' + error.message }, { status: 500 });
  }

  // timeSlots is stored as comma-separated hours: "8,9,10"
  const bookedHours = new Set<number>();
  (bookings ?? []).forEach(b => {
    if (b.timeSlots) {
      String(b.timeSlots).split(',').forEach(h => {
        const hour = parseInt(h.trim(), 10);
        if (!isNaN(hour)) bookedHours.add(hour);
      });
    }
  });

  // ساعت‌های ۸ تا ۲۳ (آخرین slot شروع ۲۳:۰۰)
  const slots = [];
  for (let hour = 8; hour < 24; hour++) {
    const slotStart = `${date}T${String(hour).padStart(2, '0')}:00:00`;
    const slotEnd   = `${date}T${String(hour + 1).padStart(2, '0')}:00:00`;
    slots.push({ hour, slotStart, slotEnd, isBooked: bookedHours.has(hour) });
  }

  return NextResponse.json(slots);
}
