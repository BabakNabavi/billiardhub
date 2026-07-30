export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';

/* جدولِ رنکینگ برای همه — بدونِ ورود.

   چرا لازم شد: صفحه‌ی /ranking تا امروز فقط از localStorage می‌خواند.
   یعنی رنکینگی که ادمین وارد می‌کرد تنها روی مرورگرِ خودش دیده می‌شد و
   هیچ کاربرِ دیگری آن را نمی‌دید؛ بدتر اینکه وقتی localStorage خالی بود،
   صفحه به فهرستِ نمونه‌ی داخلِ کد برمی‌گشت و داده‌ی ساختگی نشان می‌داد.

   نوشتن همچنان فقط از /api/admin/settings و فقط با ادمین ممکن است؛
   این مسیر صرفاً خواندنی است. */

export async function GET() {
  const { data, error } = await sb()
    .from('app_settings').select('value,updated_at').eq('key', 'rankings_board').maybeSingle();

  if (error) return NextResponse.json({ board: null, updatedAt: null }, { status: 200 });

  const row = data as { value?: unknown; updated_at?: string } | null;
  return NextResponse.json(
    { board: row?.value ?? null, updatedAt: row?.updated_at ?? null },
    /* یک دقیقه کش، با اجازه‌ی سرو کردنِ نسخه‌ی کهنه هنگام بازاعتبارسنجی —
       رنکینگ روزی چند بار هم عوض نمی‌شود. */
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
