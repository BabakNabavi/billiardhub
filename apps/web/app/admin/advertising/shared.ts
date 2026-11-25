/* ثابت‌ها، نوع‌ها و استایل‌های مشترکِ پنل تبلیغات — از page.tsx جدا شد (۱۰۲۷ خط) */

import type { CSSProperties } from 'react'
import { toFaDigits } from '../../../lib/jalali'

export const INK = '#1C1B17', SEC = '#5B564B', MUT = '#6F6A5C', LINE = '#EAE5DA'
export const GOLD_D = '#8F6531', FELT = '#0E7A38', RED = '#B23B2E'

export const CARD: CSSProperties = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18,
  padding: 'clamp(18px,2.4vw,26px)', marginBottom: 18,
}
export const INPUT: CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 13px',
  fontSize: 13, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
export const LABEL: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, color: SEC, marginBottom: 6 }
export const BTN: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 10, cursor: 'pointer',
  border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
  fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '9px 15px',
}

export type Mode = 'free' | 'manual' | 'paid'
export const MODE_FA: Record<Mode, string> = { free: 'رایگان', manual: 'دستی', paid: 'پولی' }
export const MODE_OPTS = (['free', 'manual', 'paid'] as Mode[]).map(m => ({ value: m, label: MODE_FA[m] }))

export const STATUS_FA: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:           { label: 'پیش‌نویس',        color: MUT,     bg: 'rgba(0,0,0,0.05)' },
  PENDING_PAYMENT: { label: 'در انتظار پرداخت', color: '#B7791F', bg: 'rgba(183,121,31,0.10)' },
  PENDING_REVIEW:  { label: 'در انتظار بررسی',  color: GOLD_D,  bg: 'rgba(199,166,106,0.13)' },
  SCHEDULED:       { label: 'زمان‌بندی‌شده',    color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)' },
  ACTIVE:          { label: 'فعال',            color: FELT,    bg: 'rgba(14,122,56,0.09)' },
  EXPIRED:         { label: 'منقضی',           color: MUT,     bg: 'rgba(0,0,0,0.05)' },
  REJECTED:        { label: 'رد شده',          color: RED,     bg: 'rgba(178,59,46,0.08)' },
  CANCELLED:       { label: 'لغو شده',         color: RED,     bg: 'rgba(178,59,46,0.08)' },
}
export const STATUS_OPTS = Object.entries(STATUS_FA).map(([v, m]) => ({ value: v, label: m.label }))

export type Rotation = 'fixed' | 'weighted' | 'fair' | 'random'
export const ROTATION_FA: Record<Rotation, string> = {
  fair: 'عادلانه', weighted: 'وزنی', random: 'تصادفی', fixed: 'ثابت',
}
export const ROTATION_HINT: Record<Rotation, string> = {
  fair: 'کم‌نمایش‌ترین اول', weighted: 'به‌نسبت وزن', random: 'برخورده', fixed: 'ترتیب ثابت',
}
export const ROTATION_OPTS = (['fair', 'weighted', 'random', 'fixed'] as Rotation[])
  .map(r => ({ value: r, label: ROTATION_FA[r], hint: ROTATION_HINT[r] }))

export interface Placement {
  key: string; title: string; description: string | null; section: string
  isActive: boolean; mode: Mode; contentKind: 'banner' | 'entity' | 'video'
  entityType: string | null; capacity: number; price: number; durationDays: number
  displayCount: number; rotationMode: Rotation; priority: number
  /* فقط جایگاه ویدیویی (پیش‌پخش) — مهاجرت ۰۵۱ */
  skipAfterSec: number | null; maxDurationSec: number | null
}
export interface Campaign {
  id: string; placementKey: string; advertiser: string; title: string
  content: Record<string, unknown>; status: string
  startsAt: string; endsAt: string; impressions: number; clicks: number
  /* تبلیغ ویدیویی — برای بنر همیشه صفر */
  completedViews?: number; skippedViews?: number
}
export interface Plan {
  id: string; name: string; description: string | null; placementKey: string | null
  price: number; durationDays: number; adQuantity: number; creditAmount: number
  isActive: boolean; badge: string | null; sortOrder?: number
}
export interface Stats {
  campaigns: { total: number; active: number; pending: number; expired: number; scheduled: number; draft: number; rejected: number; cancelled: number }
  impressions: number; clicks: number; ctr: number
  revenue: { total: number; orders: number; pendingOrders: number }
  byPlacement: { key: string; title: string; active: number; impressions: number; clicks: number; ctr: number }[]
}
export interface AdRequest {
  id: string; name: string; phone: string; email: string | null; company: string | null
  slot_key: string | null; message: string; status: string; created_at: string
}
/* سفارش خرید — بدون این، ادمین نمی‌داند کدام کمپین اصلا پولی
   پرداخت شده و چه چیزی قابل بازگرداندن است (مهاجرت ۰۵۸) */
export interface AdOrder {
  id: string; campaign_id: string | null; user_id: string
  amount: number; status: string
  paid_at: string | null; refunded_at: string | null
  refund_amount: number | null; refund_reason: string | null
  created_at: string
}

export const fa = (n: number | string) => toFaDigits(typeof n === 'number' ? n.toLocaleString('en-US') : String(n))
export const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')
