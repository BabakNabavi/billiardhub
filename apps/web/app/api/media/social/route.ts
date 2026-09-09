export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { actorFromRequest } from '@/lib/finance/db'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'
import {
  channelSubState, toggleSubscription,
  likeState, toggleLike,
  listComments, addComment, deleteComment, commentOwner, videoOwner, videoIdBySlug,
} from '@/lib/media/social'

/* ─────────────────────────────────────────────────────────────
   اشتراک / پسند / دیدگاه — یک مسیر برای هر سه.

   ⚠️ `available: false` در پاسخ یعنی جدول مربوطه هنوز روی سرور
   ساخته نشده (مهاجرت ۰۹۲ دستی اجرا می‌شود). رابط در آن حالت دکمه
   را اصلا رندر نمی‌کند — نه اینکه صفر نشان بدهد یا خطا بیندازد.

   ⚠️ GET بدون ورود هم کار می‌کند (شمارش عمومی است)؛ فقط وضعیت
   «خودم پسندیده‌ام / دنبال می‌کنم» به نشست نیاز دارد.

   ⚠️ اعتبارسنجی دستی است و نه با Zod: Zod وابستگی `apps/web`
   نیست و افزودن dependency در این پروژه اجازه‌ی جدا می‌خواهد.
   هر ورودی سقف طول دارد و `action` از فهرست بسته می‌آید.
   ───────────────────────────────────────────────────────────── */

const ACTIONS = ['subscribe', 'like', 'comment', 'deleteComment'] as const
type Action = typeof ACTIONS[number]

/** رشته‌ی امن: فقط رشته، بریده تا سقف، بدون فاصله‌ی حاشیه. */
const s = (v: unknown, max: number) =>
  (typeof v === 'string' ? v : '').trim().slice(0, max)

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const actor = actorFromRequest(req)
  const me = actor?.id

  const handle = s(u.searchParams.get('channel'), 30)
  if (handle) return NextResponse.json(await channelSubState(handle, me))

  const slug = s(u.searchParams.get('video'), 120)
  if (!slug) return NextResponse.json({ message: 'پارامتر لازم است' }, { status: 400 })

  const id = await videoIdBySlug(slug)
  if (!id) return NextResponse.json({ message: 'ویدیو پیدا نشد' }, { status: 404 })

  const [likes, comments] = await Promise.all([
    likeState(id, me),
    u.searchParams.get('comments') === '1' ? listComments(id) : Promise.resolve(null),
  ])
  return NextResponse.json({ likes, ...(comments ? { comments } : {}) })
}

/* «جدول نیست» ⟵ ۵۰۳ ، «خطا» ⟵ ۵۰۰ ، وگرنه وضعیت تازه. */
const toggleResponse = (r: { kind: string; state?: unknown }) =>
  r.kind === 'ok'
    ? NextResponse.json(r.state)
    : r.kind === 'unavailable'
      ? NextResponse.json({ message: 'این قابلیت هنوز فعال نیست' }, { status: 503 })
      : NextResponse.json({ message: 'انجام نشد؛ دوباره تلاش کنید' }, { status: 500 })

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req)
  if (!actor) return NextResponse.json({ message: 'برای این کار وارد شوید' }, { status: 401 })

  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const action = s(b.action, 20) as Action
  if (!(ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json({ message: 'کنش نامعتبر' }, { status: 400 })
  }

  /* ⚠️ سقف نرخ روی *نوشتن*: بدون آن یک حلقه می‌تواند صدها دیدگاه
     بگذارد یا شمارنده‌ی اشتراک را با ثبت/حذف پیاپی بکوبد. */
  const rl = await hitRateLimit(req, { action: 'media_social', max: 60, windowSec: 600 }, actor.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  if (action === 'subscribe') {
    /* ۳۰ نویسه — همان سقف `channel_subs_handle_chk` در مهاجرت */
    const handle = s(b.channel, 30)
    if (!handle) return NextResponse.json({ message: 'کانال لازم است' }, { status: 400 })
    return toggleResponse(await toggleSubscription(handle, actor.id))
  }

  const slug = s(b.video, 120)
  const id = slug ? await videoIdBySlug(slug) : null
  if (!id) return NextResponse.json({ message: 'ویدیو پیدا نشد' }, { status: 404 })

  if (action === 'like') return toggleResponse(await toggleLike(id, actor.id))

  if (action === 'comment') {
    const body = s(b.body, 2000)
    if (!body) return NextResponse.json({ message: 'متن دیدگاه خالی است' }, { status: 400 })
    const parent = s(b.parentId, 40) || undefined
    const row = await addComment(id, actor.id, body, parent)
    /* `null` یعنی والد نامعتبر یا خطای ثبت — هر دو ۴۰۰ */
    if (!row) return NextResponse.json({ message: 'دیدگاه ثبت نشد' }, { status: 400 })
    return NextResponse.json({ comment: row }, { status: 201 })
  }

  /* action === 'deleteComment' */
  const cid = s(b.commentId, 40)
  if (!cid) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 })

  /* ⚠️ ردیف مستقیم خوانده می‌شود. نسخه‌ی اول ۲۰۰ دیدگاه اول را
     می‌گرفت و بینشان می‌گشت — روی ویدیویی با دیدگاه بیشتر،
     نویسنده‌ی واقعی ۴۰۴ می‌گرفت و هرگز نمی‌توانست دیدگاه خودش را
     پاک کند. */
  const target = await commentOwner(cid)
  if (!target || target.videoId !== id) {
    return NextResponse.json({ message: 'دیدگاه پیدا نشد' }, { status: 404 })
  }
  const owner = await videoOwner(id)
  if (target.userId !== actor.id && owner?.ownerId !== actor.id) {
    return NextResponse.json({ message: 'اجازه‌ی حذف این دیدگاه را ندارید' }, { status: 403 })
  }
  const ok = await deleteComment(cid)
  return NextResponse.json({ ok }, { status: ok ? 200 : 500 })
}
