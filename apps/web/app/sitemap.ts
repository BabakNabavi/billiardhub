import type { MetadataRoute } from 'next'
import { base } from './robots'

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

export default function sitemap(): MetadataRoute.Sitemap {
  const root = base()
  const now = new Date()
  return [
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
