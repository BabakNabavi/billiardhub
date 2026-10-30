import 'server-only'

/* ─────────────────────────────────────────────────────────────
   «فقط مالکِ پلتفرم» برای مسیرهای /api/owner/*.

   هویت از نشستِ امضاشده (actorOf — که خودش وضعیتِ حساب را هم می‌سنجد)
   و مالک‌بودن از دیتابیس (users.is_platform_owner). هیچ پرچمِ کلاینت،
   کوکیِ ویژه، نشانیِ مخفی یا رمزِ جدایی در کار نیست.
   ───────────────────────────────────────────────────────────── */

import type { NextRequest } from 'next/server'
import { actorOf, type Actor } from '../auth/ownership'
import { isPlatformOwner } from './server'
import { audit, clientIp } from '../finance/db'

export async function requireOwner(req: NextRequest): Promise<{ actor: Actor } | { res: Response }> {
  const actor = await actorOf(req)
  if (!actor) return { res: Response.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) }
  if (!(await isPlatformOwner(actor.id))) {
    /* تلاشِ غیرِمالک ثبت می‌شود — این مسیرها هدفِ طبیعیِ ارتقای دسترسی‌اند */
    void audit({
      actorId: actor.id, actorRole: actor.role, action: 'OWNER_ENDPOINT_DENIED',
      entityType: 'endpoint', entityId: req.nextUrl.pathname, ip: clientIp(req),
    })
    return { res: Response.json({ message: 'این بخش فقط برای مالکِ پلتفرم است' }, { status: 403 }) }
  }
  return { actor }
}
