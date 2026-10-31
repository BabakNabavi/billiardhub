/* ─────────────────────────────────────────────────────────────
   شناسه‌های ابزارهای جست‌وجو و آمار — یک‌جا.

   هیچ‌کدام راز نیست: همه در HTMLِ عمومیِ صفحه دیده می‌شوند (همان کاری
   که خودِ این سرویس‌ها می‌خواهند). پس در کدند، نه در `.env` سرور — اتصالِ
   هر ابزار فقط پرکردنِ یک خط و یک دیپلوی است.

   خالی ⟵ آن ابزار اصلاً بار نمی‌شود (نه اسکریپت، نه متاتگ).

   ⚠️ دسترسی از ایران: اسکریپت‌های گوگل‌آنالیتیکس و Clarity از سرورهای
   خارجی می‌آیند؛ اگر برای بازدیدکننده‌ای در دسترس نباشند، فقط آمارِ همان
   بازدید ثبت نمی‌شود — صفحه منتظرشان نمی‌ماند (`lazyOnload`).
   ───────────────────────────────────────────────────────────── */

export const SEO_IDS = {
  /** Google Analytics 4 — «Measurement ID» به شکلِ G-XXXXXXXXXX */
  ga4: '',
  /** Microsoft Clarity — «Project ID» (حدود ۱۰ نویسه) */
  clarity: 'z6ghz1hhv2',
  /** Google Search Console — مقدارِ content در متاتگِ google-site-verification */
  googleVerification: '',
  /** Bing Webmaster Tools — مقدارِ content در متاتگِ msvalidate.01 */
  bingVerification: '',
  /** Ahrefs Webmaster Tools — مقدارِ content در متاتگِ ahrefs-site-verification */
  ahrefsVerification: '',
} as const
