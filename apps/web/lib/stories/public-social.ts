import 'server-only'
import { DAY, P, readJson, writeJson, removeStoryMedia } from '@/lib/social-server'
import { plainUsersMayPost, usersWithStoryPlan, type StoryVia } from '@/lib/stories/quota'
import { hideLiveStory } from '@/lib/stories/visibility'
import { redactList } from '@/lib/privacy'
import { getSupabaseServer } from '@/lib/supabase-server'
import { pickStoryRole, canPostStory } from '@/lib/story-store'
import { publicDisplayName } from '@/lib/public-name'

/* ─────────────────────────────────────────────────────────────
   فهرستِ عمومیِ استوری‌های اجتماعی — بدنه‌ی GETِ /api/social/stories،
   بی‌تغییرِ رفتار به این‌جا منتقل شد تا صفحه‌ی اصلی هم همان را در HTML
   جاسازی کند (نوارِ استوری دیگر برای نمایشِ اول منتظرِ یک درخواست نمی‌ماند).
   هویتِ زنده، قاعده‌ی دیده‌شدن و هشِ ownerKey همه همین‌جا می‌مانند.
   ───────────────────────────────────────────────────────────── */

interface SStory {
  id: string; ownerKey: string; userName: string
  roleKey: string; roleLabel: string; roleColor: string
  avatar: string; logoUrl?: string; mediaUrl: string; caption: string; createdAt: number
  via?: StoryVia
}

/** `purge`: پاک‌کردنِ منقضی‌ها از فهرست و فایلشان — فقط مسیرِ GETِ API.
 *  صفحه‌ی اصلی (prerender در build و بازسازیِ ISR) با false صدا می‌زند تا یک
 *  `npm run build` روی هر ماشینی که به دیتابیسِ زنده وصل است چیزی ننویسد. */
export async function listPublicSocialStories({ purge = true }: { purge?: boolean } = {}): Promise<Record<string, unknown>[]> {
  const all = await readJson<SStory[]>(P.stories, [])
  const now = Date.now()
  const live = all.filter(s => now - s.createdAt < DAY)
  if (purge && live.length !== all.length) {
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
  /* ownerKey برای بیشتر کاربران شماره‌ی موبایل است و این فهرست عمومی
     است؛ پس هش پایدار برمی‌گردد نه خود کلید. */
  return redactList(withAvatar as unknown as Record<string, unknown>[])
}
