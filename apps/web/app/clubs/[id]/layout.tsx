import { cache } from 'react'
import type { Metadata } from 'next'
import { sb } from '@/lib/finance/db'
import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'
import { SITE_URL } from '@/lib/site-url'

/* متادیتای صفحه‌ی یک باشگاه.
   صفحه Client Component است و نمی‌تواند metadata صادر کند، پس این لایه
   فقط برای SEO است و چیزی جز children (و JSON-LD) رندر نمی‌کند.

   ⚠️ آبانِ ۱۴۰۵: تا امروز فقط شناسه‌ی UUID پذیرفته می‌شد، ولی لینک‌های سایت
   با نامکِ اختصاصی‌اند (`/clubs/artaclub`). برای همین صفحه‌ی واقعیِ هر باشگاه
   عنوانِ «باشگاه‌های بیلیارد» و canonicalِ `/clubs` می‌گرفت — یعنی به گوگل
   می‌گفت «من کپیِ فهرستم». حالا با نامک یا شناسه پیدا می‌شود و canonical
   همیشه نشانیِ نامک‌دار است (یک نشانی برای هر باشگاه). */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface ClubSeo {
  id: string; slug?: string | null; name?: string; city?: string; province?: string; address?: string
  logo?: string | null; images?: unknown; latitude?: number | null; longitude?: number | null
  verificationStatus?: string; isActive?: boolean
}

const loadClub = cache(async (raw: string): Promise<ClubSeo | null> => {
  /* ⚠️ بی‌decodeURIComponent: Next پارامتر را از قبل رمزگشایی کرده و رمزگشاییِ
     دوم روی «%» یک URIError بیرون از try می‌داد — صفحه ۵۰۰ می‌شد */
  const id = raw.trim().toLowerCase()
  if (!/^[0-9a-z-]{1,64}$/.test(id)) return null
  try {
    const q = sb().from('clubs')
      .select('id,slug,name,city,province,address,logo,images,latitude,longitude,"verificationStatus","isActive"')
    const res = await withTimeout(UUID.test(id) ? q.eq('id', id).maybeSingle() : q.eq('slug', id).maybeSingle())
    if (res === TIMED_OUT) return null
    return (res.data as ClubSeo | null) ?? null
  } catch { return null }
})

const isPublished = (c: ClubSeo) => c.isActive !== false &&
  (c.verificationStatus === 'verified' || c.verificationStatus === 'approved')
const imageOf = (c: ClubSeo) => c.logo || (Array.isArray(c.images) ? (c.images as unknown[]).find((x): x is string => typeof x === 'string' && !!x) : undefined)
const pathOf = (c: ClubSeo) => `/clubs/${c.slug || c.id}`

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const c = await loadClub(id)
  if (!c?.name) return {}
  const where = [c.city, c.province].filter(Boolean).join('، ')
  /* `absolute`: لایه‌ی فهرستِ والد عنوانِ رشته‌ای دارد و قالبِ ریشه را مصرف کرده */
  const title = `${c.name} | باشگاه بیلیارد${c.city ? ` در ${c.city}` : ''} | بیلیارد هاب`
  const description = [
    `${c.name}${where ? ` در ${where}` : ''}${c.address ? ` — ${c.address}` : ''}.`,
    'میزهای اسنوکر و پاکت، ساعات کاری، تصاویر و رزرو آنلاین میز در بیلیارد هاب',
  ].join(' ')
  const url = pathOf(c)
  const image = imageOf(c)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    /* باشگاه منتشرنشده نباید ایندکس شود */
    robots: isPublished(c) ? undefined : { index: false, follow: false },
    openGraph: {
      title, description, url,
      siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
      ...(image ? { images: [{ url: image, alt: c.name }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
  }
}

/* داده‌ی ساخت‌یافته: باشگاه = SportsActivityLocation (زیرنوعِ LocalBusiness) —
   نام، نشانی، مختصات و تصویر؛ گوگل از همین برای نتیجه‌ی محلی استفاده می‌کند. */
async function clubJsonLd(id: string) {
  const c = await loadClub(id)
  if (!c?.name || !isPublished(c)) return null
  const url = `${SITE_URL}${pathOf(c)}`
  const image = imageOf(c)
  return [
    {
      '@context': 'https://schema.org', '@type': 'SportsActivityLocation',
      name: c.name, url,
      ...(image ? { image } : {}),
      address: {
        '@type': 'PostalAddress',
        ...(c.address ? { streetAddress: c.address } : {}),
        ...(c.city ? { addressLocality: c.city } : {}),
        ...(c.province ? { addressRegion: c.province } : {}),
        addressCountry: 'IR',
      },
      ...(typeof c.latitude === 'number' && typeof c.longitude === 'number'
        ? { geo: { '@type': 'GeoCoordinates', latitude: c.latitude, longitude: c.longitude } } : {}),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'بیلیارد هاب', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'باشگاه‌های بیلیارد', item: `${SITE_URL}/clubs` },
        { '@type': 'ListItem', position: 3, name: c.name, item: url },
      ],
    },
  ]
}

export default async function ClubLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  /* در Suspense — رندرِ صفحه منتظرِ دیتابیس نمی‌ماند */
  return <><AsyncJsonLd data={clubJsonLd(id)} />{children}</>
}
