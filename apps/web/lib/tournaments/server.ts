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
  /* مهاجرتِ ۰۷۵ — زمان‌بندیِ باز شدنِ ثبت‌نام. ستون وجود داشت و در
     این تایپ نبود، پس مسیرِ ویرایش نمی‌توانست خوانده‌اش هم بکند. */
  registration_starts_at: string | null
  status: TournamentStatus
  cover_url: string | null
  created_at: string
}

export interface RegistrationRow {
  id: string
  tournament_id: string
  /* از مهاجرت ۰۶۸ تهی می‌پذیرد: ثبت‌نامِ حضوری کاربرِ سایت ندارد */
  user_id: string | null
  player_name: string | null
  contact_phone: string | null
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED'
  payment_status: 'UNPAID' | 'INITIATED' | 'PAID' | 'FAILED' | 'REFUNDED'
  amount: number
  provider: string | null
  provider_ref_id: string | null
  paid_at: string | null
  refund_amount: number
  source: 'online' | 'offline'
  note: string | null
  created_at: string
}

/* وضعیت‌هایی که عمومی دیده می‌شوند */
const PUBLIC_STATUSES: TournamentStatus[] = [
  'published', 'registration_open', 'registration_closed', 'ongoing', 'completed',
]

/* ── شروعِ خودکار ──
   مسابقه‌ای که ساعتِ شروعش رسیده و جدولش کشیده شده باید از «ثبت‌نام
   بسته» به «در حال برگزاری» برود. کران نساختیم — یک نقطه‌ی خرابیِ
   دیگر که وقتی نخوابد کسی نمی‌فهمد. به‌جایش همان‌جا که فهرست خوانده
   می‌شود انجام می‌شود. */
export async function autoStartDue(): Promise<number> {
  const { data, error } = await rpc<number>('bh_tournaments_autostart', {})
  if (error) return 0
  return Number(data) || 0
}

/* ── بازشدنِ خودکارِ ثبت‌نام ──
   باشگاه‌داری که می‌خواست ثبت‌نامِ مسابقه رأسِ ساعتِ مشخصی باز شود،
   تنها راهش این بود که یادش بماند و همان لحظه دکمه را بزند. حالا
   `registration_starts_at` را می‌گذارد، مسابقه در «بزودی» می‌ماند و
   خودش سرِ وقت به «در حال ثبت‌نام» می‌رود. همان الگوی بالا: کران
   نداریم، هر بار که فهرست خوانده می‌شود بررسی می‌شود. */
export async function autoOpenDue(): Promise<number> {
  const { data, error } = await rpc<number>('bh_tournaments_autoopen', {})
  if (error) return 0
  return Number(data) || 0
}

/** فهرست عمومی مسابقات — پیش‌نویس و لغوشده دیده نمی‌شوند */
export async function listPublicTournaments(clubId?: string): Promise<TournamentRow[]> {
  /* ترتیب مهم است: اول ثبت‌نامِ سررسیده باز شود، بعد مسابقه‌ای که
     ساعتِ شروعش رسیده استارت بخورد — وگرنه مسابقه‌ای که هر دو زمانش
     در فاصله‌ی دو بازدید گذشته، یک دور جا می‌ماند. */
  await autoOpenDue()
  await autoStartDue()
  let q = sb().from('tournaments').select('*').in('status', PUBLIC_STATUSES)
  if (clubId) q = q.eq('club_id', clubId)
  const { data, error } = await q.order('starts_at', { ascending: true, nullsFirst: false }).limit(200)
  if (error) { console.error('[tournaments] list:', error.message); return [] }
  return (data ?? []) as TournamentRow[]
}

/** مسابقات یک باشگاه برای پنل خودش — شامل پیش‌نویس */
export async function listClubTournaments(clubId: string): Promise<TournamentRow[]> {
  /* پنلِ خودِ باشگاه هم باید همان وضعیتِ به‌روز را ببیند، وگرنه
     باشگاه‌دار «بزودی» می‌بیند در حالی که سایت «در حال ثبت‌نام»
     نشان می‌دهد. */
  await autoOpenDue()
  await autoStartDue()
  const { data, error } = await sb().from('tournaments').select('*')
    .eq('club_id', clubId).order('created_at', { ascending: false }).limit(200)
  if (error) { console.error('[tournaments] club list:', error.message); return [] }
  return (data ?? []) as TournamentRow[]
}

export async function getTournament(id: string): Promise<TournamentRow | null> {
  const { data } = await sb().from('tournaments').select('*').eq('id', id).maybeSingle()
  return (data ?? null) as TournamentRow | null
}

/* ── مهلتِ پرداخت ──────────────────────────────────────────────
   کسی که به درگاه می‌رود و برنمی‌گردد، یک صندلی را قفل نگه می‌دارد.
   تابعِ `bh_tournament_expire_pending` از مهاجرت ۰۲۶ برای همین بود
   ولی **هیچ‌کس هرگز صدایش نمی‌زد** — نه کرانی بود نه مسیری. یعنی
   سفارشِ نیمه‌کاره تا ابد می‌ماند و مسابقه‌ی ۱۶ نفره با ۳ پرداختِ
   واقعی می‌توانست «پر» نشان داده شود.

   کران نساختیم چون یک نقطه‌ی خرابیِ دیگر است که وقتی نخوابد کسی
   نمی‌فهمد. به‌جایش همان‌جا که ظرفیت خوانده می‌شود پاک‌سازی هم
   انجام می‌شود: هر بار که کسی صفحه‌ی ثبت‌نام یا پنل را باز کند،
   منقضی‌ها آزاد می‌شوند. هزینه‌اش یک UPDATE روی ایندکس است.

   ۱۵ دقیقه: درگاه‌های ایرانی خودشان حدود همین مهلت را می‌دهند، پس
   بیشتر از آن یعنی نگه‌داشتنِ صندلی برای تراکنشی که دیگر نمی‌تواند
   موفق شود. */
export const PAYMENT_WINDOW_MINUTES = 15

export async function expireStalePending(): Promise<number> {
  const { data, error } = await rpc<number>('bh_tournament_expire_pending', {
    p_minutes: PAYMENT_WINDOW_MINUTES,
  })
  if (error) return 0
  return Number(data) || 0
}

/** ظرفیت باقی‌مانده — از تابع دیتابیس، نه شمارش سمت برنامه.
 *
 *  پیش از شمارش، سفارش‌های از مهلت‌گذشته آزاد می‌شوند؛ وگرنه عددی
 *  که به کاربر نشان می‌دهیم صندلی‌هایی را پر می‌شمارد که واقعاً
 *  خالی‌اند. */
export async function seatsLeft(tournamentId: string): Promise<number> {
  await expireStalePending()
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
   یا شناسه‌ی داخلی پرداخت بیرون نمی‌رود.

   ── چرا شماره‌ی تماس اضافه شد ──
   همین توضیح از قبل بالای این تابع بود، ولی خودِ `contact_phone` در
   خروجی نبود. یعنی برگزارکننده فهرست را می‌دید و هیچ راهی برای
   تماس با بازیکن نداشت — نه شماره، نه حتی نامِ کامل در بعضی
   ردیف‌ها. توضیح و کد دو چیزِ متفاوت می‌گفتند. */
export function forOrganizer(r: RegistrationRow) {
  return {
    id: r.id,
    playerName: r.player_name,
    phone: r.contact_phone,
    status: r.status,
    paymentStatus: r.payment_status,
    amount: r.amount,
    refId: r.provider_ref_id,      // شماره‌ی پیگیری — نه اطلاعات کارت
    paidAt: r.paid_at,
    refundAmount: r.refund_amount,
    /* حضوری یا آنلاین — رابط باید بداند کدام را می‌شود حذف کرد و
       کدام فقط بازپرداخت می‌پذیرد */
    source: r.source ?? 'online',
    note: r.note ?? null,
    createdAt: r.created_at,
  }
}

/* ── ثبت‌نامِ حضوری ──
   کسی که تلفنی یا دمِ در اسم می‌دهد هم یک صندلی می‌گیرد. تا وقتی
   راهی برای واردکردنش نبود، شمارشِ ظرفیت و براکت با واقعیتِ سالن
   نمی‌خواند و باشگاه‌دار مجبور بود بیرونِ سیستم حساب نگه دارد. */
export async function addOfflineRegistration(args: {
  tournamentId: string; name: string; phone: string
  amount: number | null; note: string; actorId: string
}): Promise<{ ok: boolean; reason?: string; registrationId?: string; taken?: number; maxPlayers?: number }> {
  const { data, error } = await rpc<{ ok: boolean; reason?: string; registrationId?: string }>(
    'bh_tournament_add_offline', {
      p_tournament: args.tournamentId,
      p_name: args.name.slice(0, 120),
      p_phone: args.phone.slice(0, 20),
      p_amount: args.amount,
      p_note: args.note.slice(0, 200),
      p_actor: args.actorId,
    },
  )
  if (error) {
    console.error('[tournaments] add offline:', error.message)
    return { ok: false, reason: 'server_error' }
  }
  return (data ?? { ok: false, reason: 'server_error' })
}

export async function removeOfflineRegistration(
  registrationId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await rpc<{ ok: boolean; reason?: string }>(
    'bh_tournament_remove_offline', { p_registration: registrationId },
  )
  if (error) {
    console.error('[tournaments] remove offline:', error.message)
    return { ok: false, reason: 'server_error' }
  }
  return data ?? { ok: false, reason: 'server_error' }
}
