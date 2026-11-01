import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

/* ─────────────────────────────────────────────────────────────
   رمزِ کلیدِ استریم در دیتابیس (AES-256-GCM).

   کلیدِ استریم یعنی «هرکس دارد، به‌جای باشگاه پخش می‌کند». پس متنِ
   خامش در دیتابیس نمی‌نشیند. کلیدِ رمز از JWT_SECRET مشتق می‌شود (HKDF با
   برچسبِ جدا) — همان رازی که فقط روی سرور است، پس نشتِ دیتابیس به‌تنهایی
   کلید را لو نمی‌دهد.

   اگر روزی JWT_SECRET عوض شود، `open` null می‌دهد و پنلِ باشگاه می‌گوید
   «کلید را دوباره بسازید» — نه خطای مبهم.
   ───────────────────────────────────────────────────────────── */

const V = 'v1'

function key(): Buffer {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET تنظیم نشده — رمز کلید استریم ممکن نیست')
  return Buffer.from(hkdfSync('sha256', s, 'billiardhub', 'live-stream-key/v1', 32))
}

export function seal(plain: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [V, iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.')
}

export function open(sealed: string | null | undefined): string | null {
  const parts = String(sealed ?? '').split('.')
  if (parts.length !== 4 || parts[0] !== V) return null
  try {
    const iv = Buffer.from(parts[1]!, 'base64url'), tag = Buffer.from(parts[2]!, 'base64url')
    /* برچسبِ کوتاه‌شده‌ی GCM پذیرفته نشود (DEP0182) */
    if (iv.length !== 12 || tag.length !== 16) return null
    const d = createDecipheriv('aes-256-gcm', key(), iv, { authTagLength: 16 })
    d.setAuthTag(tag)
    return Buffer.concat([d.update(Buffer.from(parts[3]!, 'base64url')), d.final()]).toString('utf8')
  } catch {
    /* راز عوض شده یا داده دست‌کاری شده — هر دو «کلید نامعتبر» */
    return null
  }
}

/** نمایشِ امن: فقط چهار نویسه‌ی آخر */
export const maskKey = (k: string) => (k.length <= 4 ? '••••' : `••••••••${k.slice(-4)}`)
