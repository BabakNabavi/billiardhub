/* ─────────────────────────────────────────────────────────────
   موضوع‌های تیکتِ «تماس با ما» — منبعِ واحد برای فرم (کلاینت) و
   /api/contact (سرور).

   ⚠️ پیش‌تر دو فهرستِ جدا بود و فرم «مشاوره» را نشان می‌داد که سرور
   نمی‌پذیرفت: کاربر کلِ فرم را پر می‌کرد و «موضوع نامعتبر است» می‌گرفت.

   این فایل هیچ import ندارد تا هم در کامپوننتِ کلاینت و هم در Route
   Handler بی‌خطر باشد (verification-lock از next/server می‌خواند).
   ───────────────────────────────────────────────────────────── */

/** موضوعِ تیکتی که پیامِ قفلِ کد پستی/اطلاعات بانکی به آن می‌فرستد */
export const LOCK_SUBJECTS = {
  postal: 'درخواست تغییر کد پستی',
  bank: 'درخواست ویرایش اطلاعات بانکی',
} as const

/* «تبلیغات» این‌جا نیست — فرمِ خودش را در /advertise دارد.
   دو موضوعِ قفل پیش از «سایر» می‌آیند تا کاربرِ قفل‌شده زود پیدایشان کند. */
export const CONTACT_SUBJECTS = [
  'پشتیبانی', 'همکاری', 'پیشنهاد و انتقاد',
  LOCK_SUBJECTS.postal, LOCK_SUBJECTS.bank,
  'سایر',
] as const

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export const isContactSubject = (s: string): s is ContactSubject =>
  (CONTACT_SUBJECTS as readonly string[]).includes(s)
