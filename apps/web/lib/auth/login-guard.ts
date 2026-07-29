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

/** پس از این تعداد تلاشِ ناموفق، قفلِ موقت اعمال می‌شود */
export const LOGIN_THRESHOLD = num(process.env.LOGIN_FAIL_THRESHOLD, 5)

/** پله‌های قفل (ثانیه): ۵ دقیقه → ۳۰ دقیقه → ۱ ساعت → ۴ ساعت */
export const LOGIN_WINDOWS: number[] = (process.env.LOGIN_LOCK_WINDOWS ?? '300,1800,3600,14400')
  .split(',').map(s => num(s.trim(), 300))

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
    })
  } catch { /* شمارنده مهم‌تر از پاسخ نیست */ }
}

/** ورودِ موفق ⇒ شمارنده‌ی همان حساب پاک می‌شود (شمارنده‌ی IP می‌ماند) */
export async function loginSucceeded(account: string): Promise<void> {
  try { await rpc('bh_login_ok', { p_account: account }) } catch { /* بی‌اهمیت */ }
}

/** پیامِ عمومی — هرگز نگوید حساب هست یا نیست */
export const GENERIC_LOGIN_ERROR = 'اطلاعات ورود صحیح نیست.'

export function lockMessage(retryAfterSec: number): string {
  const m = Math.ceil(retryAfterSec / 60)
  return m >= 60
    ? `به دلیلِ تلاش‌های ناموفقِ پیاپی، ورود موقتاً محدود شده است. حدود ${Math.ceil(m / 60)} ساعت دیگر دوباره تلاش کنید.`
    : `به دلیلِ تلاش‌های ناموفقِ پیاپی، ورود موقتاً محدود شده است. حدود ${m} دقیقه دیگر دوباره تلاش کنید.`
}
