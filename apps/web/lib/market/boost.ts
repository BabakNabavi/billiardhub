import { sb } from '@/lib/finance/db'

/* ─────────────────────────────────────────────────────────────
   ارتقای آگهی — منبعِ واحدِ تعرفه و وضعیت.

   قیمت هیچ‌وقت از کلاینت خوانده نمی‌شود. مسیرِ خرید، پنجره‌ی
   انتخاب، و پنلِ ادمین همه از همین‌جا می‌خوانند تا سه عدد متفاوت
   در سه جا نداشته باشیم.
   ───────────────────────────────────────────────────────────── */

export type BoostKind = 'bump' | 'urgent'

export interface BoostPricing {
  enabled: boolean
  bump: { price: number; cooldownHours: number }
  urgent: { price: number; days: number }
}

/* تنظیمِ ناقص یعنی خاموش. یک کلیدِ گم‌شده نباید ناخواسته فروشِ
   چیزی را باز کند که قیمتش معلوم نیست. */
const FALLBACK: BoostPricing = {
  enabled: false,
  bump: { price: 20000, cooldownHours: 24 },
  urgent: { price: 50000, days: 7 },
}

const num = (v: unknown, d: number) => {
  /* `Number('')` صفر می‌دهد نه NaN — همان تله‌ای که یک‌بار در بازار
     قیمت را صفر کرد. */
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim() || NaN)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : d
}

export async function boostPricing(): Promise<BoostPricing> {
  try {
    const { data } = await sb().from('app_settings')
      .select('value').eq('key', 'ad_boost_pricing').maybeSingle()
    const v = (data as { value?: Record<string, unknown> } | null)?.value
    if (!v || typeof v !== 'object') return FALLBACK
    const b = (v.bump ?? {}) as Record<string, unknown>
    const u = (v.urgent ?? {}) as Record<string, unknown>
    return {
      enabled: v.enabled === true,
      bump: {
        price: num(b.price, FALLBACK.bump.price),
        cooldownHours: num(b.cooldownHours, FALLBACK.bump.cooldownHours),
      },
      urgent: {
        price: num(u.price, FALLBACK.urgent.price),
        days: Math.max(1, num(u.days, FALLBACK.urgent.days)),
      },
    }
  } catch { return FALLBACK }
}

export interface BoostState {
  found: boolean
  urgentUntil: string | null
  urgentActive: boolean
  lastBumpAt: string | null
  bumpReadyAt: string | null
  canBump: boolean
}

export async function boostState(productId: string): Promise<BoostState | null> {
  const { data, error } = await sb().rpc('bh_boost_state', { p_product: productId })
  if (error || !data) return null
  return data as BoostState
}

export const KIND_LABEL: Record<BoostKind, string> = {
  bump: 'تازه‌سازی آگهی',
  urgent: 'آگهی فوری',
}
