/* ─────────────────────────────────────────────────────────────
   هسته‌ی سیستم تبلیغات (فاز ۲) — Placement / Campaign / Pricing Plan.

   جایگزینِ lib/ads/slots.ts. سه اصل:
   ● شش جایگاهِ مستقل؛ نمایش فقط با placement.is_active — «هیچ کلیدِ
     سراسری‌ای وجود ندارد».
   ● کمپین یا «بنر» است یا «ارجاع به موجودیت» (محصول/باشگاه/فروشگاه)
     برای سکشن‌های ویژه‌ی صفحه‌ی اصلی.
   ● انقضا دو لایه است: فیلترِ پنجره‌ی زمانی هنگامِ خواندن (هیچ بنرِ
     تمام‌شده‌ای هرگز نمایش داده نمی‌شود) + cron که status را به
     EXPIRED می‌برد تا پنل ادمین هم واقعیت را نشان دهد.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'

/* ── جایگاه‌ها ────────────────────────────────────────────────── */

export const PLACEMENT_KEYS = [
  'market_featured_products_homepage',
  'featured_clubs_homepage',
  'featured_equipment_stores_homepage',
  'equipment_ads_right',
  'equipment_ads_left',
  'homepage_bottom_banner',
] as const
export type PlacementKey = typeof PLACEMENT_KEYS[number]

export const isPlacementKey = (v: unknown): v is PlacementKey =>
  (PLACEMENT_KEYS as readonly string[]).includes(String(v))

/* کلیدهای قدیمیِ ad_slots → معادلِ تازه؛ برای کلاینت‌های کش‌شده و
   درخواست‌های تبلیغِ قبلی */
export const LEGACY_KEY_MAP: Record<string, PlacementKey> = {
  market_1: 'equipment_ads_right',
  market_2: 'equipment_ads_left',
  footer: 'homepage_bottom_banner',
}

export type PlacementMode = 'free' | 'manual' | 'paid'
export type ContentKind = 'banner' | 'entity'
export type EntityType = 'product' | 'club' | 'seller'

export interface Placement {
  key: PlacementKey
  title: string
  description: string | null
  section: string
  isActive: boolean
  mode: PlacementMode
  contentKind: ContentKind
  entityType: EntityType | null
  capacity: number
  price: number
  durationDays: number
  sortOrder: number
}

type DbPlacement = {
  key: PlacementKey; title: string; description: string | null; section: string
  is_active: boolean; mode: PlacementMode; content_kind: ContentKind
  entity_type: EntityType | null; capacity: number; price: number
  duration_days: number; sort_order: number
}

const toPlacement = (r: DbPlacement): Placement => ({
  key: r.key, title: r.title, description: r.description, section: r.section,
  isActive: r.is_active, mode: r.mode, contentKind: r.content_kind,
  entityType: r.entity_type, capacity: r.capacity, price: Number(r.price) || 0,
  durationDays: r.duration_days, sortOrder: r.sort_order,
})

const missing = (m?: string) => /does not exist|schema cache/i.test(m ?? '')

export async function listPlacements(): Promise<Placement[]> {
  const { data, error } = await sb().from('placements').select('*').order('sort_order', { ascending: true })
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbPlacement[] ?? []).map(toPlacement)
}

export async function getPlacement(key: string): Promise<Placement | null> {
  const { data, error } = await sb().from('placements').select('*').eq('key', key).maybeSingle()
  if (error || !data) return null
  return toPlacement(data as DbPlacement)
}

/** تنظیماتِ مستقلِ هر جایگاه — is_active و mode جدا از هم (بدون کلیدِ سراسری) */
export async function updatePlacement(key: string, patch: Partial<{
  isActive: boolean; mode: PlacementMode; capacity: number; price: number
  durationDays: number; title: string; description: string
}>): Promise<Placement | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.isActive !== undefined) row.is_active = patch.isActive
  if (patch.mode !== undefined && ['free', 'manual', 'paid'].includes(patch.mode)) row.mode = patch.mode
  if (patch.capacity !== undefined) row.capacity = Math.max(0, Math.round(patch.capacity))
  if (patch.price !== undefined) row.price = Math.max(0, Math.round(patch.price))
  if (patch.durationDays !== undefined) row.duration_days = Math.max(1, Math.round(patch.durationDays))
  if (patch.title !== undefined) row.title = patch.title
  if (patch.description !== undefined) row.description = patch.description

  const { data, error } = await sb().from('placements').update(row).eq('key', key).select().single()
  if (error || !data) return null
  return toPlacement(data as DbPlacement)
}

/* ── کمپین‌ها ─────────────────────────────────────────────────── */

export const CAMPAIGN_STATUSES = [
  'DRAFT', 'PENDING_PAYMENT', 'PENDING_REVIEW', 'SCHEDULED',
  'ACTIVE', 'EXPIRED', 'REJECTED', 'CANCELLED',
] as const
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

export const isCampaignStatus = (v: unknown): v is CampaignStatus =>
  (CAMPAIGN_STATUSES as readonly string[]).includes(String(v))

export interface BannerContent { image_url: string; link_url: string }
export interface EntityContent { entity_type: EntityType; ref: string }

export interface Campaign {
  id: string
  placementKey: PlacementKey
  userId: string | null
  advertiser: string
  title: string
  content: BannerContent | EntityContent | Record<string, unknown>
  status: CampaignStatus
  startsAt: string
  endsAt: string
  weight: number
  sortOrder: number
  impressions: number
  clicks: number
  adminNote: string | null
  createdAt: string
}

type DbCampaign = {
  id: string; placement_key: PlacementKey; user_id: string | null
  advertiser: string; title: string; content: Record<string, unknown>
  status: CampaignStatus; starts_at: string; ends_at: string
  weight: number; sort_order: number; impressions: number; clicks: number
  admin_note: string | null; created_at: string
}

const toCampaign = (r: DbCampaign): Campaign => ({
  id: r.id, placementKey: r.placement_key, userId: r.user_id,
  advertiser: r.advertiser, title: r.title,
  content: r.content ?? {}, status: r.status,
  startsAt: r.starts_at, endsAt: r.ends_at,
  weight: r.weight, sortOrder: r.sort_order,
  impressions: Number(r.impressions) || 0, clicks: Number(r.clicks) || 0,
  adminNote: r.admin_note, createdAt: r.created_at,
})

export async function listCampaigns(filter: { placementKey?: string; status?: string } = {}): Promise<Campaign[]> {
  let q = sb().from('campaigns').select('*')
    .order('placement_key', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(500)
  if (filter.placementKey) q = q.eq('placement_key', filter.placementKey)
  if (filter.status) q = q.eq('status', filter.status)
  const { data, error } = await q
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbCampaign[] ?? []).map(toCampaign)
}

export interface CampaignInput {
  placementKey: PlacementKey
  advertiser?: string
  title?: string
  content: Record<string, unknown>
  status?: CampaignStatus
  startsAt?: string
  endsAt?: string
  durationDays?: number
  weight?: number
  sortOrder?: number
  userId?: string
  adminNote?: string
}

/** اعتبارسنجیِ محتوا نسبت به نوعِ جایگاه — بنر برای جایگاهِ بنری، ارجاع برای موجودیتی */
export function validateContent(placement: Placement, content: Record<string, unknown>): string | null {
  if (placement.contentKind === 'banner') {
    const img = String(content.image_url ?? '').trim()
    if (!img) return 'تصویرِ بنر لازم است'
    if (!/^(https?:\/\/|\/)/i.test(img)) return 'نشانیِ تصویر باید با https یا / شروع شود'
    /* جلوی XSS ذخیره‌شده: فقط لینکِ http(s) یا مسیرِ داخلی — نه javascript: */
    const link = String(content.link_url ?? '').trim()
    if (link && !/^(https?:\/\/|\/)/i.test(link)) return 'لینکِ مقصد باید با https یا / شروع شود'
    return null
  }
  const t = String(content.entity_type ?? placement.entityType ?? '')
  if (!['product', 'club', 'seller'].includes(t)) return 'نوعِ موجودیت نامعتبر است'
  if (!String(content.ref ?? '').trim()) return 'شناسه‌ی موجودیت (ref) لازم است'
  return null
}

export async function createCampaign(input: CampaignInput): Promise<Campaign | null> {
  const placement = await getPlacement(input.placementKey)
  if (!placement) return null

  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date()
  const endsAt = input.endsAt
    ? new Date(input.endsAt)
    : new Date(startsAt.getTime() + Math.max(1, input.durationDays ?? placement.durationDays) * 24 * 60 * 60 * 1000)

  const status: CampaignStatus = input.status && isCampaignStatus(input.status) ? input.status : 'DRAFT'

  const { data, error } = await sb().from('campaigns').insert({
    placement_key: input.placementKey,
    user_id: input.userId ?? null,
    advertiser: input.advertiser ?? '',
    title: input.title ?? '',
    content: input.content,
    status,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    weight: Math.max(1, Math.round(input.weight ?? 1)),
    sort_order: Math.round(input.sortOrder ?? 0),
    admin_note: input.adminNote ?? null,
  }).select().single()
  if (error || !data) return null
  return toCampaign(data as DbCampaign)
}

export async function updateCampaign(id: string, patch: Record<string, unknown>): Promise<Campaign | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status !== undefined && isCampaignStatus(patch.status)) row.status = patch.status
  if (patch.title !== undefined) row.title = String(patch.title).slice(0, 160)
  if (patch.advertiser !== undefined) row.advertiser = String(patch.advertiser).slice(0, 160)
  if (patch.content !== undefined && patch.content && typeof patch.content === 'object') row.content = patch.content
  if (patch.startsAt !== undefined) row.starts_at = new Date(String(patch.startsAt)).toISOString()
  if (patch.endsAt !== undefined) row.ends_at = new Date(String(patch.endsAt)).toISOString()
  if (patch.weight !== undefined) row.weight = Math.max(1, Math.round(Number(patch.weight) || 1))
  if (patch.sortOrder !== undefined) row.sort_order = Math.round(Number(patch.sortOrder) || 0)
  if (patch.adminNote !== undefined) row.admin_note = String(patch.adminNote ?? '').slice(0, 500) || null
  if (patch.extendDays !== undefined) {
    /* «تمدید» یعنی افزودن به پایانِ فعلی، نه جایگزینی با «الان + روز» —
       وگرنه کمپینِ جاری کوتاه می‌شد و کمپینِ زمان‌بندی‌شده با شروعِ آینده
       قیدِ ends_at > starts_at را می‌شکست. */
    const days = Math.max(1, Math.round(Number(patch.extendDays) || 30))
    const { data: cur } = await sb().from('campaigns').select('starts_at,ends_at').eq('id', id).maybeSingle()
    const base = Math.max(
      Date.now(),
      cur ? new Date((cur as { ends_at: string }).ends_at).getTime() : 0,
      cur ? new Date((cur as { starts_at: string }).starts_at).getTime() : 0,
    )
    row.ends_at = new Date(base + days * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data, error } = await sb().from('campaigns').update(row).eq('id', id).select().single()
  if (error || !data) return null
  return toCampaign(data as DbCampaign)
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const { error } = await sb().from('campaigns').delete().eq('id', id)
  return !error
}

/* ── محتوای زنده‌ی جایگاه‌ها (مسیرِ عمومی) ───────────────────── */

export interface LiveCampaign {
  id: string
  title: string
  advertiser: string
  content: Record<string, unknown>
  weight: number
}

/** کمپین‌های قابلِ نمایشِ هر جایگاهِ فعال.
    فقط ACTIVE در پنجره‌ی زمانی؛ جایگاهِ غیرفعال اصلاً برنمی‌گردد —
    نمایش هیچ وابستگی‌ای به هیچ کلیدِ سراسری‌ای ندارد. */
export async function livePlacements(onlyKey?: string): Promise<Record<string, { placement: Pick<Placement, 'key' | 'contentKind' | 'entityType' | 'capacity' | 'mode'>; campaigns: LiveCampaign[] }>> {
  const placements = (await listPlacements()).filter(p => p.isActive && (!onlyKey || p.key === onlyKey))
  if (placements.length === 0) return {}

  const now = new Date().toISOString()
  let q = sb().from('campaigns').select('*')
    .eq('status', 'ACTIVE')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('sort_order', { ascending: true })
  if (onlyKey) q = q.eq('placement_key', onlyKey)
  const { data, error } = await q
  if (error) return {}

  const out: Record<string, { placement: Pick<Placement, 'key' | 'contentKind' | 'entityType' | 'capacity' | 'mode'>; campaigns: LiveCampaign[] }> = {}
  for (const p of placements) {
    out[p.key] = {
      placement: { key: p.key, contentKind: p.contentKind, entityType: p.entityType, capacity: p.capacity, mode: p.mode },
      campaigns: [],
    }
  }
  for (const r of (data as DbCampaign[] ?? [])) {
    const bucket = out[r.placement_key]
    if (!bucket) continue                                   // جایگاهِ غیرفعال
    if (bucket.campaigns.length >= bucket.placement.capacity) continue
    bucket.campaigns.push({
      id: r.id, title: r.title, advertiser: r.advertiser,
      content: r.content ?? {}, weight: r.weight,
    })
  }
  return out
}

/** شمارشِ اتمیک — جایگزینِ read-then-update قبلی */
export async function trackCampaign(id: string, kind: 'impression' | 'click'): Promise<void> {
  try { await sb().rpc('bh_track_campaign', { p_campaign_id: id, p_kind: kind }) } catch { /* شمارنده مهم‌تر از صفحه نیست */ }
}

/** انقضای خودکار: SCHEDULED→ACTIVE و ACTIVE→EXPIRED */
export async function expireCampaigns(): Promise<{ activated: number; expired: number } | null> {
  const { data, error } = await sb().rpc('bh_expire_campaigns')
  if (error) return null
  return data as { activated: number; expired: number }
}

/* ── پلن‌های قیمت‌گذاری (Database-driven) ────────────────────── */

export interface PricingPlan {
  id: string
  name: string
  description: string | null
  placementKey: string | null
  price: number
  durationDays: number
  adQuantity: number
  isActive: boolean
  sortOrder: number
  badge: string | null
  createdAt: string
  updatedAt: string
}

type DbPricingPlan = {
  id: string; name: string; description: string | null; placement_key: string | null
  price: number; duration_days: number; ad_quantity: number
  is_active: boolean; sort_order: number; badge: string | null
  created_at: string; updated_at: string
}

const toPricingPlan = (r: DbPricingPlan): PricingPlan => ({
  id: r.id, name: r.name, description: r.description, placementKey: r.placement_key,
  price: Number(r.price) || 0, durationDays: r.duration_days, adQuantity: r.ad_quantity,
  isActive: r.is_active, sortOrder: r.sort_order, badge: r.badge,
  createdAt: r.created_at, updatedAt: r.updated_at,
})

export async function listPricingPlans(onlyActive: boolean): Promise<PricingPlan[]> {
  let q = sb().from('ad_pricing_plans').select('*').order('sort_order', { ascending: true })
  if (onlyActive) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbPricingPlan[] ?? []).map(toPricingPlan)
}

export async function updatePricingPlan(id: string, patch: Partial<{
  name: string; description: string; price: number; durationDays: number
  adQuantity: number; isActive: boolean; sortOrder: number; badge: string
}>): Promise<PricingPlan | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) row.name = patch.name
  if (patch.description !== undefined) row.description = patch.description || null
  if (patch.price !== undefined) row.price = Math.max(0, Math.round(patch.price))
  if (patch.durationDays !== undefined) row.duration_days = Math.max(1, Math.round(patch.durationDays))
  if (patch.adQuantity !== undefined) row.ad_quantity = Math.max(0, Math.round(patch.adQuantity))
  if (patch.isActive !== undefined) row.is_active = patch.isActive
  if (patch.sortOrder !== undefined) row.sort_order = Math.round(patch.sortOrder)
  if (patch.badge !== undefined) row.badge = patch.badge || null

  const { data, error } = await sb().from('ad_pricing_plans').update(row).eq('id', id).select().single()
  if (error || !data) return null
  return toPricingPlan(data as DbPricingPlan)
}

export async function createPricingPlan(input: {
  name: string; description?: string; placementKey?: string | null
  price: number; durationDays: number; adQuantity: number; sortOrder?: number; badge?: string
}): Promise<PricingPlan | null> {
  const { data, error } = await sb().from('ad_pricing_plans').insert({
    name: input.name, description: input.description ?? null,
    placement_key: input.placementKey ?? null,
    price: Math.max(0, Math.round(input.price)),
    duration_days: Math.max(1, Math.round(input.durationDays)),
    ad_quantity: Math.max(0, Math.round(input.adQuantity)),
    sort_order: Math.round(input.sortOrder ?? 0),
    badge: input.badge ?? null,
  }).select().single()
  if (error || !data) return null
  return toPricingPlan(data as DbPricingPlan)
}
