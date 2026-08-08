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
  const { id: raw } = await params;

  /* ── نامک هم قبول است ──
     صفحه‌ی عمومی باشگاه نشانیِ خودش را `‌/clubs/{slug}` تبلیغ می‌کند و
     همان مسیر این آمار را از `/api/clubs/{slug}/stats` می‌خواست. این‌جا
     فقط UUID پذیرفته می‌شد، پس جواب `{members:0,tournaments:0}` بود —
     باشگاهی با یک عضو و دو مسابقه، به هر بازدیدکننده‌ای صفر نشان
     می‌داد و باشگاه‌دار فکر می‌کرد عضویت و مسابقه‌اش ثبت نشده. */
  let id = raw;
  if (!UUID.test(id)) {
    const { data } = await sb().from('clubs').select('id').eq('slug', raw).maybeSingle();
    const found = (data as { id?: string } | null)?.id;
    /* نامکِ ناشناس خطا نیست: این آماره روی صفحه‌ی عمومی رندر می‌شود و
       نباید به‌خاطر یک URL دستکاری‌شده کل کارت را بشکند. */
    if (!found) return NextResponse.json(EMPTY, { headers: { 'Cache-Control': 'no-store' } });
    id = found;
  }

  const count = async (table: string) => {
    const { count: n, error } = await sb()
      .from(table).select('id', { count: 'exact', head: true }).eq('club_id', id);
    return error ? 0 : (n ?? 0);
  };

  const [members, tournaments] = await Promise.all([count('club_members'), count('tournaments')]);

  return NextResponse.json({ members, tournaments }, { headers: { 'Cache-Control': 'no-store' } });
}
