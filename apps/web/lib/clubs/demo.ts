/* ═══════════════════════════════════════════════════════════════
   باشگاهِ نمایشی — ساخت، فهرست و حذف.

   شش نوعِ دیگرِ محتوای نمایشی روی جدولِ `profiles` می‌نشینند و از
   `lib/profiles/server` می‌آیند. باشگاه جدولِ خودش را دارد، پس
   مسیرِ خودش را هم می‌خواهد — ولی با همان سه قاعده:

     · هر ردیف `is_demo = true` می‌گیرد و همیشه از داده‌ی واقعی جدا
       می‌ماند (مهاجرتِ ۰۵۹).
     · تیکِ تأیید نمی‌گیرد. آن تیک یعنی جوازِ کسب استعلام شده و روی
       باشگاهی که وجودِ خارجی ندارد ادعای درستی نیست.
     · حذف فقط با شرطِ `is_demo` انجام می‌شود، پس حتی با شناسه‌ی
       اشتباه هم باشگاهِ یک کاربرِ واقعی از این مسیر پاک نمی‌شود.
   ═══════════════════════════════════════════════════════════════ */

import { sb } from '../finance/db'
import { offloadImages } from '../profiles/server'

export interface DemoClubInput {
  ownerId: string
  name: string
  province: string
  city: string
  address: string
  phone?: string
  description?: string
  images?: string[]
  logo?: string
  /* میزها — دقیقاً همان چهار کلیدی که کارتِ باشگاه در `/clubs`
     می‌خواند (TABLE_TYPES). نه «کارامبول» داریم نه «نرخ ساعتی»:
     ستونشان وجود ندارد و قیمت جای دیگری، روی خودِ میز، تعریف می‌شود. */
  snookerTables?: number
  pocketTables?: number
  highballTables?: number
  vipSnookerTables?: number
  /* امکانات — همان کلیدهای AMENITIES */
  hasCafe?: boolean
  hasParking?: boolean
  hasWifi?: boolean
  hasProfessionalCoach?: boolean
}

export interface DemoClubRow {
  id: string
  name: string
  city: string
  province: string | null
  address: string
  images: string[]
  isActive: boolean
  createdAt: string
}

const s = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max)
const n = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)))

type DbClub = {
  id: string; name: string; city: string; province: string | null
  address: string; images: unknown; isActive: boolean; createdAt: string
}

const toRow = (r: DbClub): DemoClubRow => ({
  id: String(r.id), name: r.name, city: r.city, province: r.province,
  address: r.address,
  images: Array.isArray(r.images) ? (r.images as unknown[]).map(String) : [],
  isActive: r.isActive !== false,
  createdAt: String(r.createdAt),
})

export async function createDemoClub(input: DemoClubInput): Promise<DemoClubRow> {
  const name = s(input.name, 160)
  const city = s(input.city, 80)
  const address = s(input.address, 400)
  if (!name || !city || !address) throw new Error('نام، شهر و آدرس لازم است')

  /* عکس‌های data: به Storage منتقل می‌شوند — همان کاری که مسیرِ
     پروفایل‌های نمایشی می‌کند. بدونِ این، یک عکسِ base64 چند مگابایتی
     مستقیم داخلِ ردیفِ دیتابیس می‌نشست. */
  const images = await offloadImages(
    (input.images ?? []).filter(Boolean), 'clubs/demo',
  ) as string[]
  const logo = input.logo ? await offloadImages(input.logo, 'clubs/demo') as string : null

  const { data, error } = await sb().from('clubs').insert({
    name, city, address,
    province: s(input.province, 80) || null,
    /* سه ستونِ NOT NULL که فرمِ عمومی هم همیشه پرشان می‌کند.
       `country` عمداً 'Iran' است نه «ایران» — همان مقداری که فرمِ ثبتِ
       باشگاه می‌فرستد؛ دو املای متفاوت یعنی فیلترِ کشور روزی نصفِ
       ردیف‌ها را جا می‌اندازد. مختصات صفر یعنی «ثبت نشده»، که برای
       باشگاهی که وجودِ خارجی ندارد درست‌ترین مقدار است. */
    country: 'Iran',
    latitude: 0,
    longitude: 0,
    timezone: 'Asia/Tehran',
    ownerId: input.ownerId,
    phone: s(input.phone, 40) || null,
    description: s(input.description, 2000) || null,
    images, logo,
    snookerTables: n(input.snookerTables, 200),
    pocketTables: n(input.pocketTables, 200),
    highballTables: n(input.highballTables, 200),
    vipSnookerTables: n(input.vipSnookerTables, 200),
    hasCafe: !!input.hasCafe,
    hasParking: !!input.hasParking,
    hasWifi: !!input.hasWifi,
    hasProfessionalCoach: !!input.hasProfessionalCoach,
    /* دیده شود — کارِ این ردیف دقیقاً همین است */
    isActive: true,
    /* ولی تیکِ تأیید نگیرد */
    verificationStatus: 'pending',
    is_demo: true,
  }).select('id,name,city,province,address,images,"isActive","createdAt"').single()

  if (error) throw new Error(error.message)
  return toRow(data as unknown as DbClub)
}

export async function listDemoClubs(): Promise<DemoClubRow[]> {
  const { data, error } = await sb().from('clubs')
    .select('id,name,city,province,address,images,"isActive","createdAt"')
    .eq('is_demo', true)
    .order('createdAt', { ascending: false })
    .limit(500)
  if (error) return []
  return (data as unknown as DbClub[]).map(toRow)
}

/** حذفِ یک باشگاهِ نمایشی. شرطِ `is_demo` عمدی است. */
export async function deleteDemoClub(id: string): Promise<boolean> {
  const { error, count } = await sb().from('clubs')
    .delete({ count: 'exact' }).eq('id', id).eq('is_demo', true)
  return !error && (count ?? 0) > 0
}
