/* ─────────────────────────────────────────────────────────────
   رزرو تبلیغ (فاز ۶) — از انتخاب جایگاه تا سفارش آماده‌ی پرداخت.

   سه اصل امنیتی که در کل این فایل رعایت شده‌اند:
     ۱) قیمت همیشه از ردیف پلن در دیتابیس خوانده می‌شود؛ هیچ عددی از
        کلاینت پذیرفته نمی‌شود.
     ۲) پلن باید واقعاً به همان جایگاه تعلق داشته باشد — وگرنه کاربر
        می‌توانست پلن ارزان یک جایگاه را به جایگاه گران‌تر بچسباند.
     ۳) کاربر فقط جایگاه‌هایی را می‌بیند که نقش تأییدشده‌اش اجازه می‌دهد.
   ───────────────────────────────────────────────────────────── */

import { sb, rpc } from '../finance/db'
import { lookupPersonForUser, verifiedRolesOfPerson } from '../identity'
import {
  getPlacement, plansForPlacement, listPlacements, validateContent,
  type Placement, type PricingPlan, type PlacementKey,
} from './core'

/* ── واجد شرایط بودن ─────────────────────────────────────────
   هر جایگاه به نقش‌هایی گره خورده که منطقاً صاحب آن محتوا هستند:
   باشگاه‌دار باشگاهش را برجسته می‌کند، فروشنده فروشگاهش را، تولیدکننده
   محصولش را. بنرهای عمومی برای هر کسب‌وکار تأییدشده باز است. */
/* ⚠️ این نگاشت دیگر منبعِ حقیقت نیست.

   از مهاجرتِ ۰۵۶ نقش‌های مجازِ هر جایگاه در ستونِ `advertiser_roles`
   خودِ ردیف است، چون ادمین می‌تواند جایگاه بسازد و کدی که فهرستش را
   نگه دارد باید برای هر جایگاهِ تازه دوباره دیپلوی شود.

   این ثابت فقط پشتیبانِ ردیف‌هایی است که هنوز ستونشان خالی است — و
   `rolesFor` اول سراغ ردیف می‌رود. */
export const PLACEMENT_ROLES: Record<string, string[]> = {
  market_featured_products_homepage: ['manufacturer', 'seller'],
  featured_clubs_homepage: ['club_owner'],
  featured_equipment_stores_homepage: ['seller'],
  market_ads_right: ['club_owner', 'seller', 'manufacturer'],
  market_ads_left: ['club_owner', 'seller', 'manufacturer'],
  equipment_ads_right: ['club_owner', 'seller', 'manufacturer'],
  equipment_ads_left: ['club_owner', 'seller', 'manufacturer'],
  homepage_bottom_banner: ['club_owner', 'seller', 'manufacturer'],
}

/** نقش‌های مجازِ یک جایگاه — از خودِ ردیف، و اگر خالی بود از نگاشتِ قدیمی */
export const rolesFor = (p: Pick<Placement, 'key' | 'advertiserRoles'>): string[] =>
  (p.advertiserRoles?.length ? p.advertiserRoles : (PLACEMENT_ROLES[p.key] ?? []))

export interface Eligibility {
  /** نقش‌های تأییدشده‌ی شخص (نه نقش‌های خوداظهار) */
  roles: string[]
  identityRequired: boolean
  placements: (Placement & { plans: PricingPlan[]; avail: Availability | null })[]
}

/**
 * جایگاه‌هایی که این کاربر می‌تواند بخرد.
 *
 * فقط جایگاه‌های `paid` (گیت فاز ۴) و فقط آن‌هایی که نقش تأییدشده‌ی
 * کاربر اجازه می‌دهد. نقش خوداظهار `users.primaryRole` عمداً نادیده
 * گرفته می‌شود چون کاربر خودش می‌تواند تغییرش دهد — مبنا همان
 * نقش‌های تأییدشده‌ی فاز ۳ است.
 */
export async function eligibleFor(userId: string): Promise<Eligibility> {
  const lookup = await lookupPersonForUser(userId)
  if (!lookup.personId) {
    return { roles: [], identityRequired: lookup.reason === 'no_identity', placements: [] }
  }

  const roles = await verifiedRolesOfPerson(lookup.personId)
  /* فقط جایگاهی که هم پولی است و هم روشن، خریدنی است.

     `isActive` تا امروز این‌جا بررسی نمی‌شد: جایگاهِ خاموش در فهرستِ
     خرید می‌آمد، کاربر تا درگاه می‌رفت و آن‌جا `reserve_campaign_slot`
     با PLACEMENT_INACTIVE ردش می‌کرد — یعنی خطا در بدترین لحظه. */
  const paid = (await listPlacements()).filter(p => p.mode === 'paid' && p.isActive)

  const allowed = paid.filter(p => roles.some(r => rolesFor(p).includes(r)))

  const withPlans = await Promise.all(allowed.map(async p => {
    const plans = await plansForPlacement(p.key)
    /* ظرفیت برای کوتاه‌ترین پله سنجیده می‌شود: اگر برای کمترین مدت هم
       جا نباشد، برای مدت‌های بلندتر قطعاً نیست. */
    const shortest = plans.reduce((m, x) => Math.min(m, x.durationDays), Infinity)
    return {
      ...p,
      plans,
      avail: plans.length ? await availability(p.key, Number.isFinite(shortest) ? shortest : 30) : null,
    }
  }))

  /* جایگاهی که هیچ پله‌ی قیمتی ندارد قابل خرید نیست */
  return { roles, identityRequired: false, placements: withPlans.filter(p => p.plans.length > 0) }
}

/* ── ظرفیت ────────────────────────────────────────────────────

   ظرفیت تا امروز فقط سقفِ *نمایش* بود و هیچ‌جا هنگام خرید بررسی
   نمی‌شد؛ روی جایگاهِ یک‌ظرفیتی می‌شد بی‌نهایت کمپین فروخت. شمارش و
   رزرو حالا هر دو در دیتابیس و زیرِ قفلِ ردیفِ جایگاه انجام می‌شوند
   (مهاجرتِ ۰۵۵) — بررسی و درج در دو رفت‌وبرگشتِ جدا یعنی دو خریدارِ
   هم‌زمان هر دو «جا هست» می‌بینند. */

export interface Availability {
  capacity: number
  used: number
  /** ‎-1 یعنی جایگاه سقفی ندارد */
  free: number
  isActive: boolean
  unlimited: boolean
}

/** چند جا روی این جایگاه، در این بازه، آزاد است؟ */
export async function availability(
  placementKey: string,
  durationDays = 30,
  from: Date = new Date(),
): Promise<Availability | null> {
  const end = new Date(from.getTime() + Math.max(1, durationDays) * 86400_000)
  const { data, error } = await rpc<{
    capacity: number; used: number; free: number; is_active: boolean
  }[]>('placement_availability', {
    p_key: placementKey,
    p_start: from.toISOString(),
    p_end: end.toISOString(),
  })
  if (error || !Array.isArray(data) || data.length === 0) return null
  const r = data[0]!
  return {
    capacity: Number(r.capacity) || 0,
    used: Number(r.used) || 0,
    free: Number(r.free),
    isActive: r.is_active === true,
    unlimited: Number(r.capacity) <= 0,
  }
}

/* ── قیمت‌گذاری ───────────────────────────────────────────────── */

export interface Quote {
  ok: true
  placement: Placement
  plan: PricingPlan
  amount: number
  durationDays: number
}
export type QuoteResult = Quote | { ok: false; status: number; message: string }

/** قیمت نهایی — فقط از دیتابیس. هیچ ورودی عددی از کلاینت پذیرفته نمی‌شود. */
export async function quote(placementKey: string, planId: string): Promise<QuoteResult> {
  const placement = await getPlacement(placementKey)
  if (!placement) return { ok: false, status: 404, message: 'جایگاه پیدا نشد' }
  if (placement.mode !== 'paid') return { ok: false, status: 409, message: 'این جایگاه فعلاً قابل خرید نیست' }

  const { data, error } = await sb().from('ad_pricing_plans').select('*').eq('id', planId).maybeSingle()
  if (error || !data) return { ok: false, status: 404, message: 'پلن پیدا نشد' }
  const row = data as Record<string, unknown>

  /* پلن باید مال همین جایگاه باشد — جلوی چسباندن پلن ارزان جایگاه
     دیگر به جایگاه گران را می‌گیرد */
  if (String(row.placement_key ?? '') !== placement.key) {
    return { ok: false, status: 409, message: 'این پلن به این جایگاه تعلق ندارد' }
  }
  if (row.is_active !== true) return { ok: false, status: 409, message: 'این پلن دیگر فعال نیست' }

  const amount = Number(row.price) || 0
  if (amount <= 0) return { ok: false, status: 409, message: 'قیمت این پلن تنظیم نشده است' }

  const plan: PricingPlan = {
    id: String(row.id), name: String(row.name), description: (row.description as string) ?? null,
    placementKey: (row.placement_key as string) ?? null,
    price: amount, durationDays: Number(row.duration_days) || 30,
    adQuantity: Number(row.ad_quantity) || 0, creditAmount: Number(row.credit_amount) || 0,
    isActive: true, sortOrder: Number(row.sort_order) || 0, badge: (row.badge as string) ?? null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }

  return { ok: true, placement, plan, amount, durationDays: plan.durationDays }
}

/* ── ساخت سفارش ──────────────────────────────────────────────── */

export interface OrderDraft {
  orderId: string
  campaignId: string
  amount: number
  durationDays: number
}

/**
 * کمپین پیش‌نویس + سفارش در انتظار پرداخت.
 *
 * کمپین با وضعیت PENDING_PAYMENT ساخته می‌شود تا تا پیش از پرداخت
 * هیچ‌جا نمایش داده نشود (فقط ACTIVE داخل پنجره سرو می‌شود). پنجره‌ی
 * زمانی واقعی هنگام تأیید ادمین از نو حساب می‌شود.
 */
export async function createOrder(
  userId: string,
  q: Quote,
  content: Record<string, unknown>,
  advertiser: string,
  title: string,
): Promise<OrderDraft | { error: string }> {
  const invalid = validateContent(q.placement, content)
  if (invalid) return { error: invalid }

  const now = Date.now()

  /* رزروِ اتمیک: شمردنِ ظرفیت و ساختِ کمپین در یک تراکنش، زیرِ قفلِ
     ردیفِ جایگاه. اگر این‌جا اول می‌شمردیم و بعد درج می‌کردیم، دو
     خریدارِ هم‌زمان هر دو «جا هست» می‌دیدند و هر دو پول می‌دادند. */
  const { data: reserved, error: resErr } = await rpc<string>('reserve_campaign_slot', {
    p_placement: q.placement.key,
    p_user: userId,
    p_advertiser: advertiser.slice(0, 160),
    p_title: title.slice(0, 160),
    p_content: content,
    p_starts: new Date(now).toISOString(),
    p_ends: new Date(now + q.durationDays * 86400_000).toISOString(),
  })

  if (resErr || !reserved) {
    /* کدهای کوتاهِ تابع به پیامِ فارسی. متنِ خام دیتابیس هرگز به
       کاربر نشان داده نمی‌شود. */
    const raw = String(resErr?.message ?? '')
    if (raw.includes('PLACEMENT_FULL')) {
      return { error: 'ظرفیت این جایگاه در این بازه تکمیل است' }
    }
    if (raw.includes('PLACEMENT_INACTIVE')) {
      return { error: 'این جایگاه فعلاً فعال نیست' }
    }
    if (raw.includes('PLACEMENT_NOT_FOUND')) {
      return { error: 'جایگاه پیدا نشد' }
    }
    return { error: 'ساخت کمپین انجام نشد' }
  }
  const campaignId = String(reserved)

  const { data: order, error: orderErr } = await sb().from('campaign_orders').insert({
    user_id: userId,
    kind: 'placement',
    placement_key: q.placement.key,
    plan_id: q.plan.id,
    campaign_id: campaignId,
    amount: q.amount,
    duration_days: q.durationDays,
    status: 'PENDING',
    provider: 'pending',
    /* اسنپ‌شات: قیمت و مشخصات لحظه‌ی خرید بماند حتی اگر پلن بعداً عوض شود */
    snapshot: {
      placementTitle: q.placement.title,
      planName: q.plan.name,
      price: q.amount,
      durationDays: q.durationDays,
    },
  }).select('id').single()

  if (orderErr || !order) {
    await sb().from('campaigns').delete().eq('id', campaignId)
    return { error: 'ثبت سفارش انجام نشد' }
  }

  return {
    orderId: String((order as { id: string }).id),
    campaignId, amount: q.amount, durationDays: q.durationDays,
  }
}

/* ── داشبورد تبلیغ‌دهنده ─────────────────────────────────────── */

export interface MyCampaign {
  id: string
  placementKey: string
  placementTitle: string
  planName: string | null
  title: string
  status: string
  startsAt: string
  endsAt: string
  impressions: number
  clicks: number
  ctr: number
  amount: number | null
  paymentStatus: string | null
  orderId: string | null
  createdAt: string
}

/** کمپین‌های خود کاربر با وضعیت پرداخت و آمارشان */
export async function myCampaigns(userId: string): Promise<MyCampaign[]> {
  const { data: camps, error } = await sb().from('campaigns').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(200)
  if (error || !camps) return []

  const rows = camps as Record<string, unknown>[]
  if (rows.length === 0) return []

  const { data: orders } = await sb().from('campaign_orders')
    .select('id,campaign_id,amount,status,snapshot')
    .in('campaign_id', rows.map(r => String(r.id)))

  const byCampaign = new Map<string, Record<string, unknown>>()
  for (const o of ((orders as Record<string, unknown>[] | null) ?? [])) {
    byCampaign.set(String(o.campaign_id), o)
  }

  const placements = await listPlacements()
  const titleOf = new Map<string, string>(placements.map(p => [String(p.key), p.title]))

  return rows.map(r => {
    const o = byCampaign.get(String(r.id))
    const snap = (o?.snapshot ?? {}) as Record<string, unknown>
    const imp = Number(r.impressions) || 0
    const clk = Number(r.clicks) || 0
    return {
      id: String(r.id),
      placementKey: String(r.placement_key),
      placementTitle: titleOf.get(String(r.placement_key)) ?? String(r.placement_key),
      planName: (snap.planName as string) ?? null,
      title: String(r.title ?? ''),
      status: String(r.status),
      startsAt: String(r.starts_at),
      endsAt: String(r.ends_at),
      impressions: imp,
      clicks: clk,
      ctr: imp > 0 ? (clk / imp) * 100 : 0,
      /* شمارنده‌های تبلیغِ ویدیویی (مهاجرتِ ۰۵۱). برای جایگاه‌های
         بنری همیشه صفرند و داشبورد آن‌ها را نشان نمی‌دهد — بخشی که
         عددِ بی‌معنی نشان بدهد بدتر از نبودنش است. */
      completedViews: Number(r.completed_views) || 0,
      skippedViews: Number(r.skipped_views) || 0,
      /* نرخِ رد کردن: از مجموعِ *پایان‌یافته‌ها*، نه از کلِ نمایش‌ها.
         نمایشی که هنوز تمام نشده هنوز نه کامل است نه ردشده. */
      skipRate: (Number(r.completed_views) || 0) + (Number(r.skipped_views) || 0) > 0
        ? ((Number(r.skipped_views) || 0) /
           ((Number(r.completed_views) || 0) + (Number(r.skipped_views) || 0))) * 100
        : 0,
      amount: o ? Number(o.amount) || 0 : null,
      paymentStatus: o ? String(o.status) : null,
      orderId: o ? String(o.id) : null,
      createdAt: String(r.created_at),
    }
  })
}
