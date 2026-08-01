export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';

/* آمارِ شمردنیِ باشگاه — اعضای فعال و مسابقات.

   این دو عدد تا امروز فیلدِ متنیِ آزاد در داشبورد بودند و در
   localStorageی *مرورگرِ خودِ باشگاه‌دار* ذخیره می‌شدند. یعنی هم
   دلخواه بودند و هم هیچ بازدیدکننده‌ای هرگز نمی‌دیدشان؛ صفحه‌ی عمومی
   باشگاه همان کلید را از localStorageی *بازدیدکننده* می‌خواند که
   طبیعتاً خالی بود.

   حالا هر دو شمرده می‌شوند:
     اعضا    = ردیف‌های club_members (کاربرانی که این باشگاه را به‌عنوان
               «باشگاهی که در آن بازی می‌کنم» انتخاب کرده‌اند)
     مسابقات = ردیف‌های tournaments این باشگاه

   شمارش به‌جای شمارنده‌ی دستی: انتخاب دوباره‌ی همان باشگاه عدد را بالا
   نمی‌برد، ترکِ باشگاه خودبه‌خود کم می‌کند، و حذفِ مسابقه هم همین‌طور.
   هر دو از صفر شروع می‌شوند و راهی برای دست‌کاری‌شان وجود ندارد. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMPTY = { members: 0, tournaments: 0 };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  /* شناسه‌ی نامعتبر خطا نیست: این آماره روی صفحه‌ی عمومی رندر می‌شود و
     نباید به‌خاطر یک URL دستکاری‌شده کل کارت را بشکند. */
  if (!UUID.test(id)) return NextResponse.json(EMPTY, { headers: { 'Cache-Control': 'no-store' } });

  const count = async (table: string) => {
    const { count: n, error } = await sb()
      .from(table).select('id', { count: 'exact', head: true }).eq('club_id', id);
    return error ? 0 : (n ?? 0);
  };

  const [members, tournaments] = await Promise.all([count('club_members'), count('tournaments')]);

  return NextResponse.json({ members, tournaments }, { headers: { 'Cache-Control': 'no-store' } });
}
