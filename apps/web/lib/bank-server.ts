/* ─────────────────────────────────────────────────────────────
   استعلام‌های بانکی — سمتِ سرور (s.api.ir).
   کلید هیچ‌وقت به مرورگر نمی‌رود.

   نکته‌ی مهم درباره‌ی این سرویس: پاسخِ «پیدا نشد» هم HTTP 200 با
   success=true برمی‌گرداند و فقط فیلدهای data را خالی می‌گذارد. پس
   «نبودِ نتیجه» باید یک پاسخِ منفیِ واقعی حساب شود، نه «سرویس در
   دسترس نیست» — همان اشتباهی که در PersonInfo رخ داده بود.
   ───────────────────────────────────────────────────────────── */

import { digitsOnly, isValidCard, formatIban, isValidIban } from './bank'

const CARD_TO_IBAN_URL = 'https://s.api.ir/api/sw1/CardToIban'

export interface CardToIbanResult {
  ok: boolean            // پاسخِ معتبری از سرویس گرفتیم
  found?: boolean        // کارت در سامانه‌ی بانکی پیدا شد
  iban?: string
  ownerName?: string
  bankName?: string
  message?: string
  unavailable?: boolean  // مشکلِ دسترسی/اعتبار/شبکه — تصمیم با فراخوان است
}

interface ApiEnvelope {
  success?: boolean
  code?: number
  message?: string | null
  data?: { name?: string | null; iban?: string | null; bankName?: string | null } | null
}

/** شماره کارت ⇒ شبا و نامِ دارنده */
export async function cardToIban(card: string): Promise<CardToIbanResult> {
  const cardNumber = digitsOnly(card)
  /* اعتبارسنجیِ محلی پیش از مصرفِ اعتبارِ سرویس */
  if (cardNumber.length !== 16) return { ok: false, message: 'شماره کارت باید ۱۶ رقم باشد' }
  if (!isValidCard(cardNumber)) return { ok: false, message: 'شماره کارت معتبر نیست' }

  const key = process.env.SMS_API_KEY
  if (!key) return { ok: false, unavailable: true, message: 'سرویسِ استعلامِ بانکی پیکربندی نشده است' }

  let r: Response
  try {
    r = await fetch(CARD_TO_IBAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ cardNumber }),
    })
  } catch {
    return { ok: false, unavailable: true, message: 'خطا در اتصال به سرویسِ استعلامِ بانکی' }
  }

  const j = await r.json().catch(() => null) as ApiEnvelope | null

  /* دسترسی/اعتبار ⇒ «نامشخص»، نه «کارت اشتباه» */
  const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
    || /trust level|سطح دسترسی|اعتبار|credit|unauthorized/i.test(j?.message || '')
  if (denied) {
    console.error('CardToIban unavailable:', j?.message || r.status)
    return { ok: false, unavailable: true, message: 'سرویسِ استعلامِ بانکی در دسترس نیست' }
  }
  if (!j) return { ok: false, unavailable: true, message: 'پاسخِ سرویسِ استعلامِ بانکی خوانده نشد' }

  /* ورودیِ نامعتبر از نگاهِ خودِ سرویس */
  if (j.success === false) {
    if (j.code === 400) return { ok: false, message: 'شماره کارت معتبر نیست' }
    console.error('CardToIban failed:', j.message || j.code)
    return { ok: false, unavailable: true, message: 'استعلامِ شبا ناموفق بود' }
  }

  const iban = formatIban(String(j.data?.iban ?? ''))
  /* success=true ولی بدونِ شبا ⇒ کارت پیدا نشد (پاسخِ منفیِ واقعی) */
  if (!iban) {
    return { ok: true, found: false, message: 'برای این شماره کارت، شبایی یافت نشد. شماره را بررسی کنید.' }
  }
  if (!isValidIban(iban)) {
    console.error('CardToIban returned a malformed iban:', j.data?.iban)
    return { ok: false, unavailable: true, message: 'شبای بازگشتی از سرویس معتبر نبود' }
  }

  return {
    ok: true, found: true, iban,
    ownerName: (j.data?.name ?? '').trim() || undefined,
    bankName:  (j.data?.bankName ?? '').trim() || undefined,
  }
}
