/* ─────────────────────────────────────────────────────────────
   هدرهای CORS — یک منبعِ واحد.

   چرا «*» حذف شد: مرورگر هرگز پاسخی با
   `Access-Control-Allow-Origin: *` را همراهِ کوکی نمی‌پذیرد. چون
   احرازِ هویت دارد کوکی‌محور می‌شود، «*» باید جای خودش را به
   originِ مشخص بدهد وگرنه در مرحله‌ی ب همه‌چیز می‌شکند.

   اپ same-origin است (مرورگر /api/… را روی همان دامنه صدا می‌زند)
   و برای درخواستِ same-origin اصلاً CORS لازم نیست؛ این هدرها فقط
   برای سازگاری با فراخوان‌های احتمالیِ بیرونی می‌مانند.
   ───────────────────────────────────────────────────────────── */

const ALLOWED = [
  'https://www.billiardhub.net',
  'https://billiardhub.net',
  'https://billiardhub.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
]

/** آیا این origin مجاز است؟ دامنه‌های پیش‌نمایشِ ورسل هم پذیرفته‌اند. */
function isAllowed(origin: string): boolean {
  if (ALLOWED.includes(origin)) return true
  try {
    const h = new URL(origin).hostname
    return h.endsWith('.vercel.app') && h.includes('billiardhub')
  } catch { return false }
}

/** هدرهای CORS برای یک درخواستِ مشخص */
export function corsHeaders(req?: { headers: Headers }): Record<string, string> {
  const origin = req?.headers.get('origin') ?? ''
  const base: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Vary': 'Origin',
  }
  if (origin && isAllowed(origin)) {
    base['Access-Control-Allow-Origin'] = origin
    base['Access-Control-Allow-Credentials'] = 'true'
  }
  return base
}

/* سازگاری با کدِ فعلی که CORS را به‌صورتِ آبجکتِ ثابت import می‌کند.
   بدونِ origin، هدرِ Allow-Origin صادر نمی‌شود — که برای same-origin
   کاملاً بی‌اثر است و برای cross-origin یعنی «مجاز نیست». */
export const CORS: Record<string, string> = corsHeaders()
