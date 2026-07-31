export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, P, readJson, writeJson, type Notif } from '@/lib/social-server'
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership'
import { guardSocialInteractions } from '@/lib/features'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* اعلان‌ها داده‌ی خصوصی‌اند: پیش‌تر `user` از کوئری/بدنه خوانده می‌شد و
   یعنی هر کسی می‌توانست اعلان‌های دیگری را بخواند یا خوانده‌شده کند.
   حالا صاحبِ اعلان‌ها همیشه خودِ صاحبِ نشست است. */
const deny = (s: number, body: unknown) => NextResponse.json(body, { status: s, headers: CORS })

/* GET → لیستِ نوتیف‌های خودِ کاربر (تازه‌ترین اول) */
export async function GET(req: NextRequest) {
  /* نوعِ Notif فقط reply|reaction|like است — یعنی این مسیر
     صددرصد مالِ تعاملاتِ اجتماعی است و هیچ اعلانِ دیگری (تأییدِ باشگاه،
     رزرو، پرداخت، تبلیغات) از این‌جا نمی‌گذرد. */
  const off = await guardSocialInteractions(CORS); if (off) return off
  const actor = await actorOf(req)
  if (!actor) return deny(401, UNAUTHENTICATED)

  const user = actor.dmKey || actor.id
  const list = await readJson<Notif[]>(P.notif(user), [])
  return NextResponse.json(list.sort((a, b) => b.at - a.at), { headers: CORS })
}

/* POST { action:'read' } → همه‌ی اعلان‌های خودِ کاربر خوانده‌شده */
export async function POST(req: NextRequest) {
  /* نوعِ Notif فقط reply|reaction|like است — یعنی این مسیر
     صددرصد مالِ تعاملاتِ اجتماعی است و هیچ اعلانِ دیگری (تأییدِ باشگاه،
     رزرو، پرداخت، تبلیغات) از این‌جا نمی‌گذرد. */
  const off = await guardSocialInteractions(CORS); if (off) return off
  const actor = await actorOf(req)
  if (!actor) return deny(401, UNAUTHENTICATED)

  const b = await req.json().catch(() => ({}))
  const user: string = actor.dmKey || actor.id
  if (!user) return NextResponse.json({ message: 'کاربر نامشخص' }, { status: 400, headers: CORS })
  if (b?.action === 'read') {
    const list = await readJson<Notif[]>(P.notif(user), [])
    let changed = false
    for (const n of list) if (!n.read) { n.read = true; changed = true }
    if (changed) await writeJson(P.notif(user), list)
  }
  return NextResponse.json({ ok: true }, { headers: CORS })
}
