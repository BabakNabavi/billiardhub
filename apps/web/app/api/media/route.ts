export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, readJson, writeJson } from '@/lib/social-server'
import { actorOf, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership'
import { redactList } from '@/lib/privacy'

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

/* GET → همه‌ی ویدیوهای کاربران (تازه‌ترین اول).

   عمداً عمومی است (فهرستِ ویدیوها مثلِ صفحه‌ی اولِ یوتیوب)، ولی
   `ownerKey` از `phone || id` ساخته می‌شود و برای بیشترِ کاربران
   همان شماره‌ی موبایل است؛ پیش‌تر عیناً برمی‌گشت و هر کسی بدونِ ورود
   می‌توانست شماره‌ها را جمع کند. حالا هشِ پایدار برمی‌گردد. */
export async function GET(req: NextRequest) {
  const list = await readJson<UserVideo[]>(INDEX, [])
  const actor = await actorOf(req).catch(() => null)
  const sorted = list.sort((a, b) => b.ts - a.ts)
  return NextResponse.json(
    redactList(sorted as unknown as Record<string, unknown>[], actor?.dmKey ?? null),
    { headers: CORS },
  )
}

/* POST { video } → افزودنِ ویدیوی جدید (بعد از آپلودِ فایل‌ها در Storage) */
export async function POST(req: NextRequest) {
  /* مالکیت از نشست می‌آید، نه از بدنه. پیش‌تر ownerKey را کلاینت
     می‌گفت و یعنی هر کسی می‌توانست ویدیو را به نامِ دیگری ثبت کند. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  const b = await req.json().catch(() => ({}))
  const v = b?.video
  if (!v?.title?.trim() || !v?.src) {
    return NextResponse.json({ ok: false, message: 'داده ناقص' }, { status: 400, headers: CORS })
  }
  const ownerKey = actor.dmKey || actor.id
  const list = await readJson<UserVideo[]>(INDEX, [])
  const now = Date.now()
  const item: UserVideo = {
    id: String(v.id || `uv-${now}-${Math.floor(Math.random() * 1e4)}`),
    title: String(v.title).slice(0, 160).trim(),
    category: String(v.category || 'techniques'),
    ownerKey,
    creatorName: String(v.creatorName || 'کاربر').slice(0, 60),
    creatorHandle: String(v.creatorHandle || ownerKey).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 60),
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
  /* پیش‌تر `user` از کوئری خوانده می‌شد، یعنی با گذاشتنِ کلیدِ قربانی
     می‌شد ویدیوی او را پاک کرد. حالا مالک از نشست می‌آید. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ ok: false }, { status: 400, headers: CORS })

  const list = await readJson<UserVideo[]>(INDEX, [])
  const target = list.find(v => v.id === id)
  if (!target) return NextResponse.json({ ok: true }, { headers: CORS })   // چیزی برای حذف نیست

  const mine = target.ownerKey === actor.dmKey || target.ownerKey === actor.id
  if (!mine && !actor.isAdmin) return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS })

  await writeJson(INDEX, list.filter(v => v.id !== id))
  return NextResponse.json({ ok: true }, { headers: CORS })
}
