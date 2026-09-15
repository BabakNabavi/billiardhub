import 'server-only'
import { sb } from './db'
import type { FeeRate } from './policy'
import { PLATFORM_FEE_PERCENT } from './policy'

/* ─────────────────────────────────────────────────────────────
   نرخِ زنده‌ی کمیسیون — همان چیزی که واقعا کسر می‌شود.

   منبع `commission_rules` است (همان جدولی که `bh_commission_for_ctx`
   می‌خواند)، پس متنِ حقوقیِ صفحه‌ی قوانین و رفتارِ واقعیِ کد از یک
   جا می‌آیند. پیش‌تر متن از یک ثابتِ هاردکد ساخته می‌شد و با اولین
   تغییرِ نرخ از واقعیت دور می‌افتاد.

   فقط قانونِ **سراسری** خوانده می‌شود: نرخِ اختصاصیِ یک باشگاه بندِ
   عمومیِ قوانین نیست و نباید در متنِ منتشرشده بیاید.
   ───────────────────────────────────────────────────────────── */

const FALLBACK: FeeRate = { type: 'PERCENTAGE', value: PLATFORM_FEE_PERCENT }

export interface GlobalRates { reservation: FeeRate; tournament: FeeRate }

export async function globalCommissionRates(): Promise<GlobalRates> {
  try {
    const { data, error } = await sb().from('commission_rules')
      .select('context,type,value')
      .eq('scope', 'GLOBAL').eq('is_active', true)
    if (error || !data) return { reservation: FALLBACK, tournament: FALLBACK }

    const pick = (ctx: string): FeeRate => {
      const r = (data as { context?: string; type?: string; value?: number }[])
        .find(x => x.context === ctx)
      if (!r || !Number.isFinite(Number(r.value))) return FALLBACK
      return {
        type: r.type === 'FIXED_AMOUNT' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
        /* `value` در دیتابیس `numeric(10,2)` است؛ نرخِ ۵ و ۵٫۵ هر دو
           ممکن‌اند، پس گردکردن به عدد صحیح غلط می‌شد. */
        value: Number(r.value),
      }
    }
    return { reservation: pick('RESERVATION'), tournament: pick('TOURNAMENT') }
  } catch {
    /* صفحه‌ی قوانین نباید به‌خاطرِ دیتابیس سفید شود */
    return { reservation: FALLBACK, tournament: FALLBACK }
  }
}
