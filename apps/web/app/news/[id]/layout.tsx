import { cache } from 'react'
import type { Metadata } from 'next'
import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'
import { SITE_URL } from '@/lib/site-url'
import { getArticle } from '@/lib/news/server'
import { sectionOf } from '@/lib/news/sections'
import { iso } from '@/lib/news/format'

/* ─────────────────────────────────────────────────────────────
   متادیتای یک خبر.

   ⚠️ عنوان `absolute` است نه رشته‌ی ساده. `app/news/layout.tsx`
   قالب `'%s | بیلیارد هاب'` لایه‌ی ریشه را *مصرف* می‌کند (چون
   `title` را به‌صورت رشته می‌دهد و قالب تازه‌ای نمی‌سازد)، پس این
   نوه هیچ قالبی به ارث نمی‌برد و بدون `absolute` هر خبر بی‌نام
   برند منتشر می‌شد. همان تله‌ای که در پروفایل خدمات فنی روی سایت
   زنده دیده شد.

   ⚠️ خواندن از همان لایه‌ی `lib/news/server` است که خود صفحه هم از
   آن می‌خواند، نه یک پرس‌وجوی دوم با شکل متفاوت — وگرنه عنوان تب
   مرورگر و عنوان داخل صفحه می‌توانستند از هم جدا بیفتند.
   ───────────────────────────────────────────────────────────── */

/* یک خواندن برای متادیتا و JSON-LD، با مهلت (متادیتا رندر را بلاک می‌کند) */
const loadArticle = cache(async (id: string) => {
  try {
    const a = await withTimeout(getArticle(id))
    return a === TIMED_OUT ? null : a
  } catch { return null }
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!id) return {}

  /* ⚠️ متادیتا رندر صفحه را بلاک می‌کند؛ اگر خواندن دیتابیس معلق
     بماند کاربر هیچ چیز نمی‌بیند، حتی حالت خطا. پس علاوه بر
     `catch`، یک مهلت زمانی هم لازم است. */

  /* رمزگشایی نامک این‌جا نیست، در خود `getArticle` و داخل try است: Next
     فاصله و حروف فارسی را رمزشده می‌دهد، و رمزگشایی بیرون از try با «%»
     تنها پیش از ساخت promise خطا می‌داد و generateMetadata رد می‌شد. */
  const a = await loadArticle(id)
  if (!a) return {}

  const sec = sectionOf(a.section)
  const description = a.excerpt
    || `${a.title} — اخبار بیلیارد در بیلیارد هاب`
  const url = `/news/${encodeURIComponent(a.id)}`

  return {
    title: { absolute: `${a.title} | بیلیارد هاب` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: a.title, description, url,
      siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'article',
      ...(a.ts ? { publishedTime: iso(a.ts) } : {}),
      ...(a.updatedTs ? { modifiedTime: iso(a.updatedTs) } : {}),
      ...(sec ? { section: sec.label } : {}),
      ...(a.tags.length > 0 ? { tags: a.tags } : {}),
      ...(a.cover ? { images: [{ url: a.cover }] } : {}),
    },
    twitter: {
      card: a.cover ? 'summary_large_image' : 'summary',
      title: a.title, description,
      ...(a.cover ? { images: [a.cover] } : {}),
    },
  }
}

/* داده‌ی ساخت‌یافته: NewsArticle — تیتر، تاریخ‌ها، تصویر، ناشر با لوگو */
async function articleJsonLd(id: string) {
  const a = id ? await loadArticle(id) : null
  if (!a) return null
  const logo = { '@type': 'ImageObject', url: `${SITE_URL}/images/Logo/bh-icon-512-v13.png` }
  return {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: a.title.slice(0, 110),
    url: `${SITE_URL}/news/${encodeURIComponent(a.id)}`,
    ...(a.excerpt ? { description: a.excerpt } : {}),
    ...(a.cover ? { image: [a.cover] } : {}),
    ...(a.ts ? { datePublished: iso(a.ts) } : {}),
    ...(a.updatedTs ? { dateModified: iso(a.updatedTs) } : a.ts ? { dateModified: iso(a.ts) } : {}),
    inLanguage: 'fa-IR',
    author: { '@type': 'Organization', name: 'بیلیارد هاب', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'بیلیارد هاب', logo },
  }
}

export default async function NewsArticleLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <><AsyncJsonLd data={articleJsonLd(id)} />{children}</>
}
