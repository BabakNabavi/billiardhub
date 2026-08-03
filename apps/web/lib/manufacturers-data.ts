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
  image: string
  badge?: string
}

export interface MockManufacturer {
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
  hours: string
  website: string
  products: MfrProduct[]
  certificates: { title: string; issuer: string; year: string }[]
}

/* ⚠️ عمداً خالی — پیش از رونمایی پاک شد.

   این آرایه 21 موجودیتِ ساختگی داشت که روی سایتِ زنده مثل داده‌ی
   واقعی دیده می‌شدند: نام، شهر، امتیاز و مشخصاتی که هیچ‌کدام وجودِ
   خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید.

   جای این‌ها با موجودیت‌های واقعیِ سایت پر می‌شود. اگر چیزی نباشد،
   بخش خالی می‌ماند — که درست است. آرایه نگه داشته شد (نه حذف) تا
   امضای ماژول و مصرف‌کننده‌هایش دست‌نخورده بمانند. */
export const MANUFACTURERS: MockManufacturer[] = []

export function getManufacturer(id: string): MockManufacturer | null {
  return MANUFACTURERS.find(m => m.id === id) ?? null
}
