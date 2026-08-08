'use client'

/* ─────────────────────────────────────────────────────────────
   براکت — سمت کلاینت.

   چهار صفحه‌ی bracket / live / results / admin همگی از همین‌جا
   می‌خوانند تا شکل داده و نام دورها در همه‌جا یکی باشد.
   ───────────────────────────────────────────────────────────── */

import { apiFetch } from '../http'

export interface Match {
  id: string
  round: number
  match_index: number
  p1_registration_id: string | null
  p2_registration_id: string | null
  p1_name: string | null
  p2_name: string | null
  score1: number
  score2: number
  winner: 1 | 2 | null
  status: 'waiting' | 'in_progress' | 'completed'
  p1_bye?: boolean
  p2_bye?: boolean
  high_break_p1?: number | null
  high_break_p2?: number | null
  table_number: number | null
  started_at: string | null
  completed_at: string | null
}

export interface BracketRound { round: number; label: string; matches: Match[] }

export interface Bracket {
  tournament: {
    id: string; title: string; club_id: string; status: string
    starts_at: string | null; venue: string | null; city: string | null
    max_players: number; entry_fee: number; prize: string | null
    match_format?: string | null; discipline?: string
  }
  matches: Match[]
  rounds: BracketRound[]
  totalRounds: number
  champion: { name: string; registrationId: string | null } | null
  runnerUp: { name: string } | null
  /* دو بازنده‌ی نیمه‌نهایی — سومِ مشترک */
  thirds?: string[]
}

export async function fetchBracket(tournamentId: string): Promise<Bracket | null> {
  try {
    const r = await apiFetch(`/api/tournaments/${tournamentId}/matches`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json() as Bracket
  } catch { return null }
}

/** `empty` یعنی ساختارِ جدول ساخته شود ولی جایگاه‌ها خالی بمانند —
 *  برای چیدنِ کاملاً دستی. بدونِ آن، تنها راهِ ساختِ جدول قرعه‌کشیِ
 *  تصادفی بود و برگزارکننده باید بعدش همه را جابه‌جا می‌کرد. */
export async function drawBracket(tournamentId: string, shuffle = true, empty = false) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shuffle, empty }),
  })
  return { ok: r.ok, body: await r.json().catch(() => ({})) as { message?: string; matches?: number } }
}

export async function resetBracket(tournamentId: string) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches`, { method: 'DELETE' })
  return { ok: r.ok, body: await r.json().catch(() => ({})) as { message?: string } }
}

export async function reportResult(tournamentId: string, matchId: string, score1: number, score2: number) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score1, score2 }),
  })
  return { ok: r.ok, body: await r.json().catch(() => ({})) as { message?: string } }
}

/* امتیازِ زنده — بدونِ اعلامِ برنده و بدونِ صعود.
   `reportResult` هر دو کار را با هم می‌کرد، پس نشان‌دادنِ امتیازِ
   جاری روی مانیتور یعنی تمام‌شده اعلام‌کردنِ بازی. */
export async function liveScore(tournamentId: string, matchId: string, score1: number, score2: number) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ live: true, score1, score2 }),
  })
  return { ok: r.ok, body: await r.json().catch(() => ({})) as { message?: string } }
}

/** بالاترین برکِ یک بازیکن در یک بازی. `value = null` یعنی پاک کن. */
export async function setHighBreak(
  tournamentId: string, matchId: string, player: 1 | 2, value: number | null,
) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ highBreakPlayer: player, highBreak: value }),
  })
  return { ok: r.ok, body: await r.json().catch(() => ({})) as { message?: string } }
}

/** چند فریم برای بُرد لازم است — همان قاعده‌ی `bh_format_target`.
 *  `null` یعنی سقفی در کار نیست (بازیِ زمان‌دار). */
export function formatTarget(format: string | null | undefined): number | null {
  if (!format) return null
  const race = /^race(\d{1,2})$/.exec(format)
  if (race) return Number(race[1])
  const bo = /^bo(\d{1,2})$/.exec(format)
  if (bo) return Math.floor(Number(bo[1]) / 2) + 1
  return null
}

/** بالاترین برکِ کلِ مسابقه — بیشترینِ برک‌های ثبت‌شده‌ی بازی‌ها */
export function tournamentHighBreak(b: Bracket): { value: number; name: string } | null {
  let best: { value: number; name: string } | null = null
  for (const m of b.matches) {
    for (const [v, name] of [
      [m.high_break_p1, m.p1_name], [m.high_break_p2, m.p2_name],
    ] as const) {
      if (!v) continue
      if (!best || v > best.value) best = { value: v, name: name ?? '—' }
    }
  }
  return best
}

/** بیشترین امتیازی که بازنده می‌تواند بگیرد: یک فریم کمتر از هدف.
 *  در Best of 5 یعنی حداکثر ۳–۲، نه ۳–۳. */
export function frameCap(target: number | null, otherScore: number): number {
  if (target === null) return 99
  return otherScore >= target ? target - 1 : target
}

export async function patchMatch(
  tournamentId: string, matchId: string,
  patch: { status?: 'waiting' | 'in_progress'; tableNumber?: number | null },
) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return { ok: r.ok, body: await r.json().catch(() => ({})) as { message?: string } }
}

/* ── چیدنِ دستی ──────────────────────────────────────────────── */

export interface PoolPlayer { id: string; name: string; source: string }

export async function fetchSeedingPool(tournamentId: string): Promise<{
  pool: PoolPlayer[]; placedCount: number; confirmed: number
} | null> {
  try {
    const r = await apiFetch(`/api/tournaments/${tournamentId}/seeding`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

type SeedResult = { ok: boolean; body: { message?: string; reason?: string } }

async function seedPatch(tournamentId: string, payload: Record<string, unknown>): Promise<SeedResult> {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/seeding`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { ok: r.ok, body: await r.json().catch(() => ({})) }
}

/** تعویضِ دو جایگاه — عملِ پایه‌ی جابه‌جایی. هیچ‌کس گم نمی‌شود. */
export const swapSlots = (
  tournamentId: string,
  a: { matchId: string; slot: 1 | 2 },
  b: { matchId: string; slot: 1 | 2 },
) => seedPatch(tournamentId, { action: 'swap', a, b })

/** گذاشتنِ بازیکنی از استخر روی یک جایگاه. `null` یعنی خالی‌کردن.
 *  `bye` یعنی «این جایگاه عمداً بی‌حریف می‌ماند» — که تا مهاجرتِ ۰۷۵
 *  با «خالی» یکی بود، و برای همین رهاکردنِ تراشه‌ی Bye روی جدول هیچ
 *  اثری نداشت و تراشه سرِ جایش برمی‌گشت. */
export const placeSlot = (
  tournamentId: string, matchId: string, slot: 1 | 2,
  registrationId: string | null, bye = false,
) => seedPatch(tournamentId, { action: 'place', matchId, slot, registrationId, bye })

/** خالی‌کردنِ همه‌ی جایگاه‌های دورِ اول — برای چیدنِ کاملاً دستی */
export const clearSlots = (tournamentId: string) => seedPatch(tournamentId, { action: 'clear' })

/** تأییدِ چیدمانِ دستی — بای‌ها بسته و برنده‌شان صعود می‌کند */
export const finalizeSeeding = (tournamentId: string) => seedPatch(tournamentId, { action: 'finalize' })

/* ── کمکی‌های نمایش ── */

export const faDigits = (v: string | number) =>
  String(v ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)

/* «بای» گفته می‌شود چون معنایش این است که حریفی وجود ندارد و بازی
   برگزار نمی‌شود. جایگاهِ دورهای بعد فقط خط تیره می‌گیرد: عبارتِ
   «در انتظار دور قبل» چیزی نمی‌گفت که خودِ خالی‌بودن نگوید، و در
   جدولِ بزرگ ده‌ها بار تکرار می‌شد. */
export function slotLabel(match: Match, slot: 1 | 2): string {
  const name = slot === 1 ? match.p1_name : match.p2_name
  if (name) return name
  const other = slot === 1 ? match.p2_name : match.p1_name
  /* «Bye» و نه ترجمه‌اش: همان واژه‌ای است که روی تراشه‌ی چیدمان و در
     هر جدولِ بیلیارد نوشته می‌شود، و کوتاه‌تر هم هست. */
  if (match.round === 1) return other ? 'Bye' : '—'
  return '—'
}

export const isBye = (m: Match) =>
  m.round === 1 && ((!!m.p1_name) !== (!!m.p2_name))

export function liveMatches(b: Bracket): Match[] {
  return b.matches.filter(m => m.status === 'in_progress')
}

/* بازی‌هایی که هر دو بازیکنشان معلوم است و هنوز نتیجه ندارند */
export function playableMatches(b: Bracket): Match[] {
  return b.matches.filter(m => m.winner === null && m.p1_name && m.p2_name)
}
