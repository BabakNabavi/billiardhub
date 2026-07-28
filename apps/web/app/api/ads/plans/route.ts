export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { listPlans } from '@/lib/ads/plans';
import { getSetting } from '@/lib/ads/quota';

/* بسته‌های آگهیِ قابلِ خرید — فقط پلن‌های فعال.
   تا وقتی ادمین سهمیه را روشن نکرده، خریدن پلن اجباری نیست؛ ولی
   صفحه‌ی پلن‌ها همیشه قابلِ دیدن است تا بشود از همین فردا فروخت. */
export async function GET() {
  try {
    const [plans, quotaEnabled, free] = await Promise.all([
      listPlans(true),
      getSetting<boolean>('ads_quota_enabled', false),
      getSetting<{ quota: number; period: string }>('ads_free_quota', { quota: 3, period: 'week' }),
    ]);
    return NextResponse.json({ plans, quotaEnabled, free }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ plans: [], quotaEnabled: false, free: { quota: 3, period: 'week' } });
  }
}
