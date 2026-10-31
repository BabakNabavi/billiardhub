export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sessionFromRequest } from '@/lib/auth/session'
import { ipOf } from '@/lib/auth/rate-limit'
import { providerForChannel } from '@/lib/streaming'
import { canWatch } from '@/lib/streaming/policy'
import { channelById, clubSettings, tablesReady } from '@/lib/streaming/repo'
import { viewerBeat } from '@/lib/streaming/public'
import { VIEWER_ID } from '@/lib/streaming/viewers'

/* POST /api/streams/:id/play { viewerId, url? }
   هم «اجازه‌ی تماشا» است هم تپشِ بیننده (هر ~۳۰ ثانیه):
   - دسترسی: کانالِ «اعضا» فقط برای کاربرِ واردشده
   - نشانیِ پخش: فقط وقتی `url: true` (بارِ اول) — اگر سرویس لینکِ
     امضاشده بدهد، همین‌جا برای همین بیننده ساخته می‌شود */
const Body = z.object({ viewerId: z.string().regex(VIEWER_ID), url: z.boolean().optional() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = Body.safeParse(await req.json().catch(() => ({})))
  if (!z.string().uuid().safeParse(id).success || !body.success) {
    return NextResponse.json({ message: 'درخواست نامعتبر' }, { status: 400 })
  }
  if (!(await tablesReady())) return NextResponse.json({ message: 'پخش زنده هنوز راه‌اندازی نشده است' }, { status: 503 })

  try {
    const ch = await channelById(id)
    if (!ch || ch.archivedAt) return NextResponse.json({ message: 'کانال یافت نشد' }, { status: 404 })
    if (!ch.isLive || ch.adminBlocked || (await clubSettings(ch.clubId)).blocked) return NextResponse.json({ live: false, viewers: 0 })
    if (!canWatch(ch.access, !!sessionFromRequest(req))) {
      return NextResponse.json({ message: 'تماشای این پخش فقط برای کاربرانِ عضو است', needLogin: true }, { status: 401 })
    }
    const viewers = await viewerBeat(ch, body.data.viewerId, ipOf(req))
    let url: string | null = null
    if (body.data.url) {
      url = await providerForChannel(ch.provider)?.playbackUrl(ch, { ip: ipOf(req) }).catch(e => {
        console.error('[streams] playback url', e); return null
      }) ?? null
    }
    return NextResponse.json({ live: true, viewers, url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('[streams] play', e)
    return NextResponse.json({ message: 'اتصال به پخش ممکن نشد' }, { status: 500 })
  }
}
