import type { MetadataRoute } from 'next'
import { base } from './robots'
import { NEWS_SECTIONS } from '@/lib/news/sections'
import { parseDbTimestamp } from '@/lib/jalali'
import { notExpiredOr } from '@/lib/market/live'

/* ⚠️ نقشه در زمان build ساخته می‌شد، یعنی خبر تازه تا دیپلوی بعدی
   در نقشه نبود. ساعتی یک‌بار بازسازی می‌شود. */
export const revalidate = 3600

/* نقشه‌ی سایت صفحه‌های عمومی ثابت را می‌دهد، به‌علاوه‌ی صفحه‌های داینامیکی
   که پشتِ گاردِ `guarded` (پایین‌تر) خوانده می‌شوند. پیش‌تر داینامیک‌ها
   عمداً این‌جا نبودند: نقشه در زمانِ build هم ساخته می‌شود و شکستِ دیتابیس
   کلِ build را می‌شکست. گارد همان را می‌بندد — هر خطا و هر تأخیرِ بیش از
   دو ثانیه یعنی فهرستِ خالیِ همان بخش، نه شکستِ نقشه. */

const ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/',              priority: 1.0, freq: 'daily' },
  { path: '/clubs',         priority: 0.9, freq: 'daily' },
  { path: '/shop',          priority: 0.9, freq: 'daily' },
  { path: '/coaches',       priority: 0.8, freq: 'weekly' },
  { path: '/referees',      priority: 0.8, freq: 'weekly' },
  { path: '/players',       priority: 0.7, freq: 'weekly' },
  { path: '/sellers',       priority: 0.7, freq: 'weekly' },
  { path: '/manufacturers', priority: 0.7, freq: 'weekly' },
  { path: '/services',      priority: 0.7, freq: 'weekly' },
  { path: '/media',         priority: 0.7, freq: 'daily' },
  { path: '/tournaments',   priority: 0.7, freq: 'daily' },

  { path: '/news',          priority: 0.6, freq: 'daily' },
  { path: '/ranking',       priority: 0.6, freq: 'weekly' },
  { path: '/advertise',     priority: 0.5, freq: 'monthly' },
  { path: '/about',         priority: 0.4, freq: 'monthly' },
  { path: '/contact',       priority: 0.4, freq: 'monthly' },
  { path: '/terms',         priority: 0.3, freq: 'yearly' },
  { path: '/privacy',       priority: 0.3, freq: 'yearly' },
]

/* صفحه‌های دسته‌بندی مدیا.

   خود ویدیوها در `/video-sitemap.xml` هستند، ولی خزنده باید از راه
   لینک هم به آن‌ها برسد، نه فقط از راه نقشه. این صفحه‌ها همان پل
   میانی‌اند: از `/media` به دسته، و از دسته به صفحه‌ی هر ویدیو.

   فهرست ثابت است و به دیتابیس دست نمی‌زند — همان قاعده‌ی بالای فایل. */
const MEDIA_CATEGORY_KEYS = [
  'snooker-training', 'pool-training', 'highball-training', 'techniques',
  'trick-shots', 'referee-rules', 'highlights', 'interviews',
  'gear', 'technical-services', 'clubs-events',
]

/* ── خبرها ──
   ⚠️ قاعده‌ی بالای فایل «به دیتابیس دست نزن» بود، چون شکست خواندن
   کل build را می‌شکست. خبر اما بدون نشانی تک‌تک مقاله‌ها در نقشه
   عملا ایندکس نمی‌شود. پس استثنا با گارد کامل: هر خطا و هر تأخیر
   بیش از دو ثانیه یعنی فهرست خالی، و نقشه‌ی ایستا سر جایش می‌ماند.
   هیچ مسیری از این تابع نمی‌تواند throw کند. */
/** هر منبعِ داینامیکِ نقشه از این می‌گذرد: هیچ مسیری throw نمی‌کند. */
async function guarded(name: string, load: () => Promise<MetadataRoute.Sitemap>): Promise<MetadataRoute.Sitemap> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      load(),
      new Promise<MetadataRoute.Sitemap>(r => { timer = setTimeout(() => r([]), 2000) }),
    ])
  } catch (e) {
    /* خاموش نماند: بخشی که همیشه خالی است دیده نمی‌شود */
    console.error(`[sitemap] ${name}:`, (e as Error).message)
    return []
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const newsEntries = (root: string) => guarded('news', async () => {
  const { listPublished } = await import('@/lib/news/server')
  const rows = await listPublished(200)
  return rows.map(a => ({
    url: `${root}/news/${encodeURIComponent(a.id)}`,
    lastModified: new Date(a.updatedTs ?? a.ts ?? Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
})

/* ── باشگاه‌ها، مسابقات، آگهی‌های بازار ──
   شرطِ عمومی‌بودنِ هرکدام همان شرطی است که layoutِ همان صفحه برای
   `robots` دارد (یا فهرستِ عمومیِ همان بخش) — صفحه‌ای که noindex است
   نباید در نقشه بیاید. ستون‌های camelCaseِ `clubs` و `products`
   timestampِ بی‌منطقه‌اند، پس با `parseDbTimestamp` خوانده می‌شوند. */
const SITEMAP_LIMIT = 1000
const lastMod = (v: unknown): Date => parseDbTimestamp(v) ?? new Date()

const clubEntries = (root: string) => guarded('clubs', async () => {
  const { sb } = await import('@/lib/finance/db')
  const { data, error } = await sb().from('clubs')
    .select('id,"updatedAt"')
    .not('isActive', 'is', false)
    .in('verificationStatus', ['verified', 'approved'])
    .limit(SITEMAP_LIMIT)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; updatedAt?: string | null }[]).map(c => ({
    url: `${root}/clubs/${c.id}`,
    lastModified: lastMod(c.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
})

const tournamentEntries = (root: string) => guarded('tournaments', async () => {
  const [{ sb }, { PUBLIC_STATUSES }] = await Promise.all([
    import('@/lib/finance/db'), import('@/lib/tournaments/server'),
  ])
  const { data, error } = await sb().from('tournaments')
    .select('id,updated_at')
    .in('status', PUBLIC_STATUSES)
    .order('updated_at', { ascending: false })
    .limit(SITEMAP_LIMIT)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; updated_at?: string | null }[]).map(t => ({
    url: `${root}/tournaments/${t.id}`,
    lastModified: lastMod(t.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))
})

/* فقط آگهیِ زنده — `lib/market/live` */
const marketAdEntries = (root: string) => guarded('market', async () => {
  const { sb } = await import('@/lib/finance/db')
  const { data, error } = await sb().from('products')
    .select('id,"updatedAt"')
    .eq('status', 'active').or(notExpiredOr())
    .order('updatedAt', { ascending: false })
    .limit(SITEMAP_LIMIT)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; updatedAt?: string | null }[]).map(p => ({
    url: `${root}/shop/${p.id}`,
    lastModified: lastMod(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = base()
  const now = new Date()
  /* هم‌زمان: هر کدام سقفِ دو ثانیه‌ی خودش را دارد */
  const [news, clubs, tournaments, ads] = await Promise.all([
    newsEntries(root), clubEntries(root), tournamentEntries(root), marketAdEntries(root),
  ])
  return [
    /* بخش‌های تحریریه — ثابت، بدون دیتابیس */
    ...NEWS_SECTIONS.map(s => ({
      url: `${root}/news?s=${s.key}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
    ...news,
    ...ROUTES.map(r => ({
      url: `${root}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...clubs,
    ...tournaments,
    ...ads,
    ...MEDIA_CATEGORY_KEYS.map(k => ({
      url: `${root}/media?category=${k}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
