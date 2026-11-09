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

   کلیدها ثابت‌اند؛ اینکه کدام در نقشه بیاید با `mediaCategoryEntries`
   از روی ویدیوهای واقعی تعیین می‌شود. */
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

/* ⚠️ بخش‌های تحریریه فقط وقتی در نقشه می‌آیند که دست‌کم یک خبر داشته باشند.
   پیش‌تر هر ۱۳ بخش ثابت این‌جا بود در حالی که کل سایت یک خبر داشت، یعنی
   دوازده صفحه‌ی «هنوز خبری در این بخش منتشر نشده» به گوگل معرفی می‌شد و
   Search Console آن‌ها را «Crawled/Discovered – not indexed» گزارش کرد.
   بخش هر خبر همان `normalizeSection` است که فیلتر صفحه‌ی بخش هم با آن کار می‌کند. */
const newsEntries = (root: string) => guarded('news', async () => {
  const { listPublished } = await import('@/lib/news/server')
  const rows = await listPublished(200)
  const withNews = new Set(rows.map(a => a.section).filter(Boolean))
  return [
    ...NEWS_SECTIONS.filter(s => withNews.has(s.key)).map(s => ({
      url: `${root}/news?s=${s.key}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
    ...rows.map(a => ({
      url: `${root}/news/${encodeURIComponent(a.id)}`,
      lastModified: new Date(a.updatedTs ?? a.ts ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
})

/* همان قاعده برای دسته‌های مدیا: فقط دسته‌ای که ویدیوی منتشرشده‌ی عمومی دارد.
   شرط همان `listPublic` و `/video-sitemap.xml` است. */
const mediaCategoryEntries = (root: string) => guarded('media', async () => {
  const { sb } = await import('@/lib/finance/db')
  const { data, error } = await sb().from('videos').select('category')
    .eq('status', 'published').eq('visibility', 'public').limit(5000)
  if (error) throw new Error(error.message)
  const used = new Set((data ?? []).map(r => String((r as { category?: unknown }).category ?? '')))
  return MEDIA_CATEGORY_KEYS.filter(k => used.has(k)).map(k => ({
    url: `${root}/media?category=${k}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
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
    /* نامک: لینک‌های سایت با نامکِ اختصاصی‌اند و canonicalِ صفحه هم همان است —
       نشانیِ UUID در نقشه یعنی دو نشانی برای یک باشگاه */
    .select('id,slug,"updatedAt"')
    .not('isActive', 'is', false)
    .in('verificationStatus', ['verified', 'approved'])
    /* باشگاهِ نمایشی دیده می‌شود ولی ایندکس نمی‌شود (همان layoutِ /clubs/[id]) */
    .not('is_demo', 'is', true)
    .limit(SITEMAP_LIMIT)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { id: string; slug?: string | null; updatedAt?: string | null }[]).map(c => ({
    url: `${root}/clubs/${encodeURIComponent(c.slug || c.id)}`,
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

/* ── پروفایل‌ها (آبانِ ۱۴۰۵) ──
   تا امروز هیچ پروفایلی — بازیکن، مربی، داور، فروشگاه، تولیدکننده، متخصص —
   در نقشه نبود. فقط تأییدشده‌ها (همان شرطِ robotsِ layoutِ هر پروفایل). */
const PROFILE_PATHS = {
  player: '/players', coach: '/coaches', referee: '/referees',
  seller: '/sellers', manufacturer: '/manufacturers', technician: '/services',
} as const
const profileEntries = (root: string) => guarded('profiles', async () => {
  const { sb } = await import('@/lib/finance/db')
  const { data, error } = await sb().from('profiles')
    .select('kind,slug,updated_at')
    .eq('status', 'approved')
    .in('kind', Object.keys(PROFILE_PATHS))
    .order('updated_at', { ascending: false })
    .limit(SITEMAP_LIMIT)
  if (error) throw new Error(error.message)
  return ((data ?? []) as { kind: keyof typeof PROFILE_PATHS; slug: string; updated_at?: string | null }[])
    .filter(p => p.slug && PROFILE_PATHS[p.kind])
    .map(p => ({
      url: `${root}${PROFILE_PATHS[p.kind]}/${encodeURIComponent(p.slug)}`,
      lastModified: lastMod(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = base()
  const now = new Date()
  /* هم‌زمان: هر کدام سقفِ دو ثانیه‌ی خودش را دارد */
  const [news, clubs, tournaments, ads, profiles, mediaCats] = await Promise.all([
    newsEntries(root), clubEntries(root), tournamentEntries(root), marketAdEntries(root), profileEntries(root),
    mediaCategoryEntries(root),
  ])
  return [
    /* بخش‌های تحریریه و خود خبرها — فقط بخش دارای خبر */
    ...news,
    ...ROUTES.map(r => ({
      url: `${root}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...clubs,
    ...profiles,
    ...tournaments,
    ...ads,
    ...mediaCats,
  ]
}
