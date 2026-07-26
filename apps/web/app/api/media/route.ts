export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, readJson, writeJson } from '@/lib/social-server'

/* ویدیوهای آپلودیِ کاربران — مثل یوتیوب، سمت‌سرور روی Supabase Storage.
   هر کاربرِ لاگین‌کرده می‌تواند کانال بسازد و ویدیو بگذارد. */
const INDEX = 'social/media/index.json'

export interface UserVideo {
  id: string
  title: string
  category: string
  ownerKey: string
  creatorName: string
  creatorHandle: string
  duration: string
  views: number
  likes: number
  date: string
  ts: number
  thumb: string
  src: string
  description: string[]
  tags: string[]
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET → همه‌ی ویدیوهای کاربران (تازه‌ترین اول) */
export async function GET() {
  const list = await readJson<UserVideo[]>(INDEX, [])
  return NextResponse.json(list.sort((a, b) => b.ts - a.ts), { headers: CORS })
}

/* POST { video } → افزودنِ ویدیوی جدید (بعد از آپلودِ فایل‌ها در Storage) */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const v = b?.video
  if (!v?.title?.trim() || !v?.src || !v?.ownerKey) {
    return NextResponse.json({ ok: false, message: 'داده ناقص' }, { status: 400, headers: CORS })
  }
  const list = await readJson<UserVideo[]>(INDEX, [])
  const now = Date.now()
  const item: UserVideo = {
    id: String(v.id || `uv-${now}-${Math.floor(Math.random() * 1e4)}`),
    title: String(v.title).slice(0, 160).trim(),
    category: String(v.category || 'techniques'),
    ownerKey: String(v.ownerKey),
    creatorName: String(v.creatorName || 'کاربر').slice(0, 60),
    creatorHandle: String(v.creatorHandle || v.ownerKey).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 60),
    duration: String(v.duration || '۰۰:۰۰'),
    views: 0, likes: 0,
    date: String(v.date || ''),
    ts: now,
    thumb: String(v.thumb || ''),
    src: String(v.src),
    description: Array.isArray(v.description) ? v.description.map(String).slice(0, 6) : [],
    tags: Array.isArray(v.tags) ? v.tags.map(String).slice(0, 8) : [],
  }
  list.unshift(item)
  await writeJson(INDEX, list.slice(0, 800))
  return NextResponse.json({ ok: true, video: item }, { status: 201, headers: CORS })
}

/* DELETE ?id=..&user=KEY → حذفِ ویدیوی خودِ کاربر */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const user = req.nextUrl.searchParams.get('user') || ''
  if (!id || !user) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
  const list = await readJson<UserVideo[]>(INDEX, [])
  const next = list.filter(v => !(v.id === id && v.ownerKey === user))
  if (next.length !== list.length) await writeJson(INDEX, next)
  return NextResponse.json({ ok: true }, { headers: CORS })
}
