/* ─────────────────────────────────────────────────────────────
   سهمیه‌ی آگهی — کامل ساخته شده ولی تا وقتی ادمین کلیدش را نزند،
   هیچ محدودیتی اعمال نمی‌شود.

   منبعِ شمارش، جدولِ products روی سرور است (نه مرورگرِ کاربر)، وگرنه
   با پاک‌کردنِ حافظه‌ی مرورگر هر محدودیتی دور زده می‌شد.

   ترتیبِ سهمیه:
     ۱) اگر کلیدِ ads_quota_enabled خاموش باشد ⇒ نامحدود
     ۲) اگر کاربر پلنِ فعال داشته باشد ⇒ سهمیه‌ی همان پلن
     ۳) وگرنه ⇒ سهمیه‌ی رایگانِ پیش‌فرض (ads_free_quota)
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
  message?: string
}

const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
}

const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }

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
  const free = await getSetting<{ quota: number; period: Period }>('ads_free_quota', { quota: 3, period: 'week' })

  const period: Period = plan?.period ?? free.period ?? 'week'
  const limit = plan?.quota ?? free.quota ?? 0
  const used = await usedInWindow(userId, period)

  const base = {
    enabled,
    used,
    limit,
    period,
    resetAt: new Date(Date.now() + PERIOD_MS[period]).toISOString(),
    planName: plan?.name ?? null,
    planExpiresAt: plan?.expiresAt ?? null,
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
