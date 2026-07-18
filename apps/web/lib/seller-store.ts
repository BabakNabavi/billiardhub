/* ─────────────────────────────────────────────────────────────
   Seller (store) profile store — client-side prototype, localStorage.
   Shared by: /dashboard/seller (owner panel) and /sellers/[id] (public storefront).

   Every field here maps to something the storefront actually renders — see
   SELLER_FIELD_MAP below for the exact correspondence.
   ───────────────────────────────────────────────────────────── */
import { provinceOfCity } from './iran-geo'

export interface SellerShot { id: string; url: string }

export type SellerStatus = 'pending' | 'approved' | 'rejected'

export interface SellerProfile {
  slug: string                 // = seller id in the URL, /sellers/<slug>
  ownerPhone: string           // whoever holds the `seller` role
  ownerName: string            // نام و نام‌خانوادگیِ مالک (از احراز هویت) — روی فرم ثبت محصول قفل می‌شود

  /* ── هدر ── */
  logo: string                 // data URL; خالی ⇒ آیکون پیش‌فرض فروشگاه
  banners: string[]            // اسلایدرِ بنرِ هدر (حداکثر ۳)؛ خالی ⇒ بنر پیش‌فرض
  title: string                // نام فروشگاه — تیتر اصلی
  province: string             // استان (کنار شهر)
  city: string                 // شهر — کنار آیکون لوکیشن
  desc: string                 // «درباره‌ی فروشگاه» — هدر و فوتر هر دو از همین می‌خوانند
  contactPhone: string         // شماره‌ی تماس کنار آیکون تلفن

  /* ── فوتر ── */
  brand: string                // نام کوتاه فروشگاه در فوتر
  phones: string[]             // تلفن‌های فروشگاه
  hours: string                // ساعت کاری
  address: string             // آدرس + مقصد لینک نقشه
  whatsapp: string             // شماره‌ی واتساپ (بدون +)
  instagram: string            // آیدی اینستاگرام (بدون @)

  /* ── برندها ── */
  brands: string[]             // برندهایی که فروشگاه نماینده‌شان است

  /* ── استوری (حلقه‌ی دور لوگو) ── */
  storyImage: string
  storyText: string

  /* ── «درباره ما» ── */
  aboutImages: string[]        // اسلایدرِ باکس درباره ما (حداکثر ۳)؛ متنش همان desc است

  /* ── گالری تصاویر فروشگاه ── */
  gallery: SellerShot[]

  /* ── جواز کسب (اجباری — بدون آن فروشگاه منتشر نمی‌شود) ── */
  certificate: { name: string; url: string } | null

  /* ── وضعیت (ادمین سایت تعیین می‌کند، نه صاحب فروشگاه) ── */
  status: SellerStatus         // فقط approvedها در /sellers دیده می‌شوند
  verified: boolean            // تیک آبی (ادمین می‌دهد)
  submittedAt: string          // زمانِ ارسال برای تایید
  updatedAt: string
}

export const GALLERY_MAX = 12

/* پیش‌فرض‌ها = همان چیزی که قبل از ساخت پنل روی /sellers/1 هاردکد بود */
export function emptySellerProfile(slug: string, ownerPhone = ''): SellerProfile {
  return {
    slug, ownerPhone,
    ownerName: '',
    logo: '',
    banners: [],
    title: '',
    province: '',
    city: '',
    desc: '',
    contactPhone: '',
    brand: '',
    phones: [''],
    hours: '',
    address: '',
    whatsapp: '',
    instagram: '',
    brands: [],
    storyImage: '',
    storyText: '',
    aboutImages: [],
    gallery: [],
    certificate: null,
    status: 'pending',
    verified: false,
    submittedAt: '',
    updatedAt: '',
  }
}

const KEY = 'bh_seller_profiles'

/* فیلدهای تازه (ownerName/certificate/status/province/...) در پروفایل‌های قدیمی نیستند؛
   اینجا با پیش‌فرض پر می‌شوند تا هیچ‌جای کد undefined نبیند. استانِ خالی از روی شهر بک‌فیل می‌شود. */
function normalize(raw: Partial<SellerProfile> & { slug: string }): SellerProfile {
  const p = { ...emptySellerProfile(raw.slug, raw.ownerPhone ?? ''), ...raw }
  if (!p.province && p.city) p.province = provinceOfCity(p.city)
  return p
}

export function getSellerProfiles(): Record<string, SellerProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, SellerProfile>
    const out: Record<string, SellerProfile> = {}
    for (const [k, v] of Object.entries(raw)) out[k] = normalize({ ...v, slug: v.slug ?? k })
    return out
  } catch { return {} }
}

export function getSellerProfile(slug: string): SellerProfile | null {
  return getSellerProfiles()[slug] ?? null
}

export function listSellerProfiles(): SellerProfile[] {
  return Object.values(getSellerProfiles())
}

/* فقط فروشگاه‌های تاییدشده — همینی که در صفحه‌ی عمومی /sellers دیده می‌شود */
export function listApprovedSellers(): SellerProfile[] {
  return listSellerProfiles().filter(p => p.status === 'approved')
}

export function findSellerByOwner(ownerPhone: string): SellerProfile | null {
  if (!ownerPhone) return null
  return listSellerProfiles().find(p => p.ownerPhone === ownerPhone) ?? null
}

export function saveSellerProfile(p: SellerProfile) {
  if (typeof window === 'undefined') return
  const all = getSellerProfiles()
  all[p.slug] = { ...p, updatedAt: new Date().toISOString() }
  try { localStorage.setItem(KEY, JSON.stringify(all)) }
  catch { throw new Error('quota') }   // صفحه پیام «حافظه پر است» نشان می‌دهد
}

/* ادمین: تغییر وضعیت / تیک آبی یک فروشگاه */
export function updateSellerProfile(slug: string, patch: Partial<SellerProfile>) {
  if (typeof window === 'undefined') return
  const all = getSellerProfiles()
  const cur = all[slug]
  if (!cur) return
  all[slug] = { ...cur, ...patch, updatedAt: new Date().toISOString() }
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* ignore */ }
}

/* ── فشرده‌سازی عکس ─────────────────────────────────────────────
   بدون این، چند عکسِ گوشی سهمیه‌ی localStorage را پر می‌کند و
   saveSellerProfile با QuotaExceededError می‌افتد. */
export function compressImage(file: File, maxDim = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const dataUrl = String(reader.result)
      const im = document.createElement('img')
      im.onerror = () => resolve(dataUrl)
      im.onload = () => {
        let w = im.naturalWidth || im.width
        let h = im.naturalHeight || im.height
        if (w >= h && w > maxDim)     { h = Math.round((h * maxDim) / w); w = maxDim }
        else if (h > w && h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(dataUrl); return }
        ctx.drawImage(im, 0, 0, w, h)
        try { resolve(canvas.toDataURL('image/jpeg', quality)) } catch { resolve(dataUrl) }
      }
      im.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}
