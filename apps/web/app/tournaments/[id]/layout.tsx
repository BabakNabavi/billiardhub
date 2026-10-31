import { cache } from 'react'
import type { Metadata } from 'next'
import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'
import { SITE_URL } from '@/lib/site-url'
import { sb } from '@/lib/finance/db'

/* متادیتای یک مسابقه. صفحه Client Component است، پس متادیتا این‌جاست. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* همان مجموعه‌ای که مسیر عمومی می‌پذیرد — پیش‌نویس عمومی نیست، پس
   ایندکس هم نمی‌شود. */
const PUBLIC = new Set([
  'published', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
])

type TRow = {
  title?: string; city?: string; province?: string; status?: string
  entry_fee?: number; starts_at?: string; venue?: string; cover_url?: string | null
}
/* یک خواندن برای متادیتا و JSON-LD */
const loadT = cache(async (id: string): Promise<TRow | null> => {
  const res = await withTimeout(sb().from('tournaments')
    .select('title,city,province,status,entry_fee,starts_at,venue,cover_url')
    .eq('id', id).maybeSingle())
  if (res === TIMED_OUT) return null
  return res.data as TRow | null
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!UUID.test(id)) return {}

  try {
    const x = await loadT(id)
    if (!x?.title) return {}

    const when = x.starts_at
      ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' })
          .format(new Date(x.starts_at))
      : ''
    const title = x.city ? `${x.title} — مسابقه بیلیارد در ${x.city}` : `${x.title} — مسابقه بیلیارد`
    const description = [
      x.title,
      x.city ? `در ${x.city}` : '',
      when ? `· ${when}` : '',
      '— ثبت‌نام و جزئیات در بیلیارد هاب.',
    ].filter(Boolean).join(' ')

    return {
      /* `absolute`: لایه‌ی فهرستِ والد عنوانِ رشته‌ای دارد و قالبِ ریشه را مصرف
         کرده — بی‌این پسوندِ «بیلیارد هاب» نمی‌آمد */
      title: { absolute: `${title} | بیلیارد هاب` },
      description,
      alternates: { canonical: `/tournaments/${id}` },
      robots: PUBLIC.has(String(x.status)) ? undefined : { index: false, follow: false },
      openGraph: {
        title, description, url: `/tournaments/${id}`,
        siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
      },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch { return {} }
}

/* داده‌ی ساخت‌یافته: مسابقه = SportsEvent (نام، تاریخ، مکان، وضعیت) */
async function tournamentJsonLd(id: string) {
  if (!UUID.test(id)) return null
  try {
    const x = await loadT(id)
    if (!x?.title || !PUBLIC.has(String(x.status)) || !x.starts_at) return null
    const place = [x.venue, x.city].filter(Boolean).join('، ')
    const url = `${SITE_URL}/tournaments/${id}`
    const fee = Number(x.entry_fee) || 0
    return {
      '@context': 'https://schema.org', '@type': 'SportsEvent',
      name: x.title, url,
      description: `${x.title}${x.city ? ` در ${x.city}` : ''} — ثبت‌نام و جزئیات در بیلیارد هاب.`,
      startDate: new Date(x.starts_at).toISOString(),
      eventStatus: x.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      sport: 'Billiards',
      ...(x.cover_url ? { image: x.cover_url } : {}),
      location: {
        '@type': 'Place', name: place || x.city || 'ایران',
        address: { '@type': 'PostalAddress', ...(x.city ? { addressLocality: x.city } : {}), ...(x.province ? { addressRegion: x.province } : {}), addressCountry: 'IR' },
      },
      organizer: { '@type': 'Organization', name: 'بیلیارد هاب', url: SITE_URL },
      /* ورودیه — تومان در دیتابیس، ریال در schema */
      ...(fee > 0 ? { offers: { '@type': 'Offer', url, price: fee * 10, priceCurrency: 'IRR', availability: 'https://schema.org/InStock' } } : {}),
    }
  } catch { return null }
}

export default async function TournamentLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <><AsyncJsonLd data={tournamentJsonLd(id)} />{children}</>
}
