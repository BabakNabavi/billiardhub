export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/finance/db';
import { myCampaigns } from '@/lib/ads/booking';

/* کمپین‌های خود کاربر — دادهٔ داشبورد تبلیغ‌دهنده.
   فقط کمپین‌هایی که user_id آن‌ها همین کاربر است. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  try {
    const campaigns = await myCampaigns(actor.id);
    const sum = (f: (c: typeof campaigns[number]) => number) => campaigns.reduce((s, c) => s + f(c), 0);
    const impressions = sum(c => c.impressions);
    const clicks = sum(c => c.clicks);

    return NextResponse.json({
      campaigns,
      totals: {
        all: campaigns.length,
        active: campaigns.filter(c => c.status === 'ACTIVE').length,
        pending: campaigns.filter(c => c.status === 'PENDING_PAYMENT' || c.status === 'PENDING_REVIEW').length,
        scheduled: campaigns.filter(c => c.status === 'SCHEDULED').length,
        expired: campaigns.filter(c => c.status === 'EXPIRED').length,
        rejected: campaigns.filter(c => c.status === 'REJECTED').length,
        cancelled: campaigns.filter(c => c.status === 'CANCELLED').length,
        impressions, clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        spent: campaigns.filter(c => c.paymentStatus === 'PAID').reduce((s, c) => s + (c.amount ?? 0), 0),
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ campaigns: [], totals: null });
  }
}
