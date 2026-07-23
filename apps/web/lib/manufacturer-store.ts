/* ─────────────────────────────────────────────────────────────
   Manufacturer profile store — پروتوتایپِ کلاینتی (localStorage).
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
  certificates: { title: string; issuer: string; year: string }[]
  phone: string
  whatsapp: string
  instagram: string
  website: string
  address: string
  hours: string
  bannerImage: string
  products: MfrProduct[]

  status: 'approved' | 'rejected'
  updatedAt: string
}

const KEY = 'bh_manufacturer_profiles'

export function emptyManufacturerProfile(slug: string, ownerId = '', ownerPhone = ''): ManufacturerProfile {
  return {
    slug, ownerId, ownerPhone,
    name: '', city: '', province: '', sinceYear: '', specialties: [],
    description: '', tagline: '', about: '', productionCapability: '',
    exportCountries: '', totalProduced: '', employees: '', certificates: [], phone: '', whatsapp: '',
    instagram: '', website: '', address: '', hours: '', bannerImage: '',
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

/* پروفایلِ ذخیره‌شده → شکلِ MockManufacturer تا صفحات /manufacturers مستقیم رندرش کنند */
export function profileToManufacturer(p: ManufacturerProfile): MockManufacturer {
  const yearNum = parseInt(p.sinceYear.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 10)
  return {
    id: p.slug,
    name: p.name || 'تولیدکننده',
    city: p.city || '—',
    verified: false,
    elite: false,
    since: p.sinceYear ? `از ${p.sinceYear}` : '—',
    sinceYear: Number.isNaN(yearNum) ? 1400 : yearNum,
    productCount: p.products.length,
    specialties: p.specialties,
    responseTime: 'چند ساعت',
    phone: p.phone,
    bannerImage: p.bannerImage || '/images/shop/Pro_table.jpg',
    description: p.description,
    tagline: p.tagline || p.description,
    about: p.about || p.description,
    employees: p.employees || '—',
    exportCountries: p.exportCountries || '—',
    totalProduced: p.totalProduced || '—',
    productionCapability: p.productionCapability || '—',
    whatsapp: p.whatsapp || p.phone.replace(/^0/, '98'),
    instagram: p.instagram,
    address: p.address,
    hours: p.hours || '—',
    website: p.website,
    products: p.products,
    certificates: p.certificates,
  }
}
