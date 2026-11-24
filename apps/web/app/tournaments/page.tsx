import { TournamentsClient } from './TournamentsClient'
import { loadPublicTournaments } from '@/lib/tournaments/public-list'
import { preload } from 'react-dom'

/* ─────────────────────────────────────────────────────────────
   پوسته‌ی سرورِ فهرستِ مسابقات — همان الگوی باشگاه و رنکینگ.

   HTMLِ اول تا امروز فقط تب‌ها و شمارنده‌های صفر بود (۲۱۴ نویسه)؛ حالا
   خودِ مسابقه‌ها را دارد. خطا ⟵ رفتارِ قبلی (مرورگر خودش می‌خواند).
   ───────────────────────────────────────────────────────────── */

/* ISRِ ۶۰ ثانیه: ظرفیتِ باقی‌مانده حداکثر یک دقیقه کهنه است و درخواستِ
   پس از بارگذاری همان لحظه تازه‌اش می‌کند */
export const revalidate = 60

/* بیلد: خطا ⟵ null (صفحه مثلِ قبل خودش می‌خواند، بیلد نمی‌شکند). اجرا: دوباره
   پرتاب ⟵ بازسازیِ ISR شکست می‌خورد و نسخه‌ی سالمِ قبلی سرو می‌ماند. */
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

export default async function TournamentsListPage() {
  /* عکسِ هیرو پسِ‌زمینه‌ی CSS است و مرورگر تا خواندنِ استایل پیدایش نمی‌کرد
     (Lighthouse: ۲ ثانیه «تأخیرِ شروع» برای بزرگ‌ترین عنصرِ صفحه). صفحه ISR است،
     پس این سرنخ در headِ همان HTML می‌نشیند. */
  preload('/images/tournaments/hero.svg', { as: 'image', fetchPriority: 'high' })
  const initialRows = await loadPublicTournaments().catch((e: unknown) => {
    console.error('[tournaments] initial load', e)
    if (!atBuild) throw e
    return null
  })
  return <TournamentsClient initialRows={initialRows} />
}
