/* ─────────────────────────────────────────────────────────────
   Seller (store) profile store — client-side prototype, localStorage.
   Shared by: /dashboard/seller (owner panel) and /sellers/[id] (public storefront).

   Every field here maps to something the storefront actually renders — see
   SELLER_FIELD_MAP below for the exact correspondence.
   ───────────────────────────────────────────────────────────── */

export interface SellerShot { id: string; url: string }

export interface SellerProfile {
  slug: string                 // = seller id in the URL, /sellers/<slug>
  ownerPhone: string           // whoever holds the `seller` role

  /* ── هدر ── */
  logo: string                 // data URL; خالی ⇒ آیکون پیش‌فرض فروشگاه
  title: string                // نام فروشگاه — تیتر اصلی
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

  /* ── استوری (حلقه‌ی دور لوگو) ── */
  storyImage: string
  storyText: string

  /* ── گالری تصاویر فروشگاه ── */
  gallery: SellerShot[]

  /* ── وضعیت (ادمین سایت تعیین می‌کند، نه صاحب فروشگاه) ── */
  verified: boolean
  updatedAt: string
}

export const GALLERY_MAX = 12

/* پیش‌فرض‌ها = همان چیزی که قبل از ساخت پنل روی /sellers/1 هاردکد بود */
export function emptySellerProfile(slug: string, ownerPhone = ''): SellerProfile {
  return {
    slug, ownerPhone,
    logo: '',
    title: '',
    city: '',
    desc: '',
    contactPhone: '',
    brand: '',
    phones: [''],
    hours: '',
    address: '',
    whatsapp: '',
    instagram: '',
    storyImage: '',
    storyText: '',
    gallery: [],
    verified: false,
    updatedAt: '',
  }
}

const KEY = 'bh_seller_profiles'

export function getSellerProfiles(): Record<string, SellerProfile> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, SellerProfile> }
  catch { return {} }
}

export function getSellerProfile(slug: string): SellerProfile | null {
  return getSellerProfiles()[slug] ?? null
}

export function listSellerProfiles(): SellerProfile[] {
  return Object.values(getSellerProfiles())
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
