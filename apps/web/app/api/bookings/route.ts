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

  const token = authHeader.slice(7);
  let payload: { sub: string; phone: string; role: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as typeof payload;
  } catch {
    return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401 });
  }

  const body = await req.json();
  const { clubId, tableType, tableNumber, startTime, endTime, totalPrice } = body;

  if (!clubId || !tableType || !tableNumber || !startTime || !endTime || !totalPrice) {
    return NextResponse.json(
      { message: 'همه فیلدها الزامی هستند: clubId، tableType، tableNumber، startTime، endTime، totalPrice' },
      { status: 400 },
    );
  }

  // تداخل رزرو را بررسی کن
  const { data: conflict } = await getSupabaseServer()
    .from('bookings')
    .select('id')
    .eq('clubId', clubId)
    .eq('tableType', tableType)
    .eq('tableNumber', tableNumber)
    .neq('status', 'cancelled')
    .lt('startTime', endTime)
    .gt('endTime', startTime)
    .limit(1)
    .single();

  if (conflict) {
    return NextResponse.json({ message: 'این میز در بازه زمانی انتخابی قبلاً رزرو شده است' }, { status: 409 });
  }

  const { data: booking, error } = await getSupabaseServer()
    .from('bookings')
    .insert({
      clubId,
      tableType,
      tableNumber,
      startTime,
      endTime,
      totalPrice,
      userId: payload.sub,
      status: 'pending',
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
