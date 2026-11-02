export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CORS, DAY, P, readJson, writeJson, removeStoryMedia } from '@/lib/social-server'
import { actorFromRequest } from '@/lib/finance/db'
import { getStoryQuotaState, plainUsersMayPost, usersWithStoryPlan, type StoryVia } from '@/lib/stories/quota'
import { hideLiveStory } from '@/lib/stories/visibility'
import { redactList } from '@/lib/privacy'
import { getSupabaseServer } from '@/lib/supabase-server'
import { pickStoryRole, canPostStory } from '@/lib/story-store'
import { publicDisplayName } from '@/lib/public-name'
import { sb } from '@/lib/finance/db'

/* سقف استوری دیگر هاردکد نیست — از تنظیمات ادمین (به تفکیک نقش) و
   بسته‌ی خریداری‌شده می‌آید. اعداد قبلی به‌عنوان پیش‌فرض در مایگریشن
   ۰۱۳ نشسته‌اند تا رفتار امروز سایت عوض نشود. */
const PERIOD_MS: Record<'day' | 'week' | 'month', number> = { day: DAY, week: 7 * DAY, month: 30 * DAY }

interface SStory {
  id: string; ownerKey: string; userName: string
  roleKey: string; roleLabel: string; roleColor: string
  avatar: string; logoUrl?: string; mediaUrl: string; caption: string; createdAt: number
  /** از چه راهی حقِ انتشار داشت (lib/stories/visibility) — استوریِ پیش از آبانِ ۱۴۰۵ ندارد */
  via?: StoryVia
}

/* بدنه‌ی انتشار در مرز: فقط فیلدهایی که خوانده می‌شوند. کپشن بر حسبِ
   *نویسه* بریده می‌شود نه واحدِ UTF-16 — وگرنه نیمه‌ی یک ایموجی می‌ماند. */
const CAPTION_MAX = 500
const PostZ = z.object({
  /* بی‌سقفِ طول: کلاینتِ قدیمی گاهی عکس/آواتار را data URL می‌فرستد */
  mediaUrl: z.string().min(1),
  caption: z.string().optional().transform(v => Array.from(v ?? '').slice(0, CAPTION_MAX).join('')),
  ownerKey: z.string().max(200).optional(),
  userName: z.string().max(200).optional(),
  avatar: z.string().max(16).optional(),
  logoUrl: z.string().optional(),
})

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

export async function GET() {
  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(s => now - s.createdAt < DAY)
  if (live.length !== all.length) {
    writeJson(P.stories, live).catch(() => {})
    /* عکس/ویدیوی استوری منقضی هم پاک می‌شود.

       تا امروز فقط ردیف از فهرست بیرون می‌رفت و فایل تا ابد در باکت
       می‌ماند. با یک استوری در روز برای هر کاربر فعال، این تنها
       منبع *تکرارشونده*ی فایل مرده است: هزار کاربر یعنی سالی حدود
       سیصدوشصت هزار فایلی که هیچ‌کس دیگر نمی‌بیندشان.

       فقط فایل‌های زیر `social/stories/` پاک می‌شوند. اگر `mediaUrl`
       به جای دیگری اشاره کند — مثلا عکسی که کاربر جای دیگری هم از
       آن استفاده می‌کند — دست نمی‌خورد. */
    const gone = all.filter(s => now - s.createdAt >= DAY)
    void removeStoryMedia(gone.map(s => s.mediaUrl))
  }

  /* عکس پروفایل *زنده* به هر استوری وصل می‌شود.

     `logoUrl` عکسی است که لحظه‌ی انتشار ذخیره شده. اگر کاربر بعدا عکس
     پروفایلش را عوض کند یا اصلا موقع انتشار عکسی نداشته باشد، آن مقدار
     تا ابد قدیمی/خالی می‌ماند — و کاربر در نوار استوری به‌جای عکسش
     آدمک می‌دید.

     تطبیق سمت کلاینت ممکن نبود: `ownerKey` در پاسخ عمومی هش می‌شود، پس
     مرورگر نمی‌تواند بفهمد کدام گروه مال خودش است. این‌جا هنوز کلید خام
     را داریم، پس درست همین‌جا حل می‌شود — و برای *همه‌ی* کاربران، نه
     فقط صاحب نشست. */
  /* نام و نقش هم مثل عکس، *زنده* خوانده می‌شوند.

     تا امروز فقط عکس زنده بود و بقیه‌ی هویت — نام، نقش، رنگ حلقه —
     همان چیزی می‌ماند که لحظه‌ی انتشار ذخیره شده بود. نتیجه‌اش این
     بود که با هر تغییر بعدی، استوری‌های موجود روی مقدار قدیمی
     می‌ماندند: کاربری که نامش عوض شده بود همچنان با نام قبلی دیده
     می‌شد، و حساب رسمی که نقشش اصلاح شده بود همچنان برچسب نقش
     دیگرش را داشت.

     منبع درست همان رکورد کاربر است، نه عکس لحظه‌ی انتشار. تنها جایی
     که کلید خام در دست است همین‌جاست (در پاسخ عمومی هش می‌شود)، پس
     همین‌جا حل می‌شود — و برای همه‌ی بیننده‌ها، نه فقط صاحب استوری. */
  const keys = [...new Set(live.map(s => s.ownerKey).filter(Boolean))]
  interface LiveIdentity { userId?: string; eligible?: boolean; avatar?: string; name?: string; role?: { key: string; label: string; color: string } }
  const idOf = new Map<string, LiveIdentity>()
  if (keys.length) {
    try {
      const ids = keys.filter(k => /^[0-9a-f-]{36}$/i.test(k))
      const phones = keys.filter(k => /^09\d{9}$/.test(k))
      const sb = getSupabaseServer()
      const COLS = 'id,phone,avatar,"firstName","lastName","primaryRole","secondaryRoles"'
      const [byId, byPhone] = await Promise.all([
        ids.length ? sb.from('users').select(COLS).in('id', ids) : Promise.resolve({ data: [] }),
        phones.length ? sb.from('users').select(COLS).in('phone', phones) : Promise.resolve({ data: [] }),
      ])
      type Row = {
        id?: string; phone?: string; avatar?: string
        firstName?: string; lastName?: string
        primaryRole?: string; secondaryRoles?: string[]
      }
      const put = (key: string | undefined, u: Row) => {
        if (!key) return
        const roles = [u.primaryRole, ...(u.secondaryRoles ?? [])].filter(Boolean) as string[]
        idOf.set(key, {
          userId: u.id, eligible: canPostStory(roles),
          avatar: u.avatar,
          name: publicDisplayName(u, '') || undefined,
          role: pickStoryRole(roles),
        })
      }
      for (const u of (byId.data ?? []) as Row[]) put(u.id, u)
      for (const u of (byPhone.data ?? []) as Row[]) put(u.phone, u)
    } catch { /* خواندن کاربر شکست خورد ⇒ همان مقدار ذخیره‌شده */ }
  }

  /* استوریِ حسابی که حقِ استوری‌اش رفته دیده نمی‌شود — قاعده در
     lib/stories/visibility. فقط وقتی هویت واقعا خوانده شد؛ خطای خواندن
     چیزی را پنهان نمی‌کند. بسته و تنظیم فقط وقتی خوانده می‌شوند که
     استوریِ بی‌نقشِ بی‌via (پیش از این قاعده) در کار باشد. */
  const roleless = live.filter(s => !s.via && idOf.get(s.ownerKey)?.eligible === false)
  const planIds = roleless.length
    ? await usersWithStoryPlan([...new Set(roleless.map(s => idOf.get(s.ownerKey)!.userId!).filter(Boolean))])
    : new Set<string>()
  const plainMay = roleless.length ? await plainUsersMayPost() : false
  const visible = live.filter(s => {
    const me = idOf.get(s.ownerKey)
    if (!me || me.eligible === undefined) return true
    return !hideLiveStory(s.via, {
      hasStoryRole: me.eligible,
      hasPlan: planIds ? planIds.has(me.userId ?? '') : null,
    }, plainMay)
  })

  const withAvatar = visible.map(s => {
    const me = idOf.get(s.ownerKey)
    return {
      ...s,
      logoUrl: me?.avatar || s.logoUrl,
      userName: me?.name || s.userName,
      roleKey: me?.role?.key || s.roleKey,
      roleLabel: me?.role?.label || s.roleLabel,
      roleColor: me?.role?.color || s.roleColor,
    }
  })

  /* ownerKey برای بیشتر کاربران شماره‌ی موبایل است و این مسیر عمومی
     است؛ پس هش پایدار برمی‌گردد نه خود کلید. */
  return NextResponse.json(
    redactList(withAvatar as unknown as Record<string, unknown>[]),
    { headers: CORS },
  )
}

export async function POST(req: NextRequest) {
  /* مالک استوری از نشست خوانده می‌شود، نه از بدنه‌ی درخواست.
     پیش‌تر هرکس می‌توانست ownerKey شخص دیگری را بفرستد و هم استوری
     به نام او منتشر کند، هم سهمیه‌اش را خرج کند. */
  const actor = actorFromRequest(req)
  if (!actor) return NextResponse.json({ message: 'برای انتشار استوری وارد شوید' }, { status: 401, headers: CORS })

  const parsed = PostZ.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'داده ناقص' }, { status: 400, headers: CORS })
  const s = parsed.data

  const ownerKey = actor.id

  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(x => now - x.createdAt < DAY)

  /* این مسیر هم منقضی‌ها را از فهرست بیرون می‌ریزد، پس فایلشان هم
     باید برود — وگرنه بسته به اینکه کدام مسیر زودتر صدا زده شود،
     گاهی پاک می‌شد و گاهی نه. */
  if (live.length !== all.length) {
    void removeStoryMedia(all.filter(x => now - x.createdAt >= DAY).map(x => x.mediaUrl))
  }

  /* سقف از تنظیمات ادمین و بسته‌ی خریداری‌شده می‌آید، نه از عدد هاردکد.
     کلید قدیمی ارسالی هم شمرده می‌شود تا استوری‌های قبلی همین کاربر
     از قلم نیفتند و سهمیه دور زده نشود. */
  const keys = [ownerKey, ...(s.ownerKey && s.ownerKey !== ownerKey ? [s.ownerKey] : [])]
  const quota = await getStoryQuotaState(actor.id, async period => {
    const since = now - PERIOD_MS[period]
    return Math.max(...keys.map(k => all.filter(x => x.ownerKey === k && x.createdAt >= since).length))
  })

  if (!quota.allowed) {
    return NextResponse.json(
      { message: quota.message ?? 'سقف استوری شما پر شده است', quotaExceeded: true },
      { status: quota.eligible ? 429 : 403, headers: CORS },
    )
  }

  /* نشانِ نقش — همان `pickStoryRole`ی که GET برای نمایش به کار می‌برد.
     پیش‌تر این‌جا فقط `primaryRole` خوانده می‌شد (برچسبِ «کاربر عادی» یا
     «بازیکن رنکینگی») و GET روی همه‌ی نقش‌ها چیز دیگری نشان می‌داد. */
  const { data: meRow } = await sb().from('users')
    .select('"firstName","lastName","primaryRole","secondaryRoles"').eq('id', ownerKey).maybeSingle()
  const me = (meRow ?? {}) as { firstName?: string; lastName?: string; primaryRole?: string; secondaryRoles?: string[] }
  const roleMeta = pickStoryRole([me.primaryRole, ...(me.secondaryRoles ?? [])].filter(Boolean) as string[])

  const story: SStory = {
    id: `st-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    /* نام هم از رکورد، نه از بدنه — وگرنه «Billiard Hub» جعل‌شدنی بود */
    ownerKey, userName: publicDisplayName(me),
    /* ── نشان نقش از سرور، نه از کلاینت ──
       تا امروز این سه هرچه مرورگر می‌فرستاد پذیرفته می‌شد — یعنی هر
       کسی می‌توانست استوری‌اش را با نشان «باشگاه‌دار» منتشر کند.
       حالا از نقش اصلی خود کاربر خوانده می‌شود. */
    roleKey: roleMeta.key,
    roleLabel: roleMeta.label,
    roleColor: roleMeta.color,
    avatar: s.avatar || 'ک', logoUrl: s.logoUrl, mediaUrl: s.mediaUrl,
    /* کپشن متنِ آزاد است و لینک‌هایش در نمایش ساخته می‌شوند (فقط http/https)؛
       سقفِ طول در PostZ — فرم ۳۰۰ می‌گذارد، ۵۰۰ برای کلاینت‌های قدیمی */
    caption: s.caption, createdAt: now,
    via: quota.via,
  }
  live.unshift(story)
  await writeJson(P.stories, live)
  return NextResponse.json(story, { status: 201, headers: CORS })
}
