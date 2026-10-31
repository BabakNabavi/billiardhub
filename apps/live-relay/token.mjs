/* ─────────────────────────────────────────────────────────────
   توکنِ رله — باید با apps/web/lib/streaming/relay-token.ts یکی بماند.

   توکن را سایت (پس از سنجشِ مالکیتِ باشگاه) می‌سازد و مرورگر فقط آن را
   جابه‌جا می‌کند. داخلش نشانیِ RTMP با کلیدِ استریم است، پس **رمز** است
   (AES-256-GCM)، نه فقط امضا: مرورگر و هر کسی در میانه کلید را نمی‌بیند.
   کلیدِ رمز از LIVE_RELAY_SECRET (مشترکِ سایت و رله) با HKDF.
   ───────────────────────────────────────────────────────────── */

import { createDecipheriv, hkdfSync } from 'node:crypto'

export function relayKey(secret) {
  return Buffer.from(hkdfSync('sha256', secret, 'billiardhub', 'live-relay/v1', 32))
}

/** null = نامعتبر، دست‌کاری‌شده یا منقضی */
export function openToken(token, secret, now = Date.now()) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3 || !secret) return null
  try {
    const iv = Buffer.from(parts[0], 'base64url'), tag = Buffer.from(parts[1], 'base64url')
    /* برچسبِ کوتاه‌شده‌ی GCM پذیرفته نشود (DEP0182) — جعلِ آنلاین را ارزان می‌کرد */
    if (iv.length !== 12 || tag.length !== 16) return null
    const d = createDecipheriv('aes-256-gcm', relayKey(secret), iv, { authTagLength: 16 })
    d.setAuthTag(tag)
    const json = Buffer.concat([d.update(Buffer.from(parts[2], 'base64url')), d.final()]).toString('utf8')
    const p = JSON.parse(json)
    if (typeof p?.rtmp !== 'string' || !/^rtmps?:\/\/\S+\/\S+\/\S+$/.test(p.rtmp)) return null
    if (typeof p?.ch !== 'string' || typeof p?.exp !== 'number' || p.exp < now) return null
    return { rtmp: p.rtmp, ch: p.ch, exp: p.exp }
  } catch { return null }
}
