export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS } from '@/lib/social-server'
import { saveSubscription, removeSubscription } from '@/lib/push-server'
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* POST { user, subscription }            → ذخیره‌ی اشتراکِ Web Push
   POST { user, subscription, action:'remove' } → حذف */
export async function POST(req: NextRequest) {
  /* حساس‌ترین موردِ این دسته: پیش‌تر `user` از بدنه خوانده می‌شد، یعنی
     مهاجم می‌توانست دستگاهِ خودش را زیرِ کلیدِ قربانی ثبت کند و از آن
     پس **اعلان‌های پوشِ او — شاملِ متنِ پیام‌های خصوصی — را دریافت
     کند**؛ یا با action:'remove' اشتراک‌های قربانی را پاک کند. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  const b = await req.json().catch(() => ({}))
  const user = actor.dmKey || actor.id
  const sub = b?.subscription
  if (!user || !sub?.endpoint) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
  if (b?.action === 'remove') { await removeSubscription(user, sub.endpoint); return NextResponse.json({ ok: true }, { headers: CORS }) }
  await saveSubscription(user, sub)
  return NextResponse.json({ ok: true }, { headers: CORS })
}
