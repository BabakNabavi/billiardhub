/* ─────────────────────────────────────────────────────────────
   کلیدِ فایل ← نشانیِ عمومی.

   ── چرا این هست، و چرا بیشتر از این نیست ──
   `videos.src` تا امروز نشانیِ *مطلق* را نگه می‌داشت، یعنی دامنه‌ی
   ارائه‌دهنده و نامِ باکت در هر ردیف پخته بود. روزی که فایل‌ها جای
   دیگری بروند، باید روی رشته‌ی نشانیِ هر ردیف جراحی می‌شد.

   حالا کلید ذخیره می‌شود و نشانی از رویش ساخته. مهاجرت یعنی افزودنِ
   یک شاخه به همین تابع و یک `UPDATE` روی ستونِ ارائه‌دهنده.

   عمداً یک *تابع* است، نه یک لایه‌ی `StorageProvider` با
   upload/delete/exists/getMetadata. آن انتزاع وقتی ارزش دارد که دو
   ارائه‌دهنده‌ی واقعی داشته باشیم؛ امروز یکی داریم و نوشتنش فقط یک
   لایه‌ی اضافه بینِ کد و کاری است که همین حالا درست کار می‌کند.

   اگر روزی ارائه‌دهنده‌ی دوم آمد، همین‌جا شاخه اضافه می‌شود — و آن
   لحظه است که اگر لازم بود، انتزاعِ کامل ساخته می‌شود.
   ───────────────────────────────────────────────────────────── */

export type StorageProvider = 'supabase'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')
const PUBLIC_BUCKET = 'club-media'

/** مسیرِ داخلِ باکت → نشانیِ قابلِ خواندن در مرورگر. */
export function publicUrlFor(key: string | null | undefined, provider: StorageProvider = 'supabase'): string {
  const k = String(key ?? '').replace(/^\/+/, '')
  if (!k) return ''
  switch (provider) {
    case 'supabase':
    default:
      if (!SUPABASE_URL) return ''
      /* هر بخشِ مسیر جدا رمزگذاری می‌شود تا `/` جداکننده بماند */
      const path = k.split('/').map(encodeURIComponent).join('/')
      return `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`
  }
}

/** نشانیِ کاملِ همین پروژه → مسیرِ داخلِ باکت. برای ردیف‌های قدیمی. */
export function keyFromUrl(url: string | null | undefined): string | null {
  const s = String(url ?? '')
  const m = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/.exec(s)
  if (!m?.[1]) return null
  return decodeURIComponent(m[1].split('?')[0]!)
}

/**
 * نشانیِ نمایشیِ یک ردیف.
 *
 * ترتیب عمدی است: اگر کلید هست از آن ساخته می‌شود (منبعِ حقیقت)، و
 * اگر نبود همان نشانیِ ذخیره‌شده برمی‌گردد. یعنی ردیف‌های پیش از این
 * مهاجرت بدونِ هیچ کاری کار می‌کنند.
 */
export function resolveUrl(
  key: string | null | undefined,
  fallbackUrl: string | null | undefined,
  provider: StorageProvider = 'supabase',
): string {
  return publicUrlFor(key, provider) || String(fallbackUrl ?? '')
}
