/* ─────────────────────────────────────────────────────────────
   منطق سمت‌سرور مسابقات و ثبت‌نام.

   عمداً هیچ سیستم پرداخت تازه‌ای ساخته نشده: همان
   `PaymentProvider`ی که رزرو و تبلیغات استفاده می‌کنند این‌جا هم به
   کار می‌رود، پس افزودن درگاه واقعی فقط یک فایل Adapter است.

   قاعده‌ی طلایی: مبلغ هرگز از کلاینت گرفته نمی‌شود. کلاینت فقط
   شناسه‌ی مسابقه را می‌فرستد و مبلغ از دیتابیس خوانده و در سفارش
   Snapshot می‌شود.
   ───────────────────────────────────────────────────────────── */

import { sb, rpc } from '../finance/db'

export type TournamentStatus =
  | 'draft' | 'published' | 'registration_open' | 'registration_closed'
  | 'ongoing' | 'completed' | 'cancelled'

export interface TournamentRow {
  id: string
  club_id: string
  created_by: string
  slug: string | null
  title: string
  description: string | null
  discipline: string
  max_players: number
  entry_fee: number
  prize: string | null
  venue: string | null
  province: string | null
  city: string | null
  starts_at: string | null
  registration_ends_at: string | null
  status: TournamentStatus
  cover_url: string | null
  created_at: string
}

export interface RegistrationRow {
  id: string
  tournament_id: string
  user_id: string
  player_name: string | null
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED'
  payment_status: 'UNPAID' | 'INITIATED' | 'PAID' | 'FAILED' | 'REFUNDED'
  amount: number
  provider: string | null
  provider_ref_id: string | null
  paid_at: string | null
  refund_amount: number
  created_at: string
}

/* وضعیت‌هایی که عمومی دیده می‌شوند */
const PUBLIC_STATUSES: TournamentStatus[] = [
  'published', 'registration_open', 'registration_closed', 'ongoing', 'completed',
]

/** فهرست عمومی مسابقات — پیش‌نویس و لغوشده دیده نمی‌شوند */
export async function listPublicTournaments(clubId?: string): Promise<TournamentRow[]> {
  let q = sb().from('tournaments').select('*').in('status', PUBLIC_STATUSES)
  if (clubId) q = q.eq('club_id', clubId)
  const { data, error } = await q.order('starts_at', { ascending: true, nullsFirst: false }).limit(200)
  if (error) { console.error('[tournaments] list:', error.message); return [] }
  return (data ?? []) as TournamentRow[]
}

/** مسابقات یک باشگاه برای پنل خودش — شامل پیش‌نویس */
export async function listClubTournaments(clubId: string): Promise<TournamentRow[]> {
  const { data, error } = await sb().from('tournaments').select('*')
    .eq('club_id', clubId).order('created_at', { ascending: false }).limit(200)
  if (error) { console.error('[tournaments] club list:', error.message); return [] }
  return (data ?? []) as TournamentRow[]
}

export async function getTournament(id: string): Promise<TournamentRow | null> {
  const { data } = await sb().from('tournaments').select('*').eq('id', id).maybeSingle()
  return (data ?? null) as TournamentRow | null
}

/** ظرفیت باقی‌مانده — از تابع دیتابیس، نه شمارش سمت برنامه */
export async function seatsLeft(tournamentId: string): Promise<number> {
  const { data } = await rpc<number>('bh_tournament_seats_left', { p_tournament: tournamentId })
  return Number(data) || 0
}

export interface RegisterOutcome {
  ok: boolean
  reason?: string
  registrationId?: string
  amount?: number
  free?: boolean
  resumed?: boolean
  status?: string
}

/** ساخت سفارش ثبت‌نام — مبلغ از دیتابیس، ظرفیت اتمیک */
export async function registerForTournament(
  tournamentId: string, userId: string, playerName: string, phone: string,
): Promise<RegisterOutcome> {
  const { data, error } = await rpc<RegisterOutcome>('bh_tournament_register', {
    p_tournament: tournamentId, p_user: userId,
    p_player_name: playerName.slice(0, 120), p_phone: phone.slice(0, 20),
  })
  if (error) {
    console.error('[tournaments] register:', error.message)
    return { ok: false, reason: 'server_error' }
  }
  return (data ?? { ok: false, reason: 'server_error' }) as RegisterOutcome
}

/** تأیید پرداخت — Idempotent، با بررسی دوباره‌ی مبلغ و ظرفیت */
export async function confirmRegistrationPayment(args: {
  registrationId: string
  expectedAmount: number
  paidAmount: number
  provider: string
  refId: string
}): Promise<{ ok: boolean; reason?: string; idempotent?: boolean }> {
  const { data, error } = await rpc<{ ok: boolean; reason?: string; idempotent?: boolean }>(
    'bh_tournament_confirm_payment', {
      p_registration: args.registrationId,
      p_expected_amount: args.expectedAmount,
      p_paid_amount: args.paidAmount,
      p_provider: args.provider,
      p_ref_id: args.refId,
    },
  )
  if (error) {
    console.error('[tournaments] confirm:', error.message)
    return { ok: false, reason: 'server_error' }
  }
  return data ?? { ok: false, reason: 'server_error' }
}

/** ثبت‌نام‌های یک کاربر */
export async function myRegistrations(userId: string) {
  const { data } = await sb().from('tournament_registrations')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
  return (data ?? []) as RegistrationRow[]
}

/** ثبت‌نام‌های یک مسابقه — فقط برای مالک باشگاه/ادمین */
export async function registrationsOf(tournamentId: string) {
  const { data } = await sb().from('tournament_registrations')
    .select('*').eq('tournament_id', tournamentId).order('created_at', { ascending: true }).limit(600)
  return (data ?? []) as RegistrationRow[]
}

/* اطلاعاتی که باشگاه مجاز است از یک ثبت‌نام ببیند. شماره‌ی تماس
   می‌ماند (برگزارکننده باید بتواند هماهنگ کند) ولی هیچ داده‌ی بانکی
   یا شناسه‌ی داخلی پرداخت بیرون نمی‌رود. */
export function forOrganizer(r: RegistrationRow) {
  return {
    id: r.id,
    playerName: r.player_name,
    status: r.status,
    paymentStatus: r.payment_status,
    amount: r.amount,
    refId: r.provider_ref_id,      // شماره‌ی پیگیری — نه اطلاعات کارت
    paidAt: r.paid_at,
    refundAmount: r.refund_amount,
    createdAt: r.created_at,
  }
}
