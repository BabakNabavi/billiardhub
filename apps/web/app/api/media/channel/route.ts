export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, readJson, readJsonFresh, writeJson } from '@/lib/social-server'
import { z } from 'zod'
import { asRole, normHandle, channelKey, CHANNEL_ROLES, type UserChannel, type ChannelRole } from '@/lib/media/channel'
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership'
import { redactList } from '@/lib/privacy'

/* کانال‌های کاربران — مثل یوتیوب، برای انتشار ویدیو داشتن کانال لازم است و
   کانال یک مرحله‌ی صریح است (نام + هندل)، نه چیزی که پنهانی ساخته شود. */
const INDEX = 'social/media/channels.json'

/* سقف کل فهرست. رسیدن به آن یعنی باید فهرست از یک فایل JSON به
   جدول منتقل شود — نه اینکه ردیف‌ها بی‌صدا دور ریخته شوند. */
const MAX_CHANNELS = 2000

/* تایپ و قواعد در `lib/media/channel` است — سه اعلان جدا داشتیم و
   از هم جدا افتاده بودند (یکی‌شان `role` نداشت). */
export type { UserChannel, ChannelRole }

/* شناسه‌ی تازه — بدون وابستگی به crypto.randomUUID */
const newId = () => `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

/* GET            → همه‌ی کانال‌ها
   GET ?owner=KEY → کانال همان کاربر (اگر ندارد null)
   GET ?handle=x  → بررسی در دسترس بودن هندل */
export async function GET(req: NextRequest) {
  const list = await readJson<UserChannel[]>(INDEX, [])
  const owner = req.nextUrl.searchParams.get('owner')
  const handle = req.nextUrl.searchParams.get('handle')

  if (handle) {
    /* ⚠️ پیش‌تر `owner` (کلید خام مالک، یعنی شماره) از پارامتر خوانده
       می‌شد و از فهرست کنار گذاشته می‌شد — یعنی این مسیر بی‌احراز
       هویت تأیید می‌کرد «فلان شماره صاحب فلان هندل است». حالا فقط
       می‌گوید هندل آزاد است یا نه. */
    const h = normHandle(handle)
    const taken = list.some(c => c.handle === h)
    return NextResponse.json({ handle: h, available: !taken && h.length >= 3 }, { headers: CORS })
  }
  /* پرس‌وجو با owner فقط برای «کانال خودم» است؛ مالکیت از نشست
     بررسی می‌شود تا کسی با شماره‌ی دیگری کانال او را نخواند. */
  if (owner) {
    const actor = await actorOf(req).catch(() => null)
    if (!actor || (actor.dmKey !== owner && actor.id !== owner && !actor.isAdmin)) {
      return NextResponse.json(null, { status: 403, headers: CORS })
    }
    /* ⚠️ کلید ذخیره‌شده `dmKey` است (غالبا شماره)، ولی کلاینت
       ممکن است شناسه بفرستد — و آن‌وقت فیلتر رشته‌ای خام همیشه
       خالی برمی‌گشت و کاربر «کانال ندارید» می‌دید در حالی که داشت.
       کلید قانونی از خود نشست گرفته می‌شود، نه از پارامتر. */
    /* ⚠️ فهرست همیشه مال خود نشست است. شاخه‌ی ادمین کانال *دیگری*
       را برمی‌گرداند در حالی که POST روی حساب خود ادمین می‌نویسد —
       پنجره کانال کس دیگر را نشان می‌داد و روی حساب ادمین عمل
       می‌کرد. */
    const key = actor.dmKey || actor.id
    /* ⚠️ ردیف‌های پیش از این تغییر `id` ندارند. شناسه‌ی قطعی از خود
       داده ساخته می‌شود (نه تصادفی) تا دو تب یک چیز ببینند. */
    const mine = list.filter(c => c.ownerKey === key).map(c => ({ ...c, id: channelKey(c) }))
    /* ⚠️ سازگاری: مصرف‌کننده‌ی قدیمی یک شیء (یا null) انتظار دارد و
       اگر آرایه بگیرد «کانال دارم» را همیشه درست می‌فهمد ولی
       فیلدهایش را نه. پس شکل قدیمی سر جایش می‌ماند و فهرست زیر
       یک کلید تازه می‌آید. */
    const wantAll = req.nextUrl.searchParams.get('all') === '1'
    if (wantAll) return NextResponse.json({ channels: mine }, { headers: CORS })
    return NextResponse.json(mine[0] ?? null, { headers: CORS })
  }

  /* فهرست عمومی کانال‌ها — ownerKey (که غالبا شماره‌ی موبایل است)
     هش می‌شود تا از مسیر عمومی جمع‌آوری نشود. */
  return NextResponse.json(
    redactList(list as unknown as Record<string, unknown>[]),
    { headers: CORS },
  )
}

const BODY = z.object({
  /* شناسه‌ی کانال موجود؛ نبودنش یعنی «بساز» */
  id: z.string().max(64).optional(),
  /* ⚠️ اختیاری، چون ویرایش می‌تواند فقط نقش را عوض کند. اگر اجباری
     بمانند، `stampRole` نسخه‌ی *کش کلاینت* را می‌فرستد و نامی که
     در تب دیگری عوض شده بی‌صدا به عقب برمی‌گردد. */
  name: z.string().max(200).optional(),
  handle: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  /* ⚠️ فقط *نشانی*، نه خود عکس. این فایل مشترک است: روی هر انتشار
     ویدیو کامل خوانده می‌شود و در GET عمومی کامل برمی‌گردد — یک
     data-URL ۲۰۰ کیلوبایتی در هر ردیف، فهرست را برای همه سنگین
     می‌کند. عکس باید اول آپلود شود و نشانی‌اش این‌جا بنشیند. */
  avatar: z.string().max(2048)
    .refine(v => !v.trim().toLowerCase().startsWith('data:'), 'عکس را اول آپلود کنید')
    .optional(),
  role: z.enum(CHANNEL_ROLES).optional(),
  addRole: z.enum(CHANNEL_ROLES).optional(),
})

/* نام فارسی میدان‌ها — پیام خطا باید به کاربر بگوید کجا را درست کند */
const FIELD_FA: Record<string, string> = {
  name: 'نام کانال', handle: 'نشانی کانال', bio: 'درباره‌ی کانال',
  avatar: 'عکس کانال', role: 'نقش', addRole: 'نقش', id: 'شناسه‌ی کانال',
}

/* POST { name, handle, id?, bio?, avatar?, role?, addRole? } → ساخت یا ویرایش کانال */
export async function POST(req: NextRequest) {
  /* مالک کانال از نشست می‌آید: پیش‌تر ownerKey را کلاینت می‌گفت و
     یعنی می‌شد کانال دیگری را ساخت، تصاحب یا بازنویسی کرد. */
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS })

  /* ورودی خارجی در مرز اعتبارسنجی می‌شود، نه با `String()`های
     پراکنده. `.optional()` عمدی است: «نفرستاده» از «خالی فرستاده»
     جدا می‌ماند و پایین‌تر همین تفاوت جلوی پاک‌شدن عکس را می‌گیرد. */
  const parsed = BODY.safeParse(await req.json().catch(() => ({})))
  /* ⚠️ گارد باید *پیش از* استفاده باشد، نه بعدش. و پیام «ورودی معتبر
     نیست» به تنهایی به کاربر نمی‌گفت کدام میدان مشکل دارد — مثلا
     عکس data-URLی که از سقف رد شده بود. */
  if (!parsed.success) {
    const bad = parsed.error.issues[0]
    const field = String(bad?.path?.[0] ?? '')
    return NextResponse.json(
      { ok: false, message: field ? `مقدار «${FIELD_FA[field] ?? field}» پذیرفته نشد` : 'ورودی معتبر نیست' },
      { status: 400, headers: CORS })
  }
  const b = parsed.data

  const ownerKey = actor.dmKey || actor.id
  const role = asRole(b.role)
  /* ⚠️ «افزودن نقش» جدا از «ساخت» است: کاربر در پنجره کانالی از نقش
     دیگر را انتخاب می‌کند و از آن به بعد باید بی‌سؤال منتشر شود.
     بدون این، پنجره تا ابد هر بار باز می‌شد. */
  const addRole = asRole(b.addRole)

  if (!ownerKey) return NextResponse.json({ ok: false, message: 'کاربر نامشخص است' }, { status: 400, headers: CORS })

  /* ⚠️ این خواندن مبنای نوشتن است. با نسخه‌ی کش‌شده، دو ساخت
     هم‌زمان (دو تب، دو صفحه‌ی نقش) یکی را پاک می‌کرد — و با مدل
     چندکاناله این از‌دست‌رفتن دیگر نامرئی نیست. */
  const list = await readJsonFresh<UserChannel[]>(INDEX, [])
  const wantHandle = normHandle(b.handle ?? '')

  /* ── سه نیت، سه رفتار ──
     پیش‌تر کلید یکتا فقط `ownerKey` بود (هر ذخیره کانال قبلی را
     بازنویسی می‌کرد)، بعد «مالک + هندل» شد (تغییر نام کانال دومی
     می‌ساخت). هر دو یک ریشه داشتند: مسیر نمی‌دانست کاربر می‌خواهد
     *بسازد* یا *ویرایش کند*، و از روی داده حدس می‌زد.

     حالا نیت صریح است:
       `id`      ⇒ ویرایش همان کانال (هندل هم می‌تواند عوض شود)
       `addRole` ⇒ مهر نقش روی کانال موجود (ردیف‌های بی‌شناسه هم)
       هیچ‌کدام ⇒ ساخت. و ساخت با هندل گرفته‌شده باید رد شود، حتی
                  اگر آن هندل مال کانال دیگر *خود* کاربر باشد —
                  وگرنه «کانال تازه» بی‌صدا کانال قبلی را تغییر نام
                  می‌داد، زیر ویدیوهایی که همان‌جا منتشر شده‌اند. */
  const wantId = String(b.id ?? '').trim()
  const existing = wantId
    ? list.find(c => c.ownerKey === ownerKey && channelKey(c) === wantId)
    : addRole
      ? list.find(c => c.ownerKey === ownerKey && c.handle === wantHandle)
      : undefined
  /* ⚠️ «نیافتم» در هر دو مسیر ویرایش باید ۴۰۴ باشد. اگر مسیر
     `addRole` بی‌صدا به «ساخت» بیفتد، کاربری که فقط می‌خواست نقشی
     را وصل کند صاحب کانال دوم ناخواسته می‌شود. */
  if ((wantId || addRole) && !existing) {
    return NextResponse.json({ ok: false, message: 'کانال پیدا نشد' }, { status: 404, headers: CORS })
  }

  /* ── معناشناسی PATCH برای نام و هندل هم ──
     تنها فرستنده‌ی `addRole` کش کلاینت است؛ اگر نام کهنه‌اش را
     بنویسیم، تغییر نامی که در تب دیگر انجام شده برمی‌گردد — روی
     همان میدانی که ویدیوهای منتشرشده با آن شناخته می‌شوند. */
  const name = b.name !== undefined ? String(b.name).trim().slice(0, 60) : (existing?.name ?? '')
  const handle = b.handle !== undefined ? normHandle(b.handle) : (existing?.handle ?? '')
  if (name.length < 2) return NextResponse.json({ ok: false, message: 'نام کانال را وارد کنید' }, { status: 400, headers: CORS })
  if (handle.length < 3) return NextResponse.json({ ok: false, message: 'هندل حداقل ۳ نویسه (انگلیسی/عدد) باشد' }, { status: 400, headers: CORS })

  /* هندل در کل سایت یکتاست؛ تنها استثنا خود همین کانال است. */
  if (list.some(c => c.handle === handle && c !== existing)) {
    return NextResponse.json({ ok: false, message: 'این هندل قبلا گرفته شده است' }, { status: 409, headers: CORS })
  }

  const mine = list.filter(c => c.ownerKey === ownerKey)
  /* سقفی که جلوی ساخت انبوه را می‌گیرد؛ هفت نقش داریم. */
  if (!existing && mine.length >= 7) {
    return NextResponse.json(
      { ok: false, message: 'بیشتر از هفت کانال نمی‌شود ساخت' }, { status: 409, headers: CORS })
  }
  const channel: UserChannel = {
    id: existing ? channelKey(existing) : newId(),
    ownerKey, name, handle,
    /* ⚠️ «نفرستادن» یعنی «عوض نکن»، نه «خالی کن». مهر نقش فقط
       `id/name/handle/bio/addRole` می‌فرستد؛ با انتساب خام، هر بار
       که کاربر کانالی را به نقش تازه‌ای وصل می‌کرد عکس کانالش
       پاک می‌شد. */
    bio: b.bio !== undefined ? String(b.bio).trim().slice(0, 200) : (existing?.bio ?? ''),
    avatar: b.avatar !== undefined ? String(b.avatar).trim().slice(0, 2048) : (existing?.avatar ?? ''),
    createdAt: existing?.createdAt ?? Date.now(),
    roles: [...new Set([
      ...(existing?.roles ?? []),
      ...(existing?.role ? [existing.role] : []),
      ...(role ? [role] : []),
      ...(addRole ? [addRole] : []),
    ])],
  }
  const next = existing
    ? list.map(c => (c === existing ? channel : c))
    : [...list, channel]

  /* ⚠️ پیش‌تر این‌جا `next.slice(-2000)` بود: روی *هر* نوشتن، حتی یک
     ویرایش ساده، قدیمی‌ترین ردیف‌ها بی‌صدا پاک می‌شدند. یعنی از
     کانال ۲۰۰۱ به بعد، هر بار که کسی نام کانالش را عوض می‌کرد،
     کانال یک کاربر دیگر — با همه‌ی ویدیوهایی که به هندلش اشاره
     دارند — از فهرست می‌افتاد. حذف داده‌ی کاربر نباید عارضه‌ی
     جانبی ذخیره باشد. سقف حالا جلوی *ساخت* را می‌گیرد و می‌گوید
     چرا؛ ویرایش همیشه ممکن است. */
  if (!existing && next.length > MAX_CHANNELS) {
    /* ⚠️ این مسیر DELETE ندارد و هیچ‌جای پروژه ردیفی از این فهرست
       برنمی‌دارد؛ یعنی رسیدن به سقف یک در یک‌طرفه است. پس باید
       *پیش* از رسیدن در لاگ سرور دیده شود، نه وقتی کاربر گیر کرد. */
    console.error('[channel] فهرست پر است', next.length)
    return NextResponse.json(
      { ok: false, message: 'ظرفیت کانال‌ها پر است؛ لطفا با پشتیبانی تماس بگیرید' },
      { status: 507, headers: CORS })
  }
  if (!existing && next.length > MAX_CHANNELS * 0.8) {
    console.warn('[channel] فهرست به ۸۰٪ ظرفیت رسید', next.length, '— وقت انتقال به جدول است')
  }
  await writeJson(INDEX, next)

  return NextResponse.json({ ok: true, channel }, { status: existing ? 200 : 201, headers: CORS })
}
