export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, DAY, P, readJson, writeJson } from '@/lib/social-server'
import { actorFromRequest } from '@/lib/finance/db'
import { getStoryQuotaState } from '@/lib/stories/quota'

/* سقفِ استوری دیگر هاردکد نیست — از تنظیماتِ ادمین (به تفکیکِ نقش) و
   بسته‌ی خریداری‌شده می‌آید. اعدادِ قبلی به‌عنوانِ پیش‌فرض در مایگریشنِ
   ۰۱۳ نشسته‌اند تا رفتارِ امروزِ سایت عوض نشود. */
const PERIOD_MS: Record<'day' | 'week' | 'month', number> = { day: DAY, week: 7 * DAY, month: 30 * DAY }

interface SStory {
  id: string; ownerKey: string; userName: string
  roleKey: string; roleLabel: string; roleColor: string
  avatar: string; logoUrl?: string; mediaUrl: string; caption: string; createdAt: number
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

export async function GET() {
  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(s => now - s.createdAt < DAY)
  if (live.length !== all.length) writeJson(P.stories, live).catch(() => {})
  return NextResponse.json(live, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const s = (await req.json()) as Partial<SStory>
  if (!s.ownerKey || !s.mediaUrl) return NextResponse.json({ message: 'داده ناقص' }, { status: 400, headers: CORS })

  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(x => now - x.createdAt < DAY)

  /* سقف از تنظیماتِ ادمین و بسته‌ی خریداری‌شده می‌آید، نه از عددِ هاردکد.
     شمارش هم روی همان ownerKey که استوری با آن ثبت می‌شود. */
  const actor = actorFromRequest(req)
  const quota = await getStoryQuotaState(
    actor?.id ?? '',
    async period => {
      const since = now - PERIOD_MS[period]
      return all.filter(x => x.ownerKey === s.ownerKey && x.createdAt >= since).length
    },
    actor ? undefined : (s.roleKey || 'player'),
  )

  if (!quota.allowed) {
    return NextResponse.json(
      { message: quota.message ?? 'سقفِ استوریِ شما پر شده است', quotaExceeded: true },
      { status: quota.limit <= 0 ? 403 : 429, headers: CORS },
    )
  }

  const story: SStory = {
    id: `st-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    ownerKey: s.ownerKey, userName: s.userName || 'کاربر',
    roleKey: s.roleKey || 'player', roleLabel: s.roleLabel || 'بازیکن', roleColor: s.roleColor || '#06b6d4',
    avatar: s.avatar || 'ک', logoUrl: s.logoUrl, mediaUrl: s.mediaUrl, caption: s.caption || '', createdAt: now,
  }
  live.unshift(story)
  await writeJson(P.stories, live)
  return NextResponse.json(story, { status: 201, headers: CORS })
}
