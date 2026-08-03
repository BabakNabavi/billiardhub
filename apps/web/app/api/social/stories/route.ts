export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { CORS, DAY, P, readJson, writeJson } from '@/lib/social-server'
import { actorFromRequest } from '@/lib/finance/db'
import { getStoryQuotaState } from '@/lib/stories/quota'
import { redactList } from '@/lib/privacy'
import { getSupabaseServer } from '@/lib/supabase-server'
import { pickStoryRole, OFFICIAL_DISPLAY_NAME } from '@/lib/story-store'

/* سقف استوری دیگر هاردکد نیست — از تنظیمات ادمین (به تفکیک نقش) و
   بسته‌ی خریداری‌شده می‌آید. اعداد قبلی به‌عنوان پیش‌فرض در مایگریشن
   ۰۱۳ نشسته‌اند تا رفتار امروز سایت عوض نشود. */
const PERIOD_MS: Record<'day' | 'week' | 'month', number> = { day: DAY, week: 7 * DAY, month: 30 * DAY }

interface SStory {
  id: string; ownerKey: string; userName: string
  roleKey: string; roleLabel: string; roleColor: string
  avatar: string; logoUrl?: string; mediaUrl: string; caption: string; createdAt: number
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }

export async function GET() {
  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(s => now - s.createdAt < DAY)
  if (live.length !== all.length) writeJson(P.stories, live).catch(() => {})

  /* عکس پروفایل *زنده* به هر استوری وصل می‌شود.

     `logoUrl` عکسی است که لحظه‌ی انتشار ذخیره شده. اگر کاربر بعداً عکس
     پروفایلش را عوض کند یا اصلاً موقع انتشار عکسی نداشته باشد، آن مقدار
     تا ابد قدیمی/خالی می‌ماند — و کاربر در نوار استوری به‌جای عکسش
     آدمک می‌دید.

     تطبیق سمت کلاینت ممکن نبود: `ownerKey` در پاسخ عمومی هش می‌شود، پس
     مرورگر نمی‌تواند بفهمد کدام گروه مال خودش است. این‌جا هنوز کلید خام
     را داریم، پس درست همین‌جا حل می‌شود — و برای *همه‌ی* کاربران، نه
     فقط صاحب نشست. */
  /* نام و نقش هم مثل عکس، *زنده* خوانده می‌شوند.

     تا امروز فقط عکس زنده بود و بقیه‌ی هویت — نام، نقش، رنگ حلقه —
     همان چیزی می‌ماند که لحظه‌ی انتشار ذخیره شده بود. نتیجه‌اش این
     بود که با هر تغییرِ بعدی، استوری‌های موجود روی مقدارِ قدیمی
     می‌ماندند: کاربری که نامش عوض شده بود همچنان با نام قبلی دیده
     می‌شد، و حسابِ رسمی که نقشش اصلاح شده بود همچنان برچسبِ نقشِ
     دیگرش را داشت.

     منبع درست همان رکورد کاربر است، نه عکسِ لحظه‌ی انتشار. تنها جایی
     که کلید خام در دست است همین‌جاست (در پاسخ عمومی هش می‌شود)، پس
     همین‌جا حل می‌شود — و برای همه‌ی بیننده‌ها، نه فقط صاحب استوری. */
  const keys = [...new Set(live.map(s => s.ownerKey).filter(Boolean))]
  interface LiveIdentity { avatar?: string; name?: string; role?: { key: string; label: string; color: string } }
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
        const role = pickStoryRole(roles)
        const real = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
        idOf.set(key, {
          avatar: u.avatar,
          /* حساب رسمی با نام برند دیده می‌شود، نه نام شخص */
          name: role.key === 'admin' ? OFFICIAL_DISPLAY_NAME : (real || undefined),
          role,
        })
      }
      for (const u of (byId.data ?? []) as Row[]) put(u.id, u)
      for (const u of (byPhone.data ?? []) as Row[]) put(u.phone, u)
    } catch { /* خواندن کاربر شکست خورد ⇒ همان مقدارِ ذخیره‌شده */ }
  }

  const withAvatar = live.map(s => {
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

  const s = (await req.json()) as Partial<SStory>
  if (!s.mediaUrl) return NextResponse.json({ message: 'داده ناقص' }, { status: 400, headers: CORS })

  const ownerKey = actor.id

  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(x => now - x.createdAt < DAY)

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
      { status: quota.limit <= 0 ? 403 : 429, headers: CORS },
    )
  }

  const story: SStory = {
    id: `st-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    ownerKey, userName: s.userName || 'کاربر',
    roleKey: s.roleKey || 'player', roleLabel: s.roleLabel || 'بازیکن', roleColor: s.roleColor || '#06b6d4',
    avatar: s.avatar || 'ک', logoUrl: s.logoUrl, mediaUrl: s.mediaUrl, caption: s.caption || '', createdAt: now,
  }
  live.unshift(story)
  await writeJson(P.stories, live)
  return NextResponse.json(story, { status: 201, headers: CORS })
}
