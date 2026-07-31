/* ─────────────────────────────────────────────────────────────
   بسته‌های آگهی — ادمین می‌سازد، کاربر می‌خرد.

   قیمت و سهمیه همیشه از رکورد سرور خوانده می‌شوند، نه از کلاینت؛
   و هنگام سفارش یک عکس لحظه‌ای از پلن ذخیره می‌شود تا تغییر بعدی
   قیمت روی سفارش باز اثر نگذارد.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'
import type { Period } from './quota'

export interface AdPlan {
  id: string
  name: string
  description: string | null
  quota: number          // ۰ = نامحدود
  period: Period
  durationDays: number
  price: number          // تومان
  isActive: boolean
  sortOrder: number
  badge: string | null
}

type DbPlan = {
  id: string; name: string; description: string | null
  quota: number; period: Period; duration_days: number; price: number
  is_active: boolean; sort_order: number; badge: string | null
}

export const toPlan = (r: DbPlan): AdPlan => ({
  id: r.id, name: r.name, description: r.description,
  quota: r.quota, period: r.period, durationDays: r.duration_days,
  price: Number(r.price) || 0, isActive: r.is_active, sortOrder: r.sort_order, badge: r.badge,
})

const missing = (m?: string) => /does not exist|schema cache/i.test(m ?? '')

export async function listPlans(onlyActive: boolean): Promise<AdPlan[]> {
  let q = sb().from('ad_plans').select('*').order('sort_order', { ascending: true }).order('price', { ascending: true })
  if (onlyActive) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbPlan[] ?? []).map(toPlan)
}

export async function getPlan(id: string): Promise<AdPlan | null> {
  const { data, error } = await sb().from('ad_plans').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return toPlan(data as DbPlan)
}

export interface PlanInput {
  name: string
  description?: string
  quota: number
  period: Period
  durationDays: number
  price: number
  isActive?: boolean
  sortOrder?: number
  badge?: string
}

const row = (p: Partial<PlanInput>): Record<string, unknown> => {
  const r: Record<string, unknown> = {}
  if (p.name !== undefined) r.name = p.name
  if (p.description !== undefined) r.description = p.description || null
  if (p.quota !== undefined) r.quota = Math.max(0, Math.round(p.quota))
  if (p.period !== undefined) r.period = p.period
  if (p.durationDays !== undefined) r.duration_days = Math.max(1, Math.round(p.durationDays))
  if (p.price !== undefined) r.price = Math.max(0, Math.round(p.price))
  if (p.isActive !== undefined) r.is_active = p.isActive
  if (p.sortOrder !== undefined) r.sort_order = Math.round(p.sortOrder)
  if (p.badge !== undefined) r.badge = p.badge || null
  return r
}

export async function createPlan(p: PlanInput): Promise<AdPlan> {
  const { data, error } = await sb().from('ad_plans').insert(row(p)).select().single()
  if (error) throw new Error(error.message)
  return toPlan(data as DbPlan)
}

export async function updatePlan(id: string, p: Partial<PlanInput>): Promise<AdPlan | null> {
  const patch = row(p)
  if (Object.keys(patch).length === 0) return getPlan(id)
  patch.updated_at = new Date().toISOString()
  const { data, error } = await sb().from('ad_plans').update(patch).eq('id', id).select().single()
  if (error || !data) return null
  return toPlan(data as DbPlan)
}

/** پلن هرگز پاک نمی‌شود — سفارش‌های قبلی به آن ارجاع دارند؛ فقط خاموش می‌شود */
export async function deactivatePlan(id: string): Promise<boolean> {
  const { error } = await sb().from('ad_plans').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
  return !error
}

/* ── سفارش‌ها ────────────────────────────────────────────────── */

export interface PlanOrder {
  id: string
  userId: string
  planId: string
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED'
  createdAt: string
  paidAt: string | null
  snapshot: Record<string, unknown> | null
}

export async function createOrder(userId: string, plan: AdPlan): Promise<{ id: string } | null> {
  const { data, error } = await sb().from('ad_plan_orders').insert({
    user_id: userId, plan_id: plan.id, amount: plan.price,
    provider: 'pending', status: 'PENDING',
    snapshot: { name: plan.name, quota: plan.quota, period: plan.period, durationDays: plan.durationDays, price: plan.price },
  }).select('id').single()
  if (error || !data) return null
  return { id: (data as { id: string }).id }
}

export async function listMyOrders(userId: string): Promise<PlanOrder[]> {
  const { data, error } = await sb().from('ad_plan_orders')
    .select('id,user_id,plan_id,amount,status,created_at,paid_at,snapshot')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
  if (error) return []
  return (data as Record<string, unknown>[] ?? []).map(r => ({
    id: String(r.id), userId: String(r.user_id), planId: String(r.plan_id),
    amount: Number(r.amount) || 0, status: r.status as PlanOrder['status'],
    createdAt: String(r.created_at), paidAt: r.paid_at ? String(r.paid_at) : null,
    snapshot: (r.snapshot as Record<string, unknown>) ?? null,
  }))
}
