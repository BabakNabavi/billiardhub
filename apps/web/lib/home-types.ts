/* ─────────────────────────────────────────────────────────────
   شکل داده‌ای که کارت‌های صفحه‌ی اصلی می‌گیرند.

   عمداً در ماژول خودش است، نه داخل `app/HomeClient.tsx`:
   HomeClient یک Client Component است و `lib/home-featured.ts` که
   روی سرور اجرا می‌شود باید همین تایپ‌ها را بشناسد. ایمپورت‌کردنشان
   از دل یک فایل `'use client'` یک یال شکننده در گراف ماژول‌ها
   می‌سازد — همان کاری که یک‌بار مرز سرور/کلاینت را جابه‌جا کرد و
   صفحه‌ی اصلی را ۵۰۰ کرد.

   این فایل نه `'use client'` دارد نه `server-only`، پس هر دو طرف
   بی‌خطر از آن می‌خوانند.
   ───────────────────────────────────────────────────────────── */

export interface RealClub {
  id: string
  name: string
  city: string
  dist: string
  tables: number
  breakdown?: { snooker: number; pocket: number; highball: number }
  rating: number
  reviews: number
  type: string
  img: string
  img2: string
  price: number
  badge: string | null
  tags: string[]
  hasStory: boolean
}

export interface RealProduct {
  id: string
  name: string
  sub: string
  img: string
  brand: string
  price: number
  sale: number
  pct: number
  /* آگهیِ توافقی قیمتِ قابلِ نمایش ندارد — کارت باید «توافقی»
     بنویسد، نه «۰ تومان». */
  negotiable: boolean
  /* شهر و وضعیتِ کالا — کارتِ صفحه‌ی اصلی این دو را نداشت، در حالی
     که همان آگهی در فهرستِ بازار نشانشان می‌داد */
  city: string
  condition: string
}

export interface RealStore {
  id: string
  name: string
  city: string
  specialty: string
  rating: number
  reviews: number
  img: string
  badge: string | null
}

export interface HomeFeatured {
  clubs: RealClub[]
  products: RealProduct[]
  stores: RealStore[]
}

export const EMPTY_FEATURED: HomeFeatured = { clubs: [], products: [], stores: [] }
