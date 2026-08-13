/* ─────────────────────────────────────────────────────────────
   نامِ فایلِ Billiard Media.

   ── چرا نامِ فایلِ کاربر استفاده نمی‌شود ──
   مسیرهای امروزِ سایت نامِ اصلیِ فایل را نگه می‌دارند
   (`clubs/…/images/1-IMG_1375.png`). برای عکسِ باشگاه بی‌خطر است، ولی
   برای رسانه‌ای که قرار است ترابایتی شود سه ایراد دارد:

     ۱ نامِ فایلِ گوشی گاهی اطلاعاتِ شخصی دارد — نامِ شخص، شماره،
       نامِ مشتری. مسیر عمومی است و برای همیشه می‌ماند.
     ۲ مهرِ زمانی قابلِ حدس است: کسی که یک نشانی دارد می‌تواند
       نشانی‌های همسایه را بسازد.
     ۳ دو نفر با یک نامِ فایل به هم برخورد می‌کنند.

   ── چرا سال و ماه در مسیر ──
   یک پوشه با صد هزار فایل، هم `ls` را کند می‌کند هم پشتیبان‌گیری و
   هم انتقال به Object Storage. تقسیمِ ماهانه یعنی هر پوشه چند هزار
   فایل می‌ماند، و «رسانه‌ی امسال» یک پیشوندِ ساده است.

   ── چرا این‌جا و نه داخلِ فرم ──
   کلید در سه جا لازم می‌شود: مسیرِ آپلود، ستونِ `storage_key` و
   پاک‌کردنِ فایل. سه نسخه از یک قاعده یعنی روزی یکی‌شان عقب می‌ماند.
   ───────────────────────────────────────────────────────────── */

/** ریشه‌ی همه‌ی فایل‌های Billiard Media */
export const MEDIA_ROOT = 'media'

export type MediaKind = 'videos' | 'thumbnails'

/** پسوندهای مجاز برای هر نوع — بیش از این باید داده عوض شود، نه کد */
const EXT: Record<MediaKind, readonly string[]> = {
  videos: ['mp4', 'webm', 'mov'],
  thumbnails: ['webp', 'jpg', 'png', 'avif'],
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * مسیرِ آپلود — **بدونِ پسوند**: `media/videos/2026/08/6f1c…-9ab2`
 *
 * ── چرا بی‌پسوند ──
 * `resolvePath` در `lib/upload/policy.ts` هر نویسه‌ی غیرِ
 * `[A-Za-z0-9_-]` را به `_` تبدیل می‌کند تا پیمایشِ مسیر بسته بماند —
 * یعنی نقطه هم می‌رود و `uuid.mp4` می‌شود `uuid_mp4`، و بعد سرور
 * پسوندِ واقعی را رویش می‌گذارد: `uuid_mp4.mp4`.
 *
 * سست‌کردنِ آن قاعده برای زیبایی نامِ فایل، `..` را برمی‌گرداند. پس
 * مسیر بی‌پسوند می‌رود و پسوند را همان‌جایی می‌گذارد که نوعِ واقعیِ
 * فایل را از بایت‌ها می‌شناسد. کلیدی که در دیتابیس می‌نشیند هم همان
 * چیزی است که سرور برگردانده، نه حدسِ کلاینت.
 *
 * `at` فقط برای تست تزریق می‌شود؛ در عمل «همین حالا» است.
 */
export function mediaUploadPath(kind: MediaKind, id: string, at: Date = new Date()): string {
  /* UUID همان‌طور که هست می‌ماند — حذفِ خط تیره‌ها فقط خواندنش را سخت
     می‌کند و چیزی به‌دست نمی‌آید. */
  const uuid = String(id).toLowerCase()
  if (!UUID_RE.test(uuid)) throw new Error('شناسه باید UUID باشد')
  const y = at.getUTCFullYear()
  const m = String(at.getUTCMonth() + 1).padStart(2, '0')
  return `${MEDIA_ROOT}/${kind}/${y}/${m}/${uuid}`
}

/** همان مسیر، با پسوند — برای تست و برای ساختنِ کلیدِ بندانگشتی */
export function mediaKey(kind: MediaKind, ext: string, id: string, at: Date = new Date()): string {
  const e = String(ext ?? '').toLowerCase().replace(/^\./, '')
  if (!EXT[kind].includes(e)) {
    throw new Error(`پسوندِ ${e || '(خالی)'} برای ${kind} مجاز نیست`)
  }
  return `${mediaUploadPath(kind, id, at)}.${e}`
}

/** آیا این کلید زیرِ ریشه‌ی رسانه است؟ — برای اعتبارسنجیِ سرور */
export const isMediaKey = (key: string | null | undefined): boolean =>
  /^media\/(videos|thumbnails)\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(String(key ?? ''))

/**
 * کلیدِ بندانگشتیِ متناظرِ یک ویدیو.
 *
 * همان سال و ماه و همان UUID — پس دو فایلِ یک ویدیو کنارِ هم می‌مانند
 * و با یک پیشوند هر دو پیدا می‌شوند.
 */
export function thumbKeyOf(videoKey: string, ext = 'webp'): string {
  const m = /^media\/videos\/(\d{4})\/(\d{2})\/([0-9a-f-]{36})\./.exec(videoKey)
  if (!m) throw new Error('کلیدِ ویدیو معتبر نیست')
  return `${MEDIA_ROOT}/thumbnails/${m[1]}/${m[2]}/${m[3]}.${ext}`
}
