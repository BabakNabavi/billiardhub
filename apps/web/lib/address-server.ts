/* ─────────────────────────────────────────────────────────────
   استعلام کد پستی — سمت سرور (s.api.ir).
   کلید هیچ‌وقت به مرورگر نمی‌رود؛ همان قرارداد استعلام‌های بانکی.

   نکته‌ی مشترک با bank-server: این سرویس برای «پیدا نشد» هم HTTP 200
   با success=true برمی‌گرداند و فقط data را null می‌گذارد. پس «نبودِ
   نتیجه» یک پاسخ منفیِ واقعی است، نه «سرویس در دسترس نیست» — و این
   دو باید در UI فرق کنند: اولی یعنی «کدت را بررسی کن»، دومی یعنی
   «بعداً دوباره امتحان کن».
   ───────────────────────────────────────────────────────────── */

const POSTAL_CODE_URL = 'https://s.api.ir/api/sw1/PostalCodePro'

export interface PostalAddress {
  province?: string
  city?: string
  town?: string
  district?: string
  street?: string
  street2?: string
  number?: string
  floor?: string
  sideFloor?: string
  buildingName?: string
  description?: string
  address?: string
  lat?: number
  long?: number
}

export interface PostalCodeResult {
  ok: boolean
  found?: boolean
  data?: PostalAddress
  message?: string
  unavailable?: boolean
}

interface Envelope {
  success?: boolean
  code?: number | string
  message?: string | null
  data?: Record<string, unknown> | null
}

/** ده رقم لاتین؛ ارقام فارسی/عربی و خط تیره پذیرفته و نرمال می‌شوند */
export function normalizePostalCode(raw: string): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)))
    .replace(/[٠-٩]/g, ch => String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch)))
    .replace(/\D/g, '')
    .slice(0, 10)
}

export const isValidPostalCode = (raw: string): boolean => {
  const p = normalizePostalCode(raw)
  /* ده رقم، و نه همه یک رقمِ تکراری — «۰۰۰۰۰۰۰۰۰۰» شکلاً درست است
     ولی هیچ‌وقت کد واقعی نیست و فقط اعتبار سرویس را می‌سوزاند. */
  return /^\d{10}$/.test(p) && !/^(\d)\1{9}$/.test(p)
}

const str = (v: unknown): string | undefined => {
  const s = String(v ?? '').trim()
  return s && s !== 'null' ? s : undefined
}

/* سرویس lat/long را رشته می‌دهد (طبق اسکیمای خودش، با format=double).
   عدد نامفهوم باید حذف شود نه اینکه NaN در دیتابیس بنشیند. */
const num = (v: unknown): number | undefined => {
  const n = Number(String(v ?? '').trim())
  return Number.isFinite(n) && n !== 0 ? n : undefined
}

/** کد پستی ⇒ آدرس و مختصات */
export async function lookupPostalCode(raw: string): Promise<PostalCodeResult> {
  const postalCode = normalizePostalCode(raw)
  /* اعتبارسنجی محلی پیش از مصرف اعتبار سرویس */
  if (!isValidPostalCode(postalCode)) {
    return { ok: false, message: 'کد پستی باید ۱۰ رقم باشد' }
  }

  const key = process.env.SMS_API_KEY
  if (!key) return { ok: false, unavailable: true, message: 'سرویس استعلام کد پستی پیکربندی نشده است' }

  let r: Response
  try {
    r = await fetch(POSTAL_CODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ postalCode }),
    })
  } catch {
    return { ok: false, unavailable: true, message: 'خطا در اتصال به سرویس استعلام کد پستی' }
  }

  const j = await r.json().catch(() => null) as Envelope | null

  /* دسترسی/اعتبار ⇒ «نامشخص»، نه «کد پستی اشتباه» */
  const code = Number(j?.code)
  const denied = r.status === 401 || r.status === 403 || code === 401 || code === 403
    || /trust level|سطح دسترسی|اعتبار|credit|unauthorized/i.test(j?.message || '')
  if (denied) {
    console.error('PostalCodePro unavailable:', j?.message || r.status)
    return { ok: false, unavailable: true, message: 'سرویس استعلام کد پستی در دسترس نیست' }
  }
  if (!j) return { ok: false, unavailable: true, message: 'پاسخ سرویس استعلام کد پستی خوانده نشد' }

  if (j.success === false) {
    if (code === 400) return { ok: false, message: 'کد پستی معتبر نیست' }
    console.error('PostalCodePro failed:', j.message || j.code)
    return { ok: false, unavailable: true, message: 'استعلام کد پستی ناموفق بود' }
  }

  const d = j.data
  /* success=true ولی data خالی ⇒ پاسخ منفیِ واقعی */
  if (!d || typeof d !== 'object') {
    return { ok: true, found: false, message: 'برای این کد پستی آدرسی یافت نشد. کد را بررسی کنید.' }
  }

  const data: PostalAddress = {
    province: str(d.province), city: str(d.city), town: str(d.town),
    district: str(d.district), street: str(d.street), street2: str(d.street2),
    number: str(d.number), floor: str(d.floor), sideFloor: str(d.sideFloor),
    buildingName: str(d.buildingName), description: str(d.description),
    address: str(d.address), lat: num(d.lat), long: num(d.long),
  }

  /* اگر هیچ فیلد معناداری برنگشت، همان «پیدا نشد» است. `address` تنها
     ملاک نیست: بعضی رکوردها فقط اجزا دارند و آدرسِ سرهم‌شده ندارند. */
  if (!data.address && !data.province && !data.city && !data.street) {
    return { ok: true, found: false, message: 'برای این کد پستی آدرسی یافت نشد. کد را بررسی کنید.' }
  }

  return { ok: true, found: true, data }
}

/** آدرسِ خوانا از اجزا — وقتی خودِ سرویس `address` نداده باشد */
export function composeAddress(a: PostalAddress): string {
  return [
    a.street, a.street2,
    a.number ? `پلاک ${a.number}` : undefined,
    a.floor ? `طبقه ${a.floor}` : undefined,
    a.buildingName,
  ].filter(Boolean).join('، ')
}
