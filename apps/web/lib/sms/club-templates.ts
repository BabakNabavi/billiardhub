/* ─────────────────────────────────────────────────────────────
   متن‌های آماده‌ی پیامکِ باشگاه به اعضا.

   ── چرا متنِ آزاد نیست ──
   خطِ خدماتیِ ملی‌پیامک متنِ دلخواه نمی‌پذیرد؛ هر متن باید یک‌بار در
   پنلِ آن‌ها ثبت و تأیید شود. ولی حتی اگر می‌شد هم، این‌جا متنِ آزاد
   نمی‌گذاشتیم: باشگاه‌دار به شماره‌ی موبایلِ اعضا دسترسی پیدا می‌کند و
   متنِ بی‌قید یعنی پلتفرم مسئولِ هرچیزی است که فرستاده می‌شود.

   پس مقدارها هم عمداً تنگ‌اند — تاریخ، عنوان، درصد — نه پاراگرافِ آزاد.
   یک آرگومانِ بی‌قید همان متنِ آزاد است با یک گامِ بیشتر.

   `{0}` همیشه نامِ گیرنده است و خودِ سامانه پرش می‌کند؛ باشگاه‌دار
   فقط `{1}` به بعد را می‌بیند.
   ───────────────────────────────────────────────────────────── */

export interface ClubTemplateField {
  /** نمایهٔ آرگومان در متن — ۱ به بعد (۰ نامِ گیرنده است) */
  index: number
  label: string
  placeholder: string
  /** تاریخِ جلالی از تقویم گرفته می‌شود، نه تایپِ دستی */
  type?: 'text' | 'jalali' | 'number'
  maxLength?: number
}

export interface ClubTemplate {
  key: string
  title: string
  /** متن با جای‌گذارها — دقیقاً همان که در پنلِ ملی‌پیامک ثبت می‌شود */
  body: string
  fields: ClubTemplateField[]
}

/* `{1}` همیشه نامِ باشگاه است و **سرور** از روی مالکیت پرش می‌کند، نه
   باشگاه‌دار. اگر دستی بود، هر باشگاه‌داری می‌توانست به نامِ باشگاهِ
   دیگری پیامک بفرستد — و گیرنده هیچ راهی برای تشخیص نداشت.

   جای‌گذارهای باشگاه‌دار از `{2}` شروع می‌شوند. */
export const CLUB_TEMPLATES: ClubTemplate[] = [
  {
    key: 'club_tournament',
    title: 'برگزاری مسابقه',
    body: '{0} عزیز\n{1} در {2} مسابقه برگزار می‌کند.\nثبت‌نام: صفحه باشگاه\nwww.billiardhub.net',
    fields: [
      { index: 2, label: 'تاریخ برگزاری', placeholder: 'انتخاب از تقویم', type: 'jalali' },
    ],
  },
  {
    key: 'club_class',
    title: 'دوره یا کلاس آموزشی',
    body: '{0} عزیز\nدوره {2} در {1} از {3} آغاز می‌شود.\nwww.billiardhub.net',
    fields: [
      { index: 2, label: 'عنوان دوره', placeholder: 'مقدماتی اسنوکر', maxLength: 24 },
      { index: 3, label: 'تاریخ شروع', placeholder: 'انتخاب از تقویم', type: 'jalali' },
    ],
  },
  {
    key: 'club_offer',
    title: 'تخفیف ویژه',
    body: '{0} عزیز\n{1} تا {2} تخفیف {3} درصدی دارد.\nwww.billiardhub.net',
    fields: [
      { index: 2, label: 'تا تاریخ', placeholder: 'انتخاب از تقویم', type: 'jalali' },
      { index: 3, label: 'درصد تخفیف', placeholder: '۲۰', type: 'number', maxLength: 2 },
    ],
  },
  {
    key: 'club_notice',
    title: 'اطلاعیه ساعت کاری',
    body: '{0} عزیز\n{1} در {2} {3} است.\nwww.billiardhub.net',
    fields: [
      { index: 2, label: 'تاریخ', placeholder: 'انتخاب از تقویم', type: 'jalali' },
      { index: 3, label: 'وضعیت', placeholder: 'تعطیل', maxLength: 20 },
    ],
  },
]

export const clubTemplate = (key: string) => CLUB_TEMPLATES.find(t => t.key === key) ?? null

/** جای‌گذارها را با مقدارها پر می‌کند — `{0}` نامِ گیرنده */
export function renderTemplate(body: string, recipientName: string, args: string[]): string {
  const all = [recipientName, ...args]
  return body.replace(/\{(\d+)\}/g, (_, i: string) => all[Number(i)] ?? '')
}

/* ── شمارشِ بخش‌های پیامک ──
   پیامکِ فارسی با UCS-2 می‌رود: بخشِ اول ۷۰ کاراکتر، بخش‌های بعد ۶۷.
   (متنِ کاملاً لاتین GSM-7 است و ۱۶۰/۱۵۳ — این‌جا عملاً پیش نمی‌آید
   ولی محاسبه‌اش درست بماند بهتر از این است که روزی غافلگیر کند.)

   چرا مهم است: باشگاه‌دار به ازای هر گیرنده یک نرخ می‌پردازد، ولی
   متنِ سه‌بخشی سه برابر برای ما هزینه دارد. اگر این عدد دیده نشود،
   یک متنِ کمی بلندتر می‌تواند کلِ سود را ببرد. */
const GSM7 = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/

export function smsParts(text: string): { parts: number; chars: number; unicode: boolean } {
  const chars = [...text].length
  const unicode = !GSM7.test(text)
  const [first, next] = unicode ? [70, 67] : [160, 153]
  if (chars <= first) return { parts: 1, chars, unicode }
  return { parts: Math.ceil(chars / next), chars, unicode }
}
