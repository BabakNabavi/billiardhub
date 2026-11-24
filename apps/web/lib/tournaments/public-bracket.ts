/* ─────────────────────────────────────────────────────────────
   براکتِ عمومیِ یک مسابقه برای رندرِ سرورِ /tournaments/[id]/bracket و
   /results — آذرِ ۱۴۰۵.

   هر دو صفحه کلاینتی بودند: چرخنده، بعد درخواست، بعد جدول. روی گوشیِ کند
   جدول در ثانیه‌ی چهارم و نیم می‌آمد و فوتر از زیرِ چرخنده تا پایینِ
   جدول می‌پرید (CLS ۰٫۲ و ۰٫۴۴). حالا همان داده همراهِ HTML می‌آید.

   خودِ GET /api/tournaments/[id]/matches صدا زده می‌شود، نه کپیِ قاعده‌اش.
   ⚠️ فقط فیلدهایی که نوعِ Bracket می‌شناسد: پاسخِ API ردیفِ کاملِ مسابقه و
   `select('*')`ِ بازی‌ها را می‌دهد و این HTML برای هر بازدیدکننده و ربات
   ساخته می‌شود — پراپِ کامپوننتِ کلاینت کامل سریال می‌شود، نه فقط آنچه
   رندر می‌شود.
   خطا یا مهلت ⟵ null: صفحه مثلِ قبل خودش می‌خواند.
   ───────────────────────────────────────────────────────────── */

import 'server-only'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { GET as getMatches } from '@/app/api/tournaments/[id]/matches/route'
import type { Bracket, Match } from './bracket-client'
import { VIEWABLE_STATUSES } from './server'
import { TIMED_OUT, withTimeout } from '@/lib/seo/timeout'

/* مرزِ ورودی: پارامترِ مسیر */
const Id = z.string().uuid()

const T_KEYS = [
  'id', 'title', 'club_id', 'status', 'starts_at', 'venue', 'city',
  'max_players', 'entry_fee', 'prize', 'match_format', 'discipline',
] as const
const M_KEYS = [
  /* ⚠️ شناسه‌ی ثبت‌نام عمدا نیست: هیچ‌کدام از سه صفحه و BracketTree نمی‌خوانندش و همان
     شناسه مرجعِ پرداخت است (paymentId/clientRefId در callbackِ مسابقه) — بازبینی */
  'id', 'round', 'match_index',
  'p1_name', 'p2_name', 'score1', 'score2', 'winner', 'status', 'p1_bye', 'p2_bye',
  'high_break_p1', 'high_break_p2', 'table_number', 'started_at', 'completed_at',
] as const

type Row = Record<string, unknown>
const pick = (o: unknown, keys: readonly string[]): Row => {
  const src = (o && typeof o === 'object' ? o : {}) as Row
  return Object.fromEntries(keys.filter(k => k in src).map(k => [k, src[k]]))
}
const pickMatches = (xs: unknown): Match[] =>
  (Array.isArray(xs) ? xs : []).map(m => pick(m, M_KEYS) as unknown as Match)

export async function loadPublicBracket(id: string): Promise<Bracket | null> {
  if (!Id.safeParse(id).success) return null
  try {
    const res = await withTimeout(
      getMatches(new NextRequest(`http://localhost/api/tournaments/${id}/matches`), { params: Promise.resolve({ id }) }),
      1500,
    )
    if (res === TIMED_OUT) { console.error('[bracket] initial read timed out'); return null }
    if (!res.ok) {
      if (res.status !== 404) console.error('[bracket] initial read', res.status)
      return null
    }
    const j = (await res.json()) as Row
    /* درخواستِ ساختگیِ این‌جا کوکی ندارد، پس GET پیش‌نویس را ۴۰۴ می‌دهد؛ این سنجش فقط
       پشتیبان است — HTMLِ این‌جا برای هر بازدیدکننده است. پیش‌نویس برای صاحبش با
       درخواستِ مرورگر (کوکی‌دار) می‌آید. */
    const status = String((j.tournament as Row | undefined)?.status ?? '')
    if (!VIEWABLE_STATUSES.has(status)) return null
    const rounds = (Array.isArray(j.rounds) ? j.rounds : []) as Row[]
    return {
      tournament: pick(j.tournament, T_KEYS) as unknown as Bracket['tournament'],
      matches: pickMatches(j.matches),
      rounds: rounds.map(r => ({ round: Number(r.round), label: String(r.label ?? ''), matches: pickMatches(r.matches) })),
      totalRounds: Number(j.totalRounds) || 0,
      champion: j.champion && typeof j.champion === 'object'
        ? { name: String((j.champion as Row).name ?? ''), registrationId: null }
        : null,
      runnerUp: (j.runnerUp ?? null) as Bracket['runnerUp'],
      ...(Array.isArray(j.thirds) ? { thirds: j.thirds as string[] } : {}),
    }
  } catch (e) {
    console.error('[bracket] initial read', e instanceof Error ? e.message : e)
    return null
  }
}
