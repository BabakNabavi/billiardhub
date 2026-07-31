/* تأیید توکن در محیط Edge (middleware).
   فقط jose — که وب‌استاندارد است. اینجا هیچ‌وقت نباید چیزی از
   jsonwebtoken یا ماژول‌های نود import شود. */

import { jwtVerify } from 'jose'

export interface EdgeClaims {
  id: string
  role: string
  sid?: string
  typ?: 'at' | 'rt'
}

interface RawClaims {
  sub?: string
  role?: string
  primaryRole?: string
  sid?: string
  typ?: 'at' | 'rt'
}

let cached: Uint8Array | null = null
const key = () => (cached ??= new TextEncoder().encode(process.env.JWT_SECRET ?? ''))

/** امضا و انقضا را بررسی می‌کند. ابطال نشست اینجا چک نمی‌شود
    (نیازمند دیتابیس است) و در /api/auth/refresh و خود APIها انجام می‌شود. */
export async function verifyEdge(token: string | undefined | null): Promise<EdgeClaims | null> {
  if (!token) return null
  if (!process.env.JWT_SECRET) return null
  try {
    const { payload } = await jwtVerify(token, key())
    const c = payload as RawClaims
    if (!c.sub) return null
    return {
      id: c.sub,
      role: c.role || c.primaryRole || 'user',
      sid: c.sid,
      typ: c.typ,
    }
  } catch { return null }
}
