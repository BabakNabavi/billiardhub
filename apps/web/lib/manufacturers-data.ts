/* ─────────────────────────────────────────────────────────────
   تولیدکنندگان — منبع واحد (مثل lib/sellers-data برای فروشگاه‌ها).
   هم صفحه‌ی لیست (/manufacturers) و هم صفحه‌ی تولیدکننده (/manufacturers/[id])
   از همین می‌خوانند تا کلیک روی هر کارت همان تولیدکننده را باز کند.
   ───────────────────────────────────────────────────────────── */

export interface MfrProduct {
  id: string
  name: string
  category: string          // برچسب آزاد دسته (میز اسنوکر، چوب، پارچه، …)
  description: string
  specs: string[]
  /** عکس نخست — ردیف‌های قدیمی فقط همین را دارند */
  image: string
  /** تا ۱۰ عکس. اختیاری تا ردیف‌های موجود بدون مهاجرت کار کنند. */
  images?: string[]
  badge?: string
}

/** همه‌ی عکس‌های یک محصول، از هر دو شکل — منبع واحد برای صفحه‌ها */
export function productImages(p: Pick<MfrProduct, 'image' | 'images'>): string[] {
  const many = Array.isArray(p.images) ? p.images.filter(Boolean) : []
  if (many.length) return many.slice(0, MAX_PRODUCT_IMAGES)
  return p.image ? [p.image] : []
}

export const MAX_PRODUCT_IMAGES = 10

export interface MockManufacturer {
  /* گالری تصاویر — اختیاری تا نمونه‌های قدیمی نشکنند */
  /* همان شکل رسانه‌ی بقیه‌ی نقش‌ها؛ `caption`/`album` اختیاری‌اند
     چون ردیف‌های موجود فقط `{id,url}` دارند. */
  gallery?: { id: string; url: string; caption?: string; album?: string }[]
  albums?: string[]
  videos?: { id: string; url?: string; thumbnail: string; title: string; duration: string; album?: string }[]
  id: string
  name: string
  city: string
  verified: boolean
  elite: boolean            // «تولیدکننده‌ی رسمی» (نشان طلایی روی کارت)
  since: string
  sinceYear: number
  productCount: number
  specialties: string[]     // روی کارت زیر لوکیشن با برچسب «تخصص:»
  responseTime: string
  phone: string
  /* شماره‌ی دوم و موبایل — کارگاه معمولا بیش از یک خط دارد، و
     شماره‌ی واتساپ لزوما شماره‌ی تماس نیست. */
  phone2: string
  mobile: string
  bannerImage: string
  description: string        // کوتاه — کارت + باکس «درباره ما»

  /* ── فقط صفحه‌ی تولیدکننده ── */
  tagline: string
  about: string
  employees: string
  exportCountries: string
  totalProduced: string
  productionCapability: string
  whatsapp: string
  instagram: string
  address: string
  /* نشانی دقیق — همان چیزی که فرم باشگاه می‌گیرد */
  postalCode: string
  latitude: string
  longitude: string
  hours: string
  website: string
  products: MfrProduct[]
  certificates: { title: string; issuer: string; year: string; image?: string }[]
}

/* ⚠️ عمدا خالی — پیش از رونمایی پاک شد.

   این آرایه 21 موجودیت ساختگی داشت که روی سایت زنده مثل داده‌ی
   واقعی دیده می‌شدند: نام، شهر، امتیاز و مشخصاتی که هیچ‌کدام وجود
   خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید.

   جای این‌ها با موجودیت‌های واقعی سایت پر می‌شود. اگر چیزی نباشد،
   بخش خالی می‌ماند — که درست است. آرایه نگه داشته شد (نه حذف) تا
   امضای ماژول و مصرف‌کننده‌هایش دست‌نخورده بمانند. */
export const MANUFACTURERS: MockManufacturer[] = []

export function getManufacturer(id: string): MockManufacturer | null {
  return MANUFACTURERS.find(m => m.id === id) ?? null
}
