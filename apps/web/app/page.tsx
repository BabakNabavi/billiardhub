import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { buildLivePlacements } from '../lib/ads/live-payload'
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

  try {
    const live = await buildLivePlacements()
    initialPlacements = Object.fromEntries(
      KEYS.map(k => [k, toPlacementState(live[k] as PlacementPayload | undefined)]),
    ) as Partial<Record<PlacementKey, PlacementState>>
  } catch {
    /* بی‌صدا — کلاینت خودش می‌خواند */
  }

  return <HomeClient initialPlacements={initialPlacements} />
}
