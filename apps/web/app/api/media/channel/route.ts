export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, readJson, readJsonFresh, writeJson, safeKey } from '@/lib/social-server'
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership'
import { redactList } from '@/lib/privacy'

/* کانال‌های کاربران — مثل یوتیوب، برای انتشار ویدیو داشتن کانال لازم است و
   کانال یک مرحله‌ی صریح است (نام + هندل)، نه چیزی که پنهانی ساخته شود. */
const INDEX = 'social/media/channels.json'

export interface UserChannel {
  ownerKey: string
  name: string
  handle: string
  bio: string
  avatar: string
  createdAt: number
  /* ── چرا نقش روی کانال نشست ──
     ویدیویی که از گالریِ یک نقش بالا می‌رود باید در کانالِ همان نقش
     دیده شود. بدونِ این فیلد، «کانالِ من» یک چیزِ بی‌صاحب بود و
     نمی‌شد به کاربر گفت «این کانال را با نقشِ مربی ساختی».
     ⚠️ کانال‌های پیش از این تغییر `role` ندارند؛ `undefined` یعنی
     «نامشخص» و در رابط به‌عنوان کانالِ عمومی نشان داده می‌شود، نه
     کانالِ نقشی. */
  /** نقش‌هایی که این کانال خانه‌شان است. یک کانال می‌تواند خانه‌ی
   *  چند نقشِ همان آدم باشد (کاربر در پنجره انتخابش می‌کند). */
  roles?: ProfileRole[]
  /** میدانِ قدیمی — فقط برای خواندنِ ردیف‌های پیش از این تغییر */
  role?: ProfileRole
}

/** نقش‌هایی که گالری و کانال دارند — «کاربر عادی» عمداً نیست. */
export const CHANNEL_ROLES = ['club', 'coach', 'referee', 'player', 'technician', 'seller', 'manufacturer'] as const
export type ProfileRole = (typeof CHANNEL_ROLES)[number]
const asRole = (v: unknown): ProfileRole | undefined =>
  (CHANNEL_ROLES as readonly string[]).includes(String(v)) ? (String(v) as ProfileRole) : undefined

const normHandle = (h: string) => String(h || '').trim().replace(/^@+/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30).toLowerCase()

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET            → همه‌ی کانال‌ها
   GET ?owner=KEY → کانال همان کاربر (اگر ندارد null)
   GET ?handle=x  → بررسی در دسترس بودن هندل */
export async function GET(req: NextRequest) {
  const list = await readJson<UserChannel[]>(INDEX, [])
  const owner = req.nextUrl.searchParams.get('owner')
  const handle = req.nextUrl.searchParams.get('handle')

  if (handle) {
    const h = normHandle(handle)
    const taken = list.some(c => c.handle === h && (!owner || c.ownerKey !== owner))
    return NextResponse.json({ handle: h, available: !taken && h.length >= 3 }, { headers: CORS })
  }
  /* پرس‌وجو با owner فقط برای «کانال خودم» است؛ مالکیت از نشست
     بررسی می‌شود تا کسی با شماره‌ی دیگری کانال او را نخواند. */
  if (owner) {
    const actor = await actorOf(req).catch(() => null)
    if (!actor || (actor.dmKey !== owner && actor.id !== owner && !actor.isAdmin)) {
      return NextResponse.json(null, { status: 403, headers: CORS })
    }
    /* ⚠️ کلیدِ ذخیره‌شده `dmKey` است (غالباً شماره)، ولی کلاینت
       ممکن است شناسه بفرستد — و آن‌وقت فیلترِ رشته‌ایِ خام همیشه
       خالی برمی‌گشت و کاربر «کانال ندارید» می‌دید در حالی که داشت.
       کلیدِ قانونی از خودِ نشست گرفته می‌شود، نه از پارامتر. */
    /* ⚠️ فهرست همیشه مالِ خودِ نشست است. شاخه‌ی ادمین کانالِ *دیگری*
       را برمی‌گرداند در حالی که POST روی حسابِ خودِ ادمین می‌نویسد —
       پنجره کانالِ کسِ دیگر را نشان می‌داد و روی حسابِ ادمین عمل
       می‌کرد. */
    const key = actor.dmKey || actor.id
    const mine = list.filter(c => c.ownerKey === key)
    /* ⚠️ سازگاری: مصرف‌کننده‌ی قدیمی یک شیء (یا null) انتظار دارد و
       اگر آرایه بگیرد «کانال دارم» را همیشه درست می‌فهمد ولی
       فیلدهایش را نه. پس شکلِ قدیمی سرِ جایش می‌ماند و فهرست زیرِ
       یک کلیدِ تازه می‌آید. */
    const one = req.nextUrl.searchParams.get('all') === '1'
    if (one) return NextResponse.json({ channels: mine }, { headers: CORS })
    return NextResponse.json(mine[0] ?? null, { headers: CORS })
  }

  /* فهرست عمومی کانال‌ها — ownerKey (که غالباً شماره‌ی موبایل است)
     هش می‌شود تا از مسیر عمومی جمع‌آوری نشود. */
  return NextResponse.json(
    redactList(list as unknown as Record<string, unknown>[]),
    { headers: CORS },
  )
}

/* POST { ownerKey, name, handle, bio?, avatar? } → ساخت یا ویرایش کانال */
export async function POST(req: NextRequest) {
  /* مالک کانال از نشست می‌آید: پیش‌تر ownerKey را کلاینت می‌گفت و
     یعنی می‌شد کانال دیگری را ساخت، تصاحب یا بازنویسی کرد. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  const b = await req.json().catch(() => ({}))
  const ownerKey = actor.dmKey || actor.id
  const name = String(b?.name || '').trim().slice(0, 60)
  const handle = normHandle(b?.handle)
  const role = asRole(b?.role)
  /* ⚠️ «افزودنِ نقش» جدا از «ساخت» است: کاربر در پنجره کانالی از نقشِ
     دیگر را انتخاب می‌کند و از آن به بعد باید بی‌سؤال منتشر شود.
     بدونِ این، پنجره تا ابد هر بار باز می‌شد. */
  const addRole = asRole(b?.addRole)

  if (!ownerKey) return NextResponse.json({ ok: false, message: 'کاربر نامشخص است' }, { status: 400, headers: CORS })
  if (name.length < 2) return NextResponse.json({ ok: false, message: 'نام کانال را وارد کنید' }, { status: 400, headers: CORS })
  if (handle.length < 3) return NextResponse.json({ ok: false, message: 'هندل حداقل ۳ نویسه (انگلیسی/عدد) باشد' }, { status: 400, headers: CORS })

  /* ⚠️ این خواندن مبنای نوشتن است. با نسخه‌ی کش‌شده، دو ساختِ
     هم‌زمان (دو تب، دو صفحه‌ی نقش) یکی را پاک می‌کرد — و با مدلِ
     چندکاناله این از‌دست‌رفتن دیگر نامرئی نیست. */
  const list = await readJsonFresh<UserChannel[]>(INDEX, [])
  if (list.some(c => c.handle === handle && c.ownerKey !== ownerKey)) {
    return NextResponse.json({ ok: false, message: 'این هندل قبلاً گرفته شده است' }, { status: 409, headers: CORS })
  }

  /* ── کدام کانال به‌روز می‌شود ──
     پیش‌تر کلیدِ یکتا فقط `ownerKey` بود، پس هر ذخیره کانالِ قبلیِ
     همان کاربر را *بازنویسی* می‌کرد و داشتنِ دو کانال ممکن نبود.
     حالا کلید «مالک + هندل» است: هندلِ موجود ⇒ ویرایش، هندلِ تازه
     ⇒ کانالِ تازه. */
  const existing = list.find(c => c.ownerKey === ownerKey && c.handle === handle)
  const mine = list.filter(c => c.ownerKey === ownerKey)
  /* سقفی که جلوی ساختِ انبوه را می‌گیرد؛ هفت نقش داریم. */
  if (!existing && mine.length >= 7) {
    return NextResponse.json(
      { ok: false, message: 'بیشتر از هفت کانال نمی‌شود ساخت' }, { status: 409, headers: CORS })
  }
  const channel: UserChannel = {
    ownerKey, name, handle,
    bio: String(b?.bio || '').trim().slice(0, 200),
    avatar: String(b?.avatar || ''),
    createdAt: existing?.createdAt ?? Date.now(),
    roles: [...new Set([
      ...(existing?.roles ?? []),
      ...(existing?.role ? [existing.role] : []),
      ...(role ? [role] : []),
      ...(addRole ? [addRole] : []),
    ])],
  }
  const next = existing
    ? list.map(c => (c.ownerKey === ownerKey && c.handle === handle ? channel : c))
    : [...list, channel]
  await writeJson(INDEX, next.slice(-2000))

  return NextResponse.json({ ok: true, channel }, { status: existing ? 200 : 201, headers: CORS })
}
