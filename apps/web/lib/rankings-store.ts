/* ─────────────────────────────────────────────────────────────
   Rankings store — پلِ بینِ پنل ادمین (/admin/rankings) و
   صفحه‌ی رنکینگ سایت (/ranking). localStorage، ساختار:
   sport → gender → category → RankingPlayer[]
   ظرفیت‌ها: اسنوکر دسته برتر ۳۲، دسته یک ۱۲۸؛ پاکت ۳۲.
   ───────────────────────────────────────────────────────────── */

export interface RankingPlayer {
  rank: number
  name: string
  city: string
  points: number
  previousRank?: number
  userId?: string
}

export type RankingsStructure = Record<string, Record<string, Record<string, RankingPlayer[]>>>

const KEY = 'bh_rankings'

/* ظرفیتِ هر دسته */
export const CATEGORY_SIZES: Record<string, Record<string, number>> = {
  snooker: { 'دسته برتر': 32, 'دسته یک': 128, 'زیر ۲۱ سال': 32, 'پیشکسوتان': 32 },
  pocket:  { 'دسته برتر': 32, 'دسته یک': 32,  'زیر ۲۱ سال': 32, 'پیشکسوتان': 32 },
}

export function categorySize(sport: string, category: string): number {
  return CATEGORY_SIZES[sport]?.[category] ?? 32
}

const CATS: Record<string, Record<string, string[]>> = {
  snooker: {
    آقایان: ['دسته برتر', 'دسته یک', 'زیر ۲۱ سال', 'پیشکسوتان'],
    بانوان: ['دسته برتر', 'زیر ۲۱ سال', 'پیشکسوتان'],
  },
  pocket: {
    آقایان: ['دسته برتر', 'دسته یک', 'زیر ۲۱ سال', 'پیشکسوتان'],
    بانوان: ['دسته برتر', 'زیر ۲۱ سال', 'پیشکسوتان'],
  },
}

function emptyRows(sport: string, category: string): RankingPlayer[] {
  return Array.from({ length: categorySize(sport, category) }, (_, i) => ({ rank: i + 1, name: '', city: '', points: 0 }))
}

export function buildEmptyRankings(): RankingsStructure {
  const out: RankingsStructure = {}
  for (const [sport, genders] of Object.entries(CATS)) {
    out[sport] = {}
    for (const [gender, cats] of Object.entries(genders)) {
      out[sport][gender] = {}
      for (const cat of cats) out[sport][gender][cat] = emptyRows(sport, cat)
    }
  }
  return out
}

/* ساختارِ ذخیره‌شده را روی ساختارِ خالی سوار می‌کند تا اندازه‌ها همیشه درست باشند */
export function getStoredRankings(): RankingsStructure {
  const base = buildEmptyRankings()
  if (typeof window === 'undefined') return base
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RankingsStructure | null
    if (!raw) return base
    for (const sport of Object.keys(base)) {
      const genders = base[sport]!
      for (const gender of Object.keys(genders)) {
        const cats = genders[gender]!
        for (const cat of Object.keys(cats)) {
          const stored = raw[sport]?.[gender]?.[cat]
          if (Array.isArray(stored)) {
            const size = categorySize(sport, cat)
            const rows = cats[cat]!
            for (let i = 0; i < size; i++) {
              const s = stored[i]
              if (s) rows[i] = { ...rows[i]!, ...s, rank: i + 1 }
            }
          }
        }
      }
    }
    return base
  } catch { return base }
}

export function saveRankings(data: RankingsStructure) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

/* بازیکنانِ واقعاً واردشده‌ی یک دسته (نامِ خالی حذف می‌شود) */
export function getCategoryPlayers(sport: string, gender: string, category: string): RankingPlayer[] {
  const all = getStoredRankings()
  return (all[sport]?.[gender]?.[category] ?? []).filter(p => p.name.trim() !== '')
}
