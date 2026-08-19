/* ─────────────────────────────────────────────────────────────
   مرزِ ورودیِ `data` در ذخیره‌ی پروفایل.

   ── چرا دستی و نه Zod ──
   قاعده‌ی پروژه می‌گوید ورودیِ خارجی در مرز اعتبارسنجی شود و اسمِ
   Zod را می‌برد، ولی Zod در این ریپو نصب نیست و افزودنِ وابستگی
   بدونِ اجازه ممنوع است. پس همان سبکِ دستیِ موجود (`str()` در خودِ
   مسیرها) ادامه پیدا می‌کند — و چون شکلِ `data` برای هر نقش فرق
   دارد، این‌جا *شکل* سنجیده نمی‌شود؛ چیزی سنجیده می‌شود که هر شکلی
   باید رعایتش کند: اندازه، عمق، و تعداد.

   ── چه چیزی را می‌گیرد ──
   ردیفِ `profiles.data` یک jsonbِ آزاد است. بدونِ سقف، یک درخواستِ
   دستکاری‌شده می‌تواند ده‌ها مگابایت داخلِ یک ردیف بگذارد (که بعد
   *هر* بازدیدِ آن صفحه‌ی عمومی همان را دانلود می‌کند) یا با تودرتوییِ
   عمیق، `JSON.stringify`ِ سمتِ سرور را بخواباند.

   سقف‌ها از روی داده‌ی واقعی انتخاب شده‌اند: ردیف‌های فعلی بعد از
   انتقالِ عکس‌ها به Storage حدودِ ۱ تا ۲ کیلوبایت‌اند، و بزرگ‌ترین
   بدنه‌ی واقعی چند عکسِ فشرده‌ی data:URL است (هرکدام ~۲۰۰ کیلوبایت).
   ───────────────────────────────────────────────────────────── */

export const MAX_BODY_BYTES = 12 * 1024 * 1024   // چند عکسِ فشرده در یک ذخیره
export const MAX_STRING     = 3 * 1024 * 1024    // یک data:URL فشرده
export const MAX_DEPTH      = 8
export const MAX_KEYS       = 200
export const MAX_ARRAY      = 500

/* ⚠️ کلیدهایی که `out[k] = …` را به سراغِ ستِ ارث‌بری می‌فرستند.
   `JSON.parse` این‌ها را کلیدِ معمولی می‌سازد و بعد کپیِ ساده‌ی
   شیء بی‌صدا می‌اندازدشان — یعنی داده گم می‌شود بدونِ هیچ خطایی. */
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** پیامِ خطا، یا `null` وقتی ایرادی نیست */
export function checkProfileData(data: unknown): string | null {
  let bytes = 0
  const walk = (v: unknown, depth: number): string | null => {
    if (depth > MAX_DEPTH) return 'ساختار داده بیش از حد تودرتو است'
    if (v === null || v === undefined) return null
    if (typeof v === 'string') {
      /* ⚠️ `length` کدواحدِ UTF-16 می‌شمارد نه بایت. متنِ فارسی هر
         نویسه دو بایت است، پس با شمارشِ خام سقف عملاً دو برابر
         می‌شد. این کد فقط سمتِ سرور اجرا می‌شود، پس `Buffer` هست. */
      const n = Buffer.byteLength(v, 'utf8')
      if (n > MAX_STRING) return 'یکی از مقدارها بیش از حد بزرگ است'
      bytes += n
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      bytes += 8
    } else if (Array.isArray(v)) {
      if (v.length > MAX_ARRAY) return 'تعداد آیتم‌های یکی از فهرست‌ها بیش از حد است'
      /* ⚠️ خودِ ظرف هم باید هزینه داشته باشد. با شمارشِ صفر برای
         آرایه و شیءِ خالی، یک بدنه‌ی چند ده مگابایتی از `[[[]]]`ها
         بدونِ یک بایت شمرده‌شدن از سقف رد می‌شد. */
      bytes += 2 + v.length
      for (const x of v) { const e = walk(x, depth + 1); if (e) return e }
    } else if (typeof v === 'object') {
      const keys = Object.keys(v as Record<string, unknown>)
      if (keys.length > MAX_KEYS) return 'تعداد فیلدها بیش از حد است'
      bytes += 2 + keys.length
      for (const k of keys) {
        if (BAD_KEYS.has(k)) return 'کلید غیرمجاز در بدنه'
        bytes += Buffer.byteLength(k, 'utf8')
        const e = walk((v as Record<string, unknown>)[k], depth + 1)
        if (e) return e
      }
    } else {
      /* تابع و symbol از JSON درنمی‌آیند؛ اگر آمد، ناشناخته است */
      return 'نوع داده‌ی ناشناخته در بدنه'
    }
    if (bytes > MAX_BODY_BYTES) return 'حجم اطلاعات بیش از حد مجاز است'
    return null
  }
  return walk(data, 0)
}
