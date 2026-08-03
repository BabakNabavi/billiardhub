import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { buildLivePlacements } from '../lib/ads/live-payload'
import { loadHomeFeatured } from '../lib/home-featured'
import { EMPTY_FEATURED } from '../lib/home-types'
import ServicesSection from '../components/home/ServicesSection'
import ExploreStrip from '../components/home/ExploreStrip'
/* از ماژول مشترک، نه از AdSlot که 'use client' است — صداکردن تابع
   یک فایل کلاینت از Server Component همان چیزی بود که صفحه را ۵۰۰ کرد */
import { toPlacementState, type PlacementKey, type PlacementState, type PlacementPayload } from '../lib/ads/placement-state'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرور صفحه‌ی اصلی.

   خود صفحه یک Client Component بزرگ است و همان‌جا می‌ماند — بازنویسی
   ۲۱۷۳ خط برای SSR نه لازم است نه امن.

   کاری که این لایه می‌کند فقط یک چیز است: سه جایگاه اصلی (محصولات
   ویژه، باشگاه‌های پیشنهادی، فروشگاه‌های تجهیزات) را روی سرور می‌خواند
   و به‌عنوان مقدار اولیه پایین می‌فرستد.

   پیش از این، هر سه فقط بعد از اجرای جاوااسکریپت پر می‌شدند؛ یعنی
   خزنده‌ها هیچ محتوایی نمی‌دیدند و کاربر هم یک پرش چیدمان داشت.

   اگر خواندن شکست بخورد چیزی خراب نمی‌شود: کلاینت مثل قبل خودش
   می‌خواند. این لایه فقط رندر اول را بهتر می‌کند، جایگزین آن نیست.
   ───────────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic'

/* ⚠️ موقت — احرازِ مالکیتِ دامنه برای اینماد (روشِ «تغییر عنوانِ صفحه»).
   هر سه روشِ اینماد الان هم‌زمان روی سایت‌اند: همین عنوان، متاتگِ
   `enamad` در app/layout.tsx، و فایلِ خالیِ public/48195948.txt.

   هر سه با وجودِ درست‌بودن رد شدند و تیکتِ پشتیبانی باز است؛ پس هر سه
   می‌مانند تا بررسیِ دستی انجام شود.

   بعد از گرفتنِ نشان فقط همین پیشوندِ عنوان برداشته شود — متاتگ و فایل
   باید بمانند، چون اینماد دوره‌ای دوباره بررسی می‌کند. */
export const metadata: Metadata = {
  title: '48195948 | بیلیارد هاب | پلتفرم جامع و تخصصی بیلیارد',
  description:
    'باشگاه‌های بیلیارد، رزرو آنلاین میز، مربیان و داوران رسمی، فروشگاه تجهیزات و مسابقات — همه در بیلیارد هاب.',
  alternates: { canonical: '/' },
}

const KEYS: PlacementKey[] = [
  'market_featured_products_homepage',
  'featured_clubs_homepage',
  'featured_equipment_stores_homepage',
]

export default async function HomePage() {
  let initialPlacements: Partial<Record<PlacementKey, PlacementState>> | undefined

  /* پشتوانه‌ی سه سکشن هم همین‌جا خوانده می‌شود، نه در مرورگر.

     وقتی این داده را با useEffect گرفتم، کارت‌ها از HTML اولیه بیرون
     افتادند و همان مشکلی که این لایه حل کرده بود برگشت — خزنده چیزی
     نمی‌دید و کاربر یک پرش چیدمان داشت. */
  const [placements, featured] = await Promise.allSettled([
    buildLivePlacements(),
    loadHomeFeatured(),
  ])

  if (placements.status === 'fulfilled') {
    const live = placements.value
    initialPlacements = Object.fromEntries(
      KEYS.map(k => [k, toPlacementState(live[k] as PlacementPayload | undefined)]),
    ) as Partial<Record<PlacementKey, PlacementState>>
  }

  return (
    <>
      {/* تصویر هیرو LCP صفحه است ولی داخل کامپوننت کلاینتی قرار دارد،
          پس مرورگر تا پارس‌شدن آن عمق پیدایش نمی‌کند — همان چیزی که
          PageSpeed «LCP request discovery» می‌نامد.

          این preload در <head> می‌نشیند و دانلود همان اولین لحظه شروع
          می‌شود. `fetchPriority=high` هم می‌گوید از بقیه‌ی منابع جلو
          بیفتد. عکس همان است که پوستر ویدیو و اسلاید اول هیروست. */}
      <link
        rel="preload"
        as="image"
        href="/images/hero/1.webp"
        type="image/webp"
        fetchPriority="high"
      />
      <HomeClient
        initialPlacements={initialPlacements}
        initialFeatured={featured.status === 'fulfilled' ? featured.value : EMPTY_FEATURED}
        servicesSlot={<ServicesSection />}
        exploreSlot={<ExploreStrip />}
      />
    </>
  )
}
