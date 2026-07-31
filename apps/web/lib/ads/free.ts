/* ─────────────────────────────────────────────────────────────
   محتوای رایگان جایگاه‌های موجودیتی (فاز ۵).

   جایگاهی که ادمین روی حالت «رایگان» گذاشته، کمپین ندارد؛ محتوایش
   مستقیم از داده‌ی واقعی سایت می‌آید: تازه‌ترین محصولات، باشگاه‌ها و
   فروشگاه‌ها. خروجی دقیقاً همان شکل EntitySnapshot است که مسیر
   کمپینی می‌سازد، پس کلاینت فرقی بین «رایگان» و «پولی» نمی‌بیند و
   تغییر حالت از پنل ادمین هیچ تغییری در ظاهر نمی‌دهد.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'
import type { EntityType } from './core'
import type { EntitySnapshot } from './resolve'

const s = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
const n = (v: unknown, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d }

/** تازه‌ترین محصولات فعال بازار */
async function freeProducts(limit: number): Promise<EntitySnapshot[]> {
  const { data, error } = await sb().from('products')
    .select('id,title,price,"discountPercent",images,brand,city,status,"createdAt"')
    .eq('status', 'active')
    .order('createdAt', { ascending: false })
    /* شکست تساوی: داده‌ی seed همه یک زمان ثبت دارند و بدون این کلید،
       ترتیب خروجی بین درخواست‌ها می‌توانست عوض شود و کارت‌ها بپرند */
    .order('id', { ascending: true })
    .limit(limit)
  if (error || !data) return []

  return (data as Record<string, unknown>[]).map(r => {
    const price = n(r.price)
    const disc = n(r.discountPercent)
    const imgs = Array.isArray(r.images) ? r.images as string[] : []
    return {
      entityType: 'product' as const, ref: s(r.id),
      title: s(r.title, 'محصول'),
      image: imgs[0] || '/images/shop/cue_billiard_2.webp',
      subtitle: s(r.brand),
      href: `/shop/${s(r.id)}`,
      price,
      /* تخفیف ۱۰۰٪ تقسیم بر صفر می‌شد و قیمت خط‌خورده Infinity می‌داد */
      oldPrice: disc > 0 && disc < 100 ? Math.round(price / (1 - disc / 100)) : price,
      discountPercent: disc,
      city: s(r.city),
    }
  })
}

/**
 * تازه‌ترین باشگاه‌های فعال — تأییدشده‌ها اول.
 *
 * «تأییدشده اول» به‌جای «فقط تأییدشده» عمدی است: باشگاهی که ثبت‌نام
 * کرده ولی هنوز جوازش استعلام نشده، باشگاه واقعی سایت است و پنهان
 * کردنش سکشن را بی‌دلیل خالی می‌کند. نشان «تأیید» روی کارت تفاوت را
 * نشان می‌دهد.
 */
async function freeClubs(limit: number): Promise<EntitySnapshot[]> {
  const { data, error } = await sb().from('clubs')
    .select('id,name,city,images,logo,"isActive","verificationStatus","createdAt",' +
      '"snookerTables","pocketTables","highballTables","vipSnookerTables","vipPocketTables"')
    .eq('isActive', true)
    .order('createdAt', { ascending: false })
    .order('id', { ascending: true })          // ترتیب پایدار در تساوی زمان
    .limit(Math.max(limit * 3, limit))
  if (error || !data) return []

  const rows = data as unknown as Record<string, unknown>[]
  const rank = (r: Record<string, unknown>) => (s(r.verificationStatus) === 'verified' ? 0 : 1)
  /* مرتب‌سازی پایدار جاوااسکریپت ترتیب قبلی را داخل هر رتبه حفظ می‌کند */
  rows.sort((a, b) => rank(a) - rank(b))

  return rows.slice(0, limit).map(r => {
    const imgs = Array.isArray(r.images) ? r.images as string[] : []
    /* تفکیک واقعی میزها (میز VIP هم از جنس همان نوع است).
       ایرهاکی عمداً بیرون است: میز بیلیارد نیست و کارت هم فقط سه
       نوع اسنوکر/پاکت/هی‌بال را نشان می‌دهد. */
    const snooker = n(r.snookerTables) + n(r.vipSnookerTables)
    const pocket = n(r.pocketTables) + n(r.vipPocketTables)
    const highball = n(r.highballTables)
    const tables = snooker + pocket + highball
    return {
      entityType: 'club' as const, ref: s(r.id),
      title: s(r.name, 'باشگاه'),
      image: imgs[0] || s(r.logo) || '/images/shop/snooker-table.webp',
      subtitle: s(r.city),
      href: `/clubs/${s(r.id)}`,
      city: s(r.city),
      badge: s(r.verificationStatus) === 'verified' ? 'تأیید شده' : null,
      ...(tables > 0 ? { stats: { tables, snooker, pocket, highball } } : {}),
    }
  })
}

/** تازه‌ترین فروشگاه‌های تأییدشده‌ی تجهیزات */
async function freeSellers(limit: number): Promise<EntitySnapshot[]> {
  const { data, error } = await sb().from('profiles')
    .select('slug,data,status,verified,created_at')
    .eq('kind', 'seller')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .order('slug', { ascending: true })        // ترتیب پایدار در تساوی زمان
    .limit(limit)
  if (error || !data) return []

  return (data as Record<string, unknown>[]).map(r => {
    const d = (r.data ?? {}) as Record<string, unknown>
    return {
      entityType: 'seller' as const, ref: s(r.slug),
      title: s(d.title, 'فروشگاه'),
      image: s(d.logo) || (Array.isArray(d.banners) ? s((d.banners as string[])[0]) : '') || '/images/stores/store1.jpg',
      subtitle: s(d.city),
      href: `/sellers/${s(r.slug)}`,
      city: s(d.city),
      badge: r.verified ? 'تأیید شده' : null,
    }
  })
}

/** محتوای پیش‌فرض یک جایگاه رایگان */
export async function freeContent(entityType: EntityType, limit: number): Promise<EntitySnapshot[]> {
  const take = Math.max(0, Math.min(60, Math.round(limit) || 0))
  if (take === 0) return []
  try {
    if (entityType === 'product') return await freeProducts(take)
    if (entityType === 'club') return await freeClubs(take)
    return await freeSellers(take)
  } catch (e) {
    /* خطا را بی‌صدا رد نکن: بدون لاگ، یک کوئری خراب دائمی از بیرون
       دقیقاً شبیه «محتوایی نداریم» دیده می‌شود */
    console.error('freeContent failed', entityType, e)
    return []
  }
}
