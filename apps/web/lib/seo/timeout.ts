/* مهلت برای خواندن‌های SEO (متادیتا و JSON-LD).

   متادیتا رندر را بلاک می‌کند: دیتابیسِ معلق نباید صفحه را معلق کند.
   `TIMED_OUT` جداست از «نبود» — پاسخِ کُند نباید به «noindex» یا «پیدا نشد»
   تعبیر شود (یک کندیِ لحظه‌ای هنگامِ خزیدنِ گوگل، صفحه‌ی واقعی را از نتایج
   بیرون می‌انداخت). تایمر همیشه پاک می‌شود. */

export const TIMED_OUT = Symbol('timed-out')

export async function withTimeout<T>(p: PromiseLike<T>, ms = 2500): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(p),
      new Promise<typeof TIMED_OUT>(r => { timer = setTimeout(() => r(TIMED_OUT), ms) }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
