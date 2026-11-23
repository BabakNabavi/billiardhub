import { ClubsClient } from './ClubsClient'
import { queryClubs } from '@/lib/clubs/public-list'
import { type Club } from '@/lib/clubs-data'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* رندرِ سرورِ فهرستِ باشگاه‌ها (آذرِ ۱۴۰۵): فهرستِ پیش‌فرض همراهِ HTML — کارت‌ها
   و عکسِ اول بی‌انتظار برای JS و درخواستِ جدا. همان تابعی که GET /api/clubs
   می‌خواند.

   ISRِ ۶۰ ثانیه، نه رندر در هر بازدید: فهرست برای همه یکی است و سرورِ ۲ هسته‌ای
   همان سرورِ دیتابیس است (صفحه‌ی ایستا ~۱۲۰ درخواست در ثانیه، پویا ~۱۰ — یادداشتِ
   lib/home-featured). باشگاهِ تازه حداکثر یک دقیقه بعد دیده می‌شود؛ تغییرِ فیلتر
   همان لحظه از API تازه می‌خواند. */
export const revalidate = 60

/* بیلد: خطا ⟵ null (مرورگر مثلِ قبل خودش می‌گیرد، بیلد نمی‌شکند). اجرا: دوباره
   پرتاب ⟵ بازسازیِ ISR شکست می‌خورد و نسخه‌ی سالمِ قبلی سرو می‌ماند. */
const atBuild = process.env.NEXT_PHASE === 'phase-production-build'

export default async function ClubsPage() {
  let clubs: Club[] | null = null
  try {
    const r = await withTimeout(queryClubs(new URLSearchParams(), { isAdminReq: false, canSeePrivate: false }), 2500)
    if (r === TIMED_OUT) throw new Error('[clubs] initial list timed out')
    clubs = r as unknown as Club[]
  } catch (e) {
    console.error('[clubs] initial list', e instanceof Error ? e.message : e)
    if (!atBuild) throw e
  }
  return <ClubsClient initialClubs={clubs} />
}
