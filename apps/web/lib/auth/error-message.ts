import type { AxiosError } from 'axios'

/* ─────────────────────────────────────────────────────────────
   ترجمه‌ی خطای درخواست به پیامِ درست برای کاربر.

   چرا لازم شد: فرم‌های ورود و ثبت‌نام این‌طور نوشته شده بودند:

     setError(err.response?.data?.message || 'شماره یا رمز عبور اشتباه است')

   یعنی هر خطایی که **پاسخی از سرور نداشت** — قطعیِ لحظه‌ای شبکه،
   تایم‌اوت، VPNای که وسطِ کار افت می‌کند، یا سردشدنِ تابعِ سرور — به
   کاربر می‌گفت «رمزت اشتباه است». کاربری که رمزش درست بود بارها این
   را می‌دید و طبیعتاً فکر می‌کرد سیستم خراب است.

   حالا سه حالت از هم جدا می‌شوند:
     • اصلاً به سرور نرسید      ⇒ مشکلِ اتصال
     • رسید ولی خطای سرور بود   ⇒ مشکل از ما، نه از کاربر
     • رسید و سرور رد کرد       ⇒ همان پیامِ خودِ سرور
   ───────────────────────────────────────────────────────────── */

export interface AuthError {
  message: string
  /** آیا مشکل از ورودیِ کاربر بود؟ اگر نه، نباید فیلدها قرمز شوند */
  isCredentialError: boolean
  /** برای قفلِ موقت — ثانیه‌های باقی‌مانده */
  retryAfter?: number
}

export function toAuthError(err: unknown, fallback = 'انجام نشد'): AuthError {
  const ax = err as AxiosError<{ message?: string; retryAfter?: number }> | undefined

  /* هیچ پاسخی نیامده ⇒ درخواست به سرور نرسید */
  if (ax && !ax.response) {
    const code = ax.code
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return {
        message: 'پاسخی از سرور نیامد. اتصالتان را بررسی کنید و دوباره تلاش کنید.',
        isCredentialError: false,
      }
    }
    return {
      message: navigator?.onLine === false
        ? 'اتصالِ اینترنت قطع است.'
        : 'ارتباط با سرور برقرار نشد. اگر VPN روشن است، یک‌بار خاموش/روشنش کنید و دوباره تلاش کنید.',
      isCredentialError: false,
    }
  }

  const status = ax?.response?.status
  const serverMsg = ax?.response?.data?.message

  /* خطای سمتِ سرور ⇒ تقصیرِ کاربر نیست و نباید پیامِ «رمز اشتباه» بگیرد */
  if (status && status >= 500) {
    return {
      message: serverMsg || 'خطایی در سرور رخ داد. چند لحظه بعد دوباره تلاش کنید.',
      isCredentialError: false,
    }
  }

  /* قفلِ موقت یا محدودیتِ نرخ */
  if (status === 429) {
    return {
      message: serverMsg || 'تلاشِ بیش از حد. کمی صبر کنید.',
      isCredentialError: false,
      retryAfter: ax?.response?.data?.retryAfter,
    }
  }

  /* توکنِ امنیتیِ منقضی — با تازه‌کردنِ صفحه حل می‌شود */
  if (status === 403 && /توکن امنیتی/.test(String(serverMsg))) {
    return { message: serverMsg!, isCredentialError: false }
  }

  return {
    message: serverMsg || fallback,
    isCredentialError: status === 401 || status === 400,
  }
}
