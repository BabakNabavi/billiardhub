export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { saveSubscription, removeSubscription } from '@/lib/push-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* POST { user, subscription }            → ذخیره‌ی اشتراکِ Web Push
   POST { user, subscription, action:'remove' } → حذف */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const user = String(b?.user || '')
  const sub = b?.subscription
  if (!user || !sub?.endpoint) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
  if (b?.action === 'remove') { await removeSubscription(user, sub.endpoint); return NextResponse.json({ ok: true }, { headers: CORS }) }
  await saveSubscription(user, sub)
  return NextResponse.json({ ok: true }, { headers: CORS })
}
