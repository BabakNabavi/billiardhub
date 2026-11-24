/* ─────────────────────────────────────────────────────────────
   استخرِ خانه‌ی /media برای ارسال همراهِ HTML — آذرِ ۱۴۰۵.

   صفحه تا امروز پس از سوارشدن سه درخواست می‌فرستاد (ویژه، تازه‌ترین‌ها،
   پربازدیدها) و بزرگ‌ترین تصویر ۲٫۷ ثانیه منتظرِ همین‌ها می‌ماند. حالا همان سه
   فراخوانیِ listPublic (همان که GET /api/media می‌کند) روی سرور انجام و ۳۰ ثانیه
   کش می‌شود (همان max-ageِ پاسخِ API). ترتیب را همچنان مرورگر با سابقه‌ی تماشای
   همان گوشی می‌سازد، پس چیزی جلوی چشم جابه‌جا نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import 'server-only'
import { unstable_cache } from 'next/cache'
import { listPublic } from './server'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'
import type { MediaHomeSeed } from '@/lib/media-user'

const loadSeed = unstable_cache(async (): Promise<MediaHomeSeed> => {
  const [feat, latest, pop] = await Promise.all([
    listPublic({ featuredOnly: true, limit: 1 }),
    listPublic({ limit: 48 }),
    listPublic({ sort: 'popular', limit: 24 }),
  ])
  /* همان شکلِ JSONِ پاسخِ API */
  return JSON.parse(JSON.stringify({ feat: feat.items, latest, pop: pop.items })) as MediaHomeSeed
}, ['media-home-seed'], { revalidate: 30 })

/** null یعنی سرور نتوانست — صفحه مثلِ قبل خودش می‌گیرد */
export async function loadMediaHomeSeed(): Promise<MediaHomeSeed | null> {
  try {
    const r = await withTimeout(loadSeed(), 2000)
    return r === TIMED_OUT ? null : r
  } catch (e) {
    console.error('[media] home seed', e instanceof Error ? e.message : e)
    return null
  }
}
