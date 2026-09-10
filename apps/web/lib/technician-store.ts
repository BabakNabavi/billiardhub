/* ─────────────────────────────────────────────────────────────
   Technician profile store — پروتوتایپ کلاینتی (localStorage).
   مشترک بین: /dashboard/technician (پنل) و /services (دایرکتوری+پروفایل).
   مالکیت با user.id کلید می‌خورد (نه phoneی اختیاری) — همان الگوی
   seller/coach/referee. ذخیره = انتشار (approved).
   ───────────────────────────────────────────────────────────── */
import { provinceOfCity } from './iran-geo'
import { storedToTitles } from './tech-services'
import { normalizeTechMedia, type Technician, type TechProject, type TechMedia, type TechVideo, type TechService } from './technicians-data'

/** عنوان عمومیِ این نقش — ثابت است و فرم دیگر آن را نمی‌پرسد.
 *  ⚠️ دو نسخه‌ی هاردکد بود («خدمات فنی» در پنل و «متخصص خدمات فنی»
 *  این‌جا) و از هم افتاده بودند. */
export const TECH_TITLE = 'خدمات فنی'

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
  /* ── نحوه و زمان ارائه‌ی خدمات ──
     ⚠️ این سه تا در مدل نبودند، پس صفحه‌ی عمومی فقط شهر و شهرهای
     تحت پوشش را نشان می‌داد. هیچ‌کدام اجباری نیست و هیچ‌کدام مقدار
     پیش‌فرض «بله» نمی‌گیرد: چیزی که متخصص نگفته، ساخته نمی‌شود. */
  /** خدمت در محل مشتری (باشگاه/خانه) */
  onsite: boolean
  /** پذیرش در کارگاه */
  workshop: boolean
  /** ساعت کاری — متن آزاد، چون هر کارگاه شکل خودش را دارد */
  hours: string
  intro: string
  about: string[]
  services: TechService[]
  projects: TechProject[]
  /* همان مدل مربی و داور: نام آلبوم‌ها این‌جا، عضویت روی رسانه */
  albums: string[]
  gallery: TechMedia[]
  videos: TechVideo[]
  phone: string
  whatsapp: string
  status: 'approved' | 'rejected'
  /* ستون جدول `profiles` است نه بخشی از jsonb — `fetchProfiles`
     کنار `data` می‌گذاردش. */
  verified?: boolean
  updatedAt: string
}

const KEY = 'bh_technician_profiles'

export function emptyTechnicianProfile(slug: string, ownerId = '', ownerPhone = ''): TechnicianProfile {
  return {
    slug, ownerId, ownerPhone,
    name: '', photo: '', title: '', province: '', city: '', club: '',
    coverage: [], onsite: false, workshop: false, hours: '',
    intro: '', about: [], services: [],
    projects: [], albums: [], gallery: [], videos: [], phone: '', whatsapp: '',
    status: 'approved', updatedAt: '',
  }
}

function normalize(raw: Partial<TechnicianProfile> & { slug: string }): TechnicianProfile {
  const p = { ...emptyTechnicianProfile(raw.slug), ...raw }
  /* ردیف پیش از مهاجرت: آلبوم شیئی به «نام + رسانه» تبدیل می‌شود.
     روی خواندن انجام می‌شود تا هیچ عکسی با اولین ذخیره گم نشود. */
  Object.assign(p, normalizeTechMedia(p))
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

/* «پروفایل من» — مبنا user.id؛ شماره fallback رکوردهای قدیمی */
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

/* پروفایل ذخیره‌شده → شکل Technician تا صفحات /services بدون تغییر ساختار رندرش کنند */
export function profileToTechnician(p: TechnicianProfile): Technician {
  /* ⚠️ اینجا هم نرمال‌سازی لازم است، نه فقط در `normalize` کش محلی:
     صفحه‌ی عمومی داده‌ی خام سرور را مستقیم به این تابع می‌دهد و ردیفی
     که هنوز کلید `gallery` ندارد، `undefined` رد می‌کرد — و صفحه با
     «Cannot read properties of undefined» به error boundary می‌رفت.
     بیلد و tsc هر دو سبز بودند؛ فقط بازکردن صفحه نشانش داد. */
  const media = normalizeTechMedia(p)
  return {
    id: p.slug,
    /* ⚠️ جانشینِ *نام* با جانشینِ *عنوان* یکی نیست — یک جایگزینیِ
       سراسری این دو را قاطی کرده بود. */
    name: p.name || 'متخصص خدمات فنی',
    photo: p.photo || undefined,
    title: p.title || TECH_TITLE,
    city: p.city || '—',
    club: p.club || undefined,
    /* ⚠️ `?? []` و `?? ''` همان دلیل بالا را دارند: ردیف خام سرور
       می‌تواند کلید نداشته باشد و `.length` روی `undefined` صفحه را
       به error boundary می‌برد — با بیلد و tsc کاملا سبز. */
    coverage: (p.coverage ?? []).length ? p.coverage : [p.city].filter(Boolean),
    /* ⚠️ هیچ‌کدام پیش‌فرض «بله» ندارند: صفحه‌ی عمومی نباید ادعایی
       بکند که متخصص نکرده است. */
    onsite: p.onsite === true,
    workshop: p.workshop === true,
    hours: String(p.hours ?? '').trim(),
    intro: p.intro,
    about: (p.about ?? []).length ? p.about : [p.intro].filter(Boolean),
    /* ⚠️ دایرکتوری و جست‌وجو با *متن* کار می‌کنند. اگر شناسه‌ی خام
       رد شود، اولین ذخیره‌ی پنل باعث می‌شود کارت «cloth» نشان بدهد
       و فیلتر خدمات هیچ نتیجه‌ای برنگرداند. */
    services: storedToTitles(p.services),
    projects: p.projects,
    albums: media.albums,
    gallery: media.gallery,
    videos: media.videos,
    phone: p.phone,
    whatsapp: p.whatsapp || String(p.phone ?? '').replace(/^0/, '98'),
    verified: p.verified === true,
  }
}

export function deleteTechnicianProfile(slug: string) {
  if (typeof window === 'undefined') return
  const all = getTechnicianProfiles()
  delete all[slug]
  localStorage.setItem('bh_technician_profiles', JSON.stringify(all))
}
