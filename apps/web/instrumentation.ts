/* ─────────────────────────────────────────────────────────────
   پایشِ خطای سمتِ سرور.

   ── چرا این‌جا و نه در تک‌تکِ مسیرها ──
   ۱۵۷ route handler داریم. وصل‌کردنِ گزارش به هرکدام یعنی ۱۵۷ فرصتِ
   تازه برای «این یکی یادمان رفت». Next خودش قلابی دارد که هر خطای
   گرفته‌نشده‌ی سرور — چه در رندرِ Server Component، چه در route
   handler، چه در middleware — از آن می‌گذرد. یک فایل، پوششِ کامل.

   ── چرا Sentry نه ──
   سرور و مخاطب هر دو ایرانند؛ سرویسِ بیرونی از این‌جا قابلِ اتکا
   نیست و پایشی که خودش قطع شود از نبودنش بدتر است، چون آدم فکر
   می‌کند پوشش دارد. همان جدولِ خودمان (`app_errors`) کار را
   می‌کند، با صفر وابستگیِ تازه.

   ⚠️ این ماژول عمدا سبک است و هیچ ایمپورتِ سنگینی ندارد: در هر
   بوتِ سرور یک‌بار بارگذاری می‌شود و روی مسیرِ راه‌اندازی می‌نشیند.
   ───────────────────────────────────────────────────────────── */

import type { Instrumentation } from 'next'

/* حداکثر نوشتنِ هم‌زمانِ ژورنال — بالاتر از این، خطاها شمرده نمی‌شوند */
const MAX_IN_FLIGHT = 4
let inFlight = 0

/* ── نوفه‌ای که باگ نیست ──
   ⚠️ روی `name`/`code` سنجیده می‌شود نه روی متنِ پیام. نسخه‌ی اول
   `/aborted/i` را روی پیام می‌انداخت و آن، پیامِ پستگرس
   «current transaction is aborted…» را هم بی‌صدا دور می‌ریخت —
   یعنی یک خطای کاملا واقعی.

   `NEXT_REDIRECT`/`NEXT_NOT_FOUND`/`Dynamic server usage` هم
   برداشته شدند: خودِ Next پیش از صدا زدنِ این قلاب فیلترشان می‌کند. */
const IGNORE_NAME = /^(AbortError|ResponseAborted)$/
const IGNORE_CODE = /^(ECONNRESET|ECONNABORTED|ERR_STREAM_PREMATURE_CLOSE)$/

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const e = err as { message?: string; stack?: string; digest?: string; name?: string; code?: string }
  const message = String(e?.message ?? err)
  if (IGNORE_NAME.test(e?.name ?? '') || IGNORE_CODE.test(e?.code ?? '')) return

  /* ── سوپاپِ اطمینان ──
     ⚠️ در قطعیِ دیتابیس، هر درخواست ۵۰۰ می‌شود، هر ۵۰۰ این قلاب را
     صدا می‌زند و هر صدا یک نوشتنِ تازه به همان دیتابیسِ از کار
     افتاده. بدونِ این سقف، ابزارِ پایش دقیقا وقتی که سیستم زمین
     خورده، رویش بار می‌گذارد. */
  if (inFlight >= MAX_IN_FLIGHT) return
  inFlight++

  /* ⚠️ ایمپورتِ تنبل. این ماژول در بوتِ سرور اجرا می‌شود و کشیدنِ
     کلاینتِ دیتابیس به آن لحظه، راه‌اندازی را کند می‌کند و در
     بدترین حالت می‌شکند. فقط وقتی خطایی واقعا رخ داد لازم است. */
  try {
    /* ⚠️ اثرانگشت از `lib/telemetry` می‌آید نه از خودِ route: این
       فایل در رانتایمِ Edge هم بارگذاری می‌شود و آن route زمانی
       `node:crypto` داشت که در Edge وجود ندارد — بیلد را می‌شکست. */
    const [{ rpc }, { fingerprintOf, pathOf }] = await Promise.all([
      import('@/lib/finance/db'),
      import('@/lib/telemetry'),
    ])

    /* ⚠️ `request.path` در Next از `req.url` پر می‌شود، یعنی
       **کوئری‌استرینگ هم دارد**. کالبکِ درگاه‌ها شناسه‌ی پرداخت را
       همان‌جا حمل می‌کنند، پس فقط مسیرِ خالی ذخیره می‌شود. */
    const url = pathOf(request?.path)

    const { error } = await rpc('bh_log_error', {
      p_fingerprint: fingerprintOf('server', message, e?.stack, url),
      p_source: 'server',
      /* مسیرِ رندر («app/clubs/[id]/page») بدونِ این در پیام نیست و
         پیدا کردنِ محلِ خطا را چند برابر سخت می‌کند. */
      p_message: context?.routePath ? `${context.routePath} — ${message}` : message,
      p_stack: e?.stack ?? null,
      p_url: url ?? null,
      p_user_agent: null,
      p_user_id: null,
      p_release: process.env.NEXT_PUBLIC_BUILD_SHA ?? null,
    })
    if (error) console.error('[instrumentation] bh_log_error:', error.code, error.message)
  } catch {
    /* ابزارِ پایش نباید خودش منبعِ خطای تازه شود */
  } finally {
    inFlight--
  }
}
