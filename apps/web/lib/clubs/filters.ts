/* ─────────────────────────────────────────────────────────────
   فیلتر و مرتب‌سازیِ فهرستِ باشگاه‌ها — منطقِ خالص، بدونِ React.

   ── دو مرتب‌سازی که کار نمی‌کردند ──
   · «بیشترین میز» روی `totalTables` مرتب می‌کرد؛ API فهرست این فیلد را
     نمی‌فرستد، پس ترتیب هیچ‌وقت عوض نمی‌شد. حالا از `tableSummary` —
     همان شمارشی که روی کارت دیده می‌شود.
   · «بهترین امتیاز» پیش‌فرض بود ولی امتیاز هم در پاسخِ فهرست نیست.
     گزینه‌ای که کاری نمی‌کند، فقط وقتی پیشنهاد می‌شود که دست‌کم یک
     باشگاه امتیاز داشته باشد.
   ───────────────────────────────────────────────────────────── */

import type { Club } from '../clubs-data'
import { tableSummary } from './tables'

/** کلیدها همان ستون‌هایی‌اند که API به‌عنوانِ فیلتر می‌پذیرد (`?snookerTables=1`) */
export type TableFilterKey = 'snookerTables' | 'pocketTables' | 'highballTables' | 'vipSnookerTables'
export const TABLE_FILTERS: { key: TableFilterKey; label: string }[] = [
  { key: 'snookerTables', label: 'اسنوکر' },
  { key: 'pocketTables', label: 'پاکت' },
  { key: 'highballTables', label: 'هی‌بال' },
  { key: 'vipSnookerTables', label: 'اسنوکر VIP' },
]

export type AmenityKey = 'hasCafe' | 'hasParking' | 'hasWifi' | 'hasProfessionalCoach' | 'playstations'
/** `playstations` عدد است، بقیه بولی؛ هر دو با «بیشتر از صفر» سنجیده می‌شوند */
export const hasAmenity = (club: Club, key: AmenityKey): boolean => Number(club[key]) > 0

export interface ClubFilters {
  types: TableFilterKey[]
  amens: AmenityKey[]
  onlyOpen: boolean
  onlyVerified: boolean
  onlyTournament: boolean
}

export const NO_FILTERS: ClubFilters = { types: [], amens: [], onlyOpen: false, onlyVerified: false, onlyTournament: false }

export const countFilters = (f: ClubFilters): number =>
  f.types.length + f.amens.length + Number(f.onlyOpen) + Number(f.onlyVerified) + Number(f.onlyTournament)

/** همان پاک‌سازیِ `clean()`ِ API، به‌اضافه‌ی حروفِ کوچک — سرور با `ilike` جست‌وجو
 *  می‌کند. اگر این دو یکی نباشند، سرور «Royal» را برمی‌گرداند و کلاینت با
 *  `includes`ِ حساس به حروف حذفش می‌کند: «باشگاهی پیدا نشد». */
const norm = (v: unknown): string =>
  String(v ?? '').replace(/[,%*()"'\\]/g, '').trim().toLocaleLowerCase('fa')

export function filterClubs(clubs: Club[], f: ClubFilters, search: string, hasOpenTournament: (clubId: string) => boolean): Club[] {
  const q = norm(search)
  return clubs.filter(c => {
    if (q && ![c.name, c.city, c.address].some(v => norm(v).includes(q))) return false
    if (f.onlyOpen && c.isOpen !== true) return false
    if (f.onlyVerified && !c.isVerified) return false
    if (f.onlyTournament && !hasOpenTournament(c.id)) return false
    if (!f.types.every(t => Number(c[t]) > 0)) return false
    if (!f.amens.every(a => hasAmenity(c, a))) return false
    return true
  })
}

export type SortKey = 'members' | 'tables' | 'distance' | 'rating'
export const SORT_LABEL: Record<SortKey, string> = {
  members: 'بیشترین عضو',
  tables: 'بیشترین میز',
  distance: 'نزدیک‌ترین',
  rating: 'بهترین امتیاز',
}

/** گزینه‌هایی که روی همین داده واقعاً ترتیب را عوض می‌کنند */
export function availableSorts(clubs: Club[], hasLocation: boolean): SortKey[] {
  const keys: SortKey[] = ['members', 'tables']
  if (hasLocation) keys.unshift('distance')
  if (clubs.some(c => typeof c.rating === 'number' && c.rating > 0)) keys.push('rating')
  return keys
}

export function sortClubs(clubs: Club[], key: SortKey): Club[] {
  const by: Record<SortKey, (c: Club) => number> = {
    members: c => -(c.memberCount ?? 0),
    tables: c => -tableSummary(c).total,
    /* بی‌مختصات‌ها آخر */
    distance: c => c.distance ?? Number.POSITIVE_INFINITY,
    rating: c => -(c.rating ?? 0),
  }
  const f = by[key]
  /* دو بی‌مختصات: Infinity − Infinity = NaN، که ترتیبِ sort را نامعین می‌کند */
  return [...clubs].sort((a, b) => { const d = f(a) - f(b); return Number.isNaN(d) ? 0 : d })
}
