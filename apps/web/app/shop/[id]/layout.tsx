import type { Metadata } from 'next'
import { sb } from '@/lib/finance/db'
import { productTitle } from '@/lib/market/title'
import { conditionLabel } from '@/lib/market/categories'
import { faNum } from '@/lib/jalali'
import { thumbUrl } from '@/lib/media/thumb'
import { isLiveAd, PUBLIC_AD_STATUSES } from '@/lib/market/live'

/* متادیتای صفحه‌ی یک آگهیِ بیلیارد بازار — همان الگوی clubs/[id] و
   tournaments/[id]: صفحه Client Component است و نمی‌تواند metadata صادر
   کند، پس این لایه فقط برای SEO است و چیزی جز children رندر نمی‌کند.

   تا امروز همه‌ی آگهی‌ها عنوانِ کلیِ «فروشگاه تجهیزات بیلیارد» را
   داشتند؛ گوگل و هر پیش‌نمایشِ لینک در واتساپ و تلگرام همه‌ی آن‌ها را
   یک صفحه می‌دید — بی‌نام، بی‌قیمت، بی‌عکس. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type AdRow = {
  title?: string; brand?: string; model?: string
  price?: number | string | null; discountPrice?: number | string | null; negotiable?: boolean | null
  condition?: string | null; city?: string | null
  status?: string | null; expiresAt?: string | null; images?: unknown
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!UUID.test(id)) return {}

  try {
    const { data, error } = await sb().from('products')
      .select('title,brand,model,price,"discountPrice",negotiable,condition,city,status,"expiresAt",images')
      .eq('id', id).maybeSingle()
    if (error) {
      console.error('[shop/[id] metadata] read error:', error.message)
      return {}
    }
    const p = data as AdRow | null
    if (!p?.title) return {}

    /* ⚠️ همان مرزِ `/api/market/ads/[id]`: آگهیِ ردشده، حذف‌شده، متوقف یا در
       انتظار برای غیرمالک «پیدا نشد» است. متادیتا باید همان را بگوید —
       وگرنه لینکی که قبلاً در تلگرام/واتساپ پخش شده با عنوان و قیمت و عکس
       باز می‌شد، و noindex جلوی پیش‌نمایشِ لینک را نمی‌گیرد. */
    if (!PUBLIC_AD_STATUSES.includes(String(p.status))) return { robots: { index: false, follow: false } }

    const name = productTitle(p)
    if (!name) return {}

    /* همان شرطِ فهرستِ عمومی (`lib/market/live`): فقط آگهیِ فعالِ
       منقضی‌نشده ایندکس می‌شود. فروخته، متوقف یا در انتظارِ بازبینی نه. */
    const live = isLiveAd(p)

    /* `price` فهرست است و `discountPrice` پرداختی — قراردادِ بازار */
    const listed = Number(p.price) || 0
    const paid = Number(p.discountPrice) || 0
    const final = paid > 0 && paid < listed ? paid : listed
    const priceText = p.negotiable === true ? 'قیمت توافقی' : final > 0 ? `${faNum(final)} تومان` : ''

    const title = p.city ? `${name} — ${p.city}` : name
    const description = [
      name,
      p.condition ? `(${conditionLabel(p.condition)})` : '',
      p.city ? `در ${p.city}` : '',
      priceText ? `· ${priceText}` : '',
      '— آگهی در بیلیارد بازار، بیلیارد هاب.',
    ].filter(Boolean).join(' ')

    const first = Array.isArray(p.images) ? p.images.find((x): x is string => typeof x === 'string' && !!x) : undefined
    /* data URI هرگز در پیش‌نمایش نمی‌نشیند؛ فقط نشانیِ واقعی */
    const image = first && !first.startsWith('data:') ? thumbUrl(first, 1200, 80) : undefined

    return {
      title,
      description,
      alternates: { canonical: `/shop/${id}` },
      robots: live ? undefined : { index: false, follow: false },
      openGraph: {
        title, description, url: `/shop/${id}`,
        siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website',
        ...(image ? { images: [{ url: image, alt: name }] } : {}),
      },
      twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
    }
  } catch (e) {
    /* دیتابیس در دسترس نبود ⇒ متادیتای پیش‌فرض می‌ماند، نه خطا — ولی خاموش نه */
    console.error('[shop/[id] metadata]', (e as Error).message)
    return {}
  }
}

export default function MarketAdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
