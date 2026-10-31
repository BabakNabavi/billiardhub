import { createCipheriv, hkdfSync, randomBytes } from 'node:crypto'

/* ─────────────────────────────────────────────────────────────
   توکنِ رله‌ی پخش (apps/live-relay) — قالبش باید با
   apps/live-relay/token.mjs یکی بماند (تستِ test-streaming هر دو را می‌سنجد).

   داخلِ توکن نشانیِ کاملِ RTMP با کلیدِ استریم است؛ مرورگر فقط آن را به
   رله می‌رساند و چون رمز است (نه فقط امضا)، کلید را نمی‌بیند.
   ───────────────────────────────────────────────────────────── */

/* رله `exp` را فقط هنگامِ اتصال می‌سنجد؛ کوتاه تا توکنِ لورفته بی‌ارزش شود.
   وصلِ دوباره پس از قطعی، توکنِ تازه از سایت می‌گیرد. */
export const RELAY_TOKEN_TTL_MS = 2 * 60 * 1000

export function relayTokenKey(secret: string): Buffer {
  return Buffer.from(hkdfSync('sha256', secret, 'billiardhub', 'live-relay/v1', 32))
}

export function sealRelayToken(p: { rtmp: string; ch: string }, secret: string, now = Date.now()): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', relayTokenKey(secret), iv)
  const ct = Buffer.concat([c.update(JSON.stringify({ ...p, exp: now + RELAY_TOKEN_TTL_MS }), 'utf8'), c.final()])
  return [iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.')
}

/** نشانیِ کاملِ ارسال: آروان نشانی و کلید را جدا می‌دهد (rtmp://…:1935/app + key) */
export function fullRtmp(ingestUrl: string, streamKey: string): string | null {
  const base = ingestUrl.trim().replace(/\/+$/, '')
  if (!/^rtmps?:\/\/\S+\/\S+$/.test(base) || !streamKey.trim()) return null
  return base.endsWith(`/${streamKey.trim()}`) ? base : `${base}/${streamKey.trim()}`
}
