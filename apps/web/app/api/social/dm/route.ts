export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import {
  CORS, P, safeKey, convId, dmTopic, broadcast, readJson, writeJson,
  appendMessage, readMessages, getReadCursor, setReadCursor,
  getClearedAt, setClearedAt,
  addNotification, bumpConvIndex, clearConvUnread, touchPoll, getPoll,
  type ConvIndexItem, type DMsg,
} from '@/lib/social-server'
import { sendPush } from '@/lib/push-server'

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET ?user=KEY                    → لیست گفتگوها (+ ثبتِ آنلاین‌بودن برای تیکِ «رسیده»)
   GET ?conv=ID&user=KEY&since=TS   → { messages, otherKey, otherPoll, otherRead } */
export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('conv')
  const user = req.nextUrl.searchParams.get('user') || ''
  const since = parseInt(req.nextUrl.searchParams.get('since') || '0', 10) || 0
  if (user) await touchPoll(user)   // این کاربر آنلاین است ⇒ پیام‌های او «رسیده»

  if (cid) {
    /* convId از safeKeyها ساخته شده؛ safeKey روی رشته‌ی ایمن idempotent است،
       پس طرفِ مقابل را مستقیم از خودِ id می‌گیریم و همان را همه‌جا می‌دهیم. */
    const meSafe = safeKey(user)
    const parts = cid.split('__')
    const otherSafe = parts.find(p => p !== meSafe) || parts[0] || ''

    /* گفتگوی پاک‌شده: پیام‌های قدیمی‌تر از لحظه‌ی پاک‌کردن برای این کاربر برنگردند */
    const cleared = user ? await getClearedAt(cid, user) : 0
    const messages = await readMessages(cid, Math.max(since, cleared))

    /* کرسرِ خواندنِ من را جلو ببر (بدونِ دستکاریِ فایلِ پیام‌ها) + unread صفر */
    let advancedTo = 0
    if (user && messages.length) {
      const lastIncoming = messages.filter(m => m.fromKey !== user).reduce((mx, m) => Math.max(mx, m.at), 0)
      if (lastIncoming && await setReadCursor(cid, user, lastIncoming)) advancedTo = lastIncoming
    }
    if (user) await clearConvUnread(user, cid)

    const otherPoll = otherSafe ? await getPoll(otherSafe) : 0
    const otherRead = otherSafe ? await getReadCursor(cid, otherSafe) : 0

    /* اگر تازه چیزی خواندم، به طرفِ مقابل خبر بده تا تیکش فوری آبی شود */
    if (advancedTo && otherSafe) broadcast(dmTopic(otherSafe), 'read', { convId: cid, reader: meSafe, at: advancedTo })
    /* حضورِ من را هم آنی به طرف بده ⇒ تیکِ «رسیده»اش بدونِ انتظارِ پول به‌روز شود */
    if (user && otherSafe) broadcast(dmTopic(otherSafe), 'poll', { convId: cid, at: Date.now() })

    return NextResponse.json({ messages, otherKey: otherSafe, otherPoll, otherRead }, { headers: CORS })
  }

  const list = await readJson<ConvIndexItem[]>(P.dmIndex(user), [])
  return NextResponse.json(list, { headers: CORS })
}

/* POST { from:{key,name,role}, to:{key,name,role}, text, kind, storyRef? } */
export async function POST(req: NextRequest) {
  const b = await req.json()
  const from = b?.from, to = b?.to
  const text: string = (b?.text ?? '').toString().trim()
  const kind: string = b?.kind || 'text'
  if (!from?.key || !to?.key || !text) return NextResponse.json({ message: 'داده ناقص' }, { status: 400, headers: CORS })

  const id = convId(from.key, to.key)
  const at = Date.now()
  const msg: DMsg = { id: `m-${at}-${Math.floor(Math.random() * 1e4)}`, fromKey: from.key, text, kind, storyRef: b?.storyRef, at }
  await appendMessage(id, msg)   // فایلِ مستقل ⇒ هیچ‌وقت کلوبِر نمی‌شود

  /* Realtime را همین‌جا (قبل از نوشتن‌های ایندکس/نوتیف) شلیک کن تا تحویل زیرِ یک‌ثانیه بماند */
  const payload = { convId: id, message: msg, from: { key: from.key, name: from.name, role: from.role } }
  broadcast(dmTopic(to.key), 'msg', payload)
  broadcast(dmTopic(from.key), 'msg', payload)

  /* بقیه‌ی کارها موازی (قبلاً ترتیبی بود و پوش را چند ثانیه عقب می‌انداخت) */
  const body = kind === 'reaction' ? `استیکر ${text}` : kind === 'like' ? '❤️ لایک استوری' : text
  const tasks: Promise<unknown>[] = [
    bumpConvIndex(to.key,   { key: from.key, name: from.name, role: from.role }, text, kind, at, true),
    bumpConvIndex(from.key, { key: to.key,   name: to.name,   role: to.role   }, text, kind, at, false),
    sendPush(to.key, { title: from.name || 'پیام جدید', body, url: '/direct', tag: id }),
  ]
  if (kind === 'reply' || kind === 'reaction' || kind === 'like') {
    tasks.push(addNotification(to.key, {
      type: kind === 'reply' ? 'reply' : kind === 'like' ? 'like' : 'reaction',
      fromKey: from.key, fromName: from.name, fromRole: from.role, text, storyId: b?.storyRef,
    }))
  }
  const pollP = getPoll(to.key)
  await Promise.all(tasks)
  const otherPoll = await pollP   // فرستنده همان لحظه بداند گیرنده آنلاین بوده ⇒ تیکِ «رسیده» فوری

  return NextResponse.json({ ok: true, convId: id, message: msg, otherPoll }, { status: 201, headers: CORS })
}

/* DELETE ?conv=ID&user=KEY → پاک‌کردنِ گفتگو فقط از سمتِ همین کاربر */
export async function DELETE(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('conv') || ''
  const user = req.nextUrl.searchParams.get('user') || ''
  if (!cid || !user) return NextResponse.json({ message: 'داده ناقص' }, { status: 400, headers: CORS })
  await setClearedAt(cid, user, Date.now())
  const path = P.dmIndex(user)
  const list = await readJson<ConvIndexItem[]>(path, [])
  await writeJson(path, list.filter(c => c.convId !== cid))
  return NextResponse.json({ ok: true }, { headers: CORS })
}
