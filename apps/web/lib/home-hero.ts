import 'server-only'
import { unstable_cache } from 'next/cache'
import { sb, rpc } from './finance/db'
import { liveChannels } from './streaming/public'
import type { RankingsStructure } from './rankings-store'
/* شکلش در hero-types (کنارِ کارتِ کلاینتی که می‌خواندش)، تا هیچ فایلِ
   کلاینتی حتی برای type به این ماژولِ server-only وابسته نباشد */
import type { HeroRankingBoard } from '@/components/home/hero/hero-types'

export type { HeroRankingBoard }

/* ─────────────────────────────────────────────────────────────
   داده‌ی سه کارتِ هیروی صفحه‌ی اصلی — خوانده‌شده روی سرور.

   هر کارت داده‌ی واقعیِ همین لحظه است، نه متنِ تبلیغاتی:
     ۱) پخشِ زنده‌ی پربیننده (اگر نبود ⟵ تازه‌ترین باشگاه، از page.tsx)
     ۲) مسابقه‌ی پیشِ رو یا در جریان (اگر نبود ⟵ تازه‌ترین آگهی‌های بازار، از page.tsx)
     ۳) چهار نفرِ اولِ چهار جدولِ رنکینگ — کارت بینشان می‌چرخد

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
  /** open: ثبت‌نامِ باز · upcoming: پیشِ رو · ongoing: در جریان */
  phase: 'open' | 'upcoming' | 'ongoing'
}


export interface HeroData {
  live: HeroLive | null
  tournament: HeroTournament | null
  /** خالی یعنی کارتِ رنکینگ نمی‌آید */
  ranking: HeroRankingBoard[]
}

export const EMPTY_HERO: HeroData = { live: null, tournament: null, ranking: [] }

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
  /* «آخرین برگزارشده» عمداً نیست (خواستِ مالک): کارتی که «برگزار شد» می‌گوید
     خبرِ کهنه است؛ جایش آگهی‌های تازه‌ی بازار می‌آید */
  const [ahead, recent] = await Promise.all([
    sb().from('tournaments').select(cols)
      .in('status', ['registration_open', 'published', 'registration_closed'])
      .gte('starts_at', iso).order('starts_at', { ascending: true }).limit(6),
    sb().from('tournaments').select(cols)
      .eq('status', 'ongoing')
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
    ?? past[0]
  if (!pick) return null
  const seats = await rpc<number>('bh_tournament_seats_left', { p_tournament: pick.id })
  const left = seats.error || seats.data == null ? null : Number(seats.data)
  if (left === null) console.error('[home-hero] seats:', seats.error?.message ?? 'no data')
  const phase: HeroTournament['phase'] =
    pick.status === 'registration_open' ? 'open'
      : pick.status === 'ongoing' ? 'ongoing' : 'upcoming'
  return {
    id: pick.id,
    title: pick.title,
    daysLeft: Math.max(0, Math.ceil((Date.parse(pick.starts_at) - now) / DAY)),
    taken: left === null ? null : Math.max(0, pick.max_players - left),
    max: pick.max_players,
    phase,
  }
}

/* ترتیبِ چرخش (خواستِ مالک): اسنوکر آقایان ⟵ اسنوکر بانوان ⟵ (دسته یکِ آقایان) ⟵ پاکت آقایان ⟵ پاکت بانوان.
   جدولِ خالی از چرخه بیرون می‌ماند.

   ── همه‌ی ۱۴ جدولِ ساختار (آذرِ ۱۴۰۵) ──
   پیش‌تر فقط ۷ جدول اینجا بود و «زیر ۲۱ سال» (هر دو جنس، هر دو رشته)، پیشکسوتانِ
   بانوان و پیشکسوتانِ پاکت هرگز در کارتِ هیرو نمی‌آمدند، حتی با داده‌ی کامل
   (اسنوکرِ آقایانِ زیر ۲۱ سال ۲۹۶ نفر دارد). حالا همه‌ی دسته‌های `CATS` در
   `lib/rankings-store` هستند. جدولِ بی‌بازیکن خودکار کنار می‌رود (پایینِ
   loadRanking)، پس اضافه‌کردنِ دسته‌ی خالی هزینه‌ای ندارد. ترتیبِ مالک برای
   هفت جدولِ قبلی دست‌نخورده؛ تازه‌ها بعدِ هم‌رشته‌ی خودشان آمده‌اند. */
const BOARDS: [sport: string, sportLabel: string, gender: string, category: string][] = [
  ['snooker', 'اسنوکر', 'آقایان', 'دسته برتر'],
  ['snooker', 'اسنوکر', 'بانوان', 'دسته برتر'],
  ['snooker', 'اسنوکر', 'آقایان', 'دسته یک'],
  ['snooker', 'اسنوکر', 'آقایان', 'زیر ۲۱ سال'],
  ['snooker', 'اسنوکر', 'بانوان', 'زیر ۲۱ سال'],
  ['snooker', 'اسنوکر', 'آقایان', 'پیشکسوتان'],
  ['snooker', 'اسنوکر', 'بانوان', 'پیشکسوتان'],
  ['pocket', 'پاکت بیلیارد', 'آقایان', 'دسته برتر'],
  /* تنها جدولِ پاکتِ آقایان که داده دارد (آبانِ ۱۴۰۵) — جای «پاکت آقایان» در ترتیبِ مالک */
  ['pocket', 'پاکت بیلیارد', 'آقایان', 'دسته یک'],
  ['pocket', 'پاکت بیلیارد', 'آقایان', 'زیر ۲۱ سال'],
  ['pocket', 'پاکت بیلیارد', 'آقایان', 'پیشکسوتان'],
  ['pocket', 'پاکت بیلیارد', 'بانوان', 'دسته برتر'],
  ['pocket', 'پاکت بیلیارد', 'بانوان', 'زیر ۲۱ سال'],
  ['pocket', 'پاکت بیلیارد', 'بانوان', 'پیشکسوتان'],
]
const TOP = 4

async function loadRanking(): Promise<HeroRankingBoard[]> {
  const { data, error } = await sb().from('app_settings').select('value').eq('key', 'rankings_board').maybeSingle()
  if (error) { console.error('[home-hero] ranking:', error.message); return [] }
  const board = (data?.value ?? null) as RankingsStructure | null
  if (!board) return []
  const out: HeroRankingBoard[] = []
  for (const [sport, sportLabel, gender, category] of BOARDS) {
    const rows = (board[sport]?.[gender]?.[category] ?? [])
      .filter(p => p.name?.trim() && Number(p.points) > 0)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, TOP)
    if (rows.length) {
      out.push({
        sport, gender, category,
        label: `${sportLabel}، ${gender} — ${category}`,
        players: rows.map(p => ({ rank: p.rank, name: p.name.trim(), points: Number(p.points) })),
      })
    }
  }
  return out
}

async function loadHeroDataUncached(): Promise<HeroData> {
  const [live, tournament, ranking] = await Promise.allSettled([loadLive(), loadTournament(), loadRanking()])
  const val = <T>(r: PromiseSettledResult<T | null>): T | null => {
    if (r.status === 'fulfilled') return r.value
    console.error('[home-hero]', r.reason)
    return null
  }
  return { live: val(live), tournament: val(tournament), ranking: val(ranking) ?? [] }
}

/* ۳۰ ثانیه: پخشِ زنده تندتر از بقیه عوض می‌شود، ولی صفحه خودش ۶۰
   ثانیه ISR است — کمتر از این سودی ندارد */
export const loadHeroData = unstable_cache(loadHeroDataUncached, ['home-hero'], { revalidate: 30, tags: ['home-hero'] })
