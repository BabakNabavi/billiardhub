import { NextRequest } from 'next/server'
import FlatShop from './FlatShop'
import { loadPublicProfile } from '@/lib/profiles/public-detail'
import type { SellerProfile } from '@/lib/seller-store'
import { GET as listProducts } from '@/app/api/products/route'
import { toShopProduct, type ShopProduct } from '@/app/shop/products'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/*
  همه‌ی فروشگاه‌ها یک قالب دارند: FlatShop.
  نسخه‌ی Liquid Glass (GlassShop) حذف شد — /sellers/1 الگوی نهایی است و پنل ادمین هم از روی همین ساخته می‌شود.

  ── پوسته‌ی سرور (آذرِ ۱۴۰۵) ──
  فروشگاهِ تأییدشده و محصولاتش همراهِ HTML می‌آیند تا صفحه بی‌اسکلت باز شود.
  بی‌محصولات، HTMLِ اول «۰ محصول» و «محصولی پیدا نشد» می‌گفت و ردیفِ آمارِ هیرو
  پس از رسیدنِ محصولات وسطِ سربرگ اضافه می‌شد (بازبینی). نبود/تأییدنشده/خطا ⟵
  null: رفتارِ قبلی (مرورگر خودش می‌خواند).
  سرنخِ بنرِ اول در خودِ ProfileHero است: preload() این‌جا پس از await می‌آمد و
  در صفحه‌ی داینامیک فقط به جریانِ RSC می‌رسید، نه به headِ HTML.
  ⚠️ `key`: جابه‌جایی بینِ دو فروشگاه state را از قبلی نگه می‌داشت.
*/

/** همان چیزی که fetchProductsBySeller در مرورگر می‌کند: خودِ GET /api/products
 *  (همان سقفِ ۲۰۰) و فیلتر روی نامکِ فروشگاه — نه کپیِ قاعده‌اش. */
async function loadSellerProducts(slug: string): Promise<ShopProduct[] | null> {
  try {
    const res = await withTimeout(listProducts(new NextRequest('http://localhost/api/products?limit=200')), 1500)
    if (res === TIMED_OUT || !res.ok) return null
    const j = (await res.json()) as { products?: unknown }
    if (!Array.isArray(j.products)) return null
    return (j.products as Record<string, unknown>[]).map(toShopProduct).filter(p => p.sellerId === slug)
  } catch (e) {
    console.error('[seller] initial products', e instanceof Error ? e.message : e)
    return null
  }
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [initial, products] = await Promise.all([
    loadPublicProfile<SellerProfile>('seller', id),
    loadSellerProducts(id),
  ])
  return <FlatShop key={id} initial={initial} initialProducts={products} />
}
