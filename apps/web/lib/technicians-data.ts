/* ─────────────────────────────────────────────────────────────
   متخصصان خدمات فنی — منبع واحد (الگوی sellers/manufacturers/news).
   بدون آمار و امتیاز: تمرکز روی شخص، تخصص و هویت حرفه‌ای.
   ساختار آینده‌پذیر: Service / Project / Album جدا تعریف شده‌اند تا
   بعدا از پنل خود متخصص پر شوند.
   ───────────────────────────────────────────────────────────── */

/** @deprecated فهرست تخت قدیمی. کاتالوگ رسمی:
 *  `TECH_SERVICE_CATEGORIES` در `lib/tech-services`. */
export const TECH_SERVICES = [
  'تعمیر میز',
  'رگلاژ و تراز میز',
  'تعویض پارچه',
  'تعویض لاستیک باند',
  'نصب میز',
  'جابه‌جایی میز',
  'بازسازی میز',
  'ساخت و تعمیر قطعات',
  'خدمات چوب و تجهیزات',
] as const

/** ⚠️ گشاد شد: کاتالوگ واقعی حالا در `lib/tech-services` است و
 *  هجده خدمت دسته‌بندی‌شده دارد. این تایپ فقط برای میدان
 *  `TechProject.service` مانده که مقدارهای ثبت‌شده‌ی قدیمی دارد. */
export type TechService = string



export interface TechProject {
  id: string
  title: string
  desc: string
  city: string
  club?: string
  service: TechService
  image: string
}

/* ── رسانه: همان مدل مربی و داور ──
   ⚠️ نسخه‌ی قبلی آلبوم متخصص را `{id, title, desc, photos[]}` نگه
   می‌داشت: یک مدل دوم برای همان مفهوم. نتیجه‌اش دو گالری جدا با دو
   رفتار بود — این‌جا نوار آلبوم و لایت‌باکس دست‌ساز، آن‌جا سه تب و
   نمای مشترک. حالا هر دو یک چیزند: نام آلبوم روی خود رسانه، و
   فهرست نام‌ها در `albums`. */
export interface TechMedia { id: string; url: string; caption: string; album?: string }
export interface TechVideo { id: string; url?: string; thumbnail: string; title: string; duration: string; album?: string }

/** شکل قدیمی — فقط برای خواندن ردیف‌های پیش از مهاجرت */
export interface TechAlbumLegacy {
  id: string
  title: string
  desc?: string
  photos: string[]
}

export interface Technician {
  id: string
  name: string
  /** عکس پروفایل (اختیاری) — نبودش ⇒ مونوگرام لوکس */
  photo?: string
  /** عنوان تخصصی — زیر نام */
  title: string
  city: string
  /** باشگاه/مجموعه‌ی همکار (اختیاری) */
  club?: string
  /** شهرهای تحت پوشش */
  coverage: string[]
  /** خدمت در محل مشتری — فقط اگر متخصص گفته باشد */
  onsite: boolean
  /** پذیرش در کارگاه */
  workshop: boolean
  /** ساعت کاری — متن آزاد؛ خالی یعنی نمایش نده */
  hours: string
  /** معرفی یک‌خطی کارت/هیرو */
  intro: string
  /** پاراگراف‌های «درباره من» */
  about: string[]
  services: TechService[]
  projects: TechProject[]
  /** نام آلبوم‌ها — عضویت روی خود رسانه است */
  albums: string[]
  gallery: TechMedia[]
  videos: TechVideo[]
  phone: string
  whatsapp: string
  /** تیک آبی — ستون `profiles.verified`، فقط ادمین می‌دهد */
  verified?: boolean
}

/* ⚠️ عمدا خالی — پیش از رونمایی پاک شد.

   این آرایه 24 موجودیت ساختگی داشت که روی سایت زنده مثل داده‌ی
   واقعی دیده می‌شدند: نام، شهر، امتیاز و مشخصاتی که هیچ‌کدام وجود
   خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید.

   جای این‌ها با موجودیت‌های واقعی سایت پر می‌شود. اگر چیزی نباشد،
   بخش خالی می‌ماند — که درست است. آرایه نگه داشته شد (نه حذف) تا
   امضای ماژول و مصرف‌کننده‌هایش دست‌نخورده بمانند. */
export const TECHNICIANS: Technician[] = []

export function getTechnician(id: string): Technician | null {
  return TECHNICIANS.find(t => t.id === id) ?? null
}

export function techCities(): string[] {
  return [...new Set(TECHNICIANS.map(t => t.city))]
}

export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/* ── ردیف قدیمی به مدل تازه ──
   آلبوم قدیمی شیء بود و عکس‌ها داخلش. اگر همان‌طور بماند، صفحه‌ی
   تازه هیچ عکسی نمی‌بیند و بدتر: اولین ذخیره، شکل ناشناخته را دور
   می‌ریزد. پس روی *خواندن* تبدیل می‌شود و اولین ذخیره‌ی معمولی شکل
   تازه را ماندگار می‌کند. */
export function normalizeTechMedia(d: {
  albums?: unknown; gallery?: unknown; videos?: unknown
}): { albums: string[]; gallery: TechMedia[]; videos: TechVideo[] } {
  const gallery: TechMedia[] = Array.isArray(d.gallery)
    ? (d.gallery as unknown[]).filter((g): g is TechMedia => !!g && typeof g === 'object' && typeof (g as TechMedia).url === 'string')
    : []
  const videos: TechVideo[] = Array.isArray(d.videos)
    ? (d.videos as unknown[]).filter((v): v is TechVideo => !!v && typeof v === 'object')
    : []
  const names: string[] = []
  const seenUrl = new Set(gallery.map(g => g.url))

  for (const a of (Array.isArray(d.albums) ? d.albums : [])) {
    if (typeof a === 'string') { const n = a.trim(); if (n && !names.includes(n)) names.push(n); continue }
    if (!a || typeof a !== 'object') continue
    const old = a as TechAlbumLegacy
    const n = (old.title ?? '').trim() || 'آلبوم'
    if (!names.includes(n)) names.push(n)
    for (const url of Array.isArray(old.photos) ? old.photos : []) {
      if (typeof url !== 'string' || !url || seenUrl.has(url)) continue
      seenUrl.add(url)
      gallery.push({ id: 'm' + gallery.length + '-' + url.slice(-12), url, caption: '', album: n })
    }
  }
  /* نامی که فقط روی رسانه‌ها هست هم آلبوم است */
  for (const g of gallery) { const n = (g.album ?? '').trim(); if (n && !names.includes(n)) names.push(n) }
  return { albums: names, gallery, videos }
}
