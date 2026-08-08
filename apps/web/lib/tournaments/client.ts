'use client'

/* ─────────────────────────────────────────────────────────────
   پل مسابقات به سرور — برای صفحه‌های عمومی.

   شش صفحه‌ی مسابقات از `SAMPLE_TOURNAMENTS` (آرایه‌ی هاردکد) می‌خواندند،
   یعنی کاربر مسابقه‌های ساختگی می‌دید و هیچ‌کدام قابل ثبت‌نام واقعی
   نبودند.

   این‌جا داده‌ی واقعی خوانده و به **همان شکلی** نگاشت می‌شود که صفحه‌ها
   از قبل انتظار دارند (`Tournament`). این‌طور شش صفحه بدون بازنویسی
   وصل می‌شوند و ریسک شکستن چیدمان صفر است.
   ───────────────────────────────────────────────────────────── */

import type { Tournament, TournamentStatus } from '../mock-tournaments'
import { normalizeDiscipline, posterFor } from './formats'

export interface DbTournament {
  id: string
  club_id: string
  title: string
  description?: string | null
  discipline?: string
  max_players: number
  entry_fee: number
  prize?: string | null
  rules?: string | null
  match_format?: string | null
  venue?: string | null
  province?: string | null
  city?: string | null
  starts_at?: string | null
  registration_ends_at?: string | null
  registration_starts_at?: string | null
  created_at?: string | null
  status: string
  cover_url?: string | null
  is_featured?: boolean
  seatsLeft?: number
}

/* وضعیت سرور ← وضعیتی که صفحه‌ها می‌شناسند */
const STATUS: Record<string, TournamentStatus> = {
  draft: 'upcoming',
  published: 'upcoming',
  registration_open: 'registration_open',
  registration_closed: 'bracket_ready',
  ongoing: 'live',
  completed: 'finished',
  cancelled: 'finished',
}

/* ── نگاشتِ نوعِ بازی ──
   این‌جا یک جدولِ سه‌سطریِ هاردکد بود:
     { snooker → snooker, pocket → 8ball, highball → 9ball }

   دو خرابیِ ساکت داشت. اول اینکه فرمِ پنل مقدارِ `8ball` و `9ball`
   را مستقیم ذخیره می‌کرد و این جدول هیچ‌کدام را نمی‌شناخت — پس هر
   مسابقه‌ی ایت‌بال یا ناین‌بالی برای بازدیدکننده «سایر» می‌شد. دوم
   اینکه `highball` را به `9ball` می‌برد، یعنی هی‌بال هیچ‌وقت
   خودش نبود.

   حالا از منبعِ واحد می‌آید که هم نام‌های تازه را می‌شناسد هم
   نام‌های قدیمی را. */
/** تاریخ شمسی از ISO — همان شکلی که صفحه‌ها نمایش می‌دهند */
function faDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran',
    }).format(new Date(iso))
  } catch { return '' }
}

/* ساعت باید در وقتِ تهران خوانده شود، نه وقتِ محلیِ مرورگر.
   `new Date(iso).getHours()` ساعتِ دستگاهِ کاربر را می‌دهد؛ برای
   کاربری که ساعتِ سیستمش روی منطقه‌ی دیگری است، ساعتِ شروعِ مسابقه
   چند ساعت جابه‌جا نمایش داده می‌شد. */
function tehranTime(iso: string): string {
  try {
    const p = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(iso))
      .reduce<Record<string, string>>((a, x) => (a[x.type] = x.value, a), {})
    return `${p.hour === '24' ? '00' : p.hour}:${p.minute}`
  } catch { return '' }
}

export function toTournament(r: DbTournament): Tournament {
  const taken = Math.max(0, r.max_players - (r.seatsLeft ?? r.max_players))

  return {
    id: r.id,
    clubId: r.club_id,
    clubName: r.venue ?? '',
    /* بی‌پوستر ⇒ پوسترِ همان بازی، نه عکسِ یک باشگاهِ نمونه */
    banner: r.cover_url || posterFor(normalizeDiscipline(r.discipline)),
    name: r.title,
    description: r.description ?? '',
    gameType: normalizeDiscipline(r.discipline),
    date: r.starts_at ? faDate(r.starts_at) : '',
    startTime: r.starts_at ? tehranTime(r.starts_at) : '',
    registrationDeadline: r.registration_ends_at ? faDate(r.registration_ends_at) : '',
    /* ساعتِ مهلت پیش‌تر هیچ‌جا نمی‌آمد. باشگاه‌دار می‌توانست ثبت‌نام
       را ساعت ۱۲ ظهر ببندد ولی بازیکن فقط روز را می‌دید و تا شب
       فرصت خیال می‌کرد. */
    registrationDeadlineTime: r.registration_ends_at ? tehranTime(r.registration_ends_at) : '',
    /* «بزودی» بدونِ تاریخ یعنی هیچ. اگر ثبت‌نام زمان‌بندی شده،
       بازیکن باید بداند کِی باید برگردد. */
    regOpenDate: r.registration_starts_at ? faDate(r.registration_starts_at) : '',
    regOpenTime: r.registration_starts_at ? tehranTime(r.registration_starts_at) : '',
    /* برای مرتب‌سازیِ «تازه‌ترین اول» — تاریخِ برگزاری این را
       نمی‌دهد: مسابقه‌ای که امروز ثبت شده ممکن است ماهِ بعد باشد. */
    createdAt: r.created_at ?? '',
    maxPlayers: (r.max_players as Tournament['maxPlayers']),
    entryFee: r.entry_fee,
    prizeInfo: r.prize ?? '',
    /* این دو تا امروز رشته‌ی خالیِ ثابت بودند — یعنی هرچه باشگاه‌دار
       در «قوانین» می‌نوشت، صفحه‌ی عمومی خالی نشان می‌داد و فرمت هم
       از localStorage خوانده می‌شد (که فقط روی مرورگرِ خودِ سازنده
       چیزی داشت). */
    rules: r.rules ?? '',
    matchFormat: r.match_format ?? '',
    paymentMethod: 'online',
    status: STATUS[r.status] ?? 'upcoming',
    registeredCount: taken,
    isFeatured: r.is_featured === true,
    /* آمار نتایج هنوز از سرور نمی‌آید — این‌ها بعد از پیاده‌سازی
       جدول نتایج پر می‌شوند و تا آن روز خالی می‌مانند، نه ساختگی. */
  } as Tournament
}

/** همه‌ی مسابقات عمومی */
export async function fetchTournaments(clubId?: string): Promise<Tournament[]> {
  try {
    const q = clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''
    const r = await fetch(`/api/tournaments${q}`, { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json().catch(() => null) as { tournaments?: DbTournament[] } | null
    return (j?.tournaments ?? []).map(toTournament)
  } catch { return [] }
}

/** یک مسابقه با شناسه.
 *
 *  ── چرا مستقیم و نه از فهرست ──
 *  پیش‌تر کلِ فهرستِ عمومی گرفته می‌شد و بینش دنبالِ شناسه می‌گشتیم.
 *  سه ایراد داشت: صدها ردیف برای یک صفحه، سقفِ ۲۰۰ ردیفیِ فهرست (که
 *  با زیادشدنِ مسابقات، قدیمی‌ترها را نامرئی می‌کرد)، و مهم‌تر از
 *  همه اینکه مالکِ باشگاه هم نمی‌توانست پیش‌نویسِ خودش را ببیند —
 *  چون فهرستِ عمومی پیش‌نویس‌ها را فیلتر می‌کند در حالی که مسیرِ
 *  تک‌مسابقه‌ای برای مالک بازش می‌گذارد.
 *
 *  ظرفیت را همان مسیر برنمی‌گرداند، پس جداگانه پرسیده می‌شود. */
export async function fetchTournament(id: string): Promise<Tournament | null> {
  try {
    const r = await fetch(`/api/tournaments/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json().catch(() => null) as { tournament?: DbTournament } | null
    const row = j?.tournament
    if (!row) return null
    const seats = await fetchSeats(id)
    return toTournament({ ...row, seatsLeft: seats?.seatsLeft ?? row.max_players })
  } catch { return null }
}

/** ظرفیت و وضعیت لحظه‌ای — برای صفحه‌ی ثبت‌نام */
export async function fetchSeats(id: string): Promise<{
  seatsLeft: number; maxPlayers: number; entryFee: number; status: string
} | null> {
  try {
    const r = await fetch(`/api/tournaments/${id}/register`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}
