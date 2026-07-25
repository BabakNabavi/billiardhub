export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import {
  CORS, P, readJson, writeJson, convId, addNotification, bumpConvIndex, clearConvUnread,
  type ConvIndexItem,
} from '@/lib/social-server'

interface DMsg { id: string; fromKey: string; text: string; kind: string; storyRef?: string; at: number }
interface Conv { id: string; parts: string[]; messages: DMsg[] }

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET ?user=KEY            → لیست گفتگوهای کاربر
   GET ?conv=ID&user=KEY    → پیام‌های یک گفتگو (و علامت‌گذاریِ خوانده‌شده) */
export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get('conv')
  const user = req.nextUrl.searchParams.get('user') || ''
  if (cid) {
    const conv = await readJson<Conv | null>(P.conv(cid), null)
    if (user) await clearConvUnread(user, cid)
    return NextResponse.json(conv?.messages ?? [], { headers: CORS })
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
