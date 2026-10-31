/* ─────────────────────────────────────────────────────────────
   شمارشِ بیننده‌ی هم‌زمان — در حافظه‌ی همان پروسه‌ی سرور.

   هر بیننده هر ~۳۰ ثانیه «تپش» می‌فرستد؛ کسی که ۴۵ ثانیه نفرستد رفته است.
   حافظه کافی است چون سایت یک پروسه‌ی Next است (systemd: billiardhub) —
   ری‌استارت فقط شمارِ همان لحظه را صفر می‌کند و با تپشِ بعدی برمی‌گردد.

   ⚠️ این عدد هیچ‌وقت ترافیکِ تصویر نیست: تصویر از CDNِ سرویسِ پخش
   می‌آید. تپش یک درخواستِ کوچکِ JSON است.

   ضدِ سوءاستفاده: شناسه‌ی بیننده را کلاینت می‌سازد، پس سقف دارد — هرچه
   باشد، حافظه بی‌حد رشد نمی‌کند.
   ───────────────────────────────────────────────────────────── */

export const VIEWER_TTL_MS = 45_000
const MAX_PER_CHANNEL = 50_000
export const VIEWER_ID = /^[A-Za-z0-9_-]{8,40}$/

const channels = new Map<string, Map<string, number>>()

function prune(m: Map<string, number>, now: number) {
  for (const [id, at] of m) if (now - at > VIEWER_TTL_MS) m.delete(id)
}

/** ثبتِ تپش؛ خروجی = شمارِ بیننده‌ی زنده‌ی این کانال */
export function beat(channelId: string, viewerId: string, now = Date.now()): number {
  let m = channels.get(channelId)
  if (!m) { m = new Map(); channels.set(channelId, m) }
  if (m.size >= MAX_PER_CHANNEL) prune(m, now)
  if (m.has(viewerId) || m.size < MAX_PER_CHANNEL) m.set(viewerId, now)
  return countOf(channelId, now)
}

export function leave(channelId: string, viewerId: string): void {
  channels.get(channelId)?.delete(viewerId)
}

export function countOf(channelId: string, now = Date.now()): number {
  const m = channels.get(channelId)
  if (!m) return 0
  prune(m, now)
  if (m.size === 0) channels.delete(channelId)
  return m?.size ?? 0
}

/* ── سقفِ بیننده برای هر IP ──
   شناسه‌ی بیننده را کلاینت می‌سازد؛ بدونِ این، یک اسکریپت با هزار شناسه
   هزار «بیننده» می‌ساخت. یک خانه یا کافی‌نت چند دستگاه دارد، پس سقف ۸ است
   (پشتِ NATِ اپراتورِ همراه هم IPها پخش‌اند، نه یکی). */
export const MAX_VIEWERS_PER_IP = 8
const MAX_IPS = 200_000
const byIp = new Map<string, Map<string, number>>()

export function admit(ip: string, channelId: string, viewerId: string, now = Date.now()): boolean {
  const k = `${channelId}|${ip}`
  let m = byIp.get(k)
  if (!m) {
    if (byIp.size >= MAX_IPS) for (const [key, v] of byIp) { prune(v, now); if (v.size === 0) byIp.delete(key) }
    if (byIp.size >= MAX_IPS) return false
    m = new Map(); byIp.set(k, m)
  }
  prune(m, now)
  if (!m.has(viewerId) && m.size >= MAX_VIEWERS_PER_IP) return false
  m.set(viewerId, now)
  return true
}

/** پایانِ پخش: شمارِ این کانال پاک می‌شود */
export function reset(channelId: string): void { channels.delete(channelId) }

/* ── آمارِ پخشِ جاری (اوج و ثانیه‌-بیننده) ──
   در حافظه جمع و هر دقیقه یک‌بار در live_broadcasts نوشته می‌شود —
   نه با هر تپش (هزار بیننده = هزار نوشتن در دقیقه). */
interface Tally { peak: number; seconds: number; lastTick: number; lastFlush: number }
const tallies = new Map<string, Tally>()
export const FLUSH_EVERY_MS = 60_000

/** به‌روزرسانیِ آمار؛ اگر وقتِ نوشتن است، مقدارِ نوشتنی برمی‌گردد */
export function tally(broadcastId: string, viewers: number, now = Date.now()):
  { peak: number; seconds: number } | null {
  let t = tallies.get(broadcastId)
  if (!t) {
    /* ردیف‌های رهاشده (تپشی که پس از پایانِ پخش رسید) پاک شوند */
    for (const [id, x] of tallies) if (now - x.lastTick > 13 * 3600_000) tallies.delete(id)
    t = { peak: 0, seconds: 0, lastTick: now, lastFlush: now }; tallies.set(broadcastId, t)
  }
  const dt = Math.min(now - t.lastTick, VIEWER_TTL_MS)
  /* هر تپش فقط سهمِ خودش را اضافه نمی‌کند: «بیننده × زمان» از آخرین تیک —
     تیک‌ها هر ۱۰ ثانیه، پس دقت در حدِ ثانیه‌های بیننده کافی است */
  if (dt >= 10_000) { t.seconds += Math.round((viewers * dt) / 1000); t.lastTick = now }
  t.peak = Math.max(t.peak, viewers)
  if (now - t.lastFlush < FLUSH_EVERY_MS) return null
  t.lastFlush = now
  return { peak: t.peak, seconds: t.seconds }
}

/** پایانِ پخش: آخرین آمار و پاک‌کردن */
export function finishTally(broadcastId: string): { peak: number; seconds: number } | null {
  const t = tallies.get(broadcastId)
  tallies.delete(broadcastId)
  return t ? { peak: t.peak, seconds: t.seconds } : null
}
