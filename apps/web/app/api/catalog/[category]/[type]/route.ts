/* ═══════════════════════════════════════════════════════════════
   کاتالوگِ یک نوع — استاتیک، با کشِ همیشگی.
   ───────────────────────────────────────────────────────────────
   کلِ دو کاتالوگ بیش از صد کیلوبایت است و نباید در باندلِ فرم بنشیند.
   این مسیر برندهای **یک نوع** را می‌دهد: بینِ ۶ تا ۲۲ کیلوبایت.
   کسی که «تیپ» ثبت می‌کند اصلاً چیزی دانلود نمی‌کند.

   `force-static` + `generateStaticParams` یعنی همه‌ی ترکیب‌ها موقعِ
   بیلد یک‌بار ساخته می‌شوند و در زمانِ اجرا هیچ کاری انجام نمی‌شود.

   ── چرا `sizes` هم این‌جاست ──
   فیلدِ سایز در کارتِ «مشخصات فنی» است، نه کنارِ برند — ولی فهرستش
   به همان نوع وابسته است. اگر مسیرِ جدایی می‌ساختیم، همان داده دو
   بار می‌آمد. یک درخواست، هر دو مصرف‌کننده.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import {
  CATALOG_IDS, TYPE_IDS, isCatalogId,
  countriesOf, getType,
} from '../../../../../lib/market/catalog'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return CATALOG_IDS.flatMap(category =>
    TYPE_IDS[category].map(type => ({ category, type })),
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string; type: string }> },
) {
  const { category, type } = await params
  if (!isCatalogId(category)) {
    return NextResponse.json({ error: 'دسته نامعتبر است' }, { status: 404 })
  }
  const t = getType(category, type)
  if (!t) {
    return NextResponse.json({ error: 'نوع نامعتبر است' }, { status: 404 })
  }

  return NextResponse.json(
    {
      category,
      type: t.id,
      label_fa: t.label_fa,
      brands: t.brands,
      sizes: t.sizes ?? [],
      /* «نوع ست» فقط توپ دارد و مثلِ سایز به نوع وابسته است */
      setTypes: t.set_types ?? [],
      forceFreeInput: !!t.force_free_input,
      countries: countriesOf(category),
    },
    /* داده فقط با دیپلوی عوض می‌شود و مسیر استاتیک است */
    { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  )
}
