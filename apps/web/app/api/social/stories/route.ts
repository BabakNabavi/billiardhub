export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, DAY, P, readJson, writeJson } from '@/lib/social-server'

const LIMITS: Record<string, number> = { player: 2, coach: 2, referee: 1, technician: 2, seller: 4, manufacturer: 2, club_owner: 3 }

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

  const limit = LIMITS[s.roleKey || 'player'] ?? 0
  if (limit <= 0) return NextResponse.json({ message: 'حساب شما امکان انتشار استوری ندارد' }, { status: 403, headers: CORS })

  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(x => now - x.createdAt < DAY)
  const today = new Date().toDateString()
  const todayCount = live.filter(x => x.ownerKey === s.ownerKey && new Date(x.createdAt).toDateString() === today).length
  if (todayCount >= limit) return NextResponse.json({ message: `سقف استوریِ امروزِ شما (${limit}) پر شده است` }, { status: 429, headers: CORS })

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
