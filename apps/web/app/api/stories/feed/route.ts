import { NextResponse } from 'next/server'
import { loadStoryFeed } from '@/lib/story-feed'

/* همه‌ی استوری‌های فعالِ باشگاه‌ها و فروشگاه‌ها در یک پاسخ — جای
   آبشارِ «فهرستِ باشگاه + فهرستِ فروشگاه + یک درخواست برای هرکدام»
   (lib/story-feed). عمومی و بی‌نشست، پس کشِ کوتاهِ مرورگر/پراکسی امن است. */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const groups = await loadStoryFeed()
    return NextResponse.json(groups, {
      headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' },
    })
  } catch (e) {
    console.error('[stories/feed] ساختنِ فید شکست خورد:', e)
    /* no-store: آرایه‌ی خالیِ ناشی از خطا نباید در مرورگر/پراکسی بماند */
    return NextResponse.json([], { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
