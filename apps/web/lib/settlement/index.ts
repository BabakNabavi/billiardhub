/* ─────────────────────────────────────────────────────────────
   قراردادِ تسویه — نسخه‌ی فعلی «دستی» است (ادمین واریز می‌کند و
   شماره‌ی پیگیری ثبت می‌شود). در آینده می‌توان Split Payment یا
   تسویه‌ی خودکار را بدونِ تغییر در Booking/Ledger اضافه کرد.
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
  /** ایجادِ درخواستِ تسویه از موجودیِ در انتظارِ باشگاه */
  createSettlement(clubId: string, adminId: string): Promise<{ ok: boolean; settlement?: SettlementRecord; message?: string }>
  /** شروعِ پردازش (برای دستی: علامت‌گذاری «در حالِ انجام») */
  processSettlement(id: string): Promise<{ ok: boolean; message?: string }>
  /** نهایی‌سازی با شماره‌ی پیگیریِ واریز */
  completeSettlement(id: string, reference: string): Promise<{ ok: boolean; settlement?: SettlementRecord; message?: string }>
  getSettlementStatus(id: string): Promise<SettlementRecord | null>
}

class ManualSettlementProvider implements SettlementProvider {
  readonly name = 'manual'

  async createSettlement(clubId: string, adminId: string) {
    const { data, error } = await rpc<SettlementRecord>('bh_create_settlement', { p_club_id: clubId, p_admin: adminId })
    if (error) return { ok: false, message: translate(error) }
    return { ok: true, settlement: data as SettlementRecord }
  }

  async processSettlement(id: string) {
    const { error } = await sb().from('settlements')
      .update({ status: 'PROCESSING', processed_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'PENDING')
    return error ? { ok: false, message: error.message } : { ok: true }
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
  if (m.includes('nothing_to_settle')) return 'موجودیِ قابلِ تسویه‌ای وجود ندارد'
  if (m.includes('bank_account_not_verified')) return 'حسابِ بانکیِ باشگاه تأیید نشده است'
  if (m.includes('account_not_found')) return 'حسابِ مالیِ باشگاه یافت نشد'
  if (m.includes('settlement_not_found')) return 'تسویه یافت نشد'
  return m || 'خطای نامشخص'
}

const providers: Record<string, () => SettlementProvider> = {
  manual: () => new ManualSettlementProvider(),
}

export function getSettlementProvider(name?: string): SettlementProvider {
  const key = (name || process.env.SETTLEMENT_PROVIDER || 'manual').toLowerCase()
  return (providers[key] ?? providers.manual!)()
}
