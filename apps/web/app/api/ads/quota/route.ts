export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/finance/db';
import { getQuotaState } from '@/lib/ads/quota';
import { listMyOrders } from '@/lib/ads/plans';

/* وضعیتِ بسته و سهمیه‌ی خودِ کاربر — همانی که در پنلش نشان داده می‌شود:
   چه بسته‌ای، تا کی، چند آگهی مانده، و تاریخچه‌ی خریدها. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const [quota, orders] = await Promise.all([
    getQuotaState(actor.id),
    listMyOrders(actor.id),
  ]);

  return NextResponse.json({ quota, orders }, { headers: { 'Cache-Control': 'no-store' } });
}
