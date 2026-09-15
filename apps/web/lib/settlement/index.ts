/* ─────────────────────────────────────────────────────────────
   قرارداد تسویه — نسخه‌ی فعلی «دستی» است (ادمین واریز می‌کند و
   شماره‌ی پیگیری ثبت می‌شود). در آینده می‌توان Split Payment یا
   تسویه‌ی خودکار را بدون تغییر در Booking/Ledger اضافه کرد.
   ───────────────────────────────────────────────────────────── */
import { rpc, sb } from '../finance/db'

export interface SettlementRecord {
  id: string; club_id: string; amount: number; iban: string | null
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  reference_number: string | null; requested_at: string; completed_at: string | null
  failure_reason: string | null; bank_account_snapshot: unknown
}

export interface SettlementProvider {
  readonly name: string
  /** ایجاد درخواست تسویه از موجودی قابلِ تسویه‌ی باشگاه.
   *  `amount` نیامده ⇒ کلِ موجودی. `idem` کلیدِ ضدِتکرار است. */
  createSettlement(clubId: string, adminId: string, amount?: number | null, idem?: string | null): Promise<{ ok: boolean; settlement?: SettlementRecord; message?: string }>
  /** شروع پردازش (برای دستی: علامت‌گذاری «در حال انجام») */
  processSettlement(id: string): Promise<{ ok: boolean; message?: string }>
  /** نهایی‌سازی با شماره‌ی پیگیری واریز */
  completeSettlement(id: string, reference: string): Promise<{ ok: boolean; settlement?: SettlementRecord; message?: string }>
  getSettlementStatus(id: string): Promise<SettlementRecord | null>
}

class ManualSettlementProvider implements SettlementProvider {
  readonly name = 'manual'

  async createSettlement(clubId: string, adminId: string, amount?: number | null, idem?: string | null) {
    const { data, error } = await rpc<SettlementRecord>('bh_create_settlement', {
      p_club_id: clubId, p_admin: adminId,
      p_amount: amount == null ? null : Math.round(amount),
      p_idem: idem ?? null,
    })
    if (error) return { ok: false, message: translate(error) }
    return { ok: true, settlement: data as SettlementRecord }
  }

  /* ⚠️ `APPROVED` هم باید بپذیرد: از ۰۴۱ به بعد تسویه با همین وضعیت
     ساخته می‌شود، نه `PENDING`. شرطِ قبلی (`.eq('status','PENDING')`) هیچ
     ردیفی را نمی‌گرفت، PostgREST هم برای صفر ردیف خطا نمی‌دهد — پس این
     تابع `ok` برمی‌گرداند و یک لاگِ ممیزیِ «در حال انجام» می‌نوشت که
     واقعیت نداشت.

     تعدادِ ردیفِ تغییریافته هم برمی‌گردد تا «هیچ کاری نشد» دیگر
     «موفق» گزارش نشود. */
  async processSettlement(id: string) {
    const { data, error } = await sb().from('settlements')
      .update({ status: 'PROCESSING', processed_at: new Date().toISOString() })
      .eq('id', id).in('status', ['PENDING', 'APPROVED'])
      .select('id')
    if (error) return { ok: false, message: error.message }
    if (!data || (data as unknown[]).length === 0) {
      return { ok: false, message: 'این تسویه در وضعیتی نیست که بتوان پردازشش کرد' }
    }
    return { ok: true }
  }

  async completeSettlement(id: string, reference: string) {
    const { data, error } = await rpc<SettlementRecord>('bh_complete_settlement', { p_id: id, p_reference: reference })
    if (error) return { ok: false, message: translate(error) }
    return { ok: true, settlement: data as SettlementRecord }
  }

  async getSettlementStatus(id: string) {
    const { data } = await sb().from('settlements').select('*').eq('id', id).maybeSingle()
    return (data as SettlementRecord) ?? null
  }
}

function translate(e: { message?: string }): string {
  const m = e?.message || ''
  if (m.includes('nothing_to_settle')) return 'موجودی قابل تسویه‌ای وجود ندارد'
  if (m.includes('bank_account_not_verified')) return 'حساب بانکی باشگاه تأیید نشده است'
  if (m.includes('account_not_found')) return 'حساب مالی باشگاه یافت نشد'
  if (m.includes('settlement_not_found')) return 'تسویه یافت نشد'
  if (m.includes('amount_exceeds_payable')) return 'مبلغ از بدهیِ قابلِ پرداخت بیشتر است'
  /* کلیدِ ضدِتکرار خورده ⇒ همین دستور قبلا ساخته شده (دابل‌کلیک) */
  if (/duplicate key|settlements_idem_uidx/i.test(m)) return 'این دستور پرداخت پیش‌تر ساخته شده است'
  return m || 'خطای نامشخص'
}

const providers: Record<string, () => SettlementProvider> = {
  manual: () => new ManualSettlementProvider(),
}

export function getSettlementProvider(name?: string): SettlementProvider {
  const key = (name || process.env.SETTLEMENT_PROVIDER || 'manual').toLowerCase()
  return (providers[key] ?? providers.manual!)()
}
