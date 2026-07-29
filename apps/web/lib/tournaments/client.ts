'use client'

/* ─────────────────────────────────────────────────────────────
   پلِ مسابقات به سرور — برای صفحه‌های عمومی.

   شش صفحه‌ی مسابقات از `SAMPLE_TOURNAMENTS` (آرایه‌ی هاردکد) می‌خواندند،
   یعنی کاربر مسابقه‌های ساختگی می‌دید و هیچ‌کدام قابلِ ثبت‌نامِ واقعی
   نبودند.

   این‌جا داده‌ی واقعی خوانده و به **همان شکلی** نگاشت می‌شود که صفحه‌ها
   از قبل انتظار دارند (`Tournament`). این‌طور شش صفحه بدونِ بازنویسی
   وصل می‌شوند و ریسکِ شکستنِ چیدمان صفر است.
   ───────────────────────────────────────────────────────────── */

import type { Tournament, GameType, TournamentStatus } from '../mock-tournaments'

export interface DbTournament {
  id: string
  club_id: string
  title: string
  description?: string | null
  discipline?: string
  max_players: number
  entry_fee: number
  prize?: string | null
  venue?: string | null
  province?: string | null
  city?: string | null
  starts_at?: string | null
  registration_ends_at?: string | null
  status: string
  cover_url?: string | null
  seatsLeft?: number
}

/* وضعیتِ سرور ← وضعیتی که صفحه‌ها می‌شناسند */
const STATUS: Record<string, TournamentStatus> = {
  draft: 'upcoming',
  published: 'upcoming',
  registration_open: 'registration_open',
  registration_closed: 'bracket_ready',
  ongoing: 'live',
  completed: 'finished',
  cancelled: 'finished',
}

/* رشته‌ی دیتابیس ← نوعِ بازیِ صفحه‌ها.

   واژگانِ دو طرف یکی نیست: دیتابیس با اصطلاحِ ایرانی کار می‌کند
   (pocket / highball) و این صفحه‌ها با اصطلاحِ بین‌المللی (8ball /
   9ball). هرچیزِ ناشناخته به `other` می‌افتد تا رنگ و برچسب نشکند. */
const GAME: Record<string, GameType> = {
  snooker: 'snooker',
  pocket: '8ball',
  highball: '9ball',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** تاریخِ شمسی از ISO — همان شکلی که صفحه‌ها نمایش می‌دهند */
function faDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran',
    }).format(new Date(iso))
  } catch { return '' }
}

export function toTournament(r: DbTournament): Tournament {
  const starts = r.starts_at ? new Date(r.starts_at) : null
  const taken = Math.max(0, r.max_players - (r.seatsLeft ?? r.max_players))

  return {
    id: r.id,
    clubId: r.club_id,
    clubName: r.venue ?? '',
    banner: r.cover_url || '/images/clubs/club1.png',
    name: r.title,
    description: r.description ?? '',
    gameType: GAME[r.discipline ?? 'snooker'] ?? 'other',
    date: starts ? faDate(r.starts_at!) : '',
    startTime: starts
      ? `${pad(starts.getHours())}:${pad(starts.getMinutes())}`
      : '',
    registrationDeadline: r.registration_ends_at ? faDate(r.registration_ends_at) : '',
    maxPlayers: (r.max_players as Tournament['maxPlayers']),
    entryFee: r.entry_fee,
    prizeInfo: r.prize ?? '',
    rules: '',
    matchFormat: '',
    paymentMethod: 'online',
    status: STATUS[r.status] ?? 'upcoming',
    registeredCount: taken,
    /* آمارِ نتایج هنوز از سرور نمی‌آید — این‌ها بعد از پیاده‌سازیِ
       جدولِ نتایج پر می‌شوند و تا آن روز خالی می‌مانند، نه ساختگی. */
  } as Tournament
}

/** همه‌ی مسابقاتِ عمومی */
export async function fetchTournaments(clubId?: string): Promise<Tournament[]> {
  try {
    const q = clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''
    const r = await fetch(`/api/tournaments${q}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null) as { tournaments?: DbTournament[] } | null
    return (j?.tournaments ?? []).map(toTournament)
  } catch { return [] }
}

/** یک مسابقه با شناسه */
export async function fetchTournament(id: string): Promise<Tournament | null> {
  const all = await fetchTournaments()
  return all.find(t => t.id === id) ?? null
}

/** ظرفیت و وضعیتِ لحظه‌ای — برای صفحه‌ی ثبت‌نام */
export async function fetchSeats(id: string): Promise<{
  seatsLeft: number; maxPlayers: number; entryFee: number; status: string
} | null> {
  try {
    const r = await fetch(`/api/tournaments/${id}/register`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}
