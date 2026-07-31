export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { actorOf, ownsClub } from '@/lib/auth/ownership';

/* وضعیت یک رزرو.

   تا امروز این مسیر هیچ احراز هویتی نداشت: هر کسی که شناسه‌ی رزرو را
   می‌داشت شماره‌ی پیگیری، مبلغ، تاریخ و ساعت‌ها را می‌دید. UUID
   حدس‌زدنی نیست، ولی «امنیت با گمنامی» امنیت نیست — شناسه در URL،
   لاگ‌ها و تاریخچه‌ی مرورگر می‌ماند.

   حالا سه گروه اجازه دارند:
     • خود رزروکننده
     • مالک باشگاهی که رزرو در آن است
     • ادمین

   یک استثنای عمدی: بازگشت از درگاه. کاربر ممکن است هنگام برگشت هنوز
   نشست فعال نداشته باشد (کوکی SameSite در ناوبری بین‌دامنه‌ای گاهی
   نمی‌آید). برای همین با `?ref=` می‌شود رزرو را دید — ولی فقط با
   دانستن **شماره‌ی پیگیری**، که خودش یک راز است و در پاسخ هم فقط
   فیلدهای لازم صفحه‌ی نتیجه برمی‌گردد. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FIELDS = 'id,booking_reference,final_amount,booking_status,payment_status,"bookingDate","timeSlots","clubId","totalHours","userId"';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });

  const { data, error } = await sb().from('bookings').select(FIELDS).eq('id', id).maybeSingle();
  if (error || !data) return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });

  const row = data as Record<string, unknown>;
  const { userId, ...safe } = row;   // شناسه‌ی کاربر هرگز بیرون نمی‌رود

  /* راه بازگشت از درگاه — نیازمند دانستن شماره‌ی پیگیری */
  const ref = req.nextUrl.searchParams.get('ref');
  if (ref && ref === String(row.booking_reference ?? '')) {
    return NextResponse.json(safe, { headers: { 'Cache-Control': 'no-store' } });
  }

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const isOwner = String(userId ?? '') === actor.id;
  const isClub = await ownsClub(actor, String(row.clubId ?? ''));
  if (!isOwner && !isClub) {
    return NextResponse.json({ message: 'دسترسی به این رزرو مجاز نیست' }, { status: 403 });
  }

  return NextResponse.json(safe, { headers: { 'Cache-Control': 'no-store' } });
}
