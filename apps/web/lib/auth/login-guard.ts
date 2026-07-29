/* ─────────────────────────────────────────────────────────────
   محافظتِ ورود — قفلِ تدریجیِ موقت (فاز ۸).

   آستانه و مدت‌ها این‌جا جمع‌اند تا Hardcode نباشند و با متغیرِ محیطی
   هم قابلِ تنظیم بمانند. هیچ‌کدام به «قفلِ دائمی» نمی‌رسند: بلندترین
   پله چند ساعت است، وگرنه هر کسی می‌توانست با چند تلاشِ عمدی حسابِ
   دیگری را از دسترس خارج کند.
   ───────────────────────────────────────────────────────────── */

import type { NextRequest } from 'next/server'
import { rpc } from '../finance/db'
import { ipOf } from './rate-limit'

const num = (v: string | undefined, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}

/** پس از این تعداد تلاشِ ناموفق، حسابِ همان شماره موقتاً قفل می‌شود */
export const LOGIN_THRESHOLD = num(process.env.LOGIN_FAIL_THRESHOLD, 3)

/** پله‌های قفلِ حساب (ثانیه): ۵د → ۱۵د → ۱س → ۶س → ۱۲س → ۱ روز */
export const LOGIN_WINDOWS: number[] = (process.env.LOGIN_LOCK_WINDOWS ?? '300,900,3600,21600,43200,86400')
  .split(',').map(s => num(s.trim(), 300))

/* قفلِ IP عمداً آستانه‌ی خیلی بالاتری دارد.

   در نسخه‌ی قبل هر دو یک آستانه داشتند و نتیجه‌اش یک باگِ جدی بود:
   کاربری که رمزِ حسابِ خودش را چند بار غلط می‌زد، IP‌اش قفل می‌شد و
   بعد **هیچ حسابِ دیگری هم از همان دستگاه** نمی‌توانست وارد شود. در
   یک خانه یا پشتِ NATِ اپراتورِ موبایل، اشتباهِ یک نفر همه را می‌بست.

   حالا قفلِ IP فقط برای حمله‌ی پرشمار (Credential Stuffing) است و
   کاربرِ عادی هرگز به آن نمی‌رسد. */
export const IP_THRESHOLD = num(process.env.LOGIN_IP_THRESHOLD, 30)
export const IP_WINDOWS: number[] = (process.env.LOGIN_IP_WINDOWS ?? '900,3600,21600')
  .split(',').map(s => num(s.trim(), 900))

export interface GuardResult { locked: boolean; retryAfter: number }

/** آیا این حساب/IP همین حالا قفل است؟ (فقط خواندن) */
export async function loginGuard(req: NextRequest, account: string): Promise<GuardResult> {
  try {
    const { data, error } = await rpc<{ locked: boolean; retry_after: number }>(
      'bh_login_guard', { p_account: account, p_ip: ipOf(req) },
    )
    if (error || !data) return { locked: false, retryAfter: 0 }
    return { locked: !!data.locked, retryAfter: Number(data.retry_after) || 0 }
  } catch {
    /* fail-open عمدی: خطای زیرساخت نباید ورودِ همه را ببندد */
    return { locked: false, retryAfter: 0 }
  }
}

/** ثبتِ تلاشِ ناموفق — قفل را در صورت رسیدن به آستانه اعمال می‌کند */
export async function loginFailed(req: NextRequest, account: string): Promise<void> {
  try {
    await rpc('bh_login_fail', {
      p_account: account, p_ip: ipOf(req),
      p_threshold: LOGIN_THRESHOLD, p_windows: LOGIN_WINDOWS,
      p_ip_threshold: IP_THRESHOLD, p_ip_windows: IP_WINDOWS,
    })
  } catch { /* شمارنده مهم‌تر از پاسخ نیست */ }
}

/** ورودِ موفق ⇒ شمارنده‌ی همان حساب پاک می‌شود (شمارنده‌ی IP می‌ماند) */
export async function loginSucceeded(account: string): Promise<void> {
  try { await rpc('bh_login_ok', { p_account: account }) } catch { /* بی‌اهمیت */ }
}

/** پیامِ عمومی — هرگز نگوید حساب هست یا نیست */
export const GENERIC_LOGIN_ERROR = 'اطلاعات ورود صحیح نیست.'

/** «۲ ساعت» / «۱۵ دقیقه» / «۱ روز» — با ارقامِ فارسی */
function faDuration(sec: number): string {
  const fa = (n: number) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)
  const m = Math.ceil(sec / 60)
  if (m < 60) return `${fa(m)} دقیقه`
  const h = Math.ceil(m / 60)
  if (h < 24) return `${fa(h)} ساعت`
  return `${fa(Math.ceil(h / 24))} روز`
}

export function lockMessage(retryAfterSec: number): string {
  /* راهِ خروج هم گفته می‌شود: بازیابیِ رمز قفل نمی‌شود، پس کاربری که
     واقعاً رمزش را فراموش کرده لازم نیست منتظر بماند. */
  return `به دلیلِ چند تلاشِ ناموفقِ پیاپی، ورود به این حساب موقتاً محدود شده است.`
    + ` حدود ${faDuration(retryAfterSec)} دیگر دوباره تلاش کنید،`
    + ` یا همین حالا از «فراموشی رمز عبور؟» رمزتان را عوض کنید.`
}
