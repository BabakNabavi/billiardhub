export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  // احراز هویت — اختیاری: اگر token بود decode کن، وگرنه userId = null
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { sub: string };
      userId = payload.sub;
    } catch {
      // token نامعتبر — ادامه بدون userId
    }
  }

  const body = await req.json();
  const { clubId, tableType, tableNumber, startTime, endTime, totalPrice } = body;

  // فقط سه فیلد اجباری
  if (!clubId || !startTime || !endTime) {
    return NextResponse.json(
      { message: 'clubId، startTime و endTime الزامی هستند' },
      { status: 400 },
    );
  }

  // بررسی تداخل — فقط اگر tableType و tableNumber ارسال شده باشند
  if (tableType && tableNumber) {
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
      return NextResponse.json(
        { message: 'این میز در بازه زمانی انتخابی قبلاً رزرو شده است' },
        { status: 409 },
      );
    }
  }

  const { data: booking, error } = await getSupabaseServer()
    .from('bookings')
    .insert({
      clubId,
      ...(tableType     ? { tableType }    : {}),
      ...(tableNumber   ? { tableNumber }   : {}),
      startTime,
      endTime,
      ...(totalPrice    ? { totalPrice }    : {}),
      userId,
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
