export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* شمارش واقعی ردیف‌ها برای کارت‌های صفحه‌ی اول پنل.

   تا امروز این اعداد در خود کامپوننت هاردکد بودند (۱۲۴ کاربر، ۴۳
   باشگاه و…) و هیچ ربطی به دیتابیس نداشتند — یعنی پنل مدیریت عددی
   نشان می‌داد که هیچ‌وقت درست نبود. */

/** شمارش سبک: هیچ ردیفی برنمی‌گردد، فقط عدد از هدر Content-Range */
async function countOf(table: string, filter = ''): Promise<number> {
  try {
    const q = sb().from(table).select('id', { count: 'exact', head: true });
    const { count, error } = filter
      ? await q.eq(filter.split('=')[0]!, filter.split('=')[1] === 'true')
      : await q;
    if (error) return 0;
    return count ?? 0;
  } catch { return 0; }
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی به این بخش مجاز نیست' }, { status: 403 });
  }

  /* جدولی که هنوز ساخته نشده ⇒ صفر، نه خطا */
  const [users, products, clubs, news, pendingClubs, bookings] = await Promise.all([
    countOf('users'),
    countOf('products'),
    countOf('clubs'),
    countOf('news'),
    countOf('clubs', 'isActive=false'),
    countOf('bookings'),
  ]);

  return NextResponse.json(
    { users, products, clubs, news, pendingClubs, bookings },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
