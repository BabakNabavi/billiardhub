export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId      = searchParams.get('clubId');
  const tableType   = searchParams.get('tableType');
  const tableNumber = searchParams.get('tableNumber');
  const date        = searchParams.get('date'); // YYYY-MM-DD

  if (!clubId || !tableType || !tableNumber || !date) {
    return NextResponse.json(
      { message: 'clubId، tableType، tableNumber و date الزامی هستند' },
      { status: 400 },
    );
  }

  const dayStart = `${date}T00:00:00`;
  const dayEnd   = `${date}T23:59:59`;

  const { data: bookings, error } = await getSupabaseServer()
    .from('bookings')
    .select('startTime, endTime')
    .eq('clubId', clubId)
    .eq('tableType', tableType)
    .eq('tableNumber', parseInt(tableNumber))
    .gte('startTime', dayStart)
    .lte('startTime', dayEnd)
    .neq('status', 'cancelled');

  if (error) {
    return NextResponse.json({ message: 'خطا در دریافت رزروها: ' + error.message }, { status: 500 });
  }

  // ساعت‌های ۸ تا ۲۳ (آخرین slot شروع ۲۳:۰۰)
  const slots = [];
  for (let hour = 8; hour < 24; hour++) {
    const slotStart = `${date}T${String(hour).padStart(2, '0')}:00:00`;
    const slotEnd   = `${date}T${String(hour + 1).padStart(2, '0')}:00:00`;

    const isBooked = (bookings ?? []).some((b) => {
      const bStart = new Date(b.startTime).getHours();
      const bEnd   = new Date(b.endTime).getHours();
      return hour >= bStart && hour < bEnd;
    });

    slots.push({ hour, slotStart, slotEnd, isBooked });
  }

  return NextResponse.json(slots);
}
