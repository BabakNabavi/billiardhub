/* ─────────────────────────────────────────────────────────────
   تبدیلِ ارجاعِ موجودیت به اسنپ‌شاتِ قابلِ نمایش.

   کمپین‌های «موجودیتی» فقط ref نگه می‌دارند (شناسه‌ی محصول/باشگاه/
   نامکِ فروشگاه). سمتِ سرور همین‌جا به داده‌ی کارتِ سبک تبدیل می‌شود
   تا کلاینت نه join بزند و نه به اسکیمای جدول‌ها وابسته شود.

   موجودیتی که پیدا نشود (حذف‌شده) بی‌صدا کنار گذاشته می‌شود — کمپینِ
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
  price?: number            // فقط محصول
  oldPrice?: number
  discountPercent?: number
  city?: string
  badge?: string | null
}

const s = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
const n = (v: unknown, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveProducts(rawRefs: string[]): Promise<Map<string, EntitySnapshot>> {
  const out = new Map<string, EntitySnapshot>()
  /* یک refِ غیر-uuid کوئریِ in() را با 22P02 می‌شکست و «همه‌ی» کمپین‌های
     جایگاه بی‌صدا ناپدید می‌شدند */
  const refs = rawRefs.filter(x => UUID.test(x))
  if (!refs.length) return out
  const { data } = await sb().from('products')
    .select('id,title,price,"discountPercent",images,brand,city,status')
    .in('id', refs)
  for (const r of (data as Record<string, unknown>[] ?? [])) {
    if (s(r.status) !== 'active') continue
    const price = n(r.price)
    const disc = n(r.discountPercent)
    const imgs = Array.isArray(r.images) ? r.images as string[] : []
    out.set(s(r.id), {
      entityType: 'product', ref: s(r.id),
      title: s(r.title, 'محصول'),
      image: imgs[0] || '/images/shop/cue_billiard_2.jpg',
      subtitle: s(r.brand),
      href: `/shop/${s(r.id)}`,
      price,
      oldPrice: disc > 0 ? Math.round(price / (1 - disc / 100)) : price,
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
      image: imgs[0] || s(r.logo) || '/images/shop/snooker-table.jpg',
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

/** یک دسته ارجاعِ هم‌نوع → اسنپ‌شات‌ها، با حفظِ ترتیبِ ورودی */
export async function resolveEntities(entityType: EntityType, refs: string[]): Promise<EntitySnapshot[]> {
  const map = entityType === 'product' ? await resolveProducts(refs)
    : entityType === 'club' ? await resolveClubs(refs)
    : await resolveSellers(refs)
  return refs.map(r => map.get(r)).filter(Boolean) as EntitySnapshot[]
}
