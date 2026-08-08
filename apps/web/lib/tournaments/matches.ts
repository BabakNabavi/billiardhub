/* ─────────────────────────────────────────────────────────────
   براکت مسابقه — خواندن سمت سرور.

   شکل براکت از خود ردیف‌ها استنتاج می‌شود (round / match_index)،
   نه از یک ستون جداگانه؛ پس هیچ‌وقت با واقعیت جدول ناسازگار نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import { sb } from '@/lib/finance/db'

export interface MatchRow {
  id: string
  tournament_id: string
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
  /* «عمداً بی‌حریف» — با «هنوز خالی» فرق دارد (مهاجرت ۰۷۵) */
  p1_bye: boolean
  p2_bye: boolean
  table_number: number | null
  started_at: string | null
  completed_at: string | null
}

export async function listMatches(tournamentId: string): Promise<MatchRow[]> {
  const { data, error } = await sb().from('tournament_matches')
    .select('*').eq('tournament_id', tournamentId)
    .order('round', { ascending: true }).order('match_index', { ascending: true })
  if (error) return []
  return (data ?? []) as MatchRow[]
}

/* نام دورها از آخر شمرده می‌شود: آخرین دور همیشه «فینال» است، هر
   اندازه‌ای که براکت داشته باشد. */
export function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return 'فینال'
  if (fromEnd === 1) return 'نیمه‌نهایی'
  if (fromEnd === 2) return 'یک‌چهارم نهایی'
  if (fromEnd === 3) return 'یک‌هشتم نهایی'
  return `دور ${round}`
}

export interface BracketView {
  rounds: { round: number; label: string; matches: MatchRow[] }[]
  totalRounds: number
  champion: { name: string; registrationId: string | null } | null
  runnerUp: { name: string } | null
  /* ── سومِ مشترک ──
     در حذفیِ یک‌طرفه بدونِ بازیِ رده‌بندی، نفرِ سوم یکی نیست: دو
     بازنده‌ی نیمه‌نهایی هر دو سوم‌اند. حدس زده نمی‌شود کدام بالاتر
     است — هر دو با هم می‌آیند و صفحه هم همین را می‌نویسد. */
  thirds: string[]
}

export function buildBracket(matches: MatchRow[]): BracketView {
  const totalRounds = matches.reduce((m, x) => Math.max(m, x.round), 0)
  const rounds = []
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push({
      round: r,
      label: roundLabel(r, totalRounds),
      matches: matches.filter(m => m.round === r).sort((a, b) => a.match_index - b.match_index),
    })
  }

  const final = matches.find(m => m.round === totalRounds && m.match_index === 0)
  let champion: BracketView['champion'] = null
  let runnerUp: BracketView['runnerUp'] = null
  if (final?.winner) {
    const win = final.winner === 1
    champion = {
      name: (win ? final.p1_name : final.p2_name) ?? '—',
      registrationId: (win ? final.p1_registration_id : final.p2_registration_id),
    }
    runnerUp = { name: (win ? final.p2_name : final.p1_name) ?? '—' }
  }

  /* فقط وقتی فینال تمام شده باشد. پیش از آن، بازنده‌ی
     نیمه‌نهایی هنوز «سوم» نیست — مسابقه تمام نشده. */
  const thirds = final?.winner
    ? matches
        .filter(m => m.round === totalRounds - 1 && m.winner !== null)
        .sort((a, b) => a.match_index - b.match_index)
        .map(m => (m.winner === 1 ? m.p2_name : m.p1_name))
        .filter((n): n is string => !!n)
    : []

  return { rounds, totalRounds, champion, runnerUp, thirds }
}
