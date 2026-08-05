/* ─────────────────────────────────────────────────────────────
   استعلام‌های بانکی — سمت سرور (s.api.ir).
   کلید هیچ‌وقت به مرورگر نمی‌رود.

   نکته‌ی مهم درباره‌ی این سرویس: پاسخ «پیدا نشد» هم HTTP 200 با
   success=true برمی‌گرداند و فقط فیلدهای data را خالی می‌گذارد. پس
   «نبود نتیجه» باید یک پاسخ منفی واقعی حساب شود، نه «سرویس در
   دسترس نیست» — همان اشتباهی که در PersonInfo رخ داده بود.
   ───────────────────────────────────────────────────────────── */

import { digitsOnly, isValidCard, formatIban, isValidIban } from './bank'
import { inquiryKey } from './inquiry-key'

const CARD_TO_IBAN_URL = 'https://s.api.ir/api/sw1/CardToIban'
const CARD_MATCH_URL   = 'https://s.api.ir/api/sw1/CardMatch'
const IBAN_MATCH_URL   = 'https://s.api.ir/api/sw1/IbanMatch'

export interface CardToIbanResult {
  ok: boolean            // پاسخ معتبری از سرویس گرفتیم
  found?: boolean        // کارت در سامانه‌ی بانکی پیدا شد
  iban?: string
  ownerName?: string
  bankName?: string
  message?: string
  unavailable?: boolean  // مشکل دسترسی/اعتبار/شبکه — تصمیم با فراخوان است
}

interface ApiEnvelope {
  success?: boolean
  code?: number
  message?: string | null
  data?: { name?: string | null; iban?: string | null; bankName?: string | null } | null
}

/** شماره کارت ⇒ شبا و نام دارنده */
export async function cardToIban(card: string): Promise<CardToIbanResult> {
  const cardNumber = digitsOnly(card)
  /* اعتبارسنجی محلی پیش از مصرف اعتبار سرویس */
  if (cardNumber.length !== 16) return { ok: false, message: 'شماره کارت باید ۱۶ رقم باشد' }
  if (!isValidCard(cardNumber)) return { ok: false, message: 'شماره کارت معتبر نیست' }

  const key = inquiryKey()
  if (!key) return { ok: false, unavailable: true, message: 'سرویس استعلام بانکی پیکربندی نشده است' }

  let r: Response
  try {
    r = await fetch(CARD_TO_IBAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ cardNumber }),
    })
  } catch {
    return { ok: false, unavailable: true, message: 'خطا در اتصال به سرویس استعلام بانکی' }
  }

  const j = await r.json().catch(() => null) as ApiEnvelope | null

  /* دسترسی/اعتبار ⇒ «نامشخص»، نه «کارت اشتباه» */
  const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
    || /trust level|سطح دسترسی|اعتبار|credit|unauthorized/i.test(j?.message || '')
  if (denied) {
    console.error('CardToIban unavailable:', j?.message || r.status)
    return { ok: false, unavailable: true, message: 'سرویس استعلام بانکی در دسترس نیست' }
  }
  if (!j) return { ok: false, unavailable: true, message: 'پاسخ سرویس استعلام بانکی خوانده نشد' }

  /* ورودی نامعتبر از نگاه خود سرویس */
  if (j.success === false) {
    if (j.code === 400) return { ok: false, message: 'شماره کارت معتبر نیست' }
    console.error('CardToIban failed:', j.message || j.code)
    return { ok: false, unavailable: true, message: 'استعلام شبا ناموفق بود' }
  }

  const iban = formatIban(String(j.data?.iban ?? ''))
  /* success=true ولی بدون شبا ⇒ کارت پیدا نشد (پاسخ منفی واقعی) */
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

/* ── تطبیق هویت با حساب بانکی ─────────────────────────────────────
   CardMatch و IbanMatch هر دو یک قرارداد دارند:
     success=false            ⇒ ورودی نامعتبر یا خطای سرویس
     success=true, data=false ⇒ پاسخ منفی واقعی (مطابقت ندارد)
     success=true, data=true  ⇒ مطابقت دارد
   برخلاف CardToIban این‌جا data بولین است، پس false یعنی «نه»، نه «نبود». */

export interface MatchResult {
  ok: boolean
  match?: boolean
  message?: string
  unavailable?: boolean
}

interface MatchEnvelope { success?: boolean; code?: number; message?: string | null; data?: boolean | null }

async function callMatch(url: string, body: Record<string, string>, what: string): Promise<MatchResult> {
  const key = inquiryKey()
  if (!key) return { ok: false, unavailable: true, message: 'سرویس استعلام بانکی پیکربندی نشده است' }

  let r: Response
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, unavailable: true, message: 'خطا در اتصال به سرویس استعلام بانکی' }
  }

  const j = await r.json().catch(() => null) as MatchEnvelope | null

  const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
    || /trust level|سطح دسترسی|اعتبار|credit|unauthorized/i.test(j?.message || '')
  if (denied) {
    console.error(`${what} unavailable:`, j?.message || r.status)
    return { ok: false, unavailable: true, message: 'سرویس استعلام بانکی در دسترس نیست' }
  }
  if (!j) return { ok: false, unavailable: true, message: 'پاسخ سرویس استعلام بانکی خوانده نشد' }

  if (j.success === false) {
    if (j.code === 400) return { ok: false, message: 'اطلاعات واردشده معتبر نیست' }
    console.error(`${what} failed:`, j.message || j.code)
    return { ok: false, unavailable: true, message: 'استعلام ناموفق بود' }
  }

  return { ok: true, match: j.data === true }
}

/** آیا این شماره کارت به همین کد ملی و تاریخ تولد تعلق دارد؟ */
export async function matchCard(nationalCode: string, birthDate: string, card: string): Promise<MatchResult> {
  const cardNumber = digitsOnly(card)
  if (cardNumber.length !== 16) return { ok: false, message: 'شماره کارت باید ۱۶ رقم باشد' }
  if (!isValidCard(cardNumber)) return { ok: false, message: 'شماره کارت معتبر نیست' }
  return callMatch(CARD_MATCH_URL, { nationalCode: digitsOnly(nationalCode), birthDate, cardNumber }, 'CardMatch')
}

/** آیا این شبا به همین کد ملی و تاریخ تولد تعلق دارد؟ */
export async function matchIban(nationalCode: string, birthDate: string, rawIban: string): Promise<MatchResult> {
  const iban = formatIban(rawIban)
  if (!isValidIban(iban)) return { ok: false, message: 'شماره شبا معتبر نیست' }
  return callMatch(IBAN_MATCH_URL, { nationalCode: digitsOnly(nationalCode), birthDate, iban }, 'IbanMatch')
}

/* ─────────────────────────────────────────────────────────────
   همگام‌سازی شبای تأییدشده با جدول تسویه.

   دو جدول همزمان شبا نگه می‌دارند و هرکدام مصرف‌کننده‌ی خودش را دارد:
     • `clubs.iban`          → نمایش در تب «اطلاعات» و صفحه‌ی عمومی
     • `club_bank_accounts`  → مبنای واقعی تسویه و تب «مالی»

   پیش‌تر فقط اولی نوشته می‌شد، پس باشگاه‌دار شبایش را با استعلام تأیید
   می‌کرد ولی تب مالی همچنان می‌گفت «حسابی ثبت نشده» و فرم دومی برای
   وارد کردن همان شبا نشان می‌داد. این تابع همان دوگانگی را می‌بندد.

   وضعیت مستقیم VERIFIED است، چون هر دو مسیر فراخوان پیش از رسیدن به
   این‌جا با IbanMatch اثبات کرده‌اند حساب به نام کد ملی تأییدشده‌ی
   همین کاربر است — سنجه‌ای قوی‌تر از بازبینی چشمی ادمین.
   ───────────────────────────────────────────────────────────── */
export async function syncClubSettlementAccount(opts: {
  sb: () => any
  clubId: string
  actorId: string
  iban: string
  bankName?: string | null
  holderName?: string | null
  cardLast4?: string | null
}): Promise<void> {
  const { sb, clubId, actorId, iban } = opts
  if (!clubId || !isValidIban(iban)) return

  const holder = String(opts.holderName || '').trim()
    || await sb().from('users').select('name').eq('id', actorId).maybeSingle()
      .then((r: { data: { name?: string } | null }) => String(r.data?.name || '').trim())
      .catch(() => '')

  const { data: prev } = await sb().from('club_bank_accounts')
    .select('id,iban,verification_status').eq('club_id', clubId).eq('is_active', true).maybeSingle()

  const p = prev as { id: string; iban?: string; verification_status?: string } | null

  /* همان شبا و همان وضعیت ⇒ کاری لازم نیست؛ رکورد تکراری نساز */
  if (p && p.iban === iban && p.verification_status === 'VERIFIED') return

  if (p) {
    await sb().from('club_bank_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', p.id)
  }

  await sb().from('club_bank_accounts').insert({
    club_id: clubId,
    account_holder_name: holder || 'صاحب باشگاه',
    bank_name: opts.bankName ?? null,
    iban,
    card_number_last4: opts.cardLast4 ?? null,
    verification_status: 'VERIFIED',
    verified_at: new Date().toISOString(),
    verified_by: actorId,
    is_active: true,
  })
}
