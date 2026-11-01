export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readRankings, EMPTY_RANKINGS } from '@/lib/rankings/server-read';

/* جدول رنکینگ برای همه — بدون ورود.

   چرا لازم شد: صفحه‌ی /ranking تا امروز فقط از localStorage می‌خواند.
   یعنی رنکینگی که ادمین وارد می‌کرد تنها روی مرورگر خودش دیده می‌شد و
   هیچ کاربر دیگری آن را نمی‌دید؛ بدتر اینکه وقتی localStorage خالی بود،
   صفحه به فهرست نمونه‌ی داخل کد برمی‌گشت و داده‌ی ساختگی نشان می‌داد.

   نوشتن همچنان فقط از /api/admin/settings و فقط با ادمین ممکن است؛
   این مسیر صرفا خواندنی است. خواندن و اعتبارسنجیِ Zod در
   lib/rankings/server-read است — همان که رندرِ سرورِ /ranking می‌خواند. */

export async function GET() {
  const data = await readRankings();
  if (!data) return NextResponse.json(EMPTY_RANKINGS, { status: 200 });
  return NextResponse.json(
    data,
    /* یک دقیقه کش، با اجازه‌ی سرو کردن نسخه‌ی کهنه هنگام بازاعتبارسنجی —
       رنکینگ روزی چند بار هم عوض نمی‌شود. */
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
