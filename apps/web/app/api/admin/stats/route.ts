export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* شمارش واقعی ردیف‌ها برای کارت‌های صفحه‌ی اول پنل.

   تا امروز این اعداد در خود کامپوننت هاردکد بودند (۱۲۴ کاربر، ۴۳
   باشگاه و…) و هیچ ربطی به دیتابیس نداشتند — یعنی پنل مدیریت عددی
   نشان می‌داد که هیچ‌وقت درست نبود. */

/** شمارش سبک: هیچ ردیفی برنمی‌گردد، فقط عدد از هدر Content-Range.
 *  `where` یک برابریِ ساده است؛ پیش‌تر رشته‌ای مثل `'isActive=false'`
 *  دستی split می‌شد و مقدار همیشه به بولین تبدیل می‌گشت، پس فیلترِ
 *  متنی اصلاً ممکن نبود. */
async function countOf(
  table: string,
  where?: { col: string; val: string | boolean },
): Promise<number> {
  try {
    const q = sb().from(table).select('id', { count: 'exact', head: true });
    const { count, error } = where ? await q.eq(where.col, where.val) : await q;
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
  const [
    users, products, clubs, news, bookings,
    pendingClubs, pendingRoles, pendingProfiles, openReports,
  ] = await Promise.all([
    countOf('users'),
    countOf('products'),
    countOf('clubs'),
    countOf('news'),
    countOf('bookings'),

    /* «در انتظار تأیید» یعنی منتظرِ تصمیمِ ادمین.
       پیش‌تر این عدد `isActive = false` را می‌شمرد، که باشگاهِ *ردشده*
       را هم در بر می‌گرفت — یعنی نشانِ «۳ مورد در انتظار» می‌ماند و
       ادمین به صفی می‌رفت که کاری در آن نبود. */
    countOf('clubs', { col: 'verificationStatus', val: 'pending' }),

    /* این دو صف تازه‌اند و تا امروز هیچ‌جای پنل دیده نمی‌شدند:
       درخواستِ نقش و پروفایلِ حرفه‌ای می‌توانستند روزها بی‌پاسخ بمانند
       بدونِ آنکه ادمین بداند چیزی منتظر است. */
    countOf('role_requests', { col: 'status', val: 'pending' }),
    countOf('profiles', { col: 'status', val: 'pending' }),
    /* ⚠️ `'OPEN'` با حروفِ بزرگ — همان مقداری که جدول ذخیره می‌کند
       (مهاجرتِ ۰۰۳: `DEFAULT 'OPEN'` با قیدِ چهارمقداریِ بزرگ‌حرف).
       این‌جا `'open'` بود، پس شمارش همیشه صفر می‌داد و نشانِ «گزارش
       باز» روی داشبورد هرگز روشن نمی‌شد — یعنی گزارشِ تخلف ثبت
       می‌شد و ادمین هیچ‌وقت خبردار نمی‌شد. */
    countOf('reports', { col: 'status', val: 'OPEN' }),
  ]);

  return NextResponse.json(
    {
      users, products, clubs, news, bookings,
      pendingClubs, pendingRoles, pendingProfiles, openReports,
      /* مجموعِ کارهای روی میز — برای نشانِ کلی */
      pendingTotal: pendingClubs + pendingRoles + pendingProfiles + openReports,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
