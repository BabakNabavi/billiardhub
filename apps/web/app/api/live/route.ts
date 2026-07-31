export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, BUCKET, safeKey, readJsonFresh, writeJson } from '@/lib/social-server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership'

/* جلسات پخش زنده — هر جلسه یک فایل مستقل (بدون کلوبر هنگام تپش همزمان).
   جلسه‌ای که ۴۵ ثانیه تپش نفرستد، پایان‌یافته حساب می‌شود. */
const DIR = 'social/live/s'
const sPath = (id: string) => `${DIR}/${safeKey(id)}.json`
const STALE = 45_000

export interface LiveSession {
  id: string
  clubId: string
  clubName: string
  title: string
  ownerKey: string
  discipline: string
  startedAt: number
  lastBeat: number
  viewers: number
  ended?: boolean
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET            → جلسات فعال
   GET ?id=...    → یک جلسه */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const s = await readJsonFresh<LiveSession | null>(sPath(id), null)
    if (!s || s.ended || Date.now() - s.lastBeat > STALE) {
      return NextResponse.json(null, { headers: { ...CORS, 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json(s, { headers: { ...CORS, 'Cache-Control': 'no-store' } })
  }

  try {
    const { data } = await getSupabaseServer().storage.from(BUCKET).list(DIR, { limit: 200 })
    const files = (data ?? []).filter(f => f.name.endsWith('.json'))
    const all = await Promise.all(files.map(f => readJsonFresh<LiveSession | null>(`${DIR}/${f.name}`, null)))
    const now = Date.now()
    const live = (all.filter(Boolean) as LiveSession[])
      .filter(s => !s.ended && now - s.lastBeat <= STALE)
      .sort((a, b) => b.startedAt - a.startedAt)
    return NextResponse.json(live, { headers: { ...CORS, 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json([], { headers: { ...CORS, 'Cache-Control': 'no-store' } })
  }
}

/* POST { action:'start'|'beat'|'stop', ... } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const action = String(b?.action || '')

  /* پخش زنده به باشگاه گره خورده: فقط مالک همان باشگاه (یا ادمین)
     می‌تواند شروع کند، و فقط صاحب جلسه تپش/پایان بفرستد. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  if (action === 'start') {
    const clubId = String(b?.clubId || '')
    const ownerKey = actor.dmKey || actor.id
    if (!clubId) return NextResponse.json({ ok: false, message: 'داده ناقص' }, { status: 400, headers: CORS })
    if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })
    const id = `lv-${Date.now()}-${Math.floor(Math.random() * 1e4)}`
    const s: LiveSession = {
      id, clubId, ownerKey,
      clubName: String(b?.clubName || 'باشگاه').slice(0, 60),
      title: String(b?.title || 'پخش زنده').slice(0, 90),
      discipline: String(b?.discipline || 'اسنوکر').slice(0, 30),
      startedAt: Date.now(), lastBeat: Date.now(), viewers: 0,
    }
    await writeJson(sPath(id), s)
    return NextResponse.json({ ok: true, session: s }, { status: 201, headers: CORS })
  }

  if (action === 'beat' || action === 'stop') {
    const id = String(b?.id || '')
    if (!id) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
    const s = await readJsonFresh<LiveSession | null>(sPath(id), null)
    if (!s) return NextResponse.json({ ok: false, message: 'جلسه یافت نشد' }, { status: 404, headers: CORS })
    /* فقط صاحب پخش می‌تواند تپش/پایان بفرستد.
       شرط قبلی به `b.ownerKey` نگاه می‌کرد و با **حذف** آن از بدنه
       کاملاً دور زده می‌شد؛ حالا مبنا نشست است. */
    const me = actor.dmKey || actor.id
    if (s.ownerKey !== me && !actor.isAdmin) {
      return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })
    }
    const next: LiveSession = {
      ...s, lastBeat: Date.now(),
      viewers: typeof b?.viewers === 'number' ? Math.max(0, b.viewers) : s.viewers,
      ...(action === 'stop' ? { ended: true } : {}),
    }
    await writeJson(sPath(id), next)
    return NextResponse.json({ ok: true, session: next }, { headers: CORS })
  }

  return NextResponse.json({ ok: false, message: 'action نامعتبر' }, { status: 400, headers: CORS })
}
