import 'server-only'
import { getSupabaseServer } from '@/lib/supabase-server'
import { listPublicStores } from '@/lib/sellers-source'
import { storyIndex, type StoredStory } from '@/lib/story-index'
import type { FeedGroup, FeedStory } from '@/lib/story-feed-client'

export type { FeedGroup, FeedStory }

/* ─────────────────────────────────────────────────────────────
   نوارِ استوریِ صفحه‌ی اصلی — یک‌جا، سمتِ سرور.

   ── چرا ──
   نوار پیش‌تر در مرورگر یک آبشارِ سه‌لایه بود: صبر تا hydration، بعد
   کلِ فهرستِ باشگاه‌ها و فروشگاه‌ها، بعد برای *هر* فروشگاه یک درخواستِ
   جدا. روی اینترنتِ موبایل هر لایه یک رفت‌وبرگشت است و استوری‌ها چند
   ثانیه بعد از خودِ صفحه می‌رسیدند. سرور همان فهرست‌ها را با شبکه‌ی
   داخلی و در چند میلی‌ثانیه می‌خواند؛ پس این‌جا جمع می‌شود و
   - در HTMLِ صفحه‌ی اصلی جاسازی می‌شود (بی هیچ درخواستی در مرورگر)
   - و از `/api/stories/feed` با یک درخواست در دسترس است.

   ── شکست ──
   خطای فهرستِ باشگاه‌ها یا فروشگاه‌ها **رد می‌شود** و کش نمی‌شود:
   آرایه‌ی خالیِ ناشی از قطعیِ لحظه‌ایِ دیتابیس نباید یک دقیقه نوار را
   خالی کند. صفحه‌ی اصلی در این حالت تگ را نمی‌گذارد و نوار خودش می‌پرسد.
   خطای فهرستِ استوریِ *یک* باشگاه/فروشگاه فقط همان را بی‌استوری می‌کند.

   ── پاک‌سازی ──
   پیش‌تر درخواست‌های تکیِ نوار، منقضی‌ها را از فهرست و فضای ذخیره‌سازی
   پاک می‌کردند. همان این‌جا هم انجام می‌شود، ولی حداکثر یک بار در ساعت
   برای هر باشگاه/فروشگاه و بی‌آنکه منتظرش بمانیم.
   ───────────────────────────────────────────────────────────── */

const TTL_MS = 20_000
const PURGE_EVERY_MS = 60 * 60 * 1000
let cache: { at: number; value: Promise<FeedGroup[]> } | null = null
const lastPurge = new Map<string, number>()

const isActive = (s: StoredStory, now: number) =>
  !!s.expiresAt && new Date(String(s.expiresAt)).getTime() > now

const toFeed = (s: StoredStory): FeedStory => ({
  id: String(s.id ?? s.mediaUrl),
  text: typeof s.text === 'string' && s.text ? s.text : undefined,
  mediaUrl: String(s.mediaUrl),
  mediaType: s.mediaType === 'video' ? 'video' : 'image',
  expiresAt: String(s.expiresAt),
})

async function readActive(bucket: string, prefix: string, id: string, now: number): Promise<FeedStory[]> {
  const idx = storyIndex(bucket, prefix, id)
  let all: StoredStory[]
  try {
    all = await idx.read()
  } catch (e) {
    console.error(`[story-feed] فهرستِ ${prefix}/${id} خوانده نشد:`, e)
    return []
  }
  const live = all.filter(s => isActive(s, now))
  const key = `${prefix}/${id}`
  if (live.length !== all.length && now - (lastPurge.get(key) ?? 0) > PURGE_EVERY_MS) {
    lastPurge.set(key, now)
    const gone = all.filter(s => !isActive(s, now))
    void idx.write(live).then(() => idx.purge(gone)).catch(e => console.error(`[story-feed] پاک‌سازیِ ${key} شکست خورد:`, e))
  }
  return live.filter(s => !!s.mediaUrl).map(toFeed)
}

async function loadClubs(nowIso: string) {
  /* همان فیلترِ دیده‌شدن و ترتیبِ فهرستِ عمومی (/api/clubs) */
  const { data, error } = await getSupabaseServer().from('clubs')
    .select('id,name,logo')
    .eq('isActive', true)
    .or('verificationStatus.in.(verified,approved),is_demo.eq.true')
    .gt('storyExpiresAt', nowIso)
    .order('createdAt', { ascending: false })
  if (error) throw new Error(`clubs: ${error.message}`)
  return (data ?? []) as Array<{ id: string; name: string; logo: string | null }>
}

async function build(): Promise<FeedGroup[]> {
  const now = Date.now()
  const [clubs, stores] = await Promise.all([loadClubs(new Date(now).toISOString()), listPublicStores()])

  const [clubGroups, shopGroups] = await Promise.all([
    Promise.all(clubs.map(async (c): Promise<FeedGroup> => ({
      kind: 'club', id: c.id, name: c.name, logo: c.logo || undefined,
      stories: await readActive('club-media', 'clubs', c.id, now),
    }))),
    Promise.all(stores.filter(s => s.ownerId).map(async (s): Promise<FeedGroup> => {
      const person = `${s.firstName || ''} ${s.lastName || ''}`.trim()
      return {
        kind: 'shop', id: s.id, ownerKey: s.ownerId,
        name: s.sellerProfile.storeName || person || 'فروشگاه',
        logo: s.sellerProfile.logo || s.avatar || undefined,
        stories: await readActive('seller-media', 'sellers', s.ownerId, now),
      }
    })),
  ])

  return [...clubGroups, ...shopGroups].filter(g => g.stories.length > 0)
}

/** فیدِ استوری با کشِ ۲۰ ثانیه‌ای در حافظه. شکست رد می‌شود و کش نمی‌شود. */
export function loadStoryFeed(): Promise<FeedGroup[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value
  const value = build()
  cache = { at: Date.now(), value }
  value.catch(e => {
    console.error('[story-feed] ساختنِ فید شکست خورد:', e)
    if (cache?.value === value) cache = null
  })
  return value
}
