export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import {
  CORS, P, readJson, writeJson, convId, addNotification, bumpConvIndex, clearConvUnread,
  touchPoll, getPoll, type ConvIndexItem,
} from '@/lib/social-server'

interface DMsg { id: string; fromKey: string; text: string; kind: string; storyRef?: string; at: number; readBy?: string[] }
interface Conv { id: string; parts: string[]; messages: DMsg[] }

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET ?user=KEY            → لیست گفتگوها (و ثبتِ فعالیتِ کاربر برای تیکِ «رسیده»)
   GET ?conv=ID&user=KEY    → { messages, otherKey, otherPoll } + علامت‌گذاریِ دیده‌شده */
export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('conv')
  const user = req.nextUrl.searchParams.get('user') || ''
  if (user) await touchPoll(user)   // این کاربر آنلاین است ⇒ پیام‌های او «رسیده»

  if (cid) {
    const conv = await readJson<Conv | null>(P.conv(cid), null)
    let changed = false
    if (conv && user) {
      for (const m of conv.messages) {
        if (m.fromKey !== user) {
          m.readBy = m.readBy || []
          if (!m.readBy.includes(user)) { m.readBy.push(user); changed = true }
        }
      }
      if (changed) await writeJson(P.conv(cid), conv)
      await clearConvUnread(user, cid)
    }
    const otherKey = conv ? conv.parts.find(p => p !== user) || '' : ''
    const otherPoll = otherKey ? await getPoll(otherKey) : 0
    return NextResponse.json({ messages: conv?.messages ?? [], otherKey, otherPoll }, { headers: CORS })
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
  const conv: Conv = (await readJson<Conv | null>(P.conv(id), null)) ?? { id, parts: [from.key, to.key], messages: [] as DMsg[] }
  const at = Date.now()
  conv.messages.push({ id: `m-${at}-${Math.floor(Math.random() * 1e4)}`, fromKey: from.key, text, kind, storyRef: b?.storyRef, at })
  await writeJson(P.conv(id), conv)

  /* ایندکسِ هر دو طرف؛ برای گیرنده unread++ */
  await bumpConvIndex(to.key,   { key: from.key, name: from.name, role: from.role }, text, kind, at, true)
  await bumpConvIndex(from.key, { key: to.key,   name: to.name,   role: to.role   }, text, kind, at, false)

  /* نوتیفیکیشن برای گیرنده — فقط پیامِ اولیه‌ی مربوط به استوری (reply/reaction/like) */
  if (kind === 'reply' || kind === 'reaction' || kind === 'like') {
    await addNotification(to.key, {
      type: kind === 'reply' ? 'reply' : kind === 'like' ? 'like' : 'reaction',
      fromKey: from.key, fromName: from.name, fromRole: from.role, text, storyId: b?.storyRef,
    })
  }
  return NextResponse.json({ ok: true, convId: id, at }, { status: 201, headers: CORS })
}
