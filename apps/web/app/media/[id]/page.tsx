import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { SITE_URL, absoluteUrl } from '../../../lib/site-url'
import { mediaCategoryOf, type MediaVideo, type MediaCategoryKey } from '../../../lib/media-data'
import { getPublicBySlug, relatedTo, slugRedirect, toPublic, type VideoRow } from '../../../lib/media/server'
import WatchClient from './WatchClient'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی تماشا — سرور-کامپوننت.

   ── چرا سرور ──
   نسخه‌ی قبلی کلاً کلاینتی بود: فهرستِ ویدیوها را می‌گرفت و بعد در
   مرورگر دنبالِ ویدیو می‌گشت. یعنی HTMLِ اولیه نه عنوان داشت، نه
   توضیح، نه canonical و نه داده‌ی ساختاریافته — و این همان صفحه‌ای
   است که قرار است ویدیو از راهش پیدا شود.

   حالا داده روی سرور خوانده می‌شود، پس:
     · عنوان و توضیحِ اختصاصی در خودِ HTML است
     · ویدیوی نبوده ۴۰۴ واقعی می‌دهد، نه صفحه‌ی ۲۰۰ با متنِ «پیدا نشد»
     · نشانیِ قدیمی ریدایرکتِ دائمی می‌گیرد، نه ۴۰۴
     · `VideoObject` فقط با داده‌ی واقعی ساخته می‌شود
   ───────────────────────────────────────────────────────────── */

/* پارامتر عمداً `id` مانده — نامِ پوشه است و عوض‌کردنش یعنی شکستنِ
   لینک‌های موجود. مقدارش حالا slug است. */
type Params = { params: Promise<{ id: string }> }

const plain = (s: string, max = 160) =>
  String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

/** ثانیه → ISO 8601 (`PT4M13S`) — قالبی که schema.org می‌خواهد */
const iso8601 = (sec: number | null): string | undefined => {
  if (!sec || sec <= 0) return undefined
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60)
  return 'PT' + (h ? `${h}H` : '') + (m ? `${m}M` : '') + (s || (!h && !m) ? `${s}S` : '')
}

async function load(slug: string): Promise<VideoRow | null> {
  return getPublicBySlug(decodeURIComponent(slug))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const v = await load(id)
  if (!v) return { title: 'ویدیو پیدا نشد | بیلیارد هاب', robots: { index: false, follow: true } }

  const cat = mediaCategoryOf(v.category as MediaCategoryKey)
  const url = absoluteUrl(`/media/${v.slug}`)
  /* توضیحِ متا از توضیحِ خودِ ویدیو می‌آید. اگر کاربر توضیحی ننوشته
     باشد، جمله‌ای از روی داده‌ی واقعی ساخته می‌شود — نه متنِ پرکننده‌ی
     بی‌معنی برای موتورِ جست‌وجو. */
  const desc = plain(v.description) ||
    `${v.title} — ${cat?.label ?? 'ویدیو'} در بیلیارد مدیا${v.creator_name ? '، از ' + v.creator_name : ''}.`

  return {
    title: `${v.title} | بیلیارد مدیا`,
    description: desc,
    alternates: { canonical: url },
    /* `unlisted` با نشانی باز می‌شود ولی نباید ایندکس شود */
    robots: v.visibility === 'unlisted'
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: 'video.other',
      title: v.title,
      description: desc,
      url,
      siteName: 'بیلیارد هاب',
      locale: 'fa_IR',
      images: v.thumb ? [{ url: v.thumb }] : undefined,
      videos: v.src ? [{ url: v.src, type: v.mime ?? 'video/mp4' }] : undefined,
    },
    twitter: {
      card: 'player',
      title: v.title,
      description: desc,
      images: v.thumb ? [v.thumb] : undefined,
    },
  }
}

export default async function WatchPage({ params }: Params) {
  const { id } = await params
  const slug = decodeURIComponent(id)
  const v = await load(slug)

  if (!v) {
    /* شاید نشانیِ قدیمی باشد — عنوان که عوض شود slug هم عوض می‌شود.
       ریدایرکتِ دائمی یعنی اعتبارِ لینک‌های بیرونی حفظ می‌شود.

       ⚠️ `encodeURIComponent` لازم است: نشانی‌ها فارسی‌اند و هدرِ HTTP
       فقط ASCII می‌پذیرد. بدونِ آن پاسخ با «نویسه‌ی نامعتبر در هدر»
       می‌شکند و کاربر به‌جای ریدایرکت، خطای ۵۰۰ می‌گیرد. */
    const fresh = await slugRedirect(slug)
    if (fresh) permanentRedirect(`/media/${encodeURIComponent(fresh)}`)
    notFound()
  }

  const related = await relatedTo(v, 8)
  const cat = mediaCategoryOf(v.category as MediaCategoryKey)

  /* شکلی که کامپوننتِ نمایش می‌فهمد */
  const asMedia = (p: ReturnType<typeof toPublic>): MediaVideo => ({
    id: p.slug, title: p.title, category: p.category as MediaCategoryKey,
    creator: { id: p.creatorHandle, name: p.creatorName, handle: p.creatorHandle },
    duration: p.durationSec
      ? `${String(Math.floor(p.durationSec / 60)).padStart(2, '0')}:${String(p.durationSec % 60).padStart(2, '0')}`
        .replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)
      : '',
    views: p.views, likes: 0,
    date: p.publishedAt ?? '', ts: p.publishedAt ? Date.parse(p.publishedAt) : 0,
    thumb: p.thumb, src: p.src,
    description: p.description ? p.description.split('\n').filter(Boolean) : [],
    tags: p.tags ?? [],
  })

  const url = absoluteUrl(`/media/${v.slug}`)

  /* ── VideoObject ──
     فقط فیلدهایی که *واقعاً* داده دارند. مدت، بندانگشتی و تاریخ اگر
     نباشند اصلاً نمی‌آیند؛ مقدارِ ساختگی هم به گوگل دروغ می‌گوید و هم
     بعداً باعثِ اخطارِ داده‌ی نامعتبر می‌شود. */
  const videoLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: plain(v.description, 500) || v.title,
    url,
    contentUrl: v.src,
    publisher: {
      '@type': 'Organization',
      name: 'بیلیارد هاب',
      url: SITE_URL,
    },
  }
  if (v.thumb) videoLd.thumbnailUrl = [v.thumb]
  if (v.published_at) videoLd.uploadDate = v.published_at
  const dur = iso8601(v.duration_sec)
  if (dur) videoLd.duration = dur
  if (v.width && v.height) { videoLd.width = v.width; videoLd.height = v.height }
  if (v.creator_name) videoLd.creator = { '@type': 'Person', name: v.creator_name }
  if (v.views > 0) {
    videoLd.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: v.views,
    }
  }

  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'بیلیارد مدیا', item: absoluteUrl('/media') },
      ...(cat ? [{ '@type': 'ListItem', position: 3, name: cat.label, item: absoluteUrl(`/media?category=${v.category}`) }] : []),
      { '@type': 'ListItem', position: cat ? 4 : 3, name: v.title, item: url },
    ],
  }

  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <WatchClient video={asMedia(toPublic(v))} related={related.map(asMedia)} />
    </>
  )
}
