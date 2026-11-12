export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CORS, DAY, P, readJson, writeJson, removeStoryMedia } from '@/lib/social-server'
import { actorFromRequest } from '@/lib/finance/db'
import { getStoryQuotaState, type StoryVia } from '@/lib/stories/quota'
import { pickStoryRole } from '@/lib/story-store'
import { publicDisplayName } from '@/lib/public-name'
import { sb } from '@/lib/finance/db'
import { listPublicSocialStories } from '@/lib/stories/public-social'

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
  /* بدنه در lib/stories/public-social است — صفحه‌ی اصلی هم همان را جاسازی می‌کند */
  return NextResponse.json(await listPublicSocialStories(), { headers: CORS })
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
