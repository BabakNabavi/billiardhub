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

  /* پارامترِ `ownerKey` از کوئری حذف شد.

     هیچ فراخوانی‌ای در پروژه آن را نمی‌فرستاد (هر سه مصرف‌کننده بدونِ
     پارامتر صدا می‌زنند)، ولی چون در شمارش شرکت می‌کرد، هر کسی
     می‌توانست کلیدِ شخصِ دیگری را بفرستد و از عددِ برگشتی تعدادِ
     استوریِ او را استنتاج کند. مجوز هیچ‌وقت به آن وابسته نبود، پس
     حذفش هیچ رفتاری را عوض نمی‌کند و یک ورودیِ کلاینت‌محور کم می‌شود. */
  const [quota, orders] = await Promise.all([
    getStoryQuotaState(actor.id, period => countStories(actor.id, period)),
    listMyStoryOrders(actor.id),
  ]);

  return NextResponse.json({ quota, orders }, { headers: { 'Cache-Control': 'no-store' } });
}
