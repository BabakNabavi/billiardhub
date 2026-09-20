/* ─────────────────────────────────────────────────────────────
   Manufacturer profile store — پروتوتایپ کلاینتی (localStorage).
   مشترک بین /dashboard/manufacturer (پنل) و /manufacturers
   (دایرکتوری + صفحه‌ی تولیدکننده). مالکیت با user.id — همان
   الگوی seller/coach/referee/technician/player. ذخیره = انتشار.
   ───────────────────────────────────────────────────────────── */
import { provinceOfCity } from './iran-geo'
import type { MockManufacturer, MfrProduct } from './manufacturers-data'

export interface ManufacturerProfile {
  slug: string
  ownerId: string
  ownerPhone: string

  name: string
  city: string
  province: string
  sinceYear: string          // «۱۳۷۸» — متن تا ارقام فارسی هم پذیرفته شود
  specialties: string[]
  description: string
  tagline: string
  about: string
  productionCapability: string
  exportCountries: string
  totalProduced: string
  employees: string
  /* ⚠️ `image` اختیاری است تا ردیف‌های موجود بدون مهاجرت کار کنند،
     ولی فرم از این پس بدونِ تصویر گواهینامه را نمی‌پذیرد: ادعای
     استاندارد بدون مدرک، ادعاست. */
  certificates: { title: string; issuer: string; year: string; image?: string }[]
  /* پروانه‌ی تولید / جواز کسب — شماره و فایل */
  licenseNumber: string
  licenseFile: { name: string; url: string } | null
  phone: string
  /* شماره‌ی دوم — کارگاه معمولا یک خط برای فروش دارد و یکی برای دفتر */
  phone2?: string
  /* موبایل، جدا از واتساپ: شماره‌ی واتساپ لزوما شماره‌ی تماس نیست */
  mobile?: string
  whatsapp: string
  instagram: string
  website: string
  address: string
  /* ── نشانی دقیق ──
     همان چیزی که فرم باشگاه دارد: کد پستی برای نشانی رسمی، و
     مختصات برای «مسیریابی» واقعی به‌جای جست‌وجوی متنِ آدرس. */
  postalCode?: string
  latitude?: string
  longitude?: string
  hours: string
  bannerImage: string
  /* ── گالری تصاویر ──
     تا امروز تولیدکننده فقط یک بنر داشت و هیچ جایی برای نشان‌دادن
     کارگاه، خط تولید یا نمونه‌کار نبود. کلید اختیاری است تا
     ردیف‌های موجود بدون مهاجرت کار کنند. */
  /* همان شکل رسانه‌ی بقیه‌ی نقش‌ها؛ `caption`/`album` اختیاری‌اند
     چون ردیف‌های موجود فقط `{id,url}` دارند. */
  gallery?: { id: string; url: string; caption?: string; album?: string }[]
  albums?: string[]
  videos?: { id: string; url?: string; thumbnail: string; title: string; duration: string; album?: string }[]
  products: MfrProduct[]

  status: 'approved' | 'rejected'
  /* تیک آبی — فقط ادمین می‌دهد و روی ستون `profiles.verified`
     می‌نشیند، نه داخل jsonb. این‌جا اختیاری است چون پروفایل
     ذخیره‌شده‌ی محلی آن را ندارد؛ `fetchProfiles` کنارش می‌گذارد. */
  verified?: boolean
  updatedAt: string
}

const KEY = 'bh_manufacturer_profiles'

export function emptyManufacturerProfile(slug: string, ownerId = '', ownerPhone = ''): ManufacturerProfile {
  return {
    slug, ownerId, ownerPhone,
    name: '', city: '', province: '', sinceYear: '', specialties: [],
    description: '', tagline: '', about: '', productionCapability: '',
    exportCountries: '', totalProduced: '', employees: '', certificates: [],
    licenseNumber: '', licenseFile: null, phone: '', phone2: '', mobile: '',
    whatsapp: '', instagram: '', website: '', address: '',
    postalCode: '', latitude: '', longitude: '', hours: '', bannerImage: '',
    products: [],
    status: 'approved', updatedAt: '',
  }
}

function normalize(raw: Partial<ManufacturerProfile> & { slug: string }): ManufacturerProfile {
  const p = { ...emptyManufacturerProfile(raw.slug), ...raw }
  if (!p.province && p.city) p.province = provinceOfCity(p.city)
  if (p.ownerId == null) p.ownerId = ''
  return p
}

export function getManufacturerProfiles(): Record<string, ManufacturerProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, ManufacturerProfile>
    const out: Record<string, ManufacturerProfile> = {}
    for (const [k, v] of Object.entries(raw)) out[k] = normalize({ ...v, slug: v.slug ?? k })
    return out
  } catch { return {} }
}

export function getManufacturerProfile(slug: string): ManufacturerProfile | null {
  return getManufacturerProfiles()[slug] ?? null
}

export function listApprovedManufacturers(): ManufacturerProfile[] {
  return Object.values(getManufacturerProfiles()).filter(p => p.status === 'approved')
}

export function findManufacturerByOwner(
  owner: string | { id?: string; phone?: string } | null | undefined,
): ManufacturerProfile | null {
  if (!owner) return null
  const keys = (typeof owner === 'string' ? [owner] : [owner.id, owner.phone]).filter(Boolean) as string[]
  if (!keys.length) return null
  return Object.values(getManufacturerProfiles()).find(p =>
    (p.ownerId && keys.includes(p.ownerId)) || (p.ownerPhone && keys.includes(p.ownerPhone)),
  ) ?? null
}

export function saveManufacturerProfile(p: ManufacturerProfile) {
  if (typeof window === 'undefined') return
  const all = getManufacturerProfiles()
  for (const k of Object.keys(all)) {
    if (k === p.slug) continue
    const o = all[k]
    if (!o) continue
    if ((p.ownerId && o.ownerId === p.ownerId) || (p.ownerPhone && o.ownerPhone === p.ownerPhone)) delete all[k]
  }
  all[p.slug] = { ...p, updatedAt: new Date().toISOString() }
  try { localStorage.setItem(KEY, JSON.stringify(all)) }
  catch { throw new Error('quota') }
}

export function newManufacturerSlug(): string {
  return `m-${Date.now().toString(36)}`
}

/* پروفایل ذخیره‌شده → شکل MockManufacturer تا صفحات /manufacturers مستقیم رندرش کنند */
/* ⚠️ «نبودن» تنها حالت خراب نیست: `data` یک jsonb آزاد است و
   صفحه با `as ManufacturerProfile` رویش cast می‌کند، پس `specialties`
   می‌تواند رشته باشد و بعد `.some(...)` در فهرست تولیدکنندگان
   بترکد. یک گارد نوع در همین مرز، همه‌ی مصرف‌کننده‌ها را می‌پوشاند. */
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? v as T[] : [])

export function profileToManufacturer(p: ManufacturerProfile): MockManufacturer {
  /* ── چرا همه‌جا گارد ──
     ⚠️ این تابع `p.sinceYear.replace(...)` را بی‌گارد صدا می‌زد. مسیر
     ذخیره فقط `typeof === object` را می‌سنجد، پس ردیفی بدون
     `sinceYear` (یا با `null`) ممکن است — و آن‌وقت این تابع استثنا
     می‌داد، صفحه‌ی عمومی داخل `catch` می‌افتاد و به بازدیدکننده
     «ارتباط با سرور برقرار نشد» نشان می‌داد. یعنی یک فیلد نبوده،
     خودش را «قطعی اینترنت» جا می‌زد. همان تله برای آرایه‌ها هم بود
     (`p.products.length`). */
  const since = String(p.sinceYear ?? '')
  const yearNum = parseInt(since.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 10)
  return {
    id: p.slug,
    name: p.name || 'تولیدکننده',
    city: p.city || '—',
    /* پیش‌تر این‌جا `false` هاردکد بود: تیکی که ادمین می‌داد هرگز روی
       کارت /manufacturers دیده نمی‌شد. */
    verified: p.verified === true,
    elite: false,
    /* ⚠️ فقط خودِ سال. نسخه‌ی قبلی «از ۱۳۹۴» برمی‌گرداند و کارت هم
       جلویش «از» می‌گذاشت ⇒ «از از ۱۳۹۴». واژه‌ی «از» تصمیمِ نمایش
       است، نه بخشی از داده. */
    since: since,
    sinceYear: Number.isNaN(yearNum) ? 1400 : yearNum,
    productCount: arr(p.products).length,
    specialties: arr(p.specialties),
    /* ⚠️ «چند ساعت» هاردکد بود — ادعایی درباره‌ی سرعتِ پاسخ‌گویی که
       هیچ اندازه‌گیری‌ای پشتش نبود و روی کارتِ *همه* می‌نشست.
       تا وقتی واقعا اندازه گرفته نشود، جایش خالی است. */
    responseTime: '',
    phone: p.phone ?? '',
    /* ⚠️ عکسِ قرضی حذف شد: `Pro_table.webp` عکسِ پوشه‌ی فروشگاه بود و
       روی هدرِ هر تولیدکننده‌ی بی‌بنر می‌نشست. نبودنِ بنر یعنی
       پوسترِ ساخته‌شده — همان کاری که پروفایل مربی و داور می‌کنند. */
    bannerImage: p.bannerImage || '',
    gallery: arr(p.gallery),
    description: p.description ?? '',
    tagline: p.tagline || p.description || '',
    about: p.about || p.description || '',
    employees: p.employees || '—',
    exportCountries: p.exportCountries || '—',
    totalProduced: p.totalProduced || '—',
    productionCapability: p.productionCapability || '—',
    phone2: p.phone2 ?? '',
    mobile: p.mobile ?? '',
    whatsapp: p.whatsapp || String(p.phone ?? '').replace(/^0/, '98'),
    instagram: p.instagram ?? '',
    address: p.address ?? '',
    postalCode: p.postalCode ?? '',
    latitude: p.latitude ?? '',
    longitude: p.longitude ?? '',
    hours: p.hours || '—',
    website: p.website ?? '',
    products: arr(p.products),
    certificates: arr(p.certificates),
  }
}

export function deleteManufacturerProfile(slug: string) {
  if (typeof window === 'undefined') return
  const all = getManufacturerProfiles()
  delete all[slug]
  localStorage.setItem('bh_manufacturer_profiles', JSON.stringify(all))
}
