export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, P, readJson, writeJson, type Notif } from '@/lib/social-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET ?user=KEY → لیستِ نوتیف‌های کاربر (تازه‌ترین اول) */
export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get('user') || ''
  const list = await readJson<Notif[]>(P.notif(user), [])
  return NextResponse.json(list.sort((a, b) => b.at - a.at), { headers: CORS })
}

/* POST { user, action:'read' } → همه خوانده‌شده */
export async function POST(req: NextRequest) {
  const b = await req.json()
  const user: string = b?.user || ''
  if (!user) return NextResponse.json({ message: 'کاربر نامشخص' }, { status: 400, headers: CORS })
  if (b?.action === 'read') {
    const list = await readJson<Notif[]>(P.notif(user), [])
    let changed = false
    for (const n of list) if (!n.read) { n.read = true; changed = true }
    if (changed) await writeJson(P.notif(user), list)
  }
  return NextResponse.json({ ok: true }, { headers: CORS })
}
