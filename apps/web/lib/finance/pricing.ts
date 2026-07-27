/* ─────────────────────────────────────────────────────────────
   قیمت‌گذاریِ سمتِ سرور — منبعِ حقیقتِ مبلغ.
   عیناً همان قواعدِ UI را بازمی‌سازد تا هیچ‌وقت مبلغِ ارسالی از
   مرورگر ملاک نباشد. همه‌ی مبالغ BIGINT به تومان (بدونِ اعشار).
   ───────────────────────────────────────────────────────────── */

export interface DiscountRule { startTime: string; endTime: string; percent: number }
export interface PricedTable {
  id: string
  pricePerHour: number
  morningDiscount?: number | null
  discountRules?: DiscountRule[] | null
}

export interface PriceBreakdown {
  baseAmount: number       // جمعِ قیمتِ ساعت‌ها بدونِ تخفیف
  discountAmount: number   // مجموعِ تخفیفِ بازه‌ای
  playerExtra: number      // افزایشِ تعدادِ بازیکن
  finalAmount: number      // مبلغِ نهاییِ قابلِ پرداخت
  perHour: { hour: number; price: number; discountPct: number }[]
}

/** درصدِ تخفیفِ یک ساعت: قواعدِ بازه‌ای، وگرنه تخفیفِ صبحگاهی */
export function slotDiscountPct(hour: number, table: PricedTable): number {
  const rules = table.discountRules
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      const sh = parseInt(String(rule.startTime).split(':')[0] ?? '0', 10)
      const eh = parseInt(String(rule.endTime).split(':')[0] ?? '24', 10)
      if (hour >= sh && hour < eh && rule.percent > 0) return rule.percent
    }
    return 0
  }
  if (hour < 12 && (table.morningDiscount ?? 0) > 0) return table.morningDiscount ?? 0
  return 0
}

/** قیمتِ یک ساعت پس از تخفیف (گرد‌شده به تومان) */
export function slotPrice(hour: number, table: PricedTable): number {
  const disc = slotDiscountPct(hour, table)
  const base = Math.round(table.pricePerHour)
  return disc > 0 ? Math.round(base * (1 - disc / 100)) : base
}

/** محاسبه‌ی کاملِ مبلغِ رزرو — ملاکِ نهاییِ پرداخت */
export function priceBooking(hours: number[], table: PricedTable, playerCount = 2): PriceBreakdown {
  const perHour = hours.map(h => ({ hour: h, price: slotPrice(h, table), discountPct: slotDiscountPct(h, table) }))
  const baseAmount = hours.length * Math.round(table.pricePerHour)
  const afterDiscount = perHour.reduce((s, x) => s + x.price, 0)
  const discountAmount = baseAmount - afterDiscount
  /* هر بازیکنِ بیش از ۲ نفر ⇒ ۱۵٪ افزایش (همانندِ UI) */
  const mult = 1 + Math.max(0, playerCount - 2) * 0.15
  const finalAmount = Math.round(afterDiscount * mult)
  return { baseAmount, discountAmount, playerExtra: finalAmount - afterDiscount, finalAmount, perHour }
}

/** ساعت‌های بینِ شروع و پایان (پایان باز است): 18..20 ⇒ [18,19] */
export function hoursBetween(startHour: number, endHour: number): number[] {
  const out: number[] = []
  for (let h = startHour; h < endHour; h++) out.push(h)
  return out
}

/** شناسه‌ی خواناى رزرو */
export function bookingReference(): string {
  return `BH-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`
}
