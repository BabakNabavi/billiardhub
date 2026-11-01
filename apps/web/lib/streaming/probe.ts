import 'server-only'

/* ─────────────────────────────────────────────────────────────
   «آیا تصویر واقعاً می‌رسد؟» — از روی مانیفستِ HLSِ خودِ سرویس.

   «زنده» در دیتابیس فقط یعنی باشگاه‌دار دکمه را زده؛ اگر دوربینی وصل
   نباشد، بیننده صفحه‌ی سیاه می‌بیند. پس فهرستِ عمومی فقط کانالی را نشان
   می‌دهد که مانیفستش پاسخ می‌دهد، و کانالی که چند دقیقه «زنده» بماند و
   تصویری نرسد، خودکار تمام می‌شود.

   کش کوتاه: هر کانال حداکثر هر ۱۰ ثانیه یک درخواستِ کوچک به CDN — مستقل
   از تعدادِ بیننده‌ها.
   ───────────────────────────────────────────────────────────── */

const TTL_MS = 10_000
const cache = new Map<string, { at: number; ok: boolean }>()
const inflight = new Map<string, Promise<boolean>>()

function remember(url: string, ok: boolean) {
  const now = Date.now()
  for (const [k, v] of cache) if (now - v.at > TTL_MS * 6) cache.delete(k)
  cache.set(url, { at: now, ok })
}

/** null = نشانیِ پخش نداریم (نمی‌دانیم) ⟵ همان «دارد» حساب می‌شود */
export async function hasPicture(playbackUrl: string | null, now = Date.now()): Promise<boolean> {
  if (!playbackUrl) return true
  const hit = cache.get(playbackUrl)
  if (hit && now - hit.at < TTL_MS) return hit.ok
  const running = inflight.get(playbackUrl)
  if (running) return running
  const p = (async () => {
    try {
      const r = await fetch(playbackUrl, { cache: 'no-store', signal: AbortSignal.timeout(2500) })
      /* ۴۰۱/۴۰۳: لینکِ امضاشده لازم است — «نمی‌دانیم»، نه «تصویر نیست» */
      if (r.status === 401 || r.status === 403) { cache.set(playbackUrl, { at: Date.now(), ok: true }); return true }
      const text = r.ok ? await r.text() : ''
      /* ۲۰۰ با صفحه‌ی HTMLِ «یافت نشد» هم ممکن است — مانیفستِ واقعی با #EXTM3U شروع می‌شود.
         (آروان بی‌ورودی ۴۰۴ با HTML می‌دهد — ۱ نوامبر ۲۰۲۶ دیده شد) */
      const ok = r.ok && text.trimStart().startsWith('#EXTM3U')
      remember(playbackUrl, ok)
      return ok
    } catch {
      /* شبکه‌ی خودمان به CDN نرسید — «نمی‌دانیم»؛ آخرین وضعیتِ معلوم یا «دارد».
         کش هم می‌شود تا هر درخواست ۲٫۵ ثانیه منتظرِ CDNِ ناپیدا نماند */
      const ok = hit?.ok ?? true
      remember(playbackUrl, ok)
      return ok
    } finally { inflight.delete(playbackUrl) }
  })()
  inflight.set(playbackUrl, p)
  return p
}

/** پس از «شروع»، این‌قدر فرصت تا تصویر برسد؛ بعد کانال خودکار تمام می‌شود */
export const NO_PICTURE_GRACE_MS = 3 * 60 * 1000
