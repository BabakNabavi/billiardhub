/* ─────────────────────────────────────────────────────────────
   اعتبارسنجیِ ایمیل — s.api.ir/api/sw1/CheckEmail

   سرویس فقط می‌گوید این نشانی واقعی و فعال هست یا نه؛ کدی به ایمیل
   فرستاده نمی‌شود.

   تله‌ی همیشگیِ این خانواده از سرویس‌ها: «نامعتبر» هم HTTP 200 با
   success:true برمی‌گردد و فقط data=false می‌شود. آن حالت یک پاسخِ
   منفیِ واقعی است، نه «سرویس در دسترس نیست» — اگر اشتباه بگیریمش،
   هر ایمیلِ الکی تأیید می‌شود.
   ───────────────────────────────────────────────────────────── */

const CHECK_URL = 'https://s.api.ir/api/sw1/CheckEmail'

/* ساده و سخت‌گیرانه؛ فرمِ کلاینت هم همین را چک می‌کند */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export interface EmailCheck {
  ok: boolean            // استعلام انجام شد؟
  valid?: boolean        // ایمیل واقعی و فعال است؟
  unavailable?: boolean  // سرویس در دسترس نبود (تصمیم با فراخوان)
  message?: string
}

export function normalizeEmail(v: string): string {
  return String(v ?? '').trim().toLowerCase()
}

export async function checkEmail(email: string): Promise<EmailCheck> {
  const e = normalizeEmail(email)
  if (!EMAIL_RE.test(e)) return { ok: true, valid: false, message: 'نشانیِ ایمیل معتبر نیست' }

  const key = process.env.SMS_API_KEY
  /* بدونِ کلید نمی‌شود استعلام گرفت — و «تأییدِ الکی» بدترین حالت است */
  if (!key) return { ok: false, unavailable: true, message: 'سرویسِ اعتبارسنجیِ ایمیل پیکربندی نشده است' }

  try {
    const r = await fetch(CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ email: e }),
    })
    const j = await r.json().catch(() => null) as
      { data?: boolean | null; success?: boolean; code?: number; message?: string } | null

    /* سطحِ دسترسی/کلید/اعتبار ⇒ نامشخص، نه «نامعتبر» */
    const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
      || /trust level|سطح دسترسی|اعتبار|credit/i.test(j?.message || '')
    if (denied) {
      console.error('CheckEmail unavailable:', j?.message || r.status)
      return { ok: false, unavailable: true, message: 'سرویسِ اعتبارسنجیِ ایمیل در دسترس نیست' }
    }
    if (!r.ok || !j) {
      console.error('CheckEmail failed:', r.status)
      return { ok: false, unavailable: true, message: 'استعلامِ ایمیل ناموفق بود' }
    }

    /* success:true + data:false ⇒ پاسخِ منفیِ واقعی */
    if (j.success === false) {
      return { ok: false, unavailable: true, message: j.message || 'استعلامِ ایمیل ناموفق بود' }
    }

    const valid = j.data === true
    return {
      ok: true, valid,
      message: valid ? undefined : 'این نشانیِ ایمیل فعال نیست یا وجود ندارد',
    }
  } catch {
    return { ok: false, unavailable: true, message: 'ارتباط با سرویسِ اعتبارسنجیِ ایمیل برقرار نشد' }
  }
}
