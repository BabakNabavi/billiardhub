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
    pendingClubs, pendingRoles, pendingProfiles, openReports, openTickets,
    pendingProducts, pendingAdRequests, pendingSettlements, pendingRefunds,
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
    /* ⚠️ این عدد **همه‌ی شش نوع** پروفایل را می‌شمرد (مربی، داور،
       فروشگاه، تولیدکننده، خدمات فنی، بازیکن) ولی کارتش روی داشبورد
       فقط به `/admin/coaches` می‌رفت. یعنی اگر یک پروفایلِ داور در
       انتظار بود، عدد بالا می‌رفت و ادمین به صفحه‌ی مربیان می‌رسید که
       چیزی در آن نبود. تفکیک پایین‌تر اضافه شد. */
    countOf('profiles', { col: 'status', val: 'pending' }),
    /* ⚠️ `'OPEN'` با حروفِ بزرگ — همان مقداری که جدول ذخیره می‌کند
       (مهاجرتِ ۰۰۳: `DEFAULT 'OPEN'` با قیدِ چهارمقداریِ بزرگ‌حرف).
       این‌جا `'open'` بود، پس شمارش همیشه صفر می‌داد و نشانِ «گزارش
       باز» روی داشبورد هرگز روشن نمی‌شد — یعنی گزارشِ تخلف ثبت
       می‌شد و ادمین هیچ‌وقت خبردار نمی‌شد. */
    countOf('reports', { col: 'status', val: 'OPEN' }),
    /* تیکتِ بازِ پشتیبانی — تا امروز هیچ‌جای داشبورد دیده نمی‌شد.
       کاربر تیکت می‌زد و تا وقتی ادمین خودش سراغِ صفحه‌ی پشتیبانی
       نمی‌رفت، هیچ نشانه‌ای نبود. */
    countOf('support_tickets', { col: 'status', val: 'open' }),

    /* ── بقیه‌ی صف‌ها ──
       تا امروز فقط بعضی از این‌ها روی داشبورد عدد داشتند. بقیه
       بی‌صدا جمع می‌شدند و ادمین فقط وقتی خبردار می‌شد که خودش
       سرِ صفحه‌شان می‌رفت — یعنی دقیقاً همان چیزی که نباید. */
    countOf('products', { col: 'status', val: 'pending' }),
    countOf('ad_requests', { col: 'status', val: 'pending' }),
    countOf('settlements', { col: 'status', val: 'REQUESTED' }),
    countOf('refunds', { col: 'status', val: 'REQUESTED' }),
  ]);

  /* ── تفکیکِ پروفایل‌های در انتظار به تفکیکِ نوع ──
     هر نوع صفحه‌ی بررسیِ خودش را دارد، پس عدد هم باید به همان‌جا
     اشاره کند. یک شمارشِ سبک به ازای هر نوع؛ هر شش تا موازی. */
  const PROFILE_KINDS = ['coach', 'referee', 'seller', 'manufacturer', 'technician', 'player'] as const;
  /* ── چرا دو شمارش و نه یکی ──
     «کارِ روی میزِ ادمین» دو حالت دارد و تا امروز فقط اولی شمرده
     می‌شد:

       ۱) پروفایلِ تازه که هنوز تأیید نشده (`status = 'pending'`).
       ۲) پروفایلِ **تأییدشده‌ای** که صاحبش بعداً مدرک/جوازش را آپلود
          کرده و منتظرِ تیکِ آبی است.

     حالتِ دوم اصلاً هیچ‌جا دیده نمی‌شد: مدرک بالا می‌رفت و تا ابد
     می‌ماند، چون هیچ شمارنده‌ای و هیچ نشانی نمی‌گفت چیزی تازه رسیده.
     تنها راهش این بود که ادمین شانسی صفحه‌ی هر نقش را باز کند.

     مدرکِ بی‌تیک هم همان‌قدر «منتظرِ تصمیم» است، پس در همان عددِ
     کارتِ همان نقش شمرده می‌شود — و مقصدِ کارت هم همان صفحه‌ای است
     که فایل را نشان می‌دهد و دکمه‌ی تیک را دارد. */
  const kindCounts = await Promise.all(
    PROFILE_KINDS.map(async k => {
      try {
        const [pending, unverifiedDoc] = await Promise.all([
          sb().from('profiles').select('id', { count: 'exact', head: true })
            .eq('status', 'pending').eq('kind', k),
          sb().from('profiles').select('id', { count: 'exact', head: true })
            .eq('kind', k).eq('status', 'approved')
            .eq('license_verified', false).not('license_url', 'is', null).neq('license_url', ''),
        ]);
        return (pending.count ?? 0) + (unverifiedDoc.count ?? 0);
      } catch { return 0; }
    }),
  );
  const pendingByKind = Object.fromEntries(
    PROFILE_KINDS.map((k, i) => [k, kindCounts[i] ?? 0]),
  ) as Record<typeof PROFILE_KINDS[number], number>;

  /* ── صفِ تیکِ آبی ──
     همان تعریفی که صفحه‌ی `/admin/verified` دارد: منتشر شده، تیک
     ندارد، ولی مدرکی آپلود کرده که بشود درباره‌اش تصمیم گرفت.
     باشگاه و شش نقشِ دیگر با هم، چون آن صفحه هم هر هفت را یک‌جا
     نشان می‌دهد.

     این عدد با `pendingByKind` هم‌پوشانی دارد و عمدی است: یک مدرکِ
     بی‌تیک هم روی میزِ همان نقش است و هم روی میزِ تیک. */
  const awaitingBadge = await (async () => {
    try {
      const [profiles, clubs] = await Promise.all([
        /* ── چرا ردیف و نه شمارشِ سبک ──
           مدرک دو جا می‌نشیند: ستونِ `license_url` (جواز کسب) و
           `data.certificate.url` (گواهیِ مربی و داور). دومی داخلِ
           jsonb است و با `.not(...)` قابلِ شمارش نیست، پس ردیف‌ها
           خوانده و همان‌جا فیلتر می‌شوند — همان شرطی که صفحه‌ی
           /admin/verified دارد، وگرنه عددِ کارت و تبِ صفحه با هم
           نمی‌خواندند.
           `verified` می‌تواند NULL باشد، پس `is not true` نه
           `eq(false)`. */
        sb().from('profiles').select('verified,license_url,data').eq('status', 'approved'),
        /* باشگاه فقط وقتی «در انتظارِ تیک» است که منتشر شده باشد؛
           باشگاهِ ردشده یا بررسی‌نشده صفِ دیگری دارد. */
        sb().from('clubs').select('id', { count: 'exact', head: true })
          .eq('verificationStatus', 'approved')
          .not('licenseDocumentUrl', 'is', null).neq('licenseDocumentUrl', ''),
      ]);

      type Row = { verified?: boolean | null; license_url?: string | null; data?: Record<string, unknown> | null };
      const rows = (profiles.data ?? []) as Row[];
      const hasDoc = (r: Row) => {
        if (String(r.license_url ?? '').trim()) return true;
        const cert = (r.data ?? {})['certificate'] as { url?: string } | null | undefined;
        return !!String(cert?.url ?? '').trim();
      };
      const p = rows.filter(r => r.verified !== true && hasDoc(r)).length;
      return p + (clubs.count ?? 0);
    } catch { return 0; }
  })();

  return NextResponse.json(
    {
      users, products, clubs, news, bookings,
      pendingClubs, pendingRoles, pendingProfiles, openReports, openTickets,
      pendingProducts, pendingAdRequests, pendingSettlements, pendingRefunds,
      pendingByKind,
      awaitingBadge,
      /* مجموعِ کارهای روی میز — برای نشانِ کلی.
         `awaitingBadge` عمداً این‌جا جمع نمی‌شود: با
         `pendingProfiles` و `pendingClubs` هم‌پوشانی دارد و دوباره
         شمردنش عددِ کل را متورم می‌کند. */
      pendingTotal: pendingClubs + pendingRoles + pendingProfiles + openReports
        + openTickets + pendingProducts + pendingAdRequests + pendingSettlements + pendingRefunds,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
