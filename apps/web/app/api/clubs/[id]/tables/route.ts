export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';

/* فقط میزهایی که باشگاه واقعاً ثبت کرده قابل رزرو هستند.
   پیش‌تر اگر جدول tables خالی بود، از روی تعداد اعلام‌شده در پروفایل باشگاه
   میزهای ساختگی با قیمت هاردکد ساخته می‌شد و همان‌ها رزرو می‌شدند. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = getSupabaseServer();
  /* داشبورد باید میزهای بسته را هم ببیند تا بتواند بازشان کند؛
     صفحه‌ی رزرو نباید. پیش‌فرض «فقط قابلِ رزرو» است، چون مصرف‌کننده‌ی
     اصلیِ این مسیر همان صفحه‌ی رزرو است و یک فراموشی آن‌جا یعنی
     نمایشِ میزی که باشگاه‌دار بسته است. */
  const includeClosed = new URL(_req.url).searchParams.get('all') === '1';

  const { data: rows, error } = await sb
    .from('tables')
    .select('*')
    .eq('clubId', id)
    .eq('isActive', true)
    .order('number', { ascending: true });

  if (error) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });

  /* فیلتر در جاوااسکریپت و نه در کوئری: تا وقتی مهاجرتِ ۰۳۶ اجرا نشده،
     ستون وجود ندارد و یک `.eq('reservationClosed', false)` کلِ فهرست را
     خطا می‌کرد — یعنی صفحه‌ی رزرو هیچ میزی نشان نمی‌داد. */
  const list = (rows ?? []) as { reservationClosed?: boolean }[];
  const out = includeClosed ? list : list.filter(t => t.reservationClosed !== true);

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
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

  if (error) {
    console.error('[clubs/:id/tables] insert error:', error.message);
    return NextResponse.json({ message: 'ثبت میز انجام نشد' }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
