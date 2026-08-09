/* منبع واحد محصولات بیلیارد بازار — مشترک بین کاتالوگ (/shop)،
   جزئیات محصول (/shop/[id]) و صفحه‌ی فروشگاه (/sellers/[id]).

   تا امروز این فایل یک آرایه‌ی ثابت از محصولاتِ ساختگی بود: چوب
   Predator، میز Rasson، توپ Aramith… با فروشنده‌های «پروکیو» و
   «بیلیارد سنتر» که هیچ‌کدام وجودِ خارجی نداشتند. بازدیدکننده روی
   کارت کلیک می‌کرد و به فروشنده‌ای می‌رسید که نبود.

   حالا محصولات از دیتابیس خوانده می‌شوند — همان مسیری که خودِ
   فروشنده‌ها با آن آگهی ثبت می‌کنند. اگر فهرست خالی باشد یعنی هنوز
   محصولی ثبت نشده، و همان درست است؛ محصولِ ساختگی جایش را پر نمی‌کند.
   برای پرکردنِ فهرست پیش از رونمایی، از پنل ادمین ← «افزودن محتوای
   نمایشی» استفاده کنید. */

export interface ShopProduct {
  id: string | number
  cat: string
  img: string
  name: string
  desc: string
  brand: string
  price: number
  old: number
  disc: number
  rating: number
  reviews: number
  sales: number
  sellerId: string      // → /sellers/{sellerId}
  sellerName: string
  sellerPhone: string
  sellerWhatsapp: string
  city: string
  condition: string
  /* آگهیِ توافقی — بدونِ این، کارتِ فروشگاه صفرِ دیتابیس را چاپ می‌کرد */
  negotiable: boolean
  createdAt: number | null
}

export const CAT_LABELS: Record<string, string> = {
  cue: 'چوب', table: 'میز', ball: 'توپ', tip: 'تیپ', chalk: 'گچ', extension: 'اکستنشن',
  'case-bag': 'کیس و کیف', rest: 'رست', cloth: 'پارچه', oil: 'روغن', towel: 'حوله',
  clothing: 'پوشاک', accessory: 'اکسسوری', other: 'سایر',
}

/* ── نگاشتِ ردیفِ دیتابیس به شکلی که صفحه‌ها می‌شناسند ──

   ستون‌های جدول با نام‌های صفحه یکی نیستند (`title` در برابر `name`،
   `images[]` در برابر `img`، `discountPrice` در برابر `old`). این نگاشت
   تنها جایی است که این تفاوت را می‌داند، تا سه صفحه‌ی مصرف‌کننده به
   اسکیمای جدول گره نخورند.

   قیمتِ نمایشی: اگر تخفیفی هست، `price` قیمتِ خط‌خورده است و
   `discountPrice` قیمتِ پرداختی. اگر نیست، هر دو یکی‌اند. */
export function toShopProduct(r: Record<string, unknown>): ShopProduct {
  const n = (v: unknown) => Number(v) || 0
  const s = (v: unknown, d = '') => (typeof v === 'string' && v.trim() ? v.trim() : d)
  const images = Array.isArray(r.images) ? (r.images as unknown[]).map(x => String(x)) : []

  const listed = n(r.price)
  const off = n(r.discountPrice)
  const hasDisc = off > 0 && off < listed
  const pct = n(r.discountPercent) || (hasDisc ? Math.round(((listed - off) / listed) * 100) : 0)

  const created = r.createdAt ? Date.parse(String(r.createdAt)) : NaN

  return {
    id: String(r.id ?? ''),
    cat: s(r.category, 'other'),
    img: images[0] ?? '',
    name: s(r.title, 'محصول'),
    desc: s(r.description),
    brand: s(r.brand),
    price: hasDisc ? off : listed,
    old: hasDisc ? listed : listed,
    disc: hasDisc ? pct : 0,
    rating: n(r.rating),
    reviews: n(r.reviewCount),
    sales: n(r.views),
    /* ── چرا `storeSlug` و نه `sellerId` ──
       تعریفِ خودِ این فیلد بالا نوشته: «→ /sellers/{sellerId}»، یعنی
       نامکِ فروشگاه. ولی این‌جا `r.sellerId` خوانده می‌شد که شناسه‌ی
       *کاربر* است — و اصلاً در ستون‌های فهرستِ عمومی نیست، پس همیشه
       رشته‌ی خالی درمی‌آمد.

       نتیجه: `fetchProductsBySeller(slug)` خالی در برابر نامک
       مقایسه می‌کرد و صفحه‌ی هر فروشگاهی بدونِ محصول می‌ماند. */
    sellerId: s(r.storeSlug),
    sellerName: s(r.sellerName),
    sellerPhone: s(r.sellerPhone),
    sellerWhatsapp: s(r.sellerWhatsapp),
    city: s(r.city),
    condition: s(r.condition, 'new'),
    negotiable: r.negotiable === true,
    createdAt: Number.isFinite(created) ? created : null,
  }
}

/* یک صفحه‌ی بزرگ کافی است: فهرستِ بازار سمتِ کلاینت فیلتر و مرتب
   می‌شود، پس صفحه‌بندیِ سرور این‌جا فقط سقفِ ایمنی است. */
export async function fetchShopProducts(limit = 200): Promise<ShopProduct[]> {
  try {
    const r = await fetch(`/api/products?limit=${limit}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json()
    const rows = Array.isArray(j?.products) ? j.products : []
    return rows.map((x: Record<string, unknown>) => toShopProduct(x))
  } catch {
    return []
  }
}

export async function fetchProductsBySeller(sellerId: string): Promise<ShopProduct[]> {
  if (!sellerId) return []
  const all = await fetchShopProducts()
  return all.filter(p => p.sellerId === sellerId)
}
