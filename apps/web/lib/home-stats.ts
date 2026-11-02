import 'server-only'
import { unstable_cache } from 'next/cache'
import { sb } from './finance/db'
import { notExpiredOr } from './market/live'
import { readRankings } from './rankings/server-read'

/* ─────────────────────────────────────────────────────────────
   آمارِ «بیلیارد هاب در یک نگاه» — فقط عددهای واقعی، و فقط وقتی قوی‌اند.

   ⚠️ خواستِ مالک (۱۰ آبانِ ۱۴۰۵): سایت تازه است و عددِ کوچک («۱ باشگاه»)
   اثرِ برعکس دارد. پس هر شاخص یک کفِ نمایش دارد؛ زیرِ کف اصلاً نمی‌آید و
   وقتی رسید خودش ظاهر می‌شود. اگر کمتر از دو شاخص به کف برسند، بخش همان
   کارت‌های کاوش می‌ماند (ExploreStrip).
   ───────────────────────────────────────────────────────────── */

export interface HomeStat { key: string; value: number; label: string; href: string }

interface Metric { key: string; label: string; href: string; min: number; read: () => Promise<number> }

const headCount = (table: string) => sb().from(table).select('id', { count: 'exact', head: true })
type HeadQuery = ReturnType<typeof headCount>

async function count(table: string, apply: (q: HeadQuery) => HeadQuery): Promise<number> {
  const { count: n, error } = await apply(headCount(table))
  if (error) throw new Error(`[home-stats] ${table}: ${error.message}`)
  return n ?? 0
}

/* ترتیب = اولویتِ نمایش؛ حداکثر چهار تا */
const METRICS: Metric[] = [
  {
    key: 'players', label: 'بازیکن رنکینگ‌شده', href: '/ranking', min: 50,
    read: async () => {
      const r = await readRankings()
      if (!r?.board) return 0
      let n = 0
      for (const g of Object.values(r.board)) for (const c of Object.values(g)) for (const rows of Object.values(c))
        n += rows.filter(p => p.name?.trim()).length
      return n
    },
  },
  {
    key: 'ads', label: 'آگهی فعال در بیلیارد بازار', href: '/shop', min: 20,
    read: () => count('products', q => q.eq('status', 'active').or(notExpiredOr())),
  },
  /* «مرحله‌ی رنکینگ» عمداً نیست: شماره‌گذاریِ هر دسته جداست (بانوان ۳۰ تا ۳۴،
     آقایان ۲۵ تا ۲۹) و بزرگ‌ترین عدد ادعای نادرستی می‌ساخت */
  {
    key: 'clubs', label: 'باشگاه فعال', href: '/clubs', min: 10,
    /* نمایشی‌ها (is_demo) در آمار شمرده نمی‌شوند — عددِ واقعی */
    read: () => count('clubs', q => q.eq('isActive', true).in('verificationStatus', ['verified', 'approved']).not('is_demo', 'is', true)),
  },
  {
    key: 'tournaments', label: 'مسابقه برگزارشده و پیش رو', href: '/tournaments', min: 10,
    read: () => count('tournaments', q => q.in('status', ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'])),
  },
]

export const MAX_STATS = 4
/* دو عددِ قوی بهتر از سه عددی که یکی‌اش ضعیف یا مبهم است */
export const MIN_STATS = 2

async function loadHomeStatsUncached(): Promise<HomeStat[]> {
  const values = await Promise.allSettled(METRICS.map(m => m.read()))
  const out: HomeStat[] = []
  METRICS.forEach((m, i) => {
    const v = values[i]
    if (v?.status === 'fulfilled' && v.value >= m.min) out.push({ key: m.key, value: v.value, label: m.label, href: m.href })
    else if (v?.status === 'rejected') console.error('[home-stats]', m.key, v.reason)
  })
  return out.slice(0, MAX_STATS)
}

/* ۵ دقیقه — این عددها کند عوض می‌شوند */
export const loadHomeStats = unstable_cache(loadHomeStatsUncached, ['home-stats'], { revalidate: 300 })
