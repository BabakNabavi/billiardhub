/* ─────────────────────────────────────────────────────────────
   استان‌ها و شهرهای ایران — منبعِ واحد.
   داده از data/iran-geo.json خوانده می‌شود (سرچِ sajaddp/list-of-cities-in-Iran،
   نسخه‌ی cities-filtered). هرگز لیست شهر/استان را جای دیگری هاردکد نکنید —
   کامپوننت ProvinceCitySelect و همه‌ی فرم‌ها از همین‌جا می‌خوانند.
   ───────────────────────────────────────────────────────────── */
import data from '../data/iran-geo.json'

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

export function getProvinceNames(): string[] {
  return PROVINCES.map(p => p.name)
}

/* شهرهای یک استان (به‌ترتیب الفبا). استانِ ناموجود ⇒ آرایه‌ی خالی */
export function getCities(provinceName: string): string[] {
  return PROVINCES.find(p => p.name === provinceName)?.cities ?? []
}

/* برای داده‌ی قدیمی که فقط «شهر» دارد و «استان» ندارد: استانِ آن شهر را پیدا می‌کند.
   (اگر نام شهر در چند استان تکراری باشد، اولین را برمی‌گرداند.) */
export function provinceOfCity(cityName: string): string {
  if (!cityName) return ''
  return PROVINCES.find(p => p.cities.includes(cityName))?.name ?? ''
}

/* کد تلفنِ استان (مثلاً تهران ⇒ 021) — برای نمایش شماره‌ی ثابت با کد شهر */
export function telPrefix(provinceName: string): string {
  return PROVINCES.find(p => p.name === provinceName)?.tel ?? ''
}
