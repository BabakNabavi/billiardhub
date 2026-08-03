'use client'

import { useEffect, useState } from 'react'

/* «هنوز وقتش نیست» — عقب‌انداختنِ کارهای دوره‌ای تا آرام‌شدنِ مرورگر.

   ── چرا لازم شد ──
   اندازه‌گیریِ صفحه‌ی اصلی (scripts/perf-audit.mjs) نشان داد نخستین
   ثانیه‌های بارگذاری پر از «کارِ بلند» است. یکی از منبع‌هایش این است
   که همه‌ی چرخش‌های خودکارِ صفحه — هیرو، بنرها، دو نوارِ کشویی و
   بنرهای کوچکِ بازار — دقیقاً در لحظه‌ی `mount` شروع می‌شوند، یعنی
   همان لحظه‌ای که مرورگر مشغولِ hydration است.

   هر تیکِ این تایمرها یک رندرِ کاملِ React است. جمعشان درست در بدترین
   لحظه روی رشته‌ی اصلی می‌نشیند و همان حسِ «سکته» را می‌سازد.

   این قلاب `false` برمی‌گرداند و بعد از آرام‌شدنِ مرورگر `true`.
   مصرف‌کننده فقط شرط را اضافه می‌کند؛ منطقِ خودش دست‌نخورده می‌ماند.

   ── چرا این تأخیر دیده نمی‌شود ──
   کاروسل‌ها به‌هرحال چند ثانیه بعد می‌چرخند. یک ثانیه دیرتر شروع‌شدن
   برای کاربر نامرئی است، ولی همان یک ثانیه دقیقاً همان‌جایی است که
   مرورگر بیشترین فشار را دارد.

   `requestIdleCallback` در سافاری نیست؛ `setTimeout` جایگزینِ امن
   است و بدترین حالتش همان رفتارِ امروز با کمی تأخیر است. */
export function useDeferredStart(delayMs = 800): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let done = false
    const go = () => { if (!done) { done = true; setReady(true) } }

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
    }
    /* سقفِ زمانی لازم است: در صفحه‌ای که همیشه کار دارد، ممکن است
       لحظه‌ی بی‌کاری هیچ‌وقت نرسد و کاروسل‌ها اصلاً شروع نشوند. */
    const t = setTimeout(go, delayMs)
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(go, { timeout: delayMs })

    return () => { done = true; clearTimeout(t) }
  }, [delayMs])

  return ready
}
