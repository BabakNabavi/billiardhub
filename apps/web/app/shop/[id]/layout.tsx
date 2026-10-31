import { cache } from 'react'
import type { Metadata } from 'next'
import { AsyncJsonLd } from '@/components/seo/AsyncJsonLd'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'
import { normalizeCondition } from '@/lib/market/categories'
import { SITE_URL } from '@/lib/site-url'
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
  status?: string | null; expiresAt?: string | null; images?: unknown; description?: string | null
}

/* یک خواندن برای متادیتا و JSON-LD (همان درخواست) */
const loadAd = cache(async (id: string): Promise<AdRow | null> => {
  const res = await withTimeout(sb().from('products')
    .select('title,brand,model,price,"discountPrice",negotiable,condition,city,status,"expiresAt",images,description')
    .eq('id', id).maybeSingle())
  if (res === TIMED_OUT) return null
  if (res.error) throw new Error(res.error.message)
  return res.data as AdRow | null
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  if (!UUID.test(id)) return {}

  try {
    const p = await loadAd(id)
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

/* ── داده‌ی ساخت‌یافته‌ی محصول ──
   فقط آگهیِ زنده. قیمت به *ریال* (ISO 4217: IRR) — بازار تومان ذخیره می‌کند،
   پس ضربدر ده. آگهیِ توافقی/بی‌قیمت offerِ قیمت‌دار نمی‌گیرد (ادعای ساختگی نه). */
async function adJsonLd(id: string) {
  if (!UUID.test(id)) return null
  try {
    const p = await loadAd(id)
    if (!p?.title || !PUBLIC_AD_STATUSES.includes(String(p.status)) || !isLiveAd(p)) return null
    const name = productTitle(p)
    if (!name) return null
    const listed = Number(p.price) || 0
    const paid = Number(p.discountPrice) || 0
    const final = paid > 0 && paid < listed ? paid : listed
    /* Product بی‌offer برای گوگل نامعتبر است — آگهیِ توافقی/بی‌قیمت JSON-LD نمی‌گیرد */
    if (p.negotiable === true || final <= 0) return null
    const cond = normalizeCondition(p.condition)
    const until = Date.parse(String(p.expiresAt ?? ''))
    const images = (Array.isArray(p.images) ? p.images : [])
      .filter((x): x is string => typeof x === 'string' && !!x && !x.startsWith('data:'))
      .slice(0, 4).map(u => thumbUrl(u, 1200, 80))
    const url = `${SITE_URL}/shop/${id}`
    return {
      '@context': 'https://schema.org', '@type': 'Product',
      name, url,
      ...(images.length ? { image: images } : {}),
      ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
      ...(p.model ? { model: p.model } : {}),
      ...(p.description ? { description: String(p.description).replace(/\s+/g, ' ').slice(0, 500) } : {}),
      offers: {
        '@type': 'Offer', url, priceCurrency: 'IRR', price: final * 10,
        availability: 'https://schema.org/InStock',
        /* همان قاعده‌ی برچسبِ صفحه (normalizeCondition): بی‌مقدار = نو */
        itemCondition: cond === 'new' ? 'https://schema.org/NewCondition'
          : cond === 'needs_repair' ? 'https://schema.org/DamagedCondition' : 'https://schema.org/UsedCondition',
        ...(Number.isFinite(until) ? { priceValidUntil: new Date(until).toISOString().slice(0, 10) } : {}),
        ...(p.city ? { areaServed: p.city } : {}),
      },
    }
  } catch { return null }
}

export default async function MarketAdLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <><AsyncJsonLd data={adJsonLd(id)} />{children}</>
}
