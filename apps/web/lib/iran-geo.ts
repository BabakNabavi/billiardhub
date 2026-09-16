/* ─────────────────────────────────────────────────────────────
   استان‌ها و شهرهای ایران — منبع واحد.
   داده از data/iran-geo.json خوانده می‌شود (سرچ sajaddp/list-of-cities-in-Iran،
   نسخه‌ی cities-filtered). هرگز لیست شهر/استان را جای دیگری هاردکد نکنید —
   کامپوننت ProvinceCitySelect و همه‌ی فرم‌ها از همین‌جا می‌خوانند.
   ───────────────────────────────────────────────────────────── */
import data from '../data/iran-geo.json'
import { toLatinDigits } from './auth/phone'

export interface Province {
  id: number
  name: string
  tel: string
  cities: string[]
}

const PROVINCES = (data.provinces as Province[])

export function getProvinces(): Province[] {
  return PROVINCES
}

/* نام استان‌ها — به‌ترتیب الفبای فارسی (برای دراپ‌داون ProvinceCitySelect) */
export function getProvinceNames(): string[] {
  return PROVINCES.map(p => p.name).sort((a, b) => a.localeCompare(b, 'fa'))
}

/* شهرهای یک استان (به‌ترتیب الفبا). استان ناموجود ⇒ آرایه‌ی خالی */
export function getCities(provinceName: string): string[] {
  return PROVINCES.find(p => p.name === provinceName)?.cities ?? []
}

/* برای داده‌ی قدیمی که فقط «شهر» دارد و «استان» ندارد: استان آن شهر را پیدا می‌کند.
   (اگر نام شهر در چند استان تکراری باشد، اولین را برمی‌گرداند.) */
export function provinceOfCity(cityName: string): string {
  if (!cityName) return ''
  return PROVINCES.find(p => p.cities.includes(cityName))?.name ?? ''
}

/* کد تلفن استان (مثلا تهران ⇒ 021) — برای نمایش شماره‌ی ثابت با کد شهر */
export function telPrefix(provinceName: string): string {
  return PROVINCES.find(p => p.name === provinceName)?.tel ?? ''
}

/* ── همه‌ی استان‌هایی که شهری به این نام دارند ──
   ۲۶ نامِ شهر بینِ استان‌هایی با **کدِ تلفنِ متفاوت** تکراری است
   (رودبار ⇒ ۰۱۳ یا ۰۳۴، لاهیجان ⇒ ۰۱۳ یا ۰۴۱، سردشت در چهار استان).
   `provinceOfCity` اولی را برمی‌گرداند، که برای حدسِ استان کافی است
   ولی برای ساختنِ یک لینکِ `tel:` نه: شماره‌گیریِ کدِ غلط یعنی تماس
   با جای دیگر. */
export function provincesOfCity(cityName: string): string[] {
  if (!cityName) return []
  return PROVINCES.filter(p => p.cities.includes(cityName)).map(p => p.name)
}

/* ── نرمال‌سازیِ شماره پیش از ذخیره ──
   قرارداد این است که فقط شماره‌ی **محلی** ذخیره شود و کدِ شهر موقعِ
   نمایش اضافه گردد. این تابع همان قرارداد را تحمیل می‌کند: ارقام را
   لاتین می‌کند، جداکننده‌ها را می‌برد، و اگر کاربر کدِ استان را هم
   جلوی شماره تایپ کرده باشد (با صفر یا بی‌صفر) برش می‌دارد.

   موبایل (۰۹…) دست‌نخورده می‌ماند: کدِ شهر ندارد و خودش کامل است. */
export function normalizeLocalPhone(raw: string, province?: string | null): string {
  let d = toLatinDigits(String(raw ?? '')).replace(/\D/g, '')
  if (!d) return ''
  if (/^09\d{9}$/.test(d)) return d

  const area = telPrefix(String(province ?? '').trim())
  if (area) {
    if (d.startsWith(area)) d = d.slice(area.length)                 // 02122859551
    else if (d.startsWith(area.replace(/^0/, ''))) d = d.slice(area.length - 1) // 2122859551
  }
  return d
}

export interface IranTel { text: string; href: string; digits: string }

/* ── شماره‌ی ثابت با کد شهر، آماده‌ی نمایش و شماره‌گیری ──
   شماره در پروفایل‌ها **بدونِ کد** ذخیره می‌شود («۲۲۸۵۹۵۵۱»)، پس
   بدونِ این تابع نه قابلِ خواندن است نه قابلِ تماس.

   سه نکته که هرکدام یک‌بار باگ شده‌اند:
   ۱) `replace(/\D/g,'')` روی ارقامِ فارسی رشته را **خالی** می‌کند،
      چون «۰۹» در بازه‌ی [0-9] نیست. اول باید لاتین شود.
   ۲) استان اگر روی رکورد نبود فقط وقتی از شهر مشتق می‌شود که آن نام
      در یک استان یکتا باشد.
   ۳) کد فقط به شماره‌ی محلیِ ۶ تا ۸ رقمی اضافه می‌شود: شماره‌ای که
      خودش با صفر شروع شده (۰۲۱… یا موبایلِ ۰۹…) از قبل کامل است. */
export function iranTel(
  phone: string | null | undefined,
  province?: string | null,
  city?: string | null,
): IranTel {
  const digits = toLatinDigits(String(phone ?? '')).replace(/\D/g, '')
  if (!digits) return { text: '', href: '', digits: '' }

  let prov = String(province ?? '').trim()
  if (!prov) {
    const cands = provincesOfCity(String(city ?? '').trim())
    if (cands.length === 1) prov = cands[0]!
  }

  const area = telPrefix(prov)
  const local = /^\d{6,8}$/.test(digits)
  if (!area || !local) return { text: digits, href: digits, digits }

  return { text: `${area}-${digits}`, href: `${area}${digits}`, digits }
}
