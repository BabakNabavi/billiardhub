/* ─────────────────────────────────────────────────────────────
   سهمیه‌ی استوری — آینه‌ی سهمیه‌ی آگهی، ولی برای استوری.

   شمارش از همان جاییست که خودِ استوری‌ها ذخیره می‌شوند (فایلِ ایندکس
   روی سرور)، نه از مرورگرِ کاربر.

   ترتیب — دقیقاً مثلِ آگهی:
     ۱) کلیدِ stories_quota_enabled خاموش ⇒ هیچ محدودیتی نیست
     ۲) بسته‌ی فعال ⇒ سهمیه‌ی همان بسته
     ۳) وگرنه ⇒ سهمیه‌ی رایگانِ نقش
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'
import {
  getSetting, normalizeFreeQuota, pickRoleQuota,
  QUOTA_ROLES, ROLE_FA, type FreeQuotaSetting, type Period,
} from '../ads/quota'

export type { Period }
export { QUOTA_ROLES, ROLE_FA }

const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
}
const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }

/* پیش‌فرض = همان اعدادِ هاردکدِ قبلی، تا رفتارِ امروز عوض نشود */
export const DEFAULT_STORY_QUOTA: FreeQuotaSetting = {
  default: { quota: 2, period: 'day' },
  roles: {
    user: { quota: 0, period: 'day' },
    player: { quota: 2, period: 'day' },
    coach: { quota: 2, period: 'day' },
    referee: { quota: 1, period: 'day' },
    technician: { quota: 2, period: 'day' },
    seller: { quota: 4, period: 'day' },
    manufacturer: { quota: 2, period: 'day' },
    club_owner: { quota: 3, period: 'day' },
  },
}

export interface StoryQuotaState {
  enabled: boolean          // فروشِ بسته فعال است؟
  allowed: boolean
  used: number
  limit: number             // ۰ = نامحدود
  period: Period
  resetAt: string | null
  planName: string | null
  planExpiresAt: string | null
  role?: string
  message?: string
}

export async function activeStoryPlan(userId: string): Promise<{
  name: string; quota: number; period: Period; expiresAt: string
} | null> {
  try {
    const { data, error } = await sb()
      .from('user_story_plans')
      .select('quota, period, expires_at, story_plans(name)')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
    if (error || !data || data.length === 0) return null
    const r = data[0] as unknown as {
      quota: number; period: Period; expires_at: string; story_plans?: { name?: string } | { name?: string }[]
    }
    const plan = Array.isArray(r.story_plans) ? r.story_plans[0] : r.story_plans
    return { name: plan?.name ?? 'بسته‌ی استوری', quota: r.quota, period: r.period, expiresAt: r.expires_at }
  } catch { return null }
}

async function rolesOf(userId: string): Promise<string[]> {
  try {
    const { data } = await sb().from('users').select('primaryRole,secondaryRoles').eq('id', userId).maybeSingle()
    if (!data) return ['user']
    const u = data as { primaryRole?: string; secondaryRoles?: string[] }
    const list = [u.primaryRole, ...(u.secondaryRoles ?? [])].filter(Boolean) as string[]
    return list.length ? list : ['user']
  } catch { return ['user'] }
}

/** سهمیه‌ی کاربر و اینکه چند تا از آن مصرف شده.
    `usedCount` را فراخوان می‌دهد چون منبعِ استوری‌ها فایلِ ایندکس است. */
export async function getStoryQuotaState(
  userId: string,
  countUsed: (period: Period) => Promise<number>,
  roleHint?: string,
): Promise<StoryQuotaState> {
  const enabled = await getSetting<boolean>('stories_quota_enabled', false)

  const plan = await activeStoryPlan(userId)
  const free = normalizeFreeQuota(await getSetting<unknown>('stories_free_quota', DEFAULT_STORY_QUOTA))

  let period: Period, limit: number, role: string | undefined

  if (plan) {
    period = plan.period
    limit = plan.quota
  } else {
    const roles = roleHint ? [roleHint] : await rolesOf(userId)
    const picked = pickRoleQuota(free, roles)
    period = picked.quota.period
    limit = picked.quota.quota
    role = picked.role
  }

  const used = await countUsed(period)

  const base = {
    enabled, used, limit, period,
    resetAt: new Date(Date.now() + PERIOD_MS[period]).toISOString(),
    planName: plan?.name ?? null,
    planExpiresAt: plan?.expiresAt ?? null,
    ...(role ? { role } : {}),
  }

  /* خاموش ⇒ هیچ محدودیتی نیست */
  if (!enabled) return { ...base, allowed: true }
  /* سهمیه‌ی صفرِ بسته یعنی نامحدود */
  if (limit <= 0 && plan) return { ...base, allowed: true }

  /* نقشی که اصلاً حقِ استوری ندارد */
  if (limit <= 0) {
    return {
      ...base, allowed: false,
      message: 'نقشِ شما سهمیه‌ی رایگانِ استوری ندارد؛ برای انتشار استوری یکی از بسته‌ها را تهیه کنید.',
    }
  }

  if (used >= limit) {
    return {
      ...base, allowed: false,
      message: plan
        ? `سهمیه‌ی استوریِ بسته‌ی «${plan.name}» شما در این ${PERIOD_FA[period]} تمام شده است.`
        : `سقفِ استوریِ این ${PERIOD_FA[period]} شما پر شده است. برای بیشتر، یکی از بسته‌های استوری را تهیه کنید.`,
    }
  }

  return { ...base, allowed: true }
}
