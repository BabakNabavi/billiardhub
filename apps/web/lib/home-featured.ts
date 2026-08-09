import 'server-only'
import { getSupabaseServer } from './supabase-server'
import { listPublicStores, type PublicStore } from './sellers-source'
import type { RealClub, RealProduct, RealStore, HomeFeatured } from './home-types'

/* ─────────────────────────────────────────────────────────────
   پشتوانه‌ی سه سکشن صفحه‌ی اصلی — خوانده‌شده روی سرور.

   چرا سرور و نه کلاینت: `app/page.tsx` عمداً وجود دارد تا این سه
   سکشن در HTML اولیه باشند (خزنده‌ها و رندر اول). وقتی این داده را
   با useEffect در مرورگر گرفتم، کارت‌ها از HTML بیرون افتادند و همان
   مشکلی که آن لایه حل کرده بود برگشت.

   کلاینت همچنان خودش هم می‌خواند؛ این فقط مقدار اولیه است.
   ───────────────────────────────────────────────────────────── */

const FEATURED_CLUBS_MAX = 8
const FEATURED_PRODUCTS_MAX = 14
const FEATURED_STORES_MAX = 12

/* عکس عمومی بیلیارد وقتی موجودیت عکس ندارد — نه عکس یک باشگاه
   دیگر که القا کند مال همین باشگاه است */
const CLUB_IMG = [
  '/images/clubs/club6.jpeg', '/images/clubs/club7.jpeg', '/images/clubs/club8.jpg',
  '/images/clubs/club9.jpeg', '/images/clubs/club5.jpeg', '/images/clubs/club4.png',
]
const PRODUCT_IMG = '/images/shop/cue_billiard_1.jpg'
/* ── این فایل وجود نداشت ──
   کارتِ فروشگاه در صفحه‌ی اصلی بی‌عکس می‌ماند چون نشانیِ فالبک ۴۰۴
   می‌داد و onError عکس را پنهان می‌کرد. کلاینت نشانیِ درست را داشت و
   فقط این مقدارِ سمتِ سرور جا مانده بود. */
const STORE_IMG = '/images/stores/IMG_0974.png'

export async function loadHomeFeatured(): Promise<HomeFeatured> {
  const sb = getSupabaseServer()

  /* فروشگاه‌ها از همان منبعی که `/api/sellers` می‌خواند — وگرنه
     مقدارِ اولیه‌ی سرور و فتچِ کلاینت دو چیزِ متفاوت می‌شدند و
     کارت‌ها بعد از hydration جابه‌جا می‌شدند. زودتر شروع می‌شود تا
     همچنان موازیِ دو کوئریِ دیگر بماند. */
  const storesP = listPublicStores(FEATURED_STORES_MAX).catch(() => [] as PublicStore[])

  const [clubsRes, productsRes] = await Promise.allSettled([
    sb.from('clubs')
      .select('id,name,city,images,hasActiveStory,snookerTables,pocketTables,highballTables,vipSnookerTables,vipPocketTables')
      .eq('isActive', true).order('createdAt', { ascending: false }).limit(FEATURED_CLUBS_MAX),
    sb.from('products')
      .select('id,title,brand,category,images,price,negotiable,discountPrice,discountPercent')
      .eq('status', 'active').order('createdAt', { ascending: false }).limit(FEATURED_PRODUCTS_MAX),
  ])

  const storeRows = await storesP

  const rows = <T>(r: PromiseSettledResult<{ data: unknown }>): T[] =>
    r.status === 'fulfilled' && Array.isArray(r.value?.data) ? (r.value.data as T[]) : []

  type C = {
    id: string; name: string; city?: string | null; images?: string[] | null; hasActiveStory?: boolean | null
    snookerTables?: number | null; pocketTables?: number | null; highballTables?: number | null
    vipSnookerTables?: number | null; vipPocketTables?: number | null
  }
  type P = {
    id: string; title: string; brand?: string | null; category?: string | null
    images?: string[] | null; price?: number | null; negotiable?: boolean | null
    discountPrice?: number | null; discountPercent?: number | null
  }
  const n = (v: number | null | undefined) => v ?? 0

  /* امتیاز و تعداد نظر صفر می‌ماند تا سیستم نظر واقعاً وجود داشته باشد؛
     کارت خودش صفر را نمایش نمی‌دهد. */
  const clubs: RealClub[] = rows<C>(clubsRes).map((c, i) => ({
    id: c.id,
    name: c.name,
    city: c.city ?? '',
    dist: '',
    tables: n(c.snookerTables) + n(c.pocketTables) + n(c.highballTables)
          + n(c.vipSnookerTables) + n(c.vipPocketTables),
    breakdown: {
      snooker: n(c.snookerTables) + n(c.vipSnookerTables),
      pocket: n(c.pocketTables) + n(c.vipPocketTables),
      highball: n(c.highballTables),
    },
    rating: 0, reviews: 0, type: 'اسنوکر',
    img: c.images?.[0] || CLUB_IMG[i % CLUB_IMG.length]!,
    img2: c.images?.[1] || CLUB_IMG[(i + 1) % CLUB_IMG.length]!,
    price: 0, badge: null, tags: [], hasStory: !!c.hasActiveStory,
  }))

  const products: RealProduct[] = rows<P>(productsRes).map(p => ({
    id: p.id,
    name: p.title,
    sub: p.brand || p.category || 'بیلیارد بازار',
    img: p.images?.[0] || PRODUCT_IMG,
    brand: (p.brand || 'BILLIARD').toUpperCase(),
    price: n(p.price),
    sale: p.discountPrice ?? n(p.price),
    pct: n(p.discountPercent),
    negotiable: p.negotiable === true,
  }))

  const stores: RealStore[] = storeRows.map(s => {
    const p = s.sellerProfile
    const person = [s.firstName, s.lastName].filter(Boolean).join(' ').trim()
    return {
      id: s.id,
      name: p.storeName || person || 'فروشگاه',
      city: p.city,
      specialty: p.specialty,
      rating: 0, reviews: 0,
      img: p.logo || s.avatar || STORE_IMG,
      badge: null,
    }
  })

  return { clubs, products, stores }
}
