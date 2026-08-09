/* ─────────────────────────────────────────────────────────────
   تبدیل ارجاع موجودیت به اسنپ‌شات قابل نمایش.

   کمپین‌های «موجودیتی» فقط ref نگه می‌دارند (شناسه‌ی محصول/باشگاه/
   نامک فروشگاه). سمت سرور همین‌جا به داده‌ی کارت سبک تبدیل می‌شود
   تا کلاینت نه join بزند و نه به اسکیمای جدول‌ها وابسته شود.

   موجودیتی که پیدا نشود (حذف‌شده) بی‌صدا کنار گذاشته می‌شود — کمپین
   یتیم نباید سکشن را بشکند.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'
import type { EntityType } from './core'

export interface EntitySnapshot {
  entityType: EntityType
  ref: string
  title: string
  image: string
  subtitle: string          // برند / شهر / تخصص — بسته به نوع
  href: string
  price?: number            // فقط محصول — قیمتِ پرداختی
  oldPrice?: number         // قیمتِ خط‌خورده
  discountPercent?: number
  /** آگهیِ توافقی قیمتِ قابلِ نمایش ندارد؛ کارت باید «توافقی» بنویسد
      نه «۰ تومان». */
  negotiable?: boolean
  city?: string
  badge?: string | null
  /** آمار واقعی موجودیت — نبودنش یعنی «نداریم»، نه صفر */
  stats?: { tables?: number; snooker?: number; pocket?: number; highball?: number }
}

const s = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
const n = (v: unknown, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveProducts(rawRefs: string[]): Promise<Map<string, EntitySnapshot>> {
  const out = new Map<string, EntitySnapshot>()
  /* یک ref غیر-uuid کوئری in() را با 22P02 می‌شکست و «همه‌ی» کمپین‌های
     جایگاه بی‌صدا ناپدید می‌شدند */
  const refs = rawRefs.filter(x => UUID.test(x))
  if (!refs.length) return out
  const { data } = await sb().from('products')
    .select('id,title,price,negotiable,"discountPrice","discountPercent",images,brand,city,status')
    .in('id', refs)
  for (const r of (data as Record<string, unknown>[] ?? [])) {
    if (s(r.status) !== 'active') continue
    /* ── همان قراردادِ بقیه‌ی سایت ──
       `price` قیمتِ فهرست است و `discountPrice` پرداختی. تا امروز
       این‌جا `price` مستقیم به کارت می‌رفت و قیمتِ خط‌خورده از روی
       درصدِ گِردشده بازسازی می‌شد — عددی که هیچ‌وقت دقیق درنمی‌آمد. */
    const listed = n(r.price)
    const paid = n(r.discountPrice)
    const hasDisc = paid > 0 && paid < listed
    const price = hasDisc ? paid : listed
    const disc = n(r.discountPercent)
    const imgs = Array.isArray(r.images) ? r.images as string[] : []
    out.set(s(r.id), {
      entityType: 'product', ref: s(r.id),
      title: s(r.title, 'محصول'),
      image: imgs[0] || '/images/shop/cue_billiard_2.webp',
      subtitle: s(r.brand),
      href: `/shop/${s(r.id)}`,
      price,
      oldPrice: listed,
      negotiable: r.negotiable === true,
      discountPercent: disc,
      city: s(r.city),
    })
  }
  return out
}

async function resolveClubs(rawRefs: string[]): Promise<Map<string, EntitySnapshot>> {
  const out = new Map<string, EntitySnapshot>()
  const refs = rawRefs.filter(x => UUID.test(x))
  if (!refs.length) return out
  const { data } = await sb().from('clubs')
    .select('id,name,city,images,logo,"isActive"')
    .in('id', refs)
  for (const r of (data as Record<string, unknown>[] ?? [])) {
    if (r.isActive === false) continue
    const imgs = Array.isArray(r.images) ? r.images as string[] : []
    out.set(s(r.id), {
      entityType: 'club', ref: s(r.id),
      title: s(r.name, 'باشگاه'),
      /* «??» بعد از s() مرده بود — s هرگز null برنمی‌گرداند */
      image: imgs[0] || s(r.logo) || '/images/shop/snooker-table.webp',
      subtitle: s(r.city),
      href: `/clubs/${s(r.id)}`,
      city: s(r.city),
    })
  }
  return out
}

async function resolveSellers(refs: string[]): Promise<Map<string, EntitySnapshot>> {
  const out = new Map<string, EntitySnapshot>()
  if (!refs.length) return out
  const { data } = await sb().from('profiles')
    .select('slug,data,status,verified')
    .eq('kind', 'seller')
    .in('slug', refs)
  for (const r of (data as Record<string, unknown>[] ?? [])) {
    if (s(r.status) !== 'approved') continue
    const d = (r.data ?? {}) as Record<string, unknown>
    out.set(s(r.slug), {
      entityType: 'seller', ref: s(r.slug),
      title: s(d.title, 'فروشگاه'),
      image: s(d.logo) || (Array.isArray(d.banners) ? s((d.banners as string[])[0]) : '') || '/images/stores/store1.jpg',
      subtitle: s(d.city),
      href: `/sellers/${s(r.slug)}`,
      city: s(d.city),
      badge: r.verified ? 'تأیید شده' : null,
    })
  }
  return out
}

/** یک دسته ارجاع هم‌نوع → اسنپ‌شات‌ها، با حفظ ترتیب ورودی */
/* ── محتوای اسپانسری ──

   «مسابقهٔ اسپانسری» و «ویدیوی اسپانسری» نوعِ تازه‌ای از تبلیغ نیستند؛
   همان جایگاهِ موجودیتی‌اند با جدولِ منبعِ متفاوت. به همین دلیل به‌جای
   ساختنِ `contentKind` تازه — که کلِ مسیرِ سرو، اعتبارسنجی و پنل ادمین
   را تکرار می‌کرد — فقط دو resolver اضافه شد.

   هر دو همان قاعده‌ی بقیه را دارند: چیزی که منتشر نشده یا خصوصی است
   هرگز به‌عنوان محتوای اسپانسری سرو نمی‌شود، حتی اگر ادمین کمپینش را
   فعال کرده باشد. تبلیغ نباید درِ پشتیِ دیدنِ محتوای منتشرنشده باشد. */
async function resolveTournaments(rawRefs: string[]): Promise<Map<string, EntitySnapshot>> {
  const out = new Map<string, EntitySnapshot>()
  const refs = rawRefs.filter(x => UUID.test(x))
  if (!refs.length) return out
  const { data } = await sb().from('tournaments')
    .select('id,slug,title,city,cover_url,status,starts_at,entry_fee')
    .in('id', refs)
  /* پیش‌نویس و لغوشده سرو نمی‌شوند */
  const LIVE = ['published', 'registration_open', 'registration_closed', 'ongoing']
  for (const r of (data as Record<string, unknown>[] ?? [])) {
    if (!LIVE.includes(s(r.status))) continue
    out.set(s(r.id), {
      entityType: 'tournament', ref: s(r.id),
      title: s(r.title, 'مسابقه'),
      image: s(r.cover_url) || '/images/shop/snooker-table.webp',
      subtitle: s(r.city),
      href: `/tournaments/${s(r.slug) || s(r.id)}`,
      city: s(r.city),
      /* ورودیِ رایگان خودش یک مزیتِ گفتنی است */
      badge: n(r.entry_fee) === 0 ? 'ورود رایگان' : null,
    })
  }
  return out
}

async function resolveVideos(rawRefs: string[]): Promise<Map<string, EntitySnapshot>> {
  const out = new Map<string, EntitySnapshot>()
  const refs = rawRefs.filter(x => UUID.test(x))
  if (!refs.length) return out
  const { data } = await sb().from('videos')
    .select('id,slug,title,thumb,creator_name,status,visibility')
    .in('id', refs)
  for (const r of (data as Record<string, unknown>[] ?? [])) {
    if (s(r.status) !== 'published' || s(r.visibility) !== 'public') continue
    out.set(s(r.id), {
      entityType: 'video', ref: s(r.id),
      title: s(r.title, 'ویدیو'),
      image: s(r.thumb),
      subtitle: s(r.creator_name),
      href: `/media/${encodeURIComponent(s(r.slug) || s(r.id))}`,
    })
  }
  return out
}

export async function resolveEntities(entityType: EntityType, refs: string[]): Promise<EntitySnapshot[]> {
  const map = entityType === 'product' ? await resolveProducts(refs)
    : entityType === 'club' ? await resolveClubs(refs)
    : entityType === 'tournament' ? await resolveTournaments(refs)
    : entityType === 'video' ? await resolveVideos(refs)
    : await resolveSellers(refs)
  return refs.map(r => map.get(r)).filter(Boolean) as EntitySnapshot[]
}
