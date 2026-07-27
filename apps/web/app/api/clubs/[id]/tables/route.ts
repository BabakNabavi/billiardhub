export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';

/* فقط میزهایی که باشگاه واقعاً ثبت کرده قابلِ رزرو هستند.
   پیش‌تر اگر جدولِ tables خالی بود، از روی تعدادِ اعلام‌شده در پروفایلِ باشگاه
   میزهای ساختگی با قیمتِ هاردکد ساخته می‌شد و همان‌ها رزرو می‌شدند. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = getSupabaseServer();

  const { data: rows, error } = await sb
    .from('tables')
    .select('*')
    .eq('clubId', id)
    .eq('isActive', true)
    .order('number', { ascending: true });

  if (error) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json(rows ?? [], { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = sessionFromRequest(req);
  if (!payload) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const sb = getSupabaseServer();

  // verify ownership or admin
  const { data: club } = await sb.from('clubs').select('ownerId').eq('id', id).single();
  if (!club || (club.ownerId !== payload.id && payload.role !== 'admin')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { data, error } = await sb.from('tables').insert({
    clubId: id,
    number: body.number || null,
    type: body.type || 'snooker',
    brand: body.brand || null,
    model: body.model || null,
    pricePerHour: body.pricePerHour || 0,
    isActive: true,
  }).select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
