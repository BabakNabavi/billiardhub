/* ─────────────────────────────────────────────────────────────
   قواعدِ پخش زنده — منطقِ خالص، بی دیتابیس و بی React (تست‌پذیر).

   سه نوع کانال:
   - club        کانالِ اصلیِ باشگاه (هر باشگاه دست‌کم یکی)
   - table       یک میزِ مشخص — فقط باشگاهِ «حرفه‌ای»
   - tournament  کانالِ اختصاصیِ یک مسابقه — از سقفِ باشگاه کم نمی‌کند،
                 هر مسابقه حداکثر یکی

   سقف: باشگاهِ عادی ۱ کانال؛ حرفه‌ای همان عددی که مدیریت تعیین کرده.
   ───────────────────────────────────────────────────────────── */

export type ChannelKind = 'club' | 'table' | 'tournament'
export type ClubTier = 'standard' | 'pro'
export type ChannelAccess = 'public' | 'members'

export interface ClubLiveSettings {
  tier: ClubTier
  channelLimit: number
  blocked: boolean
  blockReason: string | null
}

export const DEFAULT_CLUB_SETTINGS: ClubLiveSettings = {
  tier: 'standard', channelLimit: 1, blocked: false, blockReason: null,
}

export const PRO_DEFAULT_LIMIT = 4
export const MAX_CHANNEL_LIMIT = 16
/* پخشی که باشگاه‌دار فراموش کرده تمامش کند، بیش از این «زنده» نمی‌ماند */
export const MAX_BROADCAST_MS = 12 * 60 * 60 * 1000

export const KIND_LABEL: Record<ChannelKind, string> = {
  club: 'کانالِ باشگاه', table: 'کانالِ میز', tournament: 'کانالِ مسابقه',
}

/** سقفِ مؤثرِ کانال‌های غیرِ مسابقه */
export function channelLimitOf(s: ClubLiveSettings): number {
  if (s.tier !== 'pro') return 1
  const n = Math.round(Number(s.channelLimit) || PRO_DEFAULT_LIMIT)
  return Math.min(MAX_CHANNEL_LIMIT, Math.max(2, n))
}

export type Verdict = { ok: true } | { ok: false; reason: string }
const no = (reason: string): Verdict => ({ ok: false, reason })

export function canCreateChannel(
  s: ClubLiveSettings,
  existing: { kind: ChannelKind }[],
  kind: ChannelKind,
  opts: { tournamentHasChannel?: boolean } = {},
): Verdict {
  if (s.blocked) return no('پخش زنده‌ی این باشگاه توسط مدیریت بیلیارد هاب مسدود شده است')
  if (kind === 'tournament') {
    return opts.tournamentHasChannel ? no('این مسابقه از قبل کانالِ پخش دارد') : { ok: true }
  }
  if (kind === 'table' && s.tier !== 'pro') {
    return no('کانالِ جداگانه برای هر میز مخصوصِ باشگاه‌های حرفه‌ای است')
  }
  const used = existing.filter(c => c.kind !== 'tournament').length
  const limit = channelLimitOf(s)
  if (used >= limit) return no(`سقفِ کانال‌های این باشگاه (${limit}) پر است`)
  return { ok: true }
}

/** `rank` = جایگاهِ این کانال میانِ کانال‌های غیرِ مسابقه‌ی باشگاه (به ترتیبِ ساخت، از ۰).
 *  اگر مدیریت سطح را پایین آورد، کانال‌های اضافه و کانالِ میز دیگر پخش نمی‌کنند —
 *  نه اینکه فقط ساختنِ کانالِ تازه بسته شود. */
export function canGoLive(
  /** `adminAttached`: کانالی که مدیرِ سایت دستی وصل کرده — تصمیمِ خودِ مدیر است،
   *  پس سقف و سطحِ باشگاه جلویش را نمی‌گیرد (مسدودی چرا) */
  ch: { adminBlocked: boolean; archived: boolean; isLive: boolean; kind: ChannelKind; rank: number; adminAttached?: boolean },
  s: ClubLiveSettings,
): Verdict {
  if (ch.archived) return no('این کانال حذف شده است')
  if (s.blocked) return no('پخش زنده‌ی این باشگاه توسط مدیریت بیلیارد هاب مسدود شده است')
  if (ch.adminBlocked) return no('این کانال توسط مدیریت بیلیارد هاب مسدود شده است')
  if (ch.isLive) return no('این کانال هم‌اکنون در حالِ پخش است')
  if (ch.adminAttached) return { ok: true }
  if (ch.kind === 'table' && s.tier !== 'pro') return no('کانالِ میز مخصوصِ باشگاه‌های حرفه‌ای است')
  if (ch.kind !== 'tournament' && ch.rank >= channelLimitOf(s)) {
    return no(`این کانال بیرون از سقفِ فعلیِ باشگاه (${channelLimitOf(s)}) است`)
  }
  return { ok: true }
}

/** «اعضا» = هر کاربرِ واردشده؛ «عمومی» = همه، بدونِ ثبت‌نام */
export function canWatch(access: ChannelAccess, loggedIn: boolean): boolean {
  return access === 'public' || loggedIn
}

/** پخشِ رهاشده: بیش از سقف از شروعش گذشته */
export function isStale(startedAtMs: number, now = Date.now()): boolean {
  return Number.isFinite(startedAtMs) && now - startedAtMs > MAX_BROADCAST_MS
}

export interface BroadcastLike { startedAt: string; endedAt: string | null; peakViewers: number; viewerSeconds: number }

/** آمارِ ساعاتِ پخش برای پنلِ مدیریت. پخشِ باز تا «اکنون» حساب می‌شود. */
export function summarize(rows: BroadcastLike[], now = Date.now()) {
  let ms = 0, peak = 0, viewerSeconds = 0
  for (const r of rows) {
    const a = Date.parse(r.startedAt)
    const b = r.endedAt ? Date.parse(r.endedAt) : now
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) ms += Math.min(b - a, MAX_BROADCAST_MS)
    peak = Math.max(peak, r.peakViewers || 0)
    viewerSeconds += r.viewerSeconds || 0
  }
  return {
    count: rows.length,
    hours: Math.round(ms / 36_000) / 100,
    peakViewers: peak,
    viewerHours: Math.round(viewerSeconds / 36) / 100,
  }
}
