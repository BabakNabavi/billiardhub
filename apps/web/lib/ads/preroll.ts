import { createHmac } from 'crypto'
import { getSupabaseServer } from '../supabase-server'

/* ─────────────────────────────────────────────────────────────
   تبلیغِ پیش‌پخشِ ویدیو — انتخاب و شمارش.

   ── چه چیزی *ساخته نشد* ──
   هیچ سیستمِ موازی. جایگاه، کمپین، سفارش، پرداخت، بازبینیِ ادمین و
   داشبورد همه از قبل هستند و همان‌ها استفاده می‌شوند. این فایل فقط دو
   کار می‌کند که مخصوصِ ویدیو است: «کدام تبلیغ را نشان بده» و «چطور
   بشمار که قابلِ جعل نباشد».
   ───────────────────────────────────────────────────────────── */

export const PREROLL_KEY = 'media_preroll'

export interface PrerollAd {
  campaignId: string
  title: string
  videoUrl: string
  clickUrl: string | null
  /** پس از چند ثانیه دکمه‌ی «رد کردن» ظاهر شود؛ null یعنی هرگز */
  skipAfterSec: number | null
  /** سقفِ مدت — پلیر بعد از آن به هر حال به ویدیوی اصلی می‌رود */
  maxDurationSec: number | null
}

interface CampaignRow {
  id: string
  title: string
  content: Record<string, unknown> | null
  weight: number
  impressions: number
  impression_limit: number
  daily_cap_per_viewer: number
}

/**
 * شناسه‌ی بیننده — هشِ برگشت‌ناپذیرِ IP و مرورگر.
 *
 * برای «همان بیننده؟» کافی است و چیزی درباره‌ی شخص نگه نمی‌دارد.
 * سمتِ سرور ساخته می‌شود، نه کلاینت: هر چیزی که کلاینت بفرستد قابلِ
 * عوض‌کردن است و سقفِ فراوانی را بی‌معنی می‌کند.
 */
export function viewerHash(ip: string | null, ua: string | null): string | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  return 'a_' + createHmac('sha256', secret)
    .update([ip ?? '', ua ?? ''].join('|'))
    .digest('hex').slice(0, 24)
}

/** انتخابِ وزنی — شانسِ هر کمپین به نسبتِ وزنش. */
function pickWeighted(rows: CampaignRow[]): CampaignRow | null {
  const pool = rows.filter(r => (r.weight ?? 1) > 0)
  if (!pool.length) return rows[0] ?? null
  const total = pool.reduce((s, r) => s + r.weight, 0)
  let n = Math.random() * total
  for (const r of pool) { n -= r.weight; if (n <= 0) return r }
  return pool[pool.length - 1]!
}

/**
 * تبلیغِ مناسب برای این بیننده — یا `null`.
 *
 * `null` حالتِ عادی است، نه خطا: جایگاه غیرفعال باشد، کمپینِ فعالی
 * نباشد، یا سقفِ بیننده پر شده باشد. پلیر در هر سه حالت ویدیوی اصلی
 * را بدونِ تبلیغ پخش می‌کند.
 */
export async function pickPreroll(viewer: string | null): Promise<PrerollAd | null> {
  const sb = getSupabaseServer()

  const { data: pl } = await sb.from('placements')
    .select('is_active,skip_after_sec,max_duration_sec,capacity')
    .eq('key', PREROLL_KEY).maybeSingle()
  const placement = pl as {
    is_active: boolean; skip_after_sec: number | null
    max_duration_sec: number | null; capacity: number
  } | null
  if (!placement?.is_active) return null

  const now = new Date().toISOString()
  const { data, error } = await sb.from('campaigns')
    .select('id,title,content,weight,impressions,impression_limit,daily_cap_per_viewer')
    .eq('placement_key', PREROLL_KEY)
    .eq('status', 'ACTIVE')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('sort_order', { ascending: true })
    .limit(50)

  if (error) { console.error('[preroll] pick:', error.message); return null }
  let rows = (data ?? []) as CampaignRow[]
  if (!rows.length) return null

  /* سقفِ کلِ نمایش — با رسیدن به آن کمپین کنار می‌رود */
  rows = rows.filter(r => !r.impression_limit || Number(r.impressions) < Number(r.impression_limit))

  /* ویدیو باید واقعاً وجود داشته باشد؛ کمپینِ بی‌فایل نباید انتخاب
     شود و باعثِ مکثِ بی‌دلیل در پلیر بشود. */
  rows = rows.filter(r => typeof r.content?.videoUrl === 'string' && (r.content.videoUrl as string).length > 8)
  if (!rows.length) return null

  /* سقفِ فراوانی: کمپین‌هایی که این بیننده امروز به سقفشان رسیده
     کنار می‌روند. یک کوئری برای همه، نه یکی به‌ازای هر کمپین. */
  if (viewer) {
    const capped = rows.filter(r => r.daily_cap_per_viewer > 0)
    if (capped.length) {
      const { data: seen } = await sb.from('campaign_impressions')
        .select('campaign_id,seen_count')
        .eq('viewer', viewer)
        .eq('bucket', new Date().toISOString().slice(0, 10))
        .in('campaign_id', capped.map(r => r.id))
      const byId = new Map((seen ?? []).map(r => [
        (r as { campaign_id: string }).campaign_id,
        Number((r as { seen_count: number }).seen_count) || 0,
      ]))
      rows = rows.filter(r =>
        r.daily_cap_per_viewer <= 0 || (byId.get(r.id) ?? 0) < r.daily_cap_per_viewer)
    }
  }
  if (!rows.length) return null

  const win = pickWeighted(rows)
  if (!win) return null

  const c = win.content ?? {}
  return {
    campaignId: win.id,
    title: win.title || '',
    videoUrl: String(c.videoUrl ?? ''),
    clickUrl: typeof c.clickUrl === 'string' && c.clickUrl ? c.clickUrl : null,
    skipAfterSec: placement.skip_after_sec,
    maxDurationSec: placement.max_duration_sec,
  }
}

export type AdEvent = 'impression' | 'complete' | 'skip' | 'click'

/**
 * ثبتِ رویداد.
 *
 * ── چرا `impression` جدا از بقیه است ──
 * نمایش از راهِ یک تابعِ دیتابیسی ثبت می‌شود که کلیدِ اصلی‌اش
 * (کمپین، بیننده، روز) است: تلاشِ دوم به تضادِ کلید می‌خورد و شمارنده
 * بالا نمی‌رود. بدونِ آن، هر کسی می‌توانست با درخواستِ تکراری هزار
 * نمایش بسازد.
 *
 * ── و چرا بقیه به آن گره خورده‌اند ──
 * «تماشای کامل»، «رد شد» و «کلیک» فقط وقتی شمرده می‌شوند که همین
 * بیننده امروز واقعاً نمایشی از این کمپین گرفته باشد. یعنی نمی‌شود
 * بدونِ دیدنِ تبلیغ برایش کلیک ساخت.
 */
export async function trackAdEvent(
  campaignId: string,
  event: AdEvent,
  viewer: string | null,
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(campaignId) || !viewer) return false
  const sb = getSupabaseServer()

  if (event === 'impression') {
    const { data, error } = await sb.rpc('count_ad_impression', {
      p_campaign: campaignId, p_viewer: viewer,
    })
    if (error) { console.error('[preroll] impression:', error.message); return false }
    return Number(data) > 0
  }

  /* بدونِ نمایشِ ثبت‌شده‌ی همین بیننده، هیچ رویدادِ دیگری پذیرفته
     نمی‌شود — این گرهِ ضدِجعل است. */
  const { data: seen } = await sb.from('campaign_impressions')
    .select('campaign_id')
    .eq('campaign_id', campaignId)
    .eq('viewer', viewer)
    .eq('bucket', new Date().toISOString().slice(0, 10))
    .maybeSingle()
  if (!seen) return false

  const col = event === 'complete' ? 'completed_views'
    : event === 'skip' ? 'skipped_views' : 'clicks'

  const { error } = await sb.rpc('increment_campaign_counter', {
    p_campaign: campaignId, p_column: col,
  })
  if (error) { console.error('[preroll] ' + event + ':', error.message); return false }
  return true
}
