export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/finance/db';
import { getStoryQuotaState } from '@/lib/stories/quota';
import { countStories } from '@/lib/stories/count';
import { listMyStoryOrders } from '@/lib/stories/plans';

/* وضعیتِ بسته و سهمیه‌ی استوریِ خودِ کاربر.

   کلیدِ شمارشِ استوری‌ها ownerKey است (همان چیزی که موقعِ انتشار ثبت
   می‌شود) و ممکن است شماره‌ی موبایل باشد، نه شناسه‌ی کاربر؛ پس هر دو
   شمرده و بیشترشان مبنا قرار می‌گیرد تا سهمیه دور زده نشود. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const ownerKey = new URL(req.url).searchParams.get('ownerKey') ?? '';

  const [quota, orders] = await Promise.all([
    getStoryQuotaState(actor.id, async period => {
      const counts = await Promise.all(
        [actor.id, ownerKey].filter(Boolean).map(k => countStories(k, period)),
      );
      return Math.max(0, ...counts);
    }),
    listMyStoryOrders(actor.id),
  ]);

  return NextResponse.json({ quota, orders }, { headers: { 'Cache-Control': 'no-store' } });
}
