export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';

/* وضعیتِ یک رزرو — فقط فیلدهای غیرحساس برای صفحه‌ی نتیجه. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { data, error } = await sb().from('bookings')
    .select('id,booking_reference,final_amount,booking_status,payment_status,"bookingDate","timeSlots","clubId","totalHours"')
    .eq('id', id).maybeSingle();

  if (error || !data) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
