/* ─────────────────────────────────────────────────────────────
   سهمیه‌ی آگهی — کامل ساخته شده ولی تا وقتی ادمین کلیدش را نزند،
   هیچ محدودیتی اعمال نمی‌شود.

   منبعِ شمارش، جدولِ products روی سرور است (نه مرورگرِ کاربر)، وگرنه
   با پاک‌کردنِ حافظه‌ی مرورگر هر محدودیتی دور زده می‌شد.

   ترتیبِ سهمیه:
     ۱) اگر کلیدِ ads_quota_enabled خاموش باشد ⇒ نامحدود
     ۲) اگر کاربر پلنِ فعال داشته باشد ⇒ سهمیه‌ی همان پلن
     ۳) وگرنه ⇒ سهمیه‌ی رایگانِ نقشِ کاربر (ads_free_quota)

   سهمیه‌ی رایگان به‌ازای هر نقش جداست: فروشگاه‌دار طبیعتاً بیشتر از
   کاربرِ عادی آگهی می‌گذارد. کاربری که چند نقش دارد، سخاوتمندانه‌ترین
   سهمیه را می‌گیرد — نه اینکه گرفتنِ نقشِ تازه محدودش کند.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'

export type Period = 'day' | 'week' | 'month'

export interface QuotaState {
  enabled: boolean          // آیا محدودیت اصلاً فعال است؟
  allowed: boolean          // آیا همین حالا می‌تواند آگهی بگذارد؟
  used: number
  limit: number             // ۰ = نامحدود
  period: Period
  resetAt: string | null    // زمانِ صفرشدنِ شمارنده
  planName: string | null   // پلنِ فعال، اگر دارد
  planExpiresAt: string | null
  role?: string             // نقشی که سهمیه از آن آمده
  message?: string
}

const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
}

const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }

/* ── سهمیه‌ی رایگان، به تفکیکِ نقش ───────────────────────────── */

export const QUOTA_ROLES = [
  'user', 'player', 'coach', 'referee', 'technician', 'seller', 'manufacturer', 'club_owner',
] as const
export type QuotaRole = typeof QUOTA_ROLES[number]

export const ROLE_FA: Record<QuotaRole, string> = {
  user: 'کاربر عادی', player: 'بازیکن', coach: 'مربی', referee: 'داور',
  technician: 'خدمات فنی', seller: 'فروشنده', manufacturer: 'تولیدکننده', club_owner: 'باشگاه‌دار',
}

export interface RoleQuota { quota: number; period: Period }
export interface FreeQuotaSetting {
  /* نقشی که در roles نیامده، از این می‌خواند */
  default: RoleQuota
  roles: Partial<Record<QuotaRole, RoleQuota>>
}

export const DEFAULT_FREE_QUOTA: FreeQuotaSetting = {
  default: { quota: 3, period: 'week' },
  roles: {
    user: { quota: 3, period: 'week' },
    player: { quota: 3, period: 'week' },
    coach: { quota: 5, period: 'week' },
    referee: { quota: 3, period: 'week' },
    technician: { quota: 5, period: 'week' },
    seller: { quota: 20, period: 'week' },
    manufacturer: { quota: 20, period: 'week' },
    club_owner: { quota: 10, period: 'week' },
  },
}

const isPeriod = (v: unknown): v is Period => v === 'day' || v === 'week' || v === 'month'

/** ورودیِ ذخیره‌شده (که ممکن است شکلِ قدیمیِ {quota,period} باشد) → شکلِ استاندارد */
export function normalizeFreeQuota(raw: unknown): FreeQuotaSetting {
  if (!raw || typeof raw !== 'object') return DEFAULT_FREE_QUOTA
  const o = raw as Record<string, unknown>

  /* شکلِ قدیمی: یک سهمیه برای همه */
  if (typeof o.quota === 'number' && !o.roles && !o.default) {
    const one: RoleQuota = { quota: Math.max(0, o.quota), period: isPeriod(o.period) ? o.period : 'week' }
    return { default: one, roles: Object.fromEntries(QUOTA_ROLES.map(r => [r, one])) }
  }

  const readOne = (v: unknown, fb: RoleQuota): RoleQuota => {
    if (!v || typeof v !== 'object') return fb
    const x = v as Record<string, unknown>
    return {
      quota: typeof x.quota === 'number' ? Math.max(0, Math.round(x.quota)) : fb.quota,
      period: isPeriod(x.period) ? x.period : fb.period,
    }
  }

  const def = readOne(o.default, DEFAULT_FREE_QUOTA.default)
  const rolesIn = (o.roles && typeof o.roles === 'object' ? o.roles : {}) as Record<string, unknown>
  const roles: Partial<Record<QuotaRole, RoleQuota>> = {}
  for (const r of QUOTA_ROLES) {
    if (rolesIn[r] !== undefined) roles[r] = readOne(rolesIn[r], def)
  }
  return { default: def, roles }
}

/** سخاوتمندانه‌ترین سهمیه بینِ نقش‌های کاربر — بر مبنای «تعداد در روز» */
export function pickRoleQuota(setting: FreeQuotaSetting, roles: string[]): { quota: RoleQuota; role: string } {
  const perDay = (q: RoleQuota) => (q.quota <= 0 ? Infinity : q.quota / (PERIOD_MS[q.period] / PERIOD_MS.day))

  let best: { quota: RoleQuota; role: string } | null = null
  for (const r of roles) {
    if (!(QUOTA_ROLES as readonly string[]).includes(r)) continue
    const q = setting.roles[r as QuotaRole] ?? setting.default
    if (!best || perDay(q) > perDay(best.quota)) best = { quota: q, role: r }
  }
  return best ?? { quota: setting.default, role: 'user' }
}

/** خواندنِ یک تنظیم؛ نبودِ جدول یا کلید نباید چیزی را بشکند */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await sb().from('app_settings').select('value').eq('key', key).maybeSingle()
    if (error || !data) return fallback
    const v = (data as { value: unknown }).value
    return (v === null || v === undefined ? fallback : v) as T
  } catch { return fallback }
}

/** شروعِ بازه‌ی جاری (پنجره‌ی متحرک) */
function windowStart(period: Period): Date {
  return new Date(Date.now() - PERIOD_MS[period])
}

/** پلنِ فعالِ کاربر، اگر دارد */
export async function activePlan(userId: string): Promise<{
  name: string; quota: number; period: Period; expiresAt: string
} | null> {
  try {
    const { data, error } = await sb()
      .from('user_ad_plans')
      .select('quota, period, expires_at, ad_plans(name)')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
    if (error || !data || data.length === 0) return null
    const r = data[0] as unknown as {
      quota: number; period: Period; expires_at: string; ad_plans?: { name?: string } | { name?: string }[]
    }
    const plan = Array.isArray(r.ad_plans) ? r.ad_plans[0] : r.ad_plans
    return { name: plan?.name ?? 'پلن آگهی', quota: r.quota, period: r.period, expiresAt: r.expires_at }
  } catch { return null }
}

/** نقش‌های کاربر — سهمیه‌ی رایگان از روی همین‌ها انتخاب می‌شود */
async function rolesOf(userId: string): Promise<string[]> {
  try {
    const { data } = await sb().from('users').select('primaryRole,secondaryRoles').eq('id', userId).maybeSingle()
    if (!data) return ['user']
    const u = data as { primaryRole?: string; secondaryRoles?: string[] }
    const list = [u.primaryRole, ...(u.secondaryRoles ?? [])].filter(Boolean) as string[]
    return list.length ? list : ['user']
  } catch { return ['user'] }
}

/** چند آگهی در بازه‌ی جاری ثبت کرده؟ */
async function usedInWindow(userId: string, period: Period): Promise<number> {
  try {
    const { count, error } = await sb()
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('sellerId', userId)
      .gte('createdAt', windowStart(period).toISOString())
    if (error) return 0
    return count ?? 0
  } catch { return 0 }
}

/** وضعیتِ کاملِ سهمیه‌ی کاربر — هم برای اجازه‌دادن، هم برای نمایش در پنل */
export async function getQuotaState(userId: string): Promise<QuotaState> {
  const enabled = await getSetting<boolean>('ads_quota_enabled', false)

  const plan = await activePlan(userId)
  const freeRaw = await getSetting<unknown>('ads_free_quota', DEFAULT_FREE_QUOTA)
  const free = normalizeFreeQuota(freeRaw)

  let period: Period
  let limit: number
  let role: string | undefined

  if (plan) {
    period = plan.period
    limit = plan.quota
  } else {
    const picked = pickRoleQuota(free, await rolesOf(userId))
    period = picked.quota.period
    limit = picked.quota.quota
    role = picked.role
  }

  const used = await usedInWindow(userId, period)

  const base = {
    enabled,
    used,
    limit,
    period,
    resetAt: new Date(Date.now() + PERIOD_MS[period]).toISOString(),
    planName: plan?.name ?? null,
    planExpiresAt: plan?.expiresAt ?? null,
    ...(role ? { role } : {}),
  }

  /* خاموش ⇒ هیچ محدودیتی نیست */
  if (!enabled) return { ...base, allowed: true }
  /* سهمیه‌ی صفر یعنی نامحدود (برای پلن‌های ویژه) */
  if (limit <= 0) return { ...base, allowed: true }

  if (used >= limit) {
    return {
      ...base,
      allowed: false,
      message: plan
        ? `سهمیه‌ی آگهیِ پلنِ «${plan.name}» شما در این ${PERIOD_FA[period]} تمام شده است. برای ثبت آگهی بیشتر، پلن خود را ارتقا دهید.`
        : `سهمیه‌ی رایگانِ شما در این ${PERIOD_FA[period]} تمام شده است. برای ثبت آگهی بیشتر، یکی از بسته‌های آگهی را تهیه کنید.`,
    }
  }
  return { ...base, allowed: true }
}
