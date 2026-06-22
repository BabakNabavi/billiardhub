export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  // احراز هویت
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { sub: string };
    userId = payload.sub;
  } catch {
    return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401 });
  }

  const body = await req.json();
  const { clubId, tableType, tableNumber, startTime, endTime, totalPrice } = body;

  if (!clubId || !startTime || !endTime) {
    return NextResponse.json(
      { message: 'clubId، startTime و endTime الزامی هستند' },
      { status: 400 },
    );
  }

  // تبدیل startTime به bookingDate (فقط YYYY-MM-DD)
  const bookingDate = new Date(startTime).toISOString().slice(0, 10);

  // محاسبه ساعت‌های بین startTime و endTime → timeSlots مثل "10,11,12"
  const startHour = new Date(startTime).getUTCHours();
  const endHour   = new Date(endTime).getUTCHours();
  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) {
    hours.push(h);
  }
  const timeSlots  = hours.join(',');
  const totalHours = hours.length;

  if (totalHours === 0) {
    return NextResponse.json({ message: 'بازه زمانی معتبر نیست' }, { status: 400 });
  }

  const { data: booking, error } = await getSupabaseServer()
    .from('bookings')
    .insert({
      userId,
      clubId,
      ...(tableNumber ? { tableId: String(tableNumber) } : {}),
      tableType:   tableType ?? null,
      bookingDate,
      timeSlots,
      totalHours,
      totalPrice:  totalPrice ?? 0,
      status:      'pending',
    })
    .select()
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { message: 'خطا در ثبت رزرو: ' + (error?.message ?? 'unknown') },
      { status: 500 },
    );
  }

  return NextResponse.json(booking, { status: 201 });
}
