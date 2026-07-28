/* ─────────────────────────────────────────────────────────────
   سهمیه‌ی آگهی — فاز ۳: شخص‌محور (Person-based).

   اصول:
     • سهمیه‌ی رایگان متعلق به «شخص» است (persons — با هشِ کد ملی
       یکتا می‌شود)، نه حساب و نه نقش. چند حسابِ یک نفر از یک
       سهمیه‌ی مشترک مصرف می‌کنند.
     • فقط نقش‌های «تأییدشده» سهمیه می‌سازند (پروفایلِ approved یا
       باشگاهِ verified) — primaryRole/secondaryRoles خوداظهاری‌اند
       و هیچ اثری بر سهمیه ندارند.
     • Free Quota = بیشینه‌ی سهمیه بینِ نقش‌های تأییدشده (جمع نمی‌شوند).
     • دوره‌ی ۳۰ روزه؛ مصرف در دفترِ quota_consumptions ثبت می‌شود و
       حذف/انقضای آگهی آن را پاک نمی‌کند ⇒ سهمیه برنمی‌گردد.
     • مصرف اتمیک است (bh_consume_quota با قفلِ ردیفِ شخص) — دو
       درخواستِ هم‌زمان، حتی از دو حسابِ یک شخص، از سقف رد نمی‌شوند.

   ترتیبِ سهمیه (مثل قبل):
     ۱) کلیدِ ads_quota_enabled خاموش ⇒ محدودیتی اعمال نمی‌شود
        (ولی مصرفِ free همچنان در دفتر ثبت می‌شود تا با روشن‌شدنش
        تاریخچه واقعی باشد)
     ۲) پلنِ فعالِ خریداری‌شده ⇒ سهمیه‌ی همان پلن (رفتارِ موجود؛
        اعتبارها در فاز ۵ به ad_credits منتقل می‌شوند)
     ۳) وگرنه ⇒ سهمیه‌ی رایگانِ شخص از ads_free_quota
   ───────────────────────────────────────────────────────────── */

import { sb, rpc } from '../finance/db'
import { lookupPersonForUser, verifiedRolesOfPerson } from '../identity'

export type Period = 'day' | 'week' | 'month'

export interface QuotaState {
  enabled: boolean          // آیا محدودیت اصلاً فعال است؟
  allowed: boolean          // آیا همین حالا می‌تواند آگهی بگذارد؟
  used: number
  limit: number             // ۰ = نامحدود
  period: Period
  resetAt: string | null    // کی یک جای خالی باز می‌شود
  planName: string | null   // پلنِ فعال، اگر دارد
  planExpiresAt: string | null
  role?: string             // نقشی که سهمیه از آن آمده
  verifiedRoles?: string[]  // نقش‌های تأییدشده‌ی شخص
  identityRequired?: boolean // کد ملیِ تأییدشده ندارد ⇒ سهمیه‌ی رایگان ندارد
  message?: string
}

const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
}

const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 }

const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'دوره‌ی ۳۰ روزه' }

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

/* اعدادِ مصوبِ فاز ۳ — دوره‌ی ۳۰ روزه (month) */
export const DEFAULT_FREE_QUOTA: FreeQuotaSetting = {
  default: { quota: 1, period: 'month' },
  roles: {
    user: { quota: 1, period: 'month' },
    player: { quota: 1, period: 'month' },
    referee: { quota: 1, period: 'month' },
    technician: { quota: 2, period: 'month' },
    coach: { quota: 2, period: 'month' },
    club_owner: { quota: 4, period: 'month' },
    manufacturer: { quota: 4, period: 'month' },
    seller: { quota: 4, period: 'month' },
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

/**
 * سخاوتمندانه‌ترین سهمیه بینِ نقش‌ها (MAX، نه جمع) — بر مبنای «تعداد در روز».
 *
 * صفر در موتورِ آگهی یعنی «نامحدود» (پس سخاوتمندترین)، ولی در موتورِ
 * استوری یعنی «این نقش اصلاً سهمیه ندارد». با zeroMeansNone، صفر
 * به‌جای بی‌نهایت، کمترین ارزش را می‌گیرد تا نقشِ صفرِ «کاربر عادی»
 * سهمیه‌ی نقشِ واقعیِ کاربر را از بین نبرد.
 */
export function pickRoleQuota(
  setting: FreeQuotaSetting,
  roles: string[],
  opts?: { zeroMeansNone?: boolean },
): { quota: RoleQuota; role: string } {
  const perDay = (q: RoleQuota) =>
    (q.quota <= 0
      ? (opts?.zeroMeansNone ? -1 : Infinity)
      : q.quota / (PERIOD_MS[q.period] / PERIOD_MS.day))

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

/** شروعِ بازه‌ی جاری (پنجره‌ی لغزان) */
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

/** شمارشِ آگهی‌های ثبت‌شده در بازه — فقط برای مسیرِ «پلنِ خریداری‌شده» (رفتارِ موجود) */
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

/* ── دفترِ مصرفِ شخص ─────────────────────────────────────────── */

/**
 * مصرفِ ثبت‌شده‌ی شخص در پنجره + زمانی که «یک جای خالی» باز می‌شود.
 *
 * وقتی مصرف از سقف بیشتر شده (مثلاً سهمیه بعد از تنزلِ نقش کم شده، یا
 * در دوره‌ی خاموشیِ enforcement ثبت شده)، جای خالی با خروجِ قدیمی‌ترین
 * مصرف باز نمی‌شود؛ باید آن‌قدر مصرف از پنجره خارج شود که used به
 * limit-1 برسد. پس ردیفِ تعیین‌کننده، (used-limit+1)اُمین مصرفِ قدیمی
 * است — نه اولی.
 */
async function ledgerUsed(personId: string, period: Period, limit: number)
  : Promise<{ used: number; freeSlotAt: string | null }> {
  try {
    const { count } = await sb()
      .from('quota_consumptions')
      .select('id', { count: 'exact', head: true })
      .eq('person_id', personId)
      .eq('kind', 'ad')
      .gt('consumed_at', windowStart(period).toISOString())

    const used = count ?? 0
    if (used === 0 || limit <= 0) return { used, freeSlotAt: null }

    /* چند مصرف باید از پنجره خارج شود تا یک جا باز شود */
    const need = Math.max(1, used - limit + 1)
    const { data } = await sb()
      .from('quota_consumptions')
      .select('consumed_at')
      .eq('person_id', personId)
      .eq('kind', 'ad')
      .gt('consumed_at', windowStart(period).toISOString())
      .order('consumed_at', { ascending: true })
      .range(need - 1, need - 1)

    const row = ((data as { consumed_at: string }[] | null) ?? [])[0]
    return {
      used,
      freeSlotAt: row ? new Date(new Date(row.consumed_at).getTime() + PERIOD_MS[period]).toISOString() : null,
    }
  } catch { return { used: 0, freeSlotAt: null } }
}

const IDENTITY_MSG = 'برای استفاده از سهمیه‌ی رایگانِ آگهی، ابتدا هویتِ خود (کد ملی) را از بخشِ پروفایل تأیید کنید.'
const SYSTEM_MSG = 'سیستمِ سهمیه موقتاً در دسترس نیست؛ چند لحظه بعد دوباره تلاش کنید'

/** وضعیتِ کاملِ سهمیه — هم برای اجازه‌دادن، هم برای نمایش در پنل */
export async function getQuotaState(userId: string): Promise<QuotaState> {
  const enabled = await getSetting<boolean>('ads_quota_enabled', false)

  const plan = await activePlan(userId)
  const freeRaw = await getSetting<unknown>('ads_free_quota', DEFAULT_FREE_QUOTA)
  const free = normalizeFreeQuota(freeRaw)

  /* ── مسیرِ پلنِ خریداری‌شده — دست‌نخورده از قبل ───────────── */
  if (plan) {
    const used = await usedInWindow(userId, plan.period)
    const base = {
      enabled,
      used,
      limit: plan.quota,
      period: plan.period,
      resetAt: new Date(Date.now() + PERIOD_MS[plan.period]).toISOString(),
      planName: plan.name,
      planExpiresAt: plan.expiresAt,
    }
    if (!enabled || plan.quota <= 0 || used < plan.quota) return { ...base, allowed: true }
    return {
      ...base,
      allowed: false,
      message: `سهمیه‌ی آگهیِ پلنِ «${plan.name}» شما در این ${PERIOD_FA[plan.period]} تمام شده است. برای ثبت آگهی بیشتر، پلن خود را ارتقا دهید.`,
    }
  }

  /* ── مسیرِ سهمیه‌ی رایگانِ شخص‌محور ──────────────────────── */
  const lookup = await lookupPersonForUser(userId)
  const personId = lookup.personId

  if (!personId) {
    /* شخص ندارد: یا هویتش تأیید نشده (identityRequired) یا دیتابیس
       خطا داده (personError) — پیام و رفتارِ این دو یکی نیست */
    const identityRequired = lookup.reason === 'no_identity'
    const picked = pickRoleQuota(free, ['user'])
    return {
      enabled,
      allowed: !enabled,
      used: 0,
      limit: picked.quota.quota,
      period: picked.quota.period,
      resetAt: null,
      planName: null,
      planExpiresAt: null,
      role: 'user',
      verifiedRoles: [],
      identityRequired,
      ...(enabled ? { message: identityRequired ? IDENTITY_MSG : SYSTEM_MSG } : {}),
    }
  }

  const roles = await verifiedRolesOfPerson(personId)
  const picked = pickRoleQuota(free, roles)
  const period = picked.quota.period
  const limit = picked.quota.quota
  const { used, freeSlotAt } = await ledgerUsed(personId, period, limit)

  const base = {
    enabled,
    used,
    limit,
    period,
    /* زمانِ بازشدنِ اولین جای خالی (با در نظر گرفتنِ مصرفِ مازاد) */
    resetAt: freeSlotAt,
    planName: null,
    planExpiresAt: null,
    role: picked.role,
    verifiedRoles: roles,
  }

  if (!enabled) return { ...base, allowed: true }
  /* سهمیه‌ی صفر یعنی نامحدود (قراردادِ موجودِ پنلِ ادمین) */
  if (limit <= 0) return { ...base, allowed: true }

  if (used >= limit) {
    return {
      ...base,
      allowed: false,
      message: `سهمیه‌ی رایگانِ شما در این ${PERIOD_FA[period]} تمام شده است. حذفِ آگهی سهمیه را برنمی‌گرداند؛ برای ثبت آگهی بیشتر، یکی از بسته‌های آگهی را تهیه کنید.`,
    }
  }
  return { ...base, allowed: true }
}

/* ── مصرفِ اتمیکِ سهمیه (دروازه‌ی ثبتِ آگهی) ─────────────────── */

export type ConsumeResult =
  | { ok: true; consumptionId: string | null; used: number; limit: number }
  | { ok: false; status: number; body: Record<string, unknown> }

/**
 * دروازه‌ی ثبتِ آگهی: بررسی و مصرفِ سهمیه در یک قدم.
 *   • مسیرِ پلن: مثل قبل (شمارشِ products؛ اعتبارِ فاز ۵ بعداً)
 *   • مسیرِ رایگان: مصرفِ اتمیک با bh_consume_quota — حتی وقتی
 *     enforcement خاموش است ثبت می‌شود (با سقفِ ۰ = فقط ثبت) تا
 *     تاریخچه برای روزِ روشن‌شدن واقعی باشد.
 * اگر ثبتِ آگهی بعداً شکست خورد، releaseConsumption را با
 * consumptionId صدا بزنید (جبرانِ خطای فنی — «حذفِ آگهی» نیست).
 */
export async function consumeAdQuota(userId: string, refId?: string | null): Promise<ConsumeResult> {
  const state = await getQuotaState(userId)

  const reject = (status: number, extra: Record<string, unknown> = {}): ConsumeResult => ({
    ok: false,
    status,
    body: {
      message: state.message ?? 'سهمیه‌ی آگهی در دسترس نیست',
      quotaExceeded: true,
      quota: { used: state.used, limit: state.limit, period: state.period, resetAt: state.resetAt },
      ...extra,
    },
  })

  /* مسیرِ پلنِ خریداری‌شده — بدونِ دفترِ شخص (رفتارِ موجود) */
  if (state.planName) {
    if (!state.allowed) return reject(429)
    return { ok: true, consumptionId: null, used: state.used + 1, limit: state.limit }
  }

  /* مسیرِ رایگان — شخص لازم است */
  const lookup = await lookupPersonForUser(userId)
  const personId = lookup.personId
  if (!personId) {
    if (!state.enabled) {
      /* enforcement خاموش و شخصی نیست که برایش ثبت کنیم */
      return { ok: true, consumptionId: null, used: state.used, limit: state.limit }
    }
    /* هویت تأیید نشده ⇒ پیامِ راهنما؛ خطای زیرساخت ⇒ fail-closed موقت */
    if (lookup.reason === 'no_identity') {
      return { ok: false, status: 429, body: { message: IDENTITY_MSG, quotaExceeded: true, identityRequired: true } }
    }
    return { ok: false, status: 503, body: { message: SYSTEM_MSG } }
  }

  const { data, error } = await rpc<{ ok: boolean; used?: number; limit?: number; consumption_id?: string }>(
    'bh_consume_quota',
    {
      p_person_id: personId,
      p_user_id: userId,
      /* خاموش ⇒ سقفِ ۰ (فقط ثبتِ مصرف)؛ روشن ⇒ سقفِ واقعی */
      p_limit: state.enabled ? state.limit : 0,
      p_window_days: PERIOD_DAYS[state.period],
      p_ref: refId ?? null,
    },
  )

  if (error || !data) {
    if (!state.enabled) {
      /* ثبتِ best-effort شکست خورد؛ جلوی کاربر را نمی‌گیریم */
      return { ok: true, consumptionId: null, used: state.used, limit: state.limit }
    }
    /* enforcement روشن است: خطای دیتابیس نباید سهمیه را دورزدنی کند (fail-closed) */
    return {
      ok: false,
      status: 503,
      body: { message: 'سیستمِ سهمیه موقتاً در دسترس نیست؛ چند لحظه بعد دوباره تلاش کنید' },
    }
  }

  if (!data.ok) {
    /* باختنِ رقابتِ هم‌زمان: شمارشِ لحظه‌ی چکِ اولیه کهنه است و تابع
       دیتابیس عددِ واقعی را برگردانده — همان را به کاربر می‌دهیم تا
       پیام و اعداد با هم نخوانند نشود. */
    const used = typeof data.used === 'number' ? data.used : state.used
    const limit = typeof data.limit === 'number' && data.limit > 0 ? data.limit : state.limit
    return {
      ok: false,
      status: 429,
      body: {
        message: state.message
          ?? `سهمیه‌ی رایگانِ شما در این ${PERIOD_FA[state.period]} تمام شده است. حذفِ آگهی سهمیه را برنمی‌گرداند؛ برای ثبت آگهی بیشتر، یکی از بسته‌های آگهی را تهیه کنید.`,
        quotaExceeded: true,
        quota: { used, limit, period: state.period, resetAt: state.resetAt },
      },
    }
  }

  return {
    ok: true,
    consumptionId: data.consumption_id ?? null,
    used: data.used ?? state.used + 1,
    limit: data.limit ?? state.limit,
  }
}

/** جبرانِ خطای فنی: اگر درجِ آگهی پس از مصرف شکست، همان یک ردیف آزاد می‌شود */
export async function releaseConsumption(consumptionId: string): Promise<void> {
  try {
    await sb().from('quota_consumptions').delete().eq('id', consumptionId)
  } catch { /* در بدترین حالت یک مصرفِ اضافه ثبت مانده — به نفعِ سخت‌گیری */ }
}

/** پس از درجِ موفقِ آگهی، شناسه‌اش روی ردیفِ مصرف ثبت می‌شود (اطلاعاتی) */
export async function attachConsumptionRef(consumptionId: string, refId: string): Promise<void> {
  try {
    await sb().from('quota_consumptions').update({ ref_id: refId }).eq('id', consumptionId)
  } catch { /* اطلاعاتی است؛ شکستش مهم نیست */ }
}
