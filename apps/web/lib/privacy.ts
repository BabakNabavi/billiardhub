import { createHmac } from 'crypto'

/* ─────────────────────────────────────────────────────────────
   پوشاندن کلید مالک در پاسخ‌های عمومی.

   `ownerKey` در سراسر پروژه از `user.phone || user.id` ساخته می‌شود،
   پس برای بیشتر کاربران **همان شماره‌ی موبایل** است. این کلید در
   فهرست‌های عمومی — ویدیوها، استوری‌ها، پخش زنده، کانال‌ها — عیناً
   برمی‌گشت، یعنی هر کسی بدون ورود می‌توانست شماره‌ی موبایل سازنده‌ها
   را جمع کند.

   راه حل بدون شکستن کلاینت: به‌جای حذف کامل، کلید با HMAC به یک
   شناسه‌ی پایدار غیرقابل‌بازگشت تبدیل می‌شود. مقایسه‌ی «مال من است؟»
   هنوز کار می‌کند (چون همان ورودی همان خروجی را می‌دهد) ولی از روی
   خروجی نمی‌شود به شماره رسید.
   ───────────────────────────────────────────────────────────── */

function key(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set — public key hashing unavailable')
  return s
}

/** کلید عمومی پایدار و غیرقابل‌بازگشت از یک ownerKey */
export function publicOwnerKey(ownerKey: unknown): string {
  const raw = String(ownerKey ?? '').trim()
  if (!raw) return ''
  return 'u_' + createHmac('sha256', key()).update(raw).digest('hex').slice(0, 16)
}

/** آیا این کلید عمومی به همین ownerKey تعلق دارد؟ */
export function matchesPublicKey(publicKey: string, ownerKey: unknown): boolean {
  return !!publicKey && publicKey === publicOwnerKey(ownerKey)
}

/* فیلدهایی که هرگز نباید در پاسخ عمومی بیایند */
const SENSITIVE = new Set(['ownerPhone', 'phone', 'nationalId', 'national_id', 'email', 'password'])

/**
 * یک ردیف عمومی را امن می‌کند:
 *   • ownerKey ⇒ هش پایدار
 *   • فیلدهای حساس حذف
 *   • اگر نشست کاربر داده شود، پرچم `mine` اضافه می‌شود
 */
export function redactPublic<T extends Record<string, unknown>>(
  row: T, viewerKey?: string | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (SENSITIVE.has(k)) continue
    out[k] = k === 'ownerKey' ? publicOwnerKey(v) : v
  }
  if (viewerKey !== undefined) {
    out.mine = !!viewerKey && String(row.ownerKey ?? '') === String(viewerKey)
  }
  return out
}

export const redactList = <T extends Record<string, unknown>>(
  rows: T[], viewerKey?: string | null,
) => rows.map(r => redactPublic(r, viewerKey))
