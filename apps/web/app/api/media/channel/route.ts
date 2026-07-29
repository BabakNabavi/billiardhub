export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, readJson, writeJson, safeKey } from '@/lib/social-server'
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership'

/* کانال‌های کاربران — مثل یوتیوب، برای انتشارِ ویدیو داشتنِ کانال لازم است و
   کانال یک مرحله‌ی صریح است (نام + هندل)، نه چیزی که پنهانی ساخته شود. */
const INDEX = 'social/media/channels.json'

export interface UserChannel {
  ownerKey: string
  name: string
  handle: string
  bio: string
  avatar: string
  createdAt: number
}

const normHandle = (h: string) => String(h || '').trim().replace(/^@+/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30).toLowerCase()

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET            → همه‌ی کانال‌ها
   GET ?owner=KEY → کانالِ همان کاربر (اگر ندارد null)
   GET ?handle=x  → بررسیِ در دسترس بودنِ هندل */
export async function GET(req: NextRequest) {
  const list = await readJson<UserChannel[]>(INDEX, [])
  const owner = req.nextUrl.searchParams.get('owner')
  const handle = req.nextUrl.searchParams.get('handle')

  if (handle) {
    const h = normHandle(handle)
    const taken = list.some(c => c.handle === h && (!owner || c.ownerKey !== owner))
    return NextResponse.json({ handle: h, available: !taken && h.length >= 3 }, { headers: CORS })
  }
  if (owner) {
    return NextResponse.json(list.find(c => c.ownerKey === owner) ?? null, { headers: CORS })
  }
  return NextResponse.json(list, { headers: CORS })
}

/* POST { ownerKey, name, handle, bio?, avatar? } → ساخت یا ویرایشِ کانال */
export async function POST(req: NextRequest) {
  /* مالکِ کانال از نشست می‌آید: پیش‌تر ownerKey را کلاینت می‌گفت و
     یعنی می‌شد کانالِ دیگری را ساخت، تصاحب یا بازنویسی کرد. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  const b = await req.json().catch(() => ({}))
  const ownerKey = actor.dmKey || actor.id
  const name = String(b?.name || '').trim().slice(0, 60)
  const handle = normHandle(b?.handle)

  if (!ownerKey) return NextResponse.json({ ok: false, message: 'کاربر نامشخص است' }, { status: 400, headers: CORS })
  if (name.length < 2) return NextResponse.json({ ok: false, message: 'نامِ کانال را وارد کنید' }, { status: 400, headers: CORS })
  if (handle.length < 3) return NextResponse.json({ ok: false, message: 'هندل حداقل ۳ نویسه (انگلیسی/عدد) باشد' }, { status: 400, headers: CORS })

  const list = await readJson<UserChannel[]>(INDEX, [])
  if (list.some(c => c.handle === handle && c.ownerKey !== ownerKey)) {
    return NextResponse.json({ ok: false, message: 'این هندل قبلاً گرفته شده است' }, { status: 409, headers: CORS })
  }

  const existing = list.find(c => c.ownerKey === ownerKey)
  const channel: UserChannel = {
    ownerKey, name, handle,
    bio: String(b?.bio || '').trim().slice(0, 200),
    avatar: String(b?.avatar || ''),
    createdAt: existing?.createdAt ?? Date.now(),
  }
  const next = existing ? list.map(c => (c.ownerKey === ownerKey ? channel : c)) : [...list, channel]
  await writeJson(INDEX, next.slice(-2000))

  return NextResponse.json({ ok: true, channel }, { status: existing ? 200 : 201, headers: CORS })
}
