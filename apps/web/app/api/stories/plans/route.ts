export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { listStoryPlans } from '@/lib/stories/plans';
import { getSetting, normalizeFreeQuota } from '@/lib/ads/quota';
import { DEFAULT_STORY_QUOTA } from '@/lib/stories/quota';

/* بسته‌های استوری قابل خرید — فقط بسته‌های فعال */
export async function GET() {
  try {
    const [plans, quotaEnabled, free] = await Promise.all([
      listStoryPlans(true),
      getSetting<boolean>('stories_quota_enabled', false),
      getSetting<unknown>('stories_free_quota', DEFAULT_STORY_QUOTA),
    ]);
    return NextResponse.json(
      { plans, quotaEnabled, free: normalizeFreeQuota(free) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ plans: [], quotaEnabled: false, free: DEFAULT_STORY_QUOTA });
  }
}
