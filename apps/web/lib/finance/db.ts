import jwt from 'jsonwebtoken'
import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '../supabase-server'

/* دسترسیِ سرور به دیتابیس + احراز هویت + ثبتِ ردِ عملیاتِ مالی.
   همه‌ی نوشتن‌های مالی از توابعِ اتمیکِ Postgres عبور می‌کنند. */

export const sb = () => getSupabaseServer()

/** فراخوانیِ تابعِ اتمیکِ دیتابیس (هر تابع = یک تراکنش) */
export async function rpc<T>(fn: string, args: Record<string, unknown>) {
  const { data, error } = await sb().rpc(fn, args)
  return { data: data as T | null, error: error as { message?: string } | null }
}

export interface Actor { id: string; role: string }

/** کاربرِ درخواست از روی توکنِ JWT (همان مکانیزمِ فعلیِ سایت) */
export function actorFromRequest(req: NextRequest): Actor | null {
  const h = req.headers.get('authorization')
  if (!h?.startsWith('Bearer ')) return null
  try {
    const p = jwt.verify(h.slice(7), process.env.JWT_SECRET!) as { sub: string; role?: string; primaryRole?: string }
    return { id: p.sub, role: p.role || p.primaryRole || 'user' }
  } catch { return null }
}

/** آیا این کاربر مالک/مدیرِ همین باشگاه است؟ (RBAC) */
export async function ownsClub(userId: string, clubId: string): Promise<boolean> {
  const { data } = await sb().from('clubs').select('ownerId').eq('id', clubId).maybeSingle()
  return !!data && (data as { ownerId?: string }).ownerId === userId
}

/** آیا کاربر ادمینِ پلتفرم است؟ */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await sb().from('users').select('primaryRole,secondaryRoles').eq('id', userId).maybeSingle()
  if (!data) return false
  const u = data as { primaryRole?: string; secondaryRoles?: string[] }
  return u.primaryRole === 'admin' || (u.secondaryRoles ?? []).includes('admin')
}

/** ثبتِ ردِ عملیاتِ حساس (بدونِ شکستنِ جریانِ اصلی در صورتِ خطا) */
export async function audit(entry: {
  actorId?: string; actorRole?: string; action: string
  entityType?: string; entityId?: string
  oldValue?: unknown; newValue?: unknown; ip?: string
}) {
  try {
    await sb().from('audit_logs').insert({
      actor_id: entry.actorId ?? null, actor_role: entry.actorRole ?? null,
      action: entry.action, entity_type: entry.entityType ?? null, entity_id: entry.entityId ?? null,
      old_value: entry.oldValue ?? null, new_value: entry.newValue ?? null, ip: entry.ip ?? null,
    })
  } catch { /* ثبتِ ممیزی نباید عملیات را متوقف کند */ }
}

export const clientIp = (req: NextRequest) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
