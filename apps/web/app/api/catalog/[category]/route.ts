/* فهرست نوع‌های یک کاتالوگ، با شمارش برند.
   ───────────────────────────────────────────────────────────────
   دراپ‌داون «نوع» تا امروز فقط برچسب فارسی داشت. با این، همان
   چیدمان ردیف برند را می‌گیرد: نام و بعد شمارش — فروشنده پیش از
   انتخاب می‌بیند کدام رشته فهرست پرتر دارد.

   سبک است (چند صد بایت) و مثل بقیه‌ی مسیرهای کاتالوگ ایستا. */

import { NextResponse } from 'next/server'
import { CATALOG_IDS, isCatalogId, typeOptions } from '../../../../lib/market/catalog'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return CATALOG_IDS.map(category => ({ category }))
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params
  if (!isCatalogId(category)) {
    return NextResponse.json({ error: 'دسته نامعتبر است' }, { status: 404 })
  }
  return NextResponse.json(
    { category, types: typeOptions(category) },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  )
}
