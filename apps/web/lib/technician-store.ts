/* ─────────────────────────────────────────────────────────────
   Technician profile store — پروتوتایپِ کلاینتی (localStorage).
   مشترک بین: /dashboard/technician (پنل) و /services (دایرکتوری+پروفایل).
   مالکیت با user.id کلید می‌خورد (نه phoneی اختیاری) — همان الگوی
   seller/coach/referee. ذخیره = انتشار (approved).
   ───────────────────────────────────────────────────────────── */
import { provinceOfCity } from './iran-geo'
import type { Technician, TechProject, TechAlbum, TechService } from './technicians-data'

export interface TechnicianProfile {
  slug: string
  ownerId: string
  ownerPhone: string
  name: string
  photo: string
  title: string
  province: string
  city: string
  club: string
  coverage: string[]
  intro: string
  about: string[]
  services: TechService[]
  projects: TechProject[]
  albums: TechAlbum[]
  phone: string
  whatsapp: string
  status: 'approved' | 'rejected'
  updatedAt: string
}

const KEY = 'bh_technician_profiles'

export function emptyTechnicianProfile(slug: string, ownerId = '', ownerPhone = ''): TechnicianProfile {
  return {
    slug, ownerId, ownerPhone,
    name: '', photo: '', title: '', province: '', city: '', club: '',
    coverage: [], intro: '', about: [], services: [],
    projects: [], albums: [], phone: '', whatsapp: '',
    status: 'approved', updatedAt: '',
  }
}

function normalize(raw: Partial<TechnicianProfile> & { slug: string }): TechnicianProfile {
  const p = { ...emptyTechnicianProfile(raw.slug), ...raw }
  if (!p.province && p.city) p.province = provinceOfCity(p.city)
  if (p.ownerId == null) p.ownerId = ''
  return p
}

export function getTechnicianProfiles(): Record<string, TechnicianProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, TechnicianProfile>
    const out: Record<string, TechnicianProfile> = {}
    for (const [k, v] of Object.entries(raw)) out[k] = normalize({ ...v, slug: v.slug ?? k })
    return out
  } catch { return {} }
}

export function getTechnicianProfile(slug: string): TechnicianProfile | null {
  return getTechnicianProfiles()[slug] ?? null
}

export function listApprovedTechnicians(): TechnicianProfile[] {
  return Object.values(getTechnicianProfiles()).filter(p => p.status === 'approved')
}

/* «پروفایلِ من» — مبنا user.id؛ شماره fallbackِ رکوردهای قدیمی */
export function findTechnicianByOwner(
  owner: string | { id?: string; phone?: string } | null | undefined,
): TechnicianProfile | null {
  if (!owner) return null
  const keys = (typeof owner === 'string' ? [owner] : [owner.id, owner.phone]).filter(Boolean) as string[]
  if (!keys.length) return null
  return Object.values(getTechnicianProfiles()).find(p =>
    (p.ownerId && keys.includes(p.ownerId)) || (p.ownerPhone && keys.includes(p.ownerPhone)),
  ) ?? null
}

export function saveTechnicianProfile(p: TechnicianProfile) {
  if (typeof window === 'undefined') return
  const all = getTechnicianProfiles()
  /* یک پروفایل برای هر مالک */
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

export function newTechnicianSlug(): string {
  return `t-${Date.now().toString(36)}`
}

/* پروفایلِ ذخیره‌شده → شکلِ Technician تا صفحات /services بدونِ تغییرِ ساختار رندرش کنند */
export function profileToTechnician(p: TechnicianProfile): Technician {
  return {
    id: p.slug,
    name: p.name || 'متخصص خدمات فنی',
    photo: p.photo || undefined,
    title: p.title || 'متخصص خدمات فنی',
    city: p.city || '—',
    club: p.club || undefined,
    coverage: p.coverage.length ? p.coverage : [p.city].filter(Boolean),
    intro: p.intro,
    about: p.about.length ? p.about : [p.intro].filter(Boolean),
    services: p.services,
    projects: p.projects,
    albums: p.albums,
    phone: p.phone,
    whatsapp: p.whatsapp || p.phone.replace(/^0/, '98'),
  }
}
