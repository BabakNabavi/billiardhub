/* ─────────────────────────────────────────────────────────────
   نشستِ کاربر — تنها منبعِ ساخت، خواندن و تأییدِ توکن.

   مرحله‌ی الف: فقط متمرکزسازی. رفتار دقیقاً همان چیزی است که بود
   (JWT هفت‌روزه در هدر Authorization). کوکی، refresh و middleware
   در مرحله‌های بعد روی همین فایل سوار می‌شوند.

   دو پیاده‌سازیِ تأیید داریم چون دو محیط داریم:
     • verifyToken      — نودی (jsonwebtoken)، برای route handlerها
     • verifyTokenEdge  — وب‌استاندارد (jose)، برای middleware که روی
       Edge اجرا می‌شود و APIهای crypto نود را ندارد.
   هر دو HS256 با همان JWT_SECRET، پس توکن‌ها بینشان مشترک‌اند.
   ───────────────────────────────────────────────────────────── */

import jwt from 'jsonwebtoken'
import { jwtVerify } from 'jose'

/* نام کوکی‌ها و عمرها از فایلِ بدونِ وابستگی می‌آیند تا Edge هم
   بتواند بخواندشان بدونِ اینکه jsonwebtoken وارد باندلش شود. */
export {
  ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, CSRF_HEADER,
  ACCESS_TTL_SEC, REFRESH_TTL_SEC, LEGACY_TTL_SEC,
} from './constants'
import { ACCESS_COOKIE, ACCESS_TTL_SEC, REFRESH_TTL_SEC } from './constants'

export interface SessionUser {
  id: string
  role: string
  phone?: string
  /* شناسه‌ی نشست — فقط روی توکن‌های نسلِ جدید */
  sid?: string
}

interface Claims {
  sub: string
  role?: string
  primaryRole?: string
  phone?: string
  sid?: string
  typ?: 'at' | 'rt'
}

const secret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set')
  return s
}

const encoded = () => new TextEncoder().encode(secret())

const toUser = (c: Claims): SessionUser => ({
  id: c.sub,
  role: c.role || c.primaryRole || 'user',
  phone: c.phone,
  sid: c.sid,
})

/* ── ساخت ─────────────────────────────────────────────────────── */

/** توکنِ دسترسیِ کوتاه‌عمر */
export function signAccessToken(u: { id: string; role: string; phone?: string; sid?: string }): string {
  return jwt.sign(
    { sub: u.id, role: u.role, phone: u.phone, sid: u.sid, typ: 'at' },
    secret(),
    { expiresIn: ACCESS_TTL_SEC },
  )
}

/** توکنِ تازه‌سازی — فقط شناسه‌ی کاربر و نشست، بدونِ نقش */
export function signRefreshToken(u: { id: string; sid: string }): string {
  return jwt.sign({ sub: u.id, sid: u.sid, typ: 'rt' }, secret(), { expiresIn: REFRESH_TTL_SEC })
}

/* ── تأیید ────────────────────────────────────────────────────── */

/** تأییدِ توکن در محیطِ نود (route handlerها). خطا ⇒ null */
export function verifyToken(token: string, expect?: 'at' | 'rt'): SessionUser | null {
  try {
    const c = jwt.verify(token, secret()) as Claims
    if (!c?.sub) return null
    /* توکن‌های نسلِ قدیم typ ندارند و در مرحله‌ی گذار پذیرفته می‌شوند */
    if (expect && c.typ && c.typ !== expect) return null
    if (expect === 'rt' && !c.typ) return null   // refresh حتماً باید نسلِ جدید باشد
    return toUser(c)
  } catch { return null }
}

/** تأییدِ توکن در محیطِ Edge (middleware). خطا ⇒ null */
export async function verifyTokenEdge(token: string, expect?: 'at' | 'rt'): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encoded())
    const c = payload as unknown as Claims
    if (!c?.sub) return null
    if (expect && c.typ && c.typ !== expect) return null
    if (expect === 'rt' && !c.typ) return null
    return toUser(c)
  } catch { return null }
}

/* ── خواندن از درخواست ────────────────────────────────────────── */

/** توکنِ خام از کوکی یا هدرِ Authorization (به‌ترتیبِ اولویت) */
export function readToken(req: { headers: Headers; cookies?: { get(n: string): { value: string } | undefined } }): string | null {
  const fromCookie = req.cookies?.get(ACCESS_COOKIE)?.value
  if (fromCookie) return fromCookie
  const h = req.headers.get('authorization')
  if (h?.startsWith('Bearer ')) return h.slice(7)
  return null
}

/** کاربرِ درخواست — کوکی یا هدر. در مرحله‌ی گذار هر دو پذیرفته‌اند. */
export function sessionFromRequest(
  req: { headers: Headers; cookies?: { get(n: string): { value: string } | undefined } },
): SessionUser | null {
  const t = readToken(req)
  return t ? verifyToken(t) : null
}
