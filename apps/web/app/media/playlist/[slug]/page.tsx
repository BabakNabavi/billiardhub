import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { playlistBySlug } from '@/lib/media/playlists'
import { absoluteUrl } from '@/lib/site-url'
import PlaylistClient from './PlaylistClient'
import '../../media.css'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی لیست پخش — سرور-کامپوننت.

   ⚠️ عنوان و ویدیوها روی سرور رندر می‌شوند تا هم در HTML باشند و هم
   `ItemList` اسکیما از داده‌ی واقعی ساخته شود. تعامل (ریل کناری،
   ناوبری) در بخش کلاینت است.

   ⚠️ عنوان `absolute` است: لایه‌ی میانی `media/layout` قالب ریشه را
   مصرف می‌کند، پس رشته‌ی ساده پسوند برند را از دست می‌داد.
   ───────────────────────────────────────────────────────────── */

type Params = { params: Promise<{ slug: string }> }

export const revalidate = 60

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const p = await playlistBySlug(slug).catch(() => null)
  if (!p) return {}
  const url = `/media/playlist/${encodeURIComponent(p.slug)}`
  const description = p.description || `${p.title} — لیست پخش در بیلیارد مدیا.`
  return {
    title: { absolute: `${p.title} | بیلیارد مدیا` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: p.title, description, url, siteName: 'بیلیارد هاب',
      locale: 'fa_IR', type: 'website',
      ...(p.posters[0] ? { images: [{ url: p.posters[0] }] } : {}),
    },
  }
}

export default async function PlaylistPage({ params }: Params) {
  const { slug } = await params
  const p = await playlistBySlug(slug)
  if (!p) notFound()

  /* ⚠️ فقط فیلدهایی که واقعا داریم. لیست خالی `ItemList` نمی‌گیرد. */
  const schema = p.items.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: p.title,
    ...(p.description ? { description: p.description } : {}),
    numberOfItems: p.items.length,
    itemListElement: p.items.slice(0, 50).map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/media/${encodeURIComponent(v.slug)}`),
      name: v.title,
    })),
  } : null

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          /* «<» فرار داده می‌شود تا یک `</script>` در عنوان از تگ بیرون نزند */
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      )}
      <PlaylistClient playlist={p} />
      {/* لینک برگشت برای خزنده، حتی اگر جاوااسکریپت اجرا نشود */}
      <noscript>
        <Link href={`/media/channel/${encodeURIComponent(p.handle)}`}>بازگشت به کانال</Link>
      </noscript>
    </>
  )
}
