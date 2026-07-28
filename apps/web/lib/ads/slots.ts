/* ─────────────────────────────────────────────────────────────
   جایگاه‌های تبلیغاتی — تعریفِ جایگاه‌ها و بنرهای اجاره‌شده.

   نمایشِ بنرها به کلیدِ ad_slots_enabled گره خورده: زیرساخت همیشه
   کار می‌کند، ولی تا خودِ ادمین روشنش نکند هیچ بنری روی سایت ظاهر
   نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import { sb } from '../finance/db'
import { getSetting } from './quota'

export const SLOT_KEYS = ['market_1', 'market_2', 'footer'] as const
export type SlotKey = typeof SLOT_KEYS[number]

export const isSlotKey = (v: unknown): v is SlotKey => (SLOT_KEYS as readonly string[]).includes(String(v))

export interface AdSlot {
  key: SlotKey
  title: string
  description: string | null
  capacity: number
  price: number
  durationDays: number
  isActive: boolean
  sortOrder: number
}

export interface Placement {
  id: string
  slotKey: SlotKey
  advertiser: string
  title: string
  imageUrl: string
  linkUrl: string
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED'
  startsAt: string
  endsAt: string
  impressions: number
  clicks: number
}

type DbSlot = {
  key: SlotKey; title: string; description: string | null
  capacity: number; price: number; duration_days: number
  is_active: boolean; sort_order: number
}
type DbPlacement = {
  id: string; slot_key: SlotKey; advertiser: string; title: string
  image_url: string; link_url: string; status: Placement['status']
  starts_at: string; ends_at: string; impressions: number; clicks: number
}

const toSlot = (r: DbSlot): AdSlot => ({
  key: r.key, title: r.title, description: r.description,
  capacity: r.capacity, price: Number(r.price) || 0, durationDays: r.duration_days,
  isActive: r.is_active, sortOrder: r.sort_order,
})

const toPlacement = (r: DbPlacement): Placement => ({
  id: r.id, slotKey: r.slot_key, advertiser: r.advertiser, title: r.title,
  imageUrl: r.image_url, linkUrl: r.link_url, status: r.status,
  startsAt: r.starts_at, endsAt: r.ends_at,
  impressions: Number(r.impressions) || 0, clicks: Number(r.clicks) || 0,
})

const missing = (m?: string) => /does not exist|schema cache/i.test(m ?? '')

export async function listSlots(): Promise<AdSlot[]> {
  const { data, error } = await sb().from('ad_slots').select('*').order('sort_order', { ascending: true })
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbSlot[] ?? []).map(toSlot)
}

export async function updateSlot(key: string, patch: Partial<Pick<AdSlot, 'capacity' | 'price' | 'durationDays' | 'isActive' | 'title' | 'description'>>): Promise<AdSlot | null> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.capacity !== undefined) row.capacity = Math.max(0, Math.round(patch.capacity))
  if (patch.price !== undefined) row.price = Math.max(0, Math.round(patch.price))
  if (patch.durationDays !== undefined) row.duration_days = Math.max(1, Math.round(patch.durationDays))
  if (patch.isActive !== undefined) row.is_active = patch.isActive
  if (patch.title !== undefined) row.title = patch.title
  if (patch.description !== undefined) row.description = patch.description

  const { data, error } = await sb().from('ad_slots').update(row).eq('key', key).select().single()
  if (error || !data) return null
  return toSlot(data as DbSlot)
}

/** بنرهای زنده‌ی یک جایگاه — با احترام به کلیدِ اصلیِ نمایش */
export async function liveBanners(slotKey?: string): Promise<Record<string, Placement[]>> {
  const enabled = await getSetting<boolean>('ad_slots_enabled', false)
  if (!enabled) return {}

  let q = sb().from('ad_placements').select('*')
    .eq('status', 'ACTIVE')
    .lte('starts_at', new Date().toISOString())
    .gt('ends_at', new Date().toISOString())
    .order('sort_order', { ascending: true })
  if (slotKey) q = q.eq('slot_key', slotKey)

  const { data, error } = await q
  if (error) return {}

  /* ظرفیتِ هر جایگاه رعایت می‌شود، حتی اگر بنرِ بیشتری ثبت شده باشد */
  const slots = await listSlots()
  const cap = new Map(slots.filter(s => s.isActive).map(s => [s.key, s.capacity]))

  const out: Record<string, Placement[]> = {}
  for (const r of (data as DbPlacement[] ?? [])) {
    const limit = cap.get(r.slot_key)
    if (limit === undefined) continue          // جایگاهِ خاموش
    const list = (out[r.slot_key] ??= [])
    if (list.length < limit) list.push(toPlacement(r))
  }
  return out
}

export async function listPlacements(): Promise<Placement[]> {
  const { data, error } = await sb().from('ad_placements').select('*')
    .order('slot_key', { ascending: true }).order('sort_order', { ascending: true })
  if (error) {
    if (missing(error.message)) return []
    throw new Error(error.message)
  }
  return (data as DbPlacement[] ?? []).map(toPlacement)
}

export interface PlacementInput {
  slotKey: SlotKey
  advertiser: string
  title: string
  imageUrl: string
  linkUrl: string
  durationDays: number
  userId?: string
}

export async function createPlacement(p: PlacementInput): Promise<Placement | null> {
  const ends = new Date(Date.now() + Math.max(1, p.durationDays) * 24 * 60 * 60 * 1000)
  const { data, error } = await sb().from('ad_placements').insert({
    slot_key: p.slotKey, advertiser: p.advertiser, title: p.title,
    image_url: p.imageUrl, link_url: p.linkUrl,
    user_id: p.userId ?? null,
    ends_at: ends.toISOString(),
  }).select().single()
  if (error || !data) return null
  return toPlacement(data as DbPlacement)
}

export async function updatePlacement(id: string, patch: Record<string, unknown>): Promise<Placement | null> {
  const { data, error } = await sb().from('ad_placements').update(patch).eq('id', id).select().single()
  if (error || !data) return null
  return toPlacement(data as DbPlacement)
}

export async function deletePlacement(id: string): Promise<boolean> {
  const { error } = await sb().from('ad_placements').delete().eq('id', id)
  return !error
}
