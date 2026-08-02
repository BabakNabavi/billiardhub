import type { Metadata } from 'next'
import { sb } from '@/lib/finance/db'

/* متادیتای یک مسابقه. صفحه Client Component است، پس متادیتا این‌جاست. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* همان مجموعه‌ای که مسیرِ عمومی می‌پذیرد — پیش‌نویس عمومی نیست، پس
   ایندکس هم نمی‌شود. */
const PUBLIC = new Set([
  'published', 'registration_open', 'registration_closed',
  'ongoing', 'completed', 'cancelled',
])

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!UUID.test(id)) return {}

  try {
    const { data } = await sb().from('tournaments')
      .select('title,city,province,status,entry_fee,starts_at,discipline')
      .eq('id', id).maybeSingle()
    const x = data as {
      title?: string; city?: string; status?: string
      entry_fee?: number; starts_at?: string
    } | null
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
      title,
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

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
