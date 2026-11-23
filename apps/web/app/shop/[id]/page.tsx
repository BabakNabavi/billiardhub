import { ProductDetailClient } from './ProductDetailClient'
import { loadPublicAd } from '@/lib/market/public-ad'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* رندرِ سرورِ آگهی (آذرِ ۱۴۰۵): داده‌ی عمومی همراهِ HTML — عکسِ اصلی بی‌انتظار
   برای JS و API پیدا می‌شود. قاعده‌ی حریم در lib/market/public-ad.
   هر بازدید تازه خوانده می‌شود (فروخته‌شدن/توقف همان لحظه دیده شود).
   دیتابیسِ کند یا خطا صفحه را نگه نمی‌دارد: پس از ۱٫۵ ثانیه همان مسیرِ
   کلاینتیِ قبلی ادامه می‌دهد. */
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let ad: Record<string, unknown> | null = null
  try {
    const r = await withTimeout(loadPublicAd(id), 1500)
    ad = r === TIMED_OUT ? null : r
  } catch (e) {
    console.error('[shop/[id]] initial load', e)
  }
  return <ProductDetailClient initialAd={ad} />
}
