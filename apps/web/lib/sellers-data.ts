/* ─────────────────────────────────────────────────────────────
   فروشگاه‌های نمونه (دموی لیست /sellers) — منبع واحد.
   هم صفحه‌ی لیست (/sellers) و هم صفحه‌ی storefront (/sellers/[id] → FlatShop)
   از همین می‌خوانند، تا کلیک روی هر کارت، همان فروشگاه را باز کند
   (نه پیش‌فرض). فروشگاه‌های واقعی ساخته‌شده در پنل روی این‌ها سوار می‌شوند.
   ───────────────────────────────────────────────────────────── */

export interface MockSeller {
  id: string
  name: string
  city: string
  verified: boolean
  elite: boolean
  rating: number
  reviewCount: number
  productCount: number
  since: string
  sinceYear: number
  brands: string[]
  specialties: string[]
  responseTime: string
  phone: string
  bannerImage: string
  description: string
}

/* ⚠️ عمداً خالی — پیش از رونمایی پاک شد.

   این آرایه 6 موجودیتِ ساختگی داشت که روی سایتِ زنده مثل داده‌ی
   واقعی دیده می‌شدند: نام، شهر، امتیاز و مشخصاتی که هیچ‌کدام وجودِ
   خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید.

   جای این‌ها با موجودیت‌های واقعیِ سایت پر می‌شود. اگر چیزی نباشد،
   بخش خالی می‌ماند — که درست است. آرایه نگه داشته شد (نه حذف) تا
   امضای ماژول و مصرف‌کننده‌هایش دست‌نخورده بمانند. */
export const MOCK_SELLERS: MockSeller[] = []

export function getMockSeller(id: string): MockSeller | null {
  return MOCK_SELLERS.find(s => s.id === id) ?? null
}
