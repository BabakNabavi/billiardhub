/* ─────────────────────────────────────────────────────────────
   استعلام اعتبار مجوز شغلی (جواز کسب) — سمت سرور.

   مثل بقیه‌ی سرویس‌های این ارائه‌دهنده، «پیدا نشد» هم HTTP 200 با
   success=true برمی‌گرداند و فقط data را خالی می‌گذارد؛ پس آن حالت
   پاسخ منفی واقعی است، نه «سرویس در دسترس نیست».
   ───────────────────────────────────────────────────────────── */

import { toJalali } from './jalali'
import { inquiryKey } from './inquiry-key'

const LICENSE_URL = 'https://s.api.ir/api/sw1/License'

export interface LicenseData {
  title?: string | null
  trackingCode?: string | null
  issuer?: string | null
  fullName?: string | null
  fatherName?: string | null
  nationalCode?: string | null
  phone?: string | null
  issueDate?: string | null
  expireDate?: string | null
  province?: string | null
  city?: string | null
  address?: string | null
  postalCode?: string | null
}

export interface LicenseResult {
  ok: boolean
  found?: boolean
  data?: LicenseData
  expired?: boolean
  message?: string
  unavailable?: boolean
}

interface Envelope { success?: boolean; code?: number; message?: string | null; data?: LicenseData | null }

/** «۱۴۰۲/۰۱/۰۱» گذشته است؟ مقایسه در همان تقویم شمسی انجام می‌شود. */
export function isJalaliPast(d: string | null | undefined): boolean | null {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(String(d ?? '').trim())
  if (!m) return null
  const [, y, mo, da] = m.map(Number) as unknown as [string, number, number, number]
  const now = new Date()
  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const a = y * 10000 + mo * 100 + da
  const b = jy * 10000 + jm * 100 + jd
  return a < b
}

/** استعلام جواز با کد پیگیری */
export async function lookupLicense(trackingCode: string): Promise<LicenseResult> {
  const code = String(trackingCode ?? '').trim()
  if (!code) return { ok: false, message: 'کد پیگیری مجوز را وارد کنید' }

  const key = inquiryKey()
  if (!key) return { ok: false, unavailable: true, message: 'سرویس استعلام مجوز پیکربندی نشده است' }

  let r: Response
  try {
    r = await fetch(LICENSE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ trackingCode: code }),
    })
  } catch {
    return { ok: false, unavailable: true, message: 'خطا در اتصال به سرویس استعلام مجوز' }
  }

  const j = await r.json().catch(() => null) as Envelope | null

  const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
    || /trust level|سطح دسترسی|اعتبار|credit|unauthorized/i.test(j?.message || '')
  if (denied) {
    console.error('License unavailable:', j?.message || r.status)
    return { ok: false, unavailable: true, message: 'سرویس استعلام مجوز در دسترس نیست' }
  }
  if (!j) return { ok: false, unavailable: true, message: 'پاسخ سرویس استعلام مجوز خوانده نشد' }

  if (j.success === false) {
    if (j.code === 400) return { ok: false, message: 'کد پیگیری مجوز معتبر نیست' }
    console.error('License failed:', j.message || j.code)
    return { ok: false, unavailable: true, message: 'استعلام مجوز ناموفق بود' }
  }

  /* success=true ولی بدون داده ⇒ مجوزی با این کد پیدا نشد */
  if (!j.data || !j.data.trackingCode) {
    return { ok: true, found: false, message: 'مجوزی با این کد پیگیری یافت نشد' }
  }

  const expired = isJalaliPast(j.data.expireDate) === true
  return { ok: true, found: true, data: j.data, expired }
}
