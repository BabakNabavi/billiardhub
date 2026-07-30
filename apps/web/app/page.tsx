import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { buildLivePlacements } from '../lib/ads/live-payload'
import { loadHomeFeatured } from '../lib/home-featured'
import { EMPTY_FEATURED } from '../lib/home-types'
import ServicesSection from '../components/home/ServicesSection'
/* از ماژولِ مشترک، نه از AdSlot که 'use client' است — صداکردنِ تابعِ
   یک فایلِ کلاینت از Server Component همان چیزی بود که صفحه را ۵۰۰ کرد */
import { toPlacementState, type PlacementKey, type PlacementState, type PlacementPayload } from '../lib/ads/placement-state'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ صفحه‌ی اصلی.

   خودِ صفحه یک Client Component بزرگ است و همان‌جا می‌ماند — بازنویسیِ
   ۲۱۷۳ خط برای SSR نه لازم است نه امن.

   کاری که این لایه می‌کند فقط یک چیز است: سه جایگاهِ اصلی (محصولاتِ
   ویژه، باشگاه‌های پیشنهادی، فروشگاه‌های تجهیزات) را روی سرور می‌خواند
   و به‌عنوان مقدارِ اولیه پایین می‌فرستد.

   پیش از این، هر سه فقط بعد از اجرای جاوااسکریپت پر می‌شدند؛ یعنی
   خزنده‌ها هیچ محتوایی نمی‌دیدند و کاربر هم یک پرشِ چیدمان داشت.

   اگر خواندن شکست بخورد چیزی خراب نمی‌شود: کلاینت مثل قبل خودش
   می‌خواند. این لایه فقط رندرِ اول را بهتر می‌کند، جایگزینِ آن نیست.
   ───────────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'بیلیارد هاب | پلتفرم جامع و هوشمند بیلیارد',
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

     وقتی این داده را با useEffect گرفتم، کارت‌ها از HTMLِ اولیه بیرون
     افتادند و همان مشکلی که این لایه حل کرده بود برگشت — خزنده چیزی
     نمی‌دید و کاربر یک پرشِ چیدمان داشت. */
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
    <HomeClient
      initialPlacements={initialPlacements}
      initialFeatured={featured.status === 'fulfilled' ? featured.value : EMPTY_FEATURED}
      servicesSlot={<ServicesSection />}
    />
  )
}
