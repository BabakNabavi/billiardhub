export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sb } from '@/lib/finance/db';

/* جدول رنکینگ برای همه — بدون ورود.

   چرا لازم شد: صفحه‌ی /ranking تا امروز فقط از localStorage می‌خواند.
   یعنی رنکینگی که ادمین وارد می‌کرد تنها روی مرورگر خودش دیده می‌شد و
   هیچ کاربر دیگری آن را نمی‌دید؛ بدتر اینکه وقتی localStorage خالی بود،
   صفحه به فهرست نمونه‌ی داخل کد برمی‌گشت و داده‌ی ساختگی نشان می‌داد.

   نوشتن همچنان فقط از /api/admin/settings و فقط با ادمین ممکن است؛
   این مسیر صرفا خواندنی است. */

/* سرستونِ مرحله‌ها (`rankings_stages`) — sport → gender → category → مرحله[].
   شکلِ نادرست ⟵ `{}`: صفحه بی‌ستونِ مرحله نشان داده می‌شود، نه شکسته. */
const StageZ = z.object({ title: z.string(), city: z.string(), date: z.string() });
/* سقفِ شش: خانه‌ها عرضِ ثابت دارند و بیشتر از آن در ۱۰۲۴ نام را می‌برد */
const StagesZ = z.record(z.string(), z.record(z.string(), z.record(z.string(), z.array(StageZ).max(6))));

export async function GET() {
  const { data, error } = await sb()
    .from('app_settings').select('key,value,updated_at').in('key', ['rankings_board', 'rankings_stages']);

  if (error) return NextResponse.json({ board: null, stages: {}, updatedAt: null }, { status: 200 });

  const rows = (data ?? []) as { key: string; value?: unknown; updated_at?: string }[];
  const board = rows.find(r => r.key === 'rankings_board');
  const st = rows.find(r => r.key === 'rankings_stages');
  const stages = StagesZ.safeParse(st?.value ?? {});
  /* تاریخِ پانوشت: تازه‌ترینِ دو کلید — عوض‌شدنِ فقط سرستون هم به‌روزرسانی است */
  const updatedAt = [board?.updated_at, st?.updated_at].filter((v): v is string => !!v).sort().at(-1) ?? null;
  return NextResponse.json(
    { board: board?.value ?? null, stages: stages.success ? stages.data : {}, updatedAt },
    /* یک دقیقه کش، با اجازه‌ی سرو کردن نسخه‌ی کهنه هنگام بازاعتبارسنجی —
       رنکینگ روزی چند بار هم عوض نمی‌شود. */
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
