/* ═══════════════════════════════════════════════════════════════
   نرمال‌سازیِ متنِ فارسی برای **مقایسه و جست‌وجو** — نه برای نمایش.
   کارِ نمایشیِ ارقام در «PersianDigits» است، نه این‌جا.
   ═══════════════════════════════════════════════════════════════ */
/* اعرابِ عربی (فتحه تا سکون) و الفِ کوتاه — «مِز» و «مز» باید یکی
   باشند. کاربر اعراب تایپ نمی‌کند ولی داده گاهی دارد. */
const HARAKAT = /[\u064B-\u0652\u0670]/g

/* نامرئی‌ها: نیم‌فاصله (200C)، فاصله‌ی بدونِ شکست (200B) و
   نشانه‌های جهتِ LRM/RLM که با کپی از سایت می‌آیند */
/* ⚠️ محدوده‌ی 2066–2069 عمداً این‌جاست: `certificationLines` عنوانِ
   درجه و سال را با FSI/PDI جدا می‌کند تا در بندِ راست‌به‌چپ قاطی
   نشوند. آن نویسه‌ها دیده نمی‌شوند ولی *کاراکترند* — و این تابع همان
   چیزی است که پروژه برای «مقایسه و جست‌وجو» صدا می‌زند. یک‌بار نبودنشان
   در این فهرست باعث شد `startsWith` در پنلِ ادمین بی‌صدا شکست بخورد. */
const INVISIBLE = /[\u200B-\u200F\u061C\u2060\uFEFF\u2066-\u2069\u202A-\u202E]/g

const DIGITS: Record<string, string> = {}
for (let i = 0; i < 10; i++) {
  DIGITS[String.fromCharCode(0x06f0 + i)] = String(i)  // ۰-۹ فارسی
  DIGITS[String.fromCharCode(0x0660 + i)] = String(i)  // ٠-٩ عربی
}

/**
 * کلیدِ مقایسه‌ی یک رشته‌ی فارسی/انگلیسی.
 * فارسی · انواعِ الف به «ا» · «ة ۀ» به «ه» · ارقام به لاتین.
 */
export function normalizeFa(s: string): string {
  return s
    .toLowerCase()
    .replace(INVISIBLE, '')
    .replace(HARAKAT, '')
    .replace(/\s+/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[۰-۹٠-٩]/g, d => DIGITS[d] ?? d)
}

/* ── نگه‌داشتنِ ارقامِ یک متن به شکلِ لاتین ──
   `PersianDigits` هر رقمِ رندرشده را فارسی می‌کند. دو استثنا دارد
   و هرکدام جای خودش را:

     `bh-latin`   ارقام لاتین می‌مانند **و** فونت Arial می‌شود
     `data-no-fa` فقط ارقام لاتین می‌مانند

   رشته‌ی خالصِ لاتین («Century G1») اولی را می‌گیرد و متنِ ترکیبی
   («استار XW101»، «آبنوس (Ebony)») دومی را — وگرنه یا «XW۱۰۱»
   می‌شد یا وسطِ جدولِ فارسی یک‌دفعه Arial.

   ── چرا کلاسِ خودِ عنصر را هم می‌گیرد ──
   خروجی روی `<span>`ی spread می‌شود که کلاسِ خودش را دارد. اگر فقط
   `className` برگرداند، آن کلاس را **بازنویسی** می‌کند و خطِ برند و
   مدل `bz-t`/`mk-t`/`pc-t` را از دست می‌دهد — یعنی همان فاصله و
   اندازه و کوتاه‌شدنی که تازه اضافه شده. پس ادغام می‌کند. */
export function keepLatinProps(
  text: string, className?: string,
): { className?: string; 'data-no-fa'?: string } {
  const base = className ? { className } : {}
  if (!/[0-9A-Za-z]/.test(text)) return base
  if (/[\u0600-\u06FF]/.test(text)) return { ...base, 'data-no-fa': '' }
  return { className: [className, 'bh-latin'].filter(Boolean).join(' ') }
}

/** ارقامِ فارسی و عربی ⟵ لاتین */
export function normalizeDigits(s: string): string {
  return s.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
          .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
}

/* ── شماره‌ی موبایل، یک شکل ──
   فرم ارقامِ فارسی و جداکننده را می‌پذیرد و نرمال می‌کند؛ ولی مرزِ
   واقعی سرور است و درخواستِ مستقیم از فرم نمی‌گذرد. همان قاعده
   این‌جا هم هست تا ستونِ `sellerPhone` دو شکل نگیرد. */
export function normalizePhoneFa(v: unknown): string {
  let d = normalizeDigits(String(v ?? '')).replace(/[^0-9]+/g, '')
  if (d.startsWith('0098')) d = d.slice(4)
  else if (d.startsWith('98') && d.length > 10) d = d.slice(2)
  if (d.startsWith('9') && d.length === 10) d = '0' + d
  return d
}

export const isIranMobile = (v: unknown): boolean => /^09[0-9]{9}$/.test(normalizePhoneFa(v))

/* ── نویسه‌های کنترلِ دوجهته ──
   `certificationLines` برچسب و سال را با FSI/PDI جدا می‌کند تا در بندِ
   راست‌به‌چپ سال وسطِ برچسب نیفتد. آن نویسه‌ها نامرئی‌اند ولی *کاراکترند*:
   هر مقایسه‌ی رشته‌ای روی همان متن — مثلاً پیداکردنِ کلیدِ درجه از روی
   برچسب در پنلِ ادمین — بدونِ پاک‌کردنشان شکست می‌خورد.

   هرجا متنِ نمایشی را می‌سنجی، اول از این رد کن. */
export const stripBidi = (s: string): string => s.replace(INVISIBLE, '')
