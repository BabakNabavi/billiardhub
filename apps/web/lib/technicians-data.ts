/* ─────────────────────────────────────────────────────────────
   متخصصان خدمات فنی — منبع واحد (الگوی sellers/manufacturers/news).
   بدون آمار و امتیاز: تمرکز روی شخص، تخصص و هویت حرفه‌ای.
   ساختار آینده‌پذیر: Service / Project / Album جدا تعریف شده‌اند تا
   بعداً از پنل خود متخصص پر شوند.
   ───────────────────────────────────────────────────────────── */

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

export type TechService = typeof TECH_SERVICES[number]

export interface TechProject {
  id: string
  title: string
  desc: string
  city: string
  club?: string
  service: TechService
  image: string
}

export interface TechAlbum {
  id: string
  title: string
  desc: string
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
  /** معرفی یک‌خطی کارت/هیرو */
  intro: string
  /** پاراگراف‌های «درباره من» */
  about: string[]
  services: TechService[]
  projects: TechProject[]
  albums: TechAlbum[]
  phone: string
  whatsapp: string
}

/* ⚠️ عمداً خالی — پیش از رونمایی پاک شد.

   این آرایه 24 موجودیتِ ساختگی داشت که روی سایتِ زنده مثل داده‌ی
   واقعی دیده می‌شدند: نام، شهر، امتیاز و مشخصاتی که هیچ‌کدام وجودِ
   خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید.

   جای این‌ها با موجودیت‌های واقعیِ سایت پر می‌شود. اگر چیزی نباشد،
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
