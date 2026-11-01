import 'server-only'
import { unstable_cache } from 'next/cache'
import { sb, rpc } from './finance/db'
import { liveChannels } from './streaming/public'
import type { RankingsStructure } from './rankings-store'

/* ─────────────────────────────────────────────────────────────
   داده‌ی سه کارتِ هیروی صفحه‌ی اصلی — خوانده‌شده روی سرور.

   هر کارت داده‌ی واقعیِ همین لحظه است، نه متنِ تبلیغاتی:
     ۱) پخشِ زنده‌ی پربیننده (اگر نبود ⟵ تازه‌ترین باشگاه، از page.tsx)
     ۲) نزدیک‌ترین مسابقه‌ای که هنوز شروع نشده
     ۳) سرِ جدولِ رنکینگ

   نبودِ هرکدام یعنی همان کارت نمی‌آید — هیچ عددِ ساختگی‌ای جایش
   نمی‌نشیند. خطای یکی هم بقیه را نمی‌برد (allSettled).

   ── چرا کش ──
   این سه خواندن روی **هر** بازدیدِ صفحه‌ی اول بودند. صفحه خودش ISRِ
   ۶۰ ثانیه است، ولی بازسازیِ ISR هم همین کوئری‌ها را می‌زند؛ کش
   یعنی در اوجِ ترافیک هم دقیقه‌ای چند کوئری، نه به ازای هر بازدید.
   ───────────────────────────────────────────────────────────── */

export interface HeroLive {
  id: string
  title: string
  clubName: string
  viewers: number
  startedAt: string | null
}

export interface HeroTournament {
  id: string
  title: string
  /** روزِ مانده تا شروع؛ ۰ یعنی امروز */
  daysLeft: number
  /** null یعنی شمارِ جا خوانده نشد — کارت بی‌عدد می‌آید، نه «پر» */
  taken: number | null
  max: number
  /** open: ثبت‌نامِ باز · upcoming: پیشِ رو · ongoing: در جریان · done: آخرین برگزارشده */
  phase: 'open' | 'upcoming' | 'ongoing' | 'done'
}

export interface HeroRanking {
  label: string
  players: { rank: number; name: string; points: number }[]
}

export interface HeroData {
  live: HeroLive | null
  tournament: HeroTournament | null
  ranking: HeroRanking | null
}

export const EMPTY_HERO: HeroData = { live: null, tournament: null, ranking: null }

async function loadLive(): Promise<HeroLive | null> {
  /* فهرست از قبل بر اساسِ بیننده مرتب است و فقط کانالی که تصویرش واقعاً
     می‌رسد را می‌دهد — کارتِ «زنده»ی بی‌تصویر ساخته نمی‌شود.
     ⚠️ liveChannels پیش از خواندن sweepStale می‌زند (پخشِ ماندهِ بی‌تصویر
     را می‌بندد) — همان کارِ صفحه‌ی /live، و عمدی */
  const top = (await liveChannels())[0]
  if (!top) return null
  return { id: top.id, title: top.title, clubName: top.club.name, viewers: top.viewers, startedAt: top.startedAt }
}

const DAY = 86_400_000

async function loadTournament(now = Date.now()): Promise<HeroTournament | null> {
  /* مستقیم از جدول، نه listPublicTournaments: آن تابع پیش از خواندن
     وضعیت‌ها را جلو می‌برد (نوشتن). شمارِ جا هم مستقیم از RPC، نه
     seatsLeft که پیش از آن رزروهای معلق را منقضی می‌کند و خطا را صفر
     برمی‌گرداند — صفر یعنی «پر»، یعنی ادعای غلط */
  const iso = new Date(now).toISOString()
  type Row = { id: string; title: string; status: string; max_players: number; starts_at: string }
  const cols = 'id,title,status,max_players,starts_at'
  const [ahead, recent] = await Promise.all([
    sb().from('tournaments').select(cols)
      .in('status', ['registration_open', 'published', 'registration_closed'])
      .gte('starts_at', iso).order('starts_at', { ascending: true }).limit(6),
    /* وقتی هیچ مسابقه‌ای در راه نیست، در جریان یا آخرین برگزارشده —
       داده‌ی واقعی، نه کارتِ خالی */
    sb().from('tournaments').select(cols)
      .in('status', ['ongoing', 'completed'])
      .lte('starts_at', iso).order('starts_at', { ascending: false }).limit(4),
  ])
  if (ahead.error || recent.error) {
    console.error('[home-hero] tournament:', (ahead.error ?? recent.error)?.message)
    return null
  }
  const up = (ahead.data ?? []) as Row[]
  const past = (recent.data ?? []) as Row[]
  /* ثبت‌نامِ باز اول — کاری که بازدیدکننده همین حالا می‌تواند بکند */
  const pick = up.find(r => r.status === 'registration_open') ?? up[0]
    ?? past.find(r => r.status === 'ongoing') ?? past[0]
  if (!pick) return null
  const seats = await rpc<number>('bh_tournament_seats_left', { p_tournament: pick.id })
  const left = seats.error || seats.data == null ? null : Number(seats.data)
  if (left === null) console.error('[home-hero] seats:', seats.error?.message ?? 'no data')
  const phase: HeroTournament['phase'] =
    pick.status === 'registration_open' ? 'open'
      : pick.status === 'ongoing' ? 'ongoing'
        : pick.status === 'completed' ? 'done' : 'upcoming'
  return {
    id: pick.id,
    title: pick.title,
    daysLeft: Math.max(0, Math.ceil((Date.parse(pick.starts_at) - now) / DAY)),
    taken: left === null ? null : Math.max(0, pick.max_players - left),
    max: pick.max_players,
    phase,
  }
}

/* ترتیبِ ترجیح — همان پیش‌فرضِ صفحه‌ی /ranking */
const BOARDS: [sport: string, sportLabel: string, gender: string, category: string][] = [
  ['snooker', 'اسنوکر', 'آقایان', 'دسته برتر'],
  ['snooker', 'اسنوکر', 'بانوان', 'دسته برتر'],
  ['pocket', 'پاکت', 'آقایان', 'دسته برتر'],
]

async function loadRanking(): Promise<HeroRanking | null> {
  const { data, error } = await sb().from('app_settings').select('value').eq('key', 'rankings_board').maybeSingle()
  if (error) { console.error('[home-hero] ranking:', error.message); return null }
  const board = (data?.value ?? null) as RankingsStructure | null
  if (!board) return null
  for (const [sport, sportLabel, gender, category] of BOARDS) {
    const rows = (board[sport]?.[gender]?.[category] ?? [])
      .filter(p => p.name?.trim() && Number(p.points) > 0)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
    if (rows.length) {
      return {
        label: `رنکینگِ ${sportLabel}، ${gender} — ${category}`,
        players: rows.map(p => ({ rank: p.rank, name: p.name.trim(), points: Number(p.points) })),
      }
    }
  }
  return null
}

async function loadHeroDataUncached(): Promise<HeroData> {
  const [live, tournament, ranking] = await Promise.allSettled([loadLive(), loadTournament(), loadRanking()])
  const val = <T>(r: PromiseSettledResult<T | null>): T | null => {
    if (r.status === 'fulfilled') return r.value
    console.error('[home-hero]', r.reason)
    return null
  }
  return { live: val(live), tournament: val(tournament), ranking: val(ranking) }
}

/* ۳۰ ثانیه: پخشِ زنده تندتر از بقیه عوض می‌شود، ولی صفحه خودش ۶۰
   ثانیه ISR است — کمتر از این سودی ندارد */
export const loadHeroData = unstable_cache(loadHeroDataUncached, ['home-hero'], { revalidate: 30, tags: ['home-hero'] })
