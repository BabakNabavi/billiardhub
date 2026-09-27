/* ─────────────────────────────────────────────────────────────
   خطای **گرفته‌شده** ⟵ همان ژورنالِ `/admin/errors`.

   ── نقطه‌ی کور ──
   `instrumentation.ts` هر خطای *گرفته‌نشده* را می‌گیرد؛ پوششش کامل
   است. ولی ۲۱۹ جای کد خطا را `catch` می‌کنند و با `console.error`
   کنار می‌گذارند — آن‌ها هرگز به قلابِ Next نمی‌رسند، پس در هیچ
   پنلی دیده نمی‌شوند و فقط در `journalctl` می‌مانند. برای کسی که
   ماهی یک‌بار به سرور ssh می‌زند، یعنی هرگز.

   ⚠️ گران‌ترین نمونه، کرون‌هاست. اگر `complete-bookings` بیفتد هیچ
   رزروی COMPLETED نمی‌شود، هیچ `CLUB_EARNING`ی در دفتر نوشته
   نمی‌شود و تسویه با باشگاه‌ها **غیرممکن** می‌ماند — و تنها نشانه‌اش
   یک خطِ `console.error` است که کسی نمی‌بیند. همین یک‌بار پیش از
   این اتفاق افتاده (کرونِ ورسل که بعد از مهاجرت مرده ماند).

   ── چرا همان جدول و نه جدولِ تازه ──
   `app_errors` از قبل تجمیع، شمارنده، `release` و «رسیدگی‌شده» دارد
   و صفحه‌اش ساخته شده. جدولِ دوم یعنی دو جا برای نگاه‌کردن، و جایی
   که کسی نگاه نمی‌کند همان‌جاست که خطا گم می‌شود.

   ⚠️ جای `console.error` را نمی‌گیرد، کنارش می‌نشیند: خطِ کنسول
   برای کسی که همان لحظه لاگِ سرور را می‌بیند هنوز ارزش دارد.
   ───────────────────────────────────────────────────────────── */

/* ⚠️ همان سوپاپِ `instrumentation.ts`: در قطعیِ دیتابیس هر خطا یک
   نوشتنِ تازه به همان دیتابیسِ از کار افتاده می‌سازد. بدونِ این سقف،
   ابزارِ پایش دقیقا وقتی که سیستم زمین خورده رویش بار می‌گذارد. */
const MAX_IN_FLIGHT = 4
let inFlight = 0

/** پیامِ کوتاهِ خوانا از هر شکلی که `catch` تحویل می‌دهد. */
function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const o = err as { message?: unknown; code?: unknown }
    if (typeof o.message === 'string') return o.code ? `${o.code}: ${o.message}` : o.message
  }
  try { return JSON.stringify(err).slice(0, 300) } catch { return String(err) }
}

/**
 * ثبتِ خطایی که گرفته و خنثی شده، ولی باید دیده شود.
 *
 * @param where برچسبِ محل، مثلِ `cron/complete-bookings`. جزءِ پیام
 *   می‌شود، پس اثرانگشت دو محلِ متفاوت را قاطی نمی‌کند.
 *
 * ⚠️ هرگز throw نمی‌کند و هرگز await را طولانی نمی‌کند. اگر ثبت
 *   شکست بخورد، مسیرِ اصلی نباید بفهمد — ابزارِ پایش نباید خودش
 *   منبعِ خطای تازه شود.
 */
export async function logHandled(
  where: string,
  err: unknown,
  ctx?: { url?: string | null; userId?: string | null },
): Promise<void> {
  if (inFlight >= MAX_IN_FLIGHT) return
  inFlight++
  try {
    /* ⚠️ ایمپورتِ تنبل، همان دلیلِ `instrumentation.ts`: این ماژول
       نباید کلاینتِ دیتابیس را به مسیرِ راه‌اندازی بکشد. */
    const [{ rpc }, { fingerprintOf, pathOf }] = await Promise.all([
      import('./finance/db'),
      import('./telemetry'),
    ])

    const message = `${where} — ${messageOf(err)}`
    const stack = err instanceof Error ? (err.stack ?? null) : null
    const url = ctx?.url ? pathOf(ctx.url) : null

    const { error } = await rpc('bh_log_error', {
      p_fingerprint: fingerprintOf('server', message, stack ?? undefined, url ?? undefined),
      p_source: 'server',
      p_message: message,
      p_stack: stack,
      p_url: url,
      p_user_agent: null,
      p_user_id: ctx?.userId ?? null,
      p_release: process.env.NEXT_PUBLIC_BUILD_SHA ?? null,
    })
    /* ⚠️ اگر خودِ ثبت شکست بخورد و این خط نباشد، ابزاری که کارش
       «گم‌نشدنِ خطا»ست خودش بی‌ردّ می‌میرد. همان کاری که
       `instrumentation.ts` و `/api/telemetry/error` می‌کنند. */
    if (error) console.error('[log-handled] bh_log_error:', error.code, error.message)
  } catch {
    /* بی‌صدا. مسیرِ اصلی از این‌جا آسیب نمی‌بیند. */
  } finally {
    inFlight--
  }
}
