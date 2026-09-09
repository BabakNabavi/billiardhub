import type { MetadataRoute } from 'next'
import { base } from './robots'
import { NEWS_SECTIONS } from '@/lib/news/sections'

/* ⚠️ نقشه در زمانِ build ساخته می‌شد، یعنی خبرِ تازه تا دیپلویِ بعدی
   در نقشه نبود. ساعتی یک‌بار بازسازی می‌شود. */
export const revalidate = 3600

/* نقشه‌ی سایت فقط صفحه‌های عمومی ثابت را می‌دهد. صفحه‌های داینامیک
   (باشگاه/مربی/محصول) عمداً این‌جا نیستند: برای فهرست‌کردنشان باید در
   زمان ساخت به دیتابیس وصل شویم و اگر دیتابیس در دسترس نباشد کل build
   می‌شکند. افزودنشان کار جداگانه‌ای است با ISR و مدیریت خطا. */

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
  { path: '/results',       priority: 0.6, freq: 'weekly' },
  { path: '/advertise',     priority: 0.5, freq: 'monthly' },
  { path: '/about',         priority: 0.4, freq: 'monthly' },
  { path: '/contact',       priority: 0.4, freq: 'monthly' },
  { path: '/terms',         priority: 0.3, freq: 'yearly' },
  { path: '/privacy',       priority: 0.3, freq: 'yearly' },
]

/* صفحه‌های دسته‌بندیِ مدیا.

   خودِ ویدیوها در `/video-sitemap.xml` هستند، ولی خزنده باید از راهِ
   لینک هم به آن‌ها برسد، نه فقط از راهِ نقشه. این صفحه‌ها همان پلِ
   میانی‌اند: از `/media` به دسته، و از دسته به صفحه‌ی هر ویدیو.

   فهرست ثابت است و به دیتابیس دست نمی‌زند — همان قاعده‌ی بالای فایل. */
const MEDIA_CATEGORY_KEYS = [
  'snooker-training', 'pool-training', 'highball-training', 'techniques',
  'trick-shots', 'referee-rules', 'highlights', 'interviews',
  'gear', 'technical-services', 'clubs-events',
]

/* ── خبرها ──
   ⚠️ قاعده‌ی بالای فایل «به دیتابیس دست نزن» بود، چون شکستِ خواندن
   کلِ build را می‌شکست. خبر اما بدونِ نشانیِ تک‌تکِ مقاله‌ها در نقشه
   عملاً ایندکس نمی‌شود. پس استثنا با گاردِ کامل: هر خطا و هر تأخیرِ
   بیش از دو ثانیه یعنی فهرستِ خالی، و نقشه‌ی ایستا سرِ جایش می‌ماند.
   هیچ مسیری از این تابع نمی‌تواند throw کند. */
async function newsEntries(root: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { listPublished } = await import('@/lib/news/server')
    let timer: ReturnType<typeof setTimeout> | undefined
    const rows = await Promise.race([
      listPublished(200),
      new Promise<never[]>(r => { timer = setTimeout(() => r([]), 2000) }),
    ]).finally(() => { if (timer) clearTimeout(timer) })
    return rows.map(a => ({
      url: `${root}/news/${encodeURIComponent(a.id)}`,
      lastModified: new Date(a.updatedTs ?? a.ts ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch (e) {
    /* خاموش نماند: نقشه‌ی خبرِ همیشه‌خالی دیده نمی‌شود */
    console.error('[sitemap] news:', (e as Error).message)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = base()
  const now = new Date()
  return [
    /* بخش‌های تحریریه — ثابت، بدونِ دیتابیس */
    ...NEWS_SECTIONS.map(s => ({
      url: `${root}/news?s=${s.key}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
    ...(await newsEntries(root)),
    ...ROUTES.map(r => ({
      url: `${root}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...MEDIA_CATEGORY_KEYS.map(k => ({
      url: `${root}/media?category=${k}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
