import 'server-only'
import { open } from './secret'
import { fullRtmp, sealRelayToken } from './relay-token'
import type { Channel } from './repo'

/* ─────────────────────────────────────────────────────────────
   «پخش با دوربینِ همین گوشی/لپ‌تاپ» — دو راه، بی‌دخالتِ باشگاه‌دار:
   ۱) whip  — سرویسِ پخش ورودیِ WebRTC دارد: مرورگر مستقیم به آن.
   ۲) relay — مرورگر ← رله‌ی سایت (apps/live-relay) ← RTMPِ سرویس.
   اولویت با whip است (بی‌واسطه، بی‌بار روی سرورِ ما).
   ───────────────────────────────────────────────────────────── */

export type BrowserMode = 'whip' | 'relay'

export function relayConfig(): { url: string; secret: string } | null {
  const url = (process.env.LIVE_RELAY_URL || '').trim()
  const secret = (process.env.LIVE_RELAY_SECRET || '').trim()
  return url && secret ? { url, secret } : null
}

export function browserModeOf(ch: Channel): BrowserMode | null {
  if (ch.whipUrl) return 'whip'
  if (relayConfig() && /^rtmps?:\/\//.test(ch.ingestUrl)) return 'relay'
  return null
}

export type BrowserSession =
  | { mode: 'whip'; url: string; token: string | null }
  | { mode: 'relay'; url: string; token: string }

/** اجازه‌ی اتصالِ مرورگر — فقط پس از سنجشِ مالکیت (در مسیر) */
export function browserSession(ch: Channel): BrowserSession | null {
  if (ch.whipUrl) return { mode: 'whip', url: ch.whipUrl, token: open(ch.whipTokenEnc) }
  const cfg = relayConfig()
  const key = open(ch.streamKeyEnc)
  const rtmp = key ? fullRtmp(ch.ingestUrl, key) : null
  if (!cfg || !rtmp) return null
  return { mode: 'relay', url: cfg.url, token: sealRelayToken({ rtmp, ch: ch.id }, cfg.secret) }
}
