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
}

export async function fetchBracket(tournamentId: string): Promise<Bracket | null> {
  try {
    const r = await apiFetch(`/api/tournaments/${tournamentId}/matches`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json() as Bracket
  } catch { return null }
}

export async function drawBracket(tournamentId: string, shuffle = true) {
  const r = await apiFetch(`/api/tournaments/${tournamentId}/matches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shuffle }),
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

/* ── کمکی‌های نمایش ── */

export const faDigits = (v: string | number) =>
  String(v ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)

/* «هنوز مشخص نشده» با «بای» فرق دارد و کاربر باید بفهمد کدام است:
   بای یعنی حریفی وجود ندارد، نامشخص یعنی دور قبل هنوز تمام نشده. */
export function slotLabel(match: Match, slot: 1 | 2): string {
  const name = slot === 1 ? match.p1_name : match.p2_name
  if (name) return name
  const other = slot === 1 ? match.p2_name : match.p1_name
  if (match.round === 1) return other ? 'بای — بدون حریف' : '—'
  return 'در انتظار دور قبل'
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
