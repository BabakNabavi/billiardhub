import { RankingClient } from './RankingClient'
import { loadInitialRankings } from '@/lib/rankings/server-read'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ رنکینگ — همان الگوی صفحه‌ی باشگاه.

   خودِ صفحه کلاینتی می‌ماند؛ این لایه فقط جدولِ پیش‌فرض (اسنوکر، آقایان،
   دسته برتر) را روی سرور می‌خواند تا HTMLِ اول نام و امتیازِ بازیکنان را
   داشته باشد — پیش از این ۱۳۵ نویسه و بی‌هیچ نامی بود. بقیه‌ی جدول‌ها مثلِ
   قبل پس از بارگذاری می‌آیند.

   خطا بی‌خطر است: initial نمی‌رسد ⟵ رفتارِ قبلی (مرورگر خودش می‌خواند).
   ───────────────────────────────────────────────────────────── */

/* ISRِ ۶۰ ثانیه — هم‌قدِ کشِ داده و Cache-Controlِ /api/rankings */
export const revalidate = 60

/* بیلد: خطا ⟵ null (صفحه مثلِ قبل خودش می‌خواند، بیلد نمی‌شکند). اجرا: دوباره
   پرتاب ⟵ بازسازیِ ISR شکست می‌خورد و نسخه‌ی سالمِ قبلی سرو می‌ماند. */
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

export default async function RankingPage() {
  const initial = await loadInitialRankings().catch((e: unknown) => {
    console.error('[ranking] initial load', e)
    if (!atBuild) throw e
    return null
  })
  return <RankingClient initial={initial} />
}
