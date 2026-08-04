/* ─────────────────────────────────────────────────────────────
   هسته‌ی سیستم تبلیغات (فاز ۲) — Placement / Campaign / Pricing Plan.

   جایگزین lib/ads/slots.ts. سه اصل:
   ● شش جایگاه مستقل؛ نمایش فقط با placement.is_active — «هیچ کلید
     سراسری‌ای وجود ندارد».
   ● کمپین یا «بنر» است یا «ارجاع به موجودیت» (محصول/باشگاه/فروشگاه)
     برای سکشن‌های ویژه‌ی صفحه‌ی اصلی.
   ● انقضا دو لایه است: فیلتر پنجره‌ی زمانی هنگام خواندن (هیچ بنر
     تمام‌شده‌ای هرگز نمایش داده نمی‌شود) + cron که status را به
     EXPIRED می‌برد تا پنل ادمین هم واقعیت را نشان دهد.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'

/* ── جایگاه‌ها ────────────────────────────────────────────────── */

export const PLACEMENT_KEYS = [
  'market_featured_products_homepage',
  'featured_clubs_homepage',
  'featured_equipment_stores_homepage',
  /* دو بنرِ زیرِ سکشنِ بیلیارد بازار — قرینه‌ی همان دو تای تجهیزات */
  'market_ads_right',
  'market_ads_left',
  'equipment_ads_right',
  'equipment_ads_left',
  'homepage_bottom_banner',
] as const
export type PlacementKey = typeof PLACEMENT_KEYS[number]

export const isPlacementKey = (v: unknown): v is PlacementKey =>
  (PLACEMENT_KEYS as readonly string[]).includes(String(v))

/* کلیدهای قدیمی ad_slots → معادل تازه؛ برای کلاینت‌های کش‌شده و
   درخواست‌های تبلیغ قبلی */
export const LEGACY_KEY_MAP: Record<string, PlacementKey> = {
  market_1: 'equipment_ads_right',
  market_2: 'equipment_ads_left',
  footer: 'homepage_bottom_banner',
}

export type PlacementMode = 'free' | 'manual' | 'paid'
/* `video` با مهاجرتِ ۰۵۱ آمد — تبلیغِ پیش‌پخشِ بیلیارد مدیا. */
export type ContentKind = 'banner' | 'entity' | 'video'
export type EntityType = 'product' | 'club' | 'seller'

/* حالت چرخش کمپین‌های یک جایگاه (فاز ۴) */
export const ROTATION_MODES = ['fixed', 'weighted', 'fair', 'random'] as const
export type RotationMode = typeof ROTATION_MODES[number]
export const isRotationMode = (v: unknown): v is RotationMode =>
  (ROTATION_MODES as readonly string[]).includes(String(v))

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
  /** چند کمپین هم‌زمان دیده شود (۰ = به‌اندازه‌ی ظرفیت) */
  displayCount: number
  rotationMode: RotationMode
  /** اولویت جایگاه — بزرگ‌تر مهم‌تر */
  priority: number
  price: number
  durationDays: number
  sortOrder: number
  /** فقط جایگاهِ ویدیویی — پس از چند ثانیه «رد کردن» ظاهر شود */
  skipAfterSec: number | null
  /** فقط جایگاهِ ویدیویی — سقفِ مدتِ تبلیغ */
  maxDurationSec: number | null
}

type DbPlacement = {
  key: PlacementKey; title: string; description: string | null; section: string
  is_active: boolean; mode: PlacementMode; content_kind: ContentKind
  entity_type: EntityType | null; capacity: number; price: number
  duration_days: number; sort_order: number
  display_count?: number | null; rotation_mode?: RotationMode | null; priority?: number | null
  /* مخصوصِ جایگاهِ ویدیویی — مهاجرتِ ۰۵۱ */
  skip_after_sec?: number | null; max_duration_sec?: number | null
}

const toPlacement = (r: DbPlacement): Placement => ({
  key: r.key, title: r.title, description: r.description, section: r.section,
  isActive: r.is_active, mode: r.mode, contentKind: r.content_kind,
  entityType: r.entity_type, capacity: r.capacity, price: Number(r.price) || 0,
  durationDays: r.duration_days, sortOrder: r.sort_order,
  /* ستون‌های فاز ۴ — پیش از مایگریشن ۰۱۸ ممکن است نباشند */
  displayCount: Number(r.display_count ?? 0) || 0,
  rotationMode: isRotationMode(r.rotation_mode) ? r.rotation_mode : 'fair',
  priority: Number(r.priority ?? 0) || 0,
  /* `null` معنادار است: برای جایگاهِ غیرِویدیویی بی‌ربط، و برای
     ویدیویی یعنی «رد کردن ممکن نیست» / «سقفِ مدت ندارد». */
  skipAfterSec: r.skip_after_sec ?? null,
  maxDurationSec: r.max_duration_sec ?? null,
})

/** عدد صحیح محدودشده — ورودی ادمین نباید از بازه‌ی integer دیتابیس بیرون بزند */
const clampInt = (v: number, min: number, max: number): number => {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

/** چند کمپین واقعاً نمایش داده می‌شود: display_count، وگرنه ظرفیت */
export const shownCount = (p: Pick<Placement, 'capacity' | 'displayCount'>): number =>
  p.displayCount > 0 ? Math.min(p.displayCount, p.capacity) : Math.max(0, p.capacity)

const missing = (m?: string) => /does not exist|schema cache/i.test(m ?? '')

export async function listPlacements(): Promise<Placement[]> {
  const { data, error } = await sb().from('placements').select('*').order('sort_order', { ascending: true })
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  const rows = (data as DbPlacement[] ?? []).map(toPlacement)
  /* اولویت بالاتر اول؛ در تساوی، ترتیب فهرست ادمین */
  return rows.sort((a, b) => (b.priority - a.priority) || (a.sortOrder - b.sortOrder))
}

export async function getPlacement(key: string): Promise<Placement | null> {
  const { data, error } = await sb().from('placements').select('*').eq('key', key).maybeSingle()
  if (error || !data) return null
  return toPlacement(data as DbPlacement)
}

/** تنظیمات مستقل هر جایگاه — is_active و mode جدا از هم (بدون کلید سراسری) */
export async function updatePlacement(key: string, patch: Partial<{
  isActive: boolean; mode: PlacementMode; capacity: number; price: number
  durationDays: number; title: string; description: string
  displayCount: number; rotationMode: RotationMode; priority: number
  skipAfterSec: number | null; maxDurationSec: number | null
}>): Promise<Placement | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.isActive !== undefined) row.is_active = patch.isActive
  if (patch.mode !== undefined && ['free', 'manual', 'paid'].includes(patch.mode)) row.mode = patch.mode
  if (patch.capacity !== undefined) row.capacity = clampInt(patch.capacity, 0, 500)
  if (patch.price !== undefined) row.price = Math.max(0, Math.round(patch.price))
  if (patch.durationDays !== undefined) row.duration_days = clampInt(patch.durationDays, 1, 3650)
  if (patch.title !== undefined) row.title = patch.title
  if (patch.description !== undefined) row.description = patch.description
  if (patch.displayCount !== undefined) row.display_count = clampInt(patch.displayCount, 0, 500)
  if (patch.rotationMode !== undefined && isRotationMode(patch.rotationMode)) row.rotation_mode = patch.rotationMode
  if (patch.priority !== undefined) row.priority = clampInt(patch.priority, -10000, 10000)
  /* تنظیم‌های جایگاهِ ویدیویی. `null` معنادار است — «رد کردن ممکن
     نیست» و «سقفِ مدت ندارد» — پس صفر نمی‌شود.
     سقفِ ۳۰۰ ثانیه: تبلیغِ بلندتر از پنج دقیقه پیش از محتوای اصلی،
     هر عددی هم که ادمین بزند، اشتباه است. */
  if (patch.skipAfterSec !== undefined) {
    row.skip_after_sec = patch.skipAfterSec === null ? null : clampInt(patch.skipAfterSec, 0, 60)
  }
  if (patch.maxDurationSec !== undefined) {
    row.max_duration_sec = patch.maxDurationSec === null ? null : clampInt(patch.maxDurationSec, 1, 300)
  }

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
  /* تبلیغِ ویدیویی — مهاجرتِ ۰۵۱. برای بنر همیشه صفر می‌مانند. */
  completedViews: number
  skippedViews: number
  adminNote: string | null
  createdAt: string
}

type DbCampaign = {
  id: string; placement_key: PlacementKey; user_id: string | null
  advertiser: string; title: string; content: Record<string, unknown>
  status: CampaignStatus; starts_at: string; ends_at: string
  weight: number; sort_order: number; impressions: number; clicks: number
  serves?: number | null
  completed_views?: number | null; skipped_views?: number | null
  admin_note: string | null; created_at: string
}

const toCampaign = (r: DbCampaign): Campaign => ({
  id: r.id, placementKey: r.placement_key, userId: r.user_id,
  advertiser: r.advertiser, title: r.title,
  content: r.content ?? {}, status: r.status,
  startsAt: r.starts_at, endsAt: r.ends_at,
  weight: r.weight, sortOrder: r.sort_order,
  impressions: Number(r.impressions) || 0, clicks: Number(r.clicks) || 0,
  completedViews: Number(r.completed_views ?? 0) || 0,
  skippedViews: Number(r.skipped_views ?? 0) || 0,
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

/** اعتبارسنجی محتوا نسبت به نوع جایگاه — بنر برای جایگاه بنری، ارجاع برای موجودیتی */
export function validateContent(placement: Placement, content: Record<string, unknown>): string | null {
  if (placement.contentKind === 'banner') {
    const img = String(content.image_url ?? '').trim()
    if (!img) return 'تصویر بنر لازم است'
    if (!/^(https?:\/\/|\/)/i.test(img)) return 'نشانی تصویر باید با https یا / شروع شود'
    /* جلوی XSS ذخیره‌شده: فقط لینک http(s) یا مسیر داخلی — نه javascript: */
    const link = String(content.link_url ?? '').trim()
    if (link && !/^(https?:\/\/|\/)/i.test(link)) return 'لینک مقصد باید با https یا / شروع شود'
    return null
  }
  const t = String(content.entity_type ?? placement.entityType ?? '')
  if (!['product', 'club', 'seller'].includes(t)) return 'نوع موجودیت نامعتبر است'
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
    /* «تمدید» یعنی افزودن به پایان فعلی، نه جایگزینی با «الان + روز» —
       وگرنه کمپین جاری کوتاه می‌شد و کمپین زمان‌بندی‌شده با شروع آینده
       قید ends_at > starts_at را می‌شکست. */
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

/* ── محتوای زنده‌ی جایگاه‌ها (مسیر عمومی) ───────────────────── */

export interface LiveCampaign {
  id: string
  title: string
  advertiser: string
  content: Record<string, unknown>
  weight: number
}

/* ── چرخش عادلانه (فاز ۴) ─────────────────────────────────────
   هدف: «جایگاه ثابت اول یا دوم فروخته نشود». ترتیب کمپین‌های یک
   جایگاه در هر درخواست بازچیده می‌شود تا تحویل میان همه پخش شود.

     fixed    — ترتیب ثابت sort_order (چیدمان انتخابی ادمین)
     weighted — قرعه‌کشی وزنی: شانس هر کمپین به وزنش
     fair     — کم‌تحویل‌ترین اول + نویز تصادفی کنترل‌شده
     random   — بُرزدن کامل

   مبنای عدالت عمداً `serves` است (شمارنده‌ای که فقط سرور هنگام تحویل
   واقعی زیاد می‌کند) نه `impressions` که بیکن بدون احراز هویت آن را
   می‌نویسد؛ وگرنه هر کسی می‌توانست رقیبش را ته صف بفرستد.

   ضمناً مبنا «نرخ تحویل» است نه شمارش خام: کمپینی که یک ماه است
   می‌چرخد طبیعتاً تحویل بیشتری دارد و اگر خام مقایسه می‌شد، با
   پیوستن هر کمپین تازه تا مدت‌ها صفر می‌گرفت — یعنی تبلیغ‌کننده‌ای
   که پول داده بود از چرخه بیرون می‌افتاد. نرخ با گذشت زمان خودش
   تصحیح می‌شود و هیچ‌کس برای همیشه گرسنه نمی‌ماند. */
type Rotatable = { id: string; weight: number; serves: number; startsAtMs: number; sortOrder: number }

const HOUR = 3600_000

export function rotateCampaigns<T extends Rotatable>(items: T[], mode: RotationMode): T[] {
  if (items.length <= 1) return items.slice()

  if (mode === 'fixed') return items.slice().sort((a, b) => a.sortOrder - b.sortOrder)

  const shuffle = (arr: T[]): T[] => {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j]!, out[i]!]
    }
    return out
  }

  if (mode === 'random') return shuffle(items)

  if (mode === 'weighted') {
    /* قرعه‌کشی بدون جایگذاری: هر بار یکی به‌نسبت وزن انتخاب می‌شود */
    const pool = items.slice()
    const out: T[] = []
    while (pool.length) {
      const total = pool.reduce((s, x) => s + Math.max(1, x.weight), 0)
      let t = Math.random() * total
      let idx = pool.length - 1
      for (let i = 0; i < pool.length; i++) {
        t -= Math.max(1, pool[i]!.weight)
        if (t <= 0) { idx = i; break }
      }
      out.push(pool.splice(idx, 1)[0]!)
    }
    return out
  }

  /* fair — نرخ تحویل به‌ازای هر ساعت عمر کمپین، تقسیم بر وزن */
  const now = Date.now()
  const keyed = items.map(x => {
    const hours = Math.max(1, (now - x.startsAtMs) / HOUR)
    return { x, k: Math.max(0, x.serves) / hours / Math.max(1, x.weight) }
  })

  const ks = keyed.map(r => r.k)
  const spread = Math.max(...ks) - Math.min(...ks)
  /* همه هم‌رده (مثلاً همه تازه) ⇒ ترتیب کاملاً تصادفی، نه ترتیب جدول */
  if (spread <= 0) return shuffle(items)

  /* نویز نسبت به پراکندگی همان کلیدها مقیاس می‌گیرد: تساوی‌ها را
     تصادفی می‌کند ولی عقب‌ماندگی واقعی را پنهان نمی‌کند */
  const jitter = spread * 0.25
  return keyed
    .map(r => ({ x: r.x, k: r.k + Math.random() * jitter }))
    .sort((a, b) => a.k - b.k)
    .map(r => r.x)
}

/** کمپین‌های قابل نمایش هر جایگاه فعال.
    فقط ACTIVE در پنجره‌ی زمانی؛ جایگاه غیرفعال اصلاً برنمی‌گردد —
    نمایش هیچ وابستگی‌ای به هیچ کلید سراسری‌ای ندارد. */
export type LivePlacementMeta = Pick<Placement,
  'key' | 'contentKind' | 'entityType' | 'capacity' | 'mode' | 'rotationMode' | 'priority'
> & { displayCount: number }

export async function livePlacements(onlyKey?: string): Promise<Record<string, { placement: LivePlacementMeta; campaigns: LiveCampaign[] }>> {
  const placements = (await listPlacements()).filter(p => p.isActive && (!onlyKey || p.key === onlyKey))
  if (placements.length === 0) return {}

  /* مهلت کوچک اختلاف ساعت: زمان شروع/پایان را دیتابیس می‌نویسد ولی
     این فیلتر با ساعت سرور اپ اجرا می‌شود. حتی چند ثانیه اختلاف یعنی
     کمپینی که همین حالا تأیید و ACTIVE شده، تا آن چند ثانیه نامرئی
     بماند — برای تبلیغ پولی پذیرفتنی نیست. دو دقیقه ارفاق این را
     می‌بندد و در عوض حداکثر دو دقیقه زودتر شروع‌شدن هزینه‌ای ندارد. */
  const SKEW = 120_000
  const startBound = new Date(Date.now() + SKEW).toISOString()
  const endBound = new Date(Date.now() - SKEW).toISOString()
  let q = sb().from('campaigns').select('*')
    .eq('status', 'ACTIVE')
    .lte('starts_at', startBound)
    .gt('ends_at', endBound)
    .order('sort_order', { ascending: true })
  if (onlyKey) q = q.eq('placement_key', onlyKey)
  const { data, error } = await q
  if (error) return {}

  /* اول همه‌ی نامزدهای هر جایگاه جمع می‌شوند، بعد چرخش اعمال و در
     پایان به تعداد نمایش بریده می‌شود — اگر مثل قبل حین جمع‌آوری
     بریده می‌شد، همان چند کمپین اول sort_order همیشه برنده بودند و
     چرخش عادلانه بی‌اثر می‌شد. */
  const pool: Record<string, (LiveCampaign & Rotatable)[]> = {}
  for (const p of placements) pool[p.key] = []
  for (const r of (data as DbCampaign[] ?? [])) {
    const bucket = pool[r.placement_key]
    if (!bucket) continue                                   // جایگاه غیرفعال
    bucket.push({
      id: r.id, title: r.title, advertiser: r.advertiser,
      content: r.content ?? {}, weight: Math.max(1, r.weight),
      serves: Number(r.serves ?? 0) || 0,
      startsAtMs: new Date(r.starts_at).getTime() || Date.now(),
      sortOrder: r.sort_order,
    })
  }

  const out: Record<string, { placement: LivePlacementMeta; campaigns: LiveCampaign[] }> = {}
  const served: string[] = []
  for (const p of placements) {
    const limit = shownCount(p)
    const ordered = rotateCampaigns(pool[p.key] ?? [], p.rotationMode).slice(0, Math.max(0, limit))
    /* فقط جایی که چرخش واقعاً تصمیم می‌گیرد، شمارنده‌ی تحویل لازم است */
    if (p.rotationMode === 'fair') for (const c of ordered) served.push(c.id)
    out[p.key] = {
      placement: {
        key: p.key, contentKind: p.contentKind, entityType: p.entityType,
        capacity: p.capacity, displayCount: limit, mode: p.mode,
        rotationMode: p.rotationMode, priority: p.priority,
      },
      campaigns: ordered.map(c => ({
        id: c.id, title: c.title, advertiser: c.advertiser, content: c.content, weight: c.weight,
      })),
    }
  }

  /* شمارنده‌ی سرورمحور تحویل — همان چیزی که چرخش عادلانه بر پایه‌اش
     تصمیم می‌گیرد؛ یک رفت‌وبرگشت برای کل صفحه. await عمدی است چون
     روی سرورلس کار رهاشده بعد از پاسخ ممکن است اجرا نشود. */
  if (served.length) {
    try { await sb().rpc('bh_bump_serves', { p_ids: served }) } catch { /* شمارنده مهم‌تر از صفحه نیست */ }
  }
  return out
}

/** شمارش اتمیک — جایگزین read-then-update قبلی */
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
  /** اعتبار کمپینی که با خرید پلن داده می‌شود (فاز ۵ مصرفش می‌کند) */
  creditAmount: number
  isActive: boolean
  sortOrder: number
  badge: string | null
  createdAt: string
  updatedAt: string
}

type DbPricingPlan = {
  id: string; name: string; description: string | null; placement_key: string | null
  price: number; duration_days: number; ad_quantity: number; credit_amount?: number | null
  is_active: boolean; sort_order: number; badge: string | null
  created_at: string; updated_at: string
}

const toPricingPlan = (r: DbPricingPlan): PricingPlan => ({
  id: r.id, name: r.name, description: r.description, placementKey: r.placement_key,
  price: Number(r.price) || 0, durationDays: r.duration_days, adQuantity: r.ad_quantity,
  creditAmount: Number(r.credit_amount ?? 0) || 0,
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
  adQuantity: number; creditAmount: number; isActive: boolean; sortOrder: number
  badge: string; placementKey: string | null
}>): Promise<PricingPlan | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) row.name = patch.name
  if (patch.description !== undefined) row.description = patch.description || null
  if (patch.price !== undefined) row.price = Math.max(0, Math.round(patch.price))
  if (patch.durationDays !== undefined) row.duration_days = clampInt(patch.durationDays, 1, 3650)
  if (patch.adQuantity !== undefined) row.ad_quantity = clampInt(patch.adQuantity, 0, 100000)
  if (patch.creditAmount !== undefined) row.credit_amount = clampInt(patch.creditAmount, 0, 100000)
  if (patch.isActive !== undefined) row.is_active = patch.isActive
  if (patch.sortOrder !== undefined) row.sort_order = Math.round(patch.sortOrder)
  if (patch.badge !== undefined) row.badge = patch.badge || null
  /* جابه‌جایی پلن بین جایگاه‌ها؛ null یعنی پلن عمومی آگهی */
  if (patch.placementKey !== undefined) {
    row.placement_key = patch.placementKey && isPlacementKey(patch.placementKey) ? patch.placementKey : null
  }

  const { data, error } = await sb().from('ad_pricing_plans').update(row).eq('id', id).select().single()
  if (error || !data) return null
  return toPricingPlan(data as DbPricingPlan)
}

export async function createPricingPlan(input: {
  name: string; description?: string; placementKey?: string | null
  price: number; durationDays: number; adQuantity: number; creditAmount?: number
  sortOrder?: number; badge?: string
}): Promise<PricingPlan | null> {
  const { data, error } = await sb().from('ad_pricing_plans').insert({
    name: input.name, description: input.description ?? null,
    placement_key: input.placementKey ?? null,
    price: Math.max(0, Math.round(input.price)),
    duration_days: clampInt(input.durationDays, 1, 3650),
    ad_quantity: clampInt(input.adQuantity, 0, 100000),
    credit_amount: clampInt(input.creditAmount ?? 0, 0, 100000),
    sort_order: clampInt(input.sortOrder ?? 0, -10000, 10000),
    badge: input.badge ?? null,
  }).select().single()
  if (error || !data) return null
  return toPricingPlan(data as DbPricingPlan)
}

/**
 * حذف واقعی پلن — فقط وقتی هیچ سفارشی به آن ارجاع ندارد.
 * پلن فروخته‌شده هرگز حذف نمی‌شود (سفارش‌ها و اعتبارها به آن اشاره
 * دارند)؛ در آن حالت فقط غیرفعال می‌شود.
 */
export async function deletePricingPlan(id: string): Promise<{ ok: boolean; deactivated?: boolean; message?: string }> {
  const used = await sb().from('campaign_orders').select('id', { count: 'exact', head: true }).eq('plan_id', id)
  const credited = await sb().from('ad_credits').select('id', { count: 'exact', head: true }).eq('plan_id', id)

  /* اگر نتوانستیم مطمئن شویم که ارجاعی نیست، حذف نمی‌کنیم — تاریخچه‌ی
     مالی ارزش fail-open ندارد. (FK دیتابیس هم لایه‌ی آخر است.) */
  if (used.error || credited.error) {
    const plan = await updatePricingPlan(id, { isActive: false })
    return plan
      ? { ok: true, deactivated: true, message: 'بررسی سفارش‌ها ممکن نشد؛ برای احتیاط پلن فقط غیرفعال شد.' }
      : { ok: false, message: 'انجام نشد' }
  }

  const refCount = (used.count ?? 0) + (credited.count ?? 0)

  if (refCount > 0) {
    const plan = await updatePricingPlan(id, { isActive: false })
    return plan
      ? { ok: true, deactivated: true, message: 'این پلن سفارش ثبت‌شده دارد؛ به‌جای حذف، غیرفعال شد.' }
      : { ok: false, message: 'غیرفعال‌سازی انجام نشد' }
  }

  const { error } = await sb().from('ad_pricing_plans').delete().eq('id', id)
  return error ? { ok: false, message: 'حذف انجام نشد' } : { ok: true }
}

/** پلن‌های فعال یک جایگاه — پله‌های مدت که کاربر می‌تواند بخرد */
export async function plansForPlacement(key: string): Promise<PricingPlan[]> {
  const { data, error } = await sb().from('ad_pricing_plans').select('*')
    .eq('placement_key', key).eq('is_active', true).order('sort_order', { ascending: true })
  if (error) return []
  return (data as DbPricingPlan[] ?? []).map(toPricingPlan)
}

/* ── آمار پنل ادمین (فاز ۴) ─────────────────────────────────── */

export interface AdStats {
  campaigns: { total: number; active: number; pending: number; expired: number; scheduled: number; draft: number; rejected: number; cancelled: number }
  impressions: number
  clicks: number
  ctr: number                       // درصد
  revenue: { total: number; orders: number; pendingOrders: number }
  byPlacement: { key: string; title: string; active: number; impressions: number; clicks: number; ctr: number }[]
}

/**
 * آمار کلی تبلیغات — کمپین‌ها، نمایش/کلیک/CTR و درآمد.
 *
 * عمداً روی فهرست صفحه‌بندی‌شده‌ی پنل حساب نمی‌شود: آن فهرست سقف
 * ۵۰۰ ردیف دارد و با رشد کمپین‌ها، آمار بی‌صدا کمتر از واقعیت
 * گزارش می‌شد. این تابع خودش همه‌ی ردیف‌های لازم را می‌خواند.
 */
export async function adStats(placements: Placement[]): Promise<AdStats> {
  const rows: { placement_key: string; status: string; impressions: number; clicks: number }[] = []
  /* خواندن صفحه‌به‌صفحه تا ته جدول — نه یک برش ثابت */
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb().from('campaigns')
      .select('placement_key,status,impressions,clicks')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) break
    const chunk = (data as typeof rows | null) ?? []
    rows.push(...chunk)
    if (chunk.length < PAGE) break
    if (from > 200_000) break                    // مهار ایمنی
  }

  const countOf = (...st: string[]) => rows.filter(r => st.includes(r.status)).length
  const c = {
    total: rows.length,
    active: countOf('ACTIVE'),
    /* «در انتظار» یعنی هر چیزی که هنوز تصمیم‌گیری نشده */
    pending: countOf('PENDING_PAYMENT', 'PENDING_REVIEW'),
    expired: countOf('EXPIRED'),
    scheduled: countOf('SCHEDULED'),
    draft: countOf('DRAFT'),
    rejected: countOf('REJECTED'),
    cancelled: countOf('CANCELLED'),
  }

  const impressions = rows.reduce((s, x) => s + (Number(x.impressions) || 0), 0)
  const clicks = rows.reduce((s, x) => s + (Number(x.clicks) || 0), 0)
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

  /* درآمد از سفارش‌های پرداخت‌شده‌ی جایگاه؛ جریان خریدش در فاز ۵ کامل
     می‌شود، پس تا آن‌وقت طبیعی است که صفر باشد. */
  let revenue = { total: 0, orders: 0, pendingOrders: 0 }
  try {
    const paidRows: { amount: number }[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb().from('campaign_orders')
        .select('amount').eq('status', 'PAID').range(from, from + PAGE - 1)
      if (error) break
      const chunk = (data as { amount: number }[] | null) ?? []
      paidRows.push(...chunk)
      if (chunk.length < PAGE) break
      if (from > 200_000) break
    }
    const { count: pendingCount } = await sb().from('campaign_orders')
      .select('id', { count: 'exact', head: true }).eq('status', 'PENDING')
    revenue = {
      total: paidRows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      orders: paidRows.length,
      pendingOrders: pendingCount ?? 0,
    }
  } catch { /* جدول هنوز خالی/نساخته — صفر می‌ماند */ }

  const byPlacement = placements.map(p => {
    const list = rows.filter(x => x.placement_key === p.key)
    const imp = list.reduce((s, x) => s + (Number(x.impressions) || 0), 0)
    const clk = list.reduce((s, x) => s + (Number(x.clicks) || 0), 0)
    return {
      key: p.key, title: p.title,
      active: list.filter(x => x.status === 'ACTIVE').length,
      impressions: imp, clicks: clk,
      ctr: imp > 0 ? (clk / imp) * 100 : 0,
    }
  })

  return { campaigns: c, impressions, clicks, ctr, revenue, byPlacement }
}
