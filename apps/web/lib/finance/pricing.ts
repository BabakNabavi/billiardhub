/* ─────────────────────────────────────────────────────────────
   قیمت‌گذاری سمت سرور — منبع حقیقت مبلغ.
   عینا همان قواعد UI را بازمی‌سازد تا هیچ‌وقت مبلغ ارسالی از
   مرورگر ملاک نباشد. همه‌ی مبالغ BIGINT به تومان (بدون اعشار).
   ───────────────────────────────────────────────────────────── */

/** `id` و `label` برای قیمت بی‌اثرند ولی پنلِ باشگاه با `id` حذف
 *  می‌کند و `label` را نشان می‌دهد — پس در مسیرِ ذخیره باید بمانند. */
export interface DiscountRule {
  startTime: string; endTime: string; percent: number
  id?: string; label?: string
}
export interface PricedTable {
  id: string
  pricePerHour: number
  morningDiscount?: number | null
  discountRules?: DiscountRule[] | null
}

export interface PriceBreakdown {
  baseAmount: number       // جمع قیمت ساعت‌ها بدون تخفیف
  discountAmount: number   // مجموع تخفیف بازه‌ای
  playerExtra: number      // افزایش تعداد بازیکن
  finalAmount: number      // مبلغ نهایی قابل پرداخت
  perHour: { hour: number; price: number; discountPct: number }[]
}

const HHMM = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/

/**
 * قواعدِ تخفیفِ رسیده از فرم را به شکلِ قابلِ اعتماد درمی‌آورد.
 *
 * ⚠️ این‌ها **مستقیم روی مبلغ** اثر دارند و تا امروز هیچ‌جا اعتبارسنجی
 * نمی‌شدند: `/tables/sync` آرایه را همان‌طور که رسیده بود در
 * `tables.discountRules` می‌نوشت. یک `percent: 150` یعنی
 * `pricePerHour * (1 - 1.5)` — مبلغِ منفی، که در بهترین حالت قیدِ
 * `final_amount >= 0` را می‌شکند و ثبتِ رزرو را با خطای خام
 * می‌خواباند، و در بدترین حالت در دفترِ مالی می‌نشیند.
 *
 * ⚠️ قاعده‌ی نامعتبر **انداخته می‌شود، نه بریده**. بریدن (۱۵۰ ⟵ ۱۰۰)
 * میز را رایگان می‌کرد؛ انداختن یعنی قاعده‌ی بی‌معنا اثری ندارد.
 * `percent: 0` معتبر است و نگه داشته می‌شود، چون وجودِ آرایه‌ی
 * ناخالی خودش تخفیفِ صبحگاهی را غیرفعال می‌کند و انداختنش رفتار را
 * بی‌صدا عوض می‌کرد. ۱۰۰ نامعتبر است: فرم تا ۹۹ می‌دهد، و مبلغِ صفر
 * رزروی می‌سازد که `/api/payments/create` پرداختش را رد می‌کند.
 *
 * ⚠️ `id` و `label` **نگه داشته می‌شوند**. نسخه‌ی اولِ این تابع فقط سه
 * فیلدِ قیمتی را برمی‌داشت و بازبینی گرفتش: پنلِ باشگاه پاسخِ همین
 * مسیر را مستقیم در state می‌گذارد و قاعده را با
 * `prev.filter(d => d.id !== id)` حذف می‌کند — با `id`ِ تهی برای همه،
 * حذفِ یک قاعده **همه‌ی قواعدِ آن میز** را پاک می‌کرد و ذخیره‌ی بعدی
 * ماندگارش می‌کرد.
 */
export function sanitizeDiscountRules(input: unknown): DiscountRule[] | null {
  if (!Array.isArray(input)) return null
  const out: DiscountRule[] = []
  for (const r of input) {
    if (!r || typeof r !== 'object') continue
    const { startTime, endTime, percent, id, label } = r as Record<string, unknown>
    if (typeof startTime !== 'string' || !HHMM.test(startTime)) continue
    if (typeof endTime !== 'string' || !HHMM.test(endTime)) continue
    const p = Number(percent)
    if (!Number.isFinite(p) || p < 0 || p >= 100) continue
    out.push({
      startTime, endTime, percent: Math.round(p),
      id: typeof id === 'string' && id ? id.slice(0, 40) : `d-${out.length}`,
      label: typeof label === 'string' ? label.slice(0, 60) : `${startTime}–${endTime}`,
    })
    /* سقفِ تعداد — فرم حداکثر چند قاعده می‌دهد، ولی درخواستِ دست‌ساز نه. */
    if (out.length >= 24) break
  }
  return out.length > 0 ? out : null
}

/** درصد تخفیف یک ساعت: قواعد بازه‌ای، وگرنه تخفیف صبحگاهی */
export function slotDiscountPct(hour: number, table: PricedTable): number {
  const rules = table.discountRules
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      const sh = parseInt(String(rule.startTime).split(':')[0] ?? '0', 10)
      /* ⚠️ «۰۰:۰۰» یعنی پایانِ روز، نه ساعتِ صفر. بدونِ این نگاشت،
         `eh` صفر می‌شد و شرطِ `hour >= sh && hour < 0` هرگز درست
         نمی‌شد — یعنی قاعده‌ای که باشگاه‌دار «۲۰:۰۰ تا ۰۰:۰۰» گذاشته
         **هیچ ساعتی را پوشش نمی‌داد**. و تنها راهِ پوشاندنِ ساعتِ ۲۳
         هم همین است، چون انتخابگرِ ساعت بالاتر از ۲۳:۴۵ نمی‌دهد و
         `hour < eh` با `eh = 23` ساعتِ ۲۳ را بیرون می‌گذارد.
         تا دیروز دیده نمی‌شد چون ساعتِ ۲۳ اصلا رزرو نمی‌شد. */
      const ehRaw = parseInt(String(rule.endTime).split(':')[0] ?? '24', 10)
      const eh = ehRaw === 0 ? 24 : ehRaw
      if (hour >= sh && hour < eh && rule.percent > 0) return rule.percent
    }
    return 0
  }
  if (hour < 12 && (table.morningDiscount ?? 0) > 0) return table.morningDiscount ?? 0
  return 0
}

/** قیمت یک ساعت پس از تخفیف (گرد‌شده به تومان) */
export function slotPrice(hour: number, table: PricedTable): number {
  const disc = slotDiscountPct(hour, table)
  const base = Math.round(table.pricePerHour)
  return disc > 0 ? Math.round(base * (1 - disc / 100)) : base
}

/* ── هزینه‌ی بازیکن اضافه — تنظیم هر میز ────────────────────────────

   `from` = «تا این تعداد نفر رایگان است؛ از نفر بعدی هزینه اضافه
   می‌شود». یعنی عددی که صاحب باشگاه وارد می‌کند، خودش هنوز شامل
   افزایش نیست.

   با پیش‌فرض (from=۲، percent=۱۵):
     ۱ نفر ⇒ بدون افزایش
     ۲ نفر ⇒ بدون افزایش   ← خود عدد واردشده
     ۳ نفر ⇒ +۱۵٪
     ۴ نفر ⇒ +۳۰٪ */
export interface PlayerSurcharge { enabled: boolean; percent: number; from: number }

export const DEFAULT_SURCHARGE: PlayerSurcharge = { enabled: true, percent: 15, from: 2 }

/** خواندن امن تنظیمات از رکورد باشگاه (اگر ستون‌ها هنوز نباشند، پیش‌فرض) */
/* تنظیم هزینه‌ی بازیکن اضافه.

   از فاز ۹ این تنظیم روی **میز** است، نه باشگاه: میز VIP اسنوکر با
   ایرهاکی یک قاعده ندارند. ستون‌های میز NULL-پذیرند و NULL یعنی «از
   باشگاه ارث ببر»، تا داده‌ی موجود رفتارش عوض نشود. */
export function surchargeOf(
  table: Record<string, unknown> | null | undefined,
  club?: Record<string, unknown> | null | undefined,
): PlayerSurcharge {
  /* اگر فقط یک آرگومان بیاید، همان منبع تنظیمات است (سازگاری عقب‌رو) */
  const src = club === undefined ? { own: table, fallback: null } : { own: table, fallback: club }

  const pick = <T,>(key: string): T | undefined => {
    const a = src.own?.[key]
    if (a !== undefined && a !== null) return a as T
    const b = src.fallback?.[key]
    return b === undefined || b === null ? undefined : (b as T)
  }

  const enabledRaw = pick<boolean>('playerSurchargeEnabled')
  const pct = Number(pick<number>('playerSurchargePercent'))
  const from = Number(pick<number>('playerSurchargeFrom'))

  return {
    enabled: enabledRaw === undefined ? DEFAULT_SURCHARGE.enabled : !!enabledRaw,
    percent: Number.isFinite(pct) && pct >= 0 && pct <= 100 ? Math.round(pct) : DEFAULT_SURCHARGE.percent,
    from: Number.isFinite(from) && from >= 1 && from <= 12 ? Math.round(from) : DEFAULT_SURCHARGE.from,
  }
}

/** تعداد نفراتی که مشمول افزایش می‌شوند
 *
 *  پیش‌تر `- (s.from - 1)` بود، یعنی خود عددی که صاحب باشگاه وارد
 *  کرده هم هزینه می‌گرفت: با from=۲، دو نفر ۱۵٪ گران‌تر می‌شد. حالا
 *  از نفر *بعد* از آن عدد شروع می‌شود. */
export function extraPlayers(playerCount: number, s: PlayerSurcharge): number {
  if (!s.enabled || s.percent <= 0) return 0
  return Math.max(0, Math.round(playerCount) - s.from)
}

/** ضریب نهایی قیمت بر اساس تعداد بازیکن */
export function playerMultiplier(playerCount: number, s: PlayerSurcharge): number {
  return 1 + extraPlayers(playerCount, s) * (s.percent / 100)
}

/** محاسبه‌ی کامل مبلغ رزرو — ملاک نهایی پرداخت */
export function priceBooking(
  hours: number[], table: PricedTable, playerCount = 1, surcharge: PlayerSurcharge = DEFAULT_SURCHARGE,
): PriceBreakdown {
  const perHour = hours.map(h => ({ hour: h, price: slotPrice(h, table), discountPct: slotDiscountPct(h, table) }))
  const baseAmount = hours.length * Math.round(table.pricePerHour)
  const afterDiscount = perHour.reduce((s, x) => s + x.price, 0)
  const discountAmount = baseAmount - afterDiscount
  const finalAmount = Math.round(afterDiscount * playerMultiplier(playerCount, surcharge))
  return { baseAmount, discountAmount, playerExtra: finalAmount - afterDiscount, finalAmount, perHour }
}

/** ساعت‌های بین شروع و پایان (پایان باز است): 18..20 ⇒ [18,19]
 *
 *  ⚠️ **برای بازه‌ی واقعیِ رزرو از این استفاده نکن** — از
 *  `hoursOfRange` استفاده کن. این تابع دو *عددِ* ساعت می‌گیرد و اگر
 *  پایان از نیمه‌شب رد شده باشد (۲۳ ⟵ ۰) خروجیِ خالی می‌دهد بی‌آنکه
 *  خطایی بدهد. همان اتفاق افتاد: آخرین اسلاتِ روز اصلا رزرو نمی‌شد.
 */
export function hoursBetween(startHour: number, endHour: number): number[] {
  const out: number[] = []
  for (let h = startHour; h < endHour; h++) out.push(h)
  return out
}

export type RangeHours =
  | { ok: true; hours: number[] }
  /** بازه‌ی بی‌معنا: پایان پیش از شروع، یا کمتر از یک ساعت */
  | { ok: false; reason: 'invalid' }
  /** از نیمه‌شب رد می‌شود — یک رزرو به یک تاریخ تعلق دارد */
  | { ok: false; reason: 'overnight' }

/**
 * ساعت‌های یک بازه‌ی رزرو — از **مدت**، نه از ساعتِ پایان.
 *
 * ⚠️ دلیلِ وجودش: کلاینت پایان را `آخرین + ۱` می‌سازد، پس برای اسلاتِ
 * ۲۳ رشته‌ی `T24:00:00Z` درست می‌شود و جاوااسکریپت آن را به **روزِ
 * بعد ۰۰:۰۰** می‌برد. آن‌وقت `endHour` صفر است و هر مقایسه‌ای با
 * `startHour` وارونه می‌شود. مدت این مشکل را ندارد: یک ساعت، یک ساعت
 * است، چه از نیمه‌شب رد بشود چه نه.
 *
 * ⚠️ ساعت‌ها UTC خوانده می‌شوند چون قراردادِ پروژه این است که فیلدهای
 * UTC ساعتِ دیواریِ تهران را حمل می‌کنند (کلاینت `…T18:00:00Z` را
 * برای «۱۸ به وقت تهران» می‌سازد).
 */
export function hoursOfRange(start: Date, end: Date): RangeHours {
  const ms = end.getTime() - start.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return { ok: false, reason: 'invalid' }
  /* ⚠️ `Math.round` نبود: نیم‌ساعت را به یک ساعت گرد می‌کرد و
     ۰۸:۰۰ تا ۱۰:۳۰ را سه ساعت می‌گرفت. کلاینت همیشه ساعتِ کامل
     می‌فرستد، ولی با گِردکردن این اصلاح دیگر «دقیقا افزودنی» نبود —
     بازه‌ای را می‌پذیرفت که نسخه‌ی قبلی رد می‌کرد. */
  if (ms % 3_600_000 !== 0) return { ok: false, reason: 'invalid' }
  /* شروع هم باید سرِ ساعت باشد، نه فقط مدت تمام‌ساعت: ۱۸:۳۰ تا ۱۹:۳۰
     وگرنه «ساعتِ ۱۸» حساب می‌شد. */
  if (start.getUTCMinutes() || start.getUTCSeconds() || start.getUTCMilliseconds()) {
    return { ok: false, reason: 'invalid' }
  }
  const count = ms / 3_600_000
  if (count < 1) return { ok: false, reason: 'invalid' }
  const first = start.getUTCHours()
  /* قیدِ دیتابیس هم همین را می‌گوید: `hour between 0 and 23`. */
  if (first + count - 1 > 23) return { ok: false, reason: 'overnight' }
  return { ok: true, hours: Array.from({ length: count }, (_, i) => first + i) }
}

/** شناسه‌ی خواناى رزرو */
export function bookingReference(): string {
  return `BH-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`
}
