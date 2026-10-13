/* ─────────────────────────────────────────────────────────────
   شمارشِ میزهای یک باشگاه — یک تعریف، همه‌جا.

   ⚠️ تا مهرِ ۱۴۰۵ چهار جا هر کدام خودش می‌شمرد. صفحه‌ی اصلی میزِ VIP
   را داخلِ همان نوع می‌گذاشت (۳ اسنوکر · ۲ پاکت · ۱ هی‌بال) و فهرستِ
   باشگاه‌ها ستون‌های خام را نشان می‌داد و پاکتِ VIP را اصلاً نمی‌شمرد
   (۲ · ۱ · ۱) — یک باشگاه در دو صفحه دو عدد داشت. میزِ VIP هم میزِ همان
   نوع است. ایرهاکی عمداً بیرون است: میزِ بیلیارد نیست.
   ───────────────────────────────────────────────────────────── */

export interface ClubTableFields {
  snookerTables?: unknown
  pocketTables?: unknown
  highballTables?: unknown
  vipSnookerTables?: unknown
  vipPocketTables?: unknown
}

export interface TableSummary {
  snooker: number
  pocket: number
  highball: number
  total: number
}

const count = (v: unknown): number => {
  const x = Number(v)
  return Number.isFinite(x) && x > 0 ? Math.floor(x) : 0
}

export function tableSummary(c: ClubTableFields): TableSummary {
  const snooker = count(c.snookerTables) + count(c.vipSnookerTables)
  const pocket = count(c.pocketTables) + count(c.vipPocketTables)
  const highball = count(c.highballTables)
  return { snooker, pocket, highball, total: snooker + pocket + highball }
}

/** سه نوعی که کارت‌ها نشان می‌دهند، به همین ترتیب */
export const TABLE_KINDS = [
  { key: 'snooker', label: 'اسنوکر' },
  { key: 'pocket', label: 'پاکت' },
  { key: 'highball', label: 'هی‌بال' },
] as const
