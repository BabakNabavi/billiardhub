/* ─────────────────────────────────────────────────────────────
   مالکیت سرورساید (فاز ۷A).

   یک اصل: هویت و مالکیت **هرگز** از بدنه یا کوئری درخواست خوانده
   نمی‌شود. هر تابع این فایل از نشست امضاشده شروع می‌کند و خودش از
   دیتابیس می‌پرسد که این کاربر واقعاً مالک آن موجودیت هست یا نه.

   پیش‌تر مسیرهای دایرکت/استوری/مدیا هویت را از کلاینت می‌گرفتند و
   همین باعث می‌شد هر کسی به‌جای هر کسی پیام بفرستد یا استوری باشگاه
   دیگری را پاک کند.
   ───────────────────────────────────────────────────────────── */

import type { NextRequest } from 'next/server'
import { sessionFromRequest } from './session'
import { getSupabaseServer } from '../supabase-server'

const sb = () => getSupabaseServer()

export interface Actor {
  id: string
  role: string
  /** کلید دایرکت — همان چیزی که کلاینت می‌ساخت (شماره‌ی موبایل، وگرنه id) */
  dmKey: string
  isAdmin: boolean
}

/**
 * بازیگر درخواست از روی نشست امضاشده.
 *
 * نقش ادمین از دیتابیس خوانده می‌شود نه از ادعای داخل توکن، چون
 * `primaryRole` را خود کاربر می‌تواند از PATCH /api/users/me عوض کند.
 */
export async function actorOf(req: NextRequest): Promise<Actor | null> {
  const s = sessionFromRequest(req)
  if (!s) return null

  const { data } = await sb().from('users')
    .select('id, phone, "primaryRole"')
    .eq('id', s.id)
    .maybeSingle()

  const row = (data ?? null) as { id: string; phone: string | null; primaryRole: string | null } | null
  if (!row) return null

  return {
    id: row.id,
    role: row.primaryRole ?? 'user',
    /* کلاینت هم دقیقاً همین ترتیب را می‌ساخت: phone || id */
    dmKey: (row.phone || row.id || '').trim(),
    isAdmin: row.primaryRole === 'admin',
  }
}

/** آیا این کاربر مالک همین باشگاه است؟ (ادمین همیشه مجاز) */
export async function ownsClub(actor: Actor, clubId: string): Promise<boolean> {
  if (actor.isAdmin) return true
  if (!clubId) return false
  const { data, error } = await sb().from('clubs')
    .select('"ownerId"').eq('id', clubId).maybeSingle()
  if (error || !data) return false
  return String((data as { ownerId?: string }).ownerId ?? '') === actor.id
}

/**
 * آیا این کاربر مالک همین فروشگاه است؟
 *
 * شناسه‌ی فروشگاه در مسیرها گاهی `slug` است و گاهی شناسه‌ی ردیف؛ هر دو
 * را می‌سنجیم تا رفتار فعلی فرانت نشکند.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function ownsSeller(actor: Actor, sellerId: string): Promise<boolean> {
  if (actor.isAdmin) return true
  if (!sellerId) return false

  /* شناسه فقط وقتی با ستون uuid مقایسه می‌شود که واقعاً uuid باشد؛
     وگرنه پستگرس با 22P02 کل کوئری را می‌شکند و مالک واقعی هم رد
     می‌شود (همان تله‌ای که در resolve تبلیغات هم دیده بودیم). */
  let q = sb().from('profiles').select('id, slug, owner_id').eq('kind', 'seller')
  q = UUID.test(sellerId) ? q.or(`slug.eq.${sellerId},id.eq.${sellerId}`) : q.eq('slug', sellerId)

  const { data, error } = await q.maybeSingle()
  if (error || !data) return false
  return String((data as { owner_id?: string }).owner_id ?? '') === actor.id
}

/** ۴۰۱ برای «وارد نشده‌ای» و ۴۰۳ برای «مال تو نیست» — دو چیز متفاوت */
export const UNAUTHENTICATED = { message: 'ابتدا وارد شوید' }
export const FORBIDDEN = { message: 'دسترسی به این بخش مجاز نیست' }
