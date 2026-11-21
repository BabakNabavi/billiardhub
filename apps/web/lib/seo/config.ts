/* ─────────────────────────────────────────────────────────────
   شناسه‌های ابزارهای جست‌وجو و آمار — یک‌جا.

   هیچ‌کدام راز نیست: همه در HTMLِ عمومیِ صفحه دیده می‌شوند (همان کاری
   که خودِ این سرویس‌ها می‌خواهند). پس در کدند، نه در `.env` سرور — اتصالِ
   هر ابزار فقط پرکردنِ یک خط و یک دیپلوی است.

   خالی ⟵ آن ابزار اصلاً بار نمی‌شود (نه اسکریپت، نه متاتگ).

   ⚠️ دسترسی از ایران: اسکریپت‌های گوگل‌آنالیتیکس و Clarity از سرورهای
   خارجی می‌آیند؛ اگر برای بازدیدکننده‌ای در دسترس نباشند، فقط آمارِ همان
   بازدید ثبت نمی‌شود — صفحه منتظرشان نمی‌ماند (`اولین تعامل یا ۴ ثانیه بعد از load`).
   ───────────────────────────────────────────────────────────── */

export const SEO_IDS = {
  /** Google Analytics 4 — «Measurement ID» به شکلِ G-XXXXXXXXXX */
  ga4: 'G-KHMCV0C4Y8',
  /** Microsoft Clarity — «Project ID» (حدود ۱۰ نویسه) */
  clarity: 'z6ghz1hhv2',
  /** Google Search Console — مقدارِ content در متاتگِ google-site-verification */
  googleVerification: '',
  /** Bing Webmaster Tools — مقدارِ content در متاتگِ msvalidate.01 */
  bingVerification: '',
  /** Ahrefs Webmaster Tools — مقدارِ content در متاتگِ ahrefs-site-verification */
  ahrefsVerification: '',
} as const

/* تصویرِ اشتراک‌گذاری (۱۲۰۰×۶۳۰). صفحه‌ای که openGraph یا twitterِ خودش را
   دارد، شیءِ ریشه را کامل جایگزین می‌کند و تصویر را از دست می‌دهد — پس
   باید همین را صریح بدهد. */
export const OG_IMAGE = { url: '/images/Logo/bh-og-v13.png', width: 1200, height: 630, alt: 'بیلیارد هاب' } as const
