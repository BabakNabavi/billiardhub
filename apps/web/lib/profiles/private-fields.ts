/* ─────────────────────────────────────────────────────────────
   فیلدهای خصوصیِ پروفایل — یک قاعده برای هر جایی که پروفایل به کسی جز
   صاحبش می‌رسد (آذرِ ۱۴۰۵).

   ── چرا ──
   GET /api/profiles/[kind] تا امروز ردیفِ کامل را به هر بازدیدکننده‌ای
   می‌داد: شماره‌ی شخصیِ صاحب (ownerPhone)، نامِ حقوقی، فایلِ پروانه‌ی کسب،
   مدرکِ مربی‌گری/داوری، شماره‌ی پروانه. هیچ صفحه‌ی عمومی‌ای این‌ها را نشان
   نمی‌دهد — شماره‌ی تماسِ عمومی (phone/whatsapp/contactPhone/mobile)
   فیلدِ جداست و می‌ماند. پنل‌های ادمین مسیرِ خودشان را دارند
   (/api/admin/profiles) و صاحب پروفایلش را با ?mine=1 یا با پرچمِ isMine
   کامل می‌گیرد، پس ویرایشِ درجا نسخه‌ی ناقص را ذخیره نمی‌کند.

   ⚠️ الگو، نه فهرستِ اسم: فیلدِ خصوصیِ تازه‌ای که فرمی با همین پیشوندها
   اضافه کند، خودبه‌خود بیرون می‌ماند (یک‌بار `licenseFile` از فهرستِ
   اسمی جا افتاده بود). `ownerId` استثناست: شناسه است نه اطلاعاتِ شخصی، و
   صفحه‌ی عمومی با آن استوری و آگهی‌های صاحب را می‌خواند.
   ───────────────────────────────────────────────────────────── */

/* `national` فقط با پسوندِ شناسه: `national`ِ تنها پرچمِ عمومیِ «ملی‌پوش» بازیکن است */
const PRIVATE_KEY = /^(owner|license|national(Id|Code|Card|No|Number)|birth|iban|sheba|card|password|secret|token)|^certificate$/i

const isPrivate = (k: string, keepOwnerId: boolean) => PRIVATE_KEY.test(k) && !(keepOwnerId && k === 'ownerId')

function strip(o: Record<string, unknown>, keepOwnerId: boolean): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([k]) => !isPrivate(k, keepOwnerId)))
}

/** ردیفِ پروفایل (و `data`ِ داخلش) بی‌فیلدِ خصوصی. `keepOwnerId: false` برای
 *  HTMLِ رندرِ سرور که شناسه را هم لازم ندارد (مالکیت از پاسخِ مرورگر می‌آید). */
export function withoutPrivateFields<T extends object>(row: T, opts: { keepOwnerId: boolean }): T {
  const out = strip(row as Record<string, unknown>, opts.keepOwnerId)
  const data = (row as { data?: unknown }).data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    out.data = strip(data as Record<string, unknown>, opts.keepOwnerId)
  }
  return out as T
}
