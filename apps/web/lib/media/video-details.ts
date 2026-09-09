/* ─────────────────────────────────────────────────────────────
   مشخصات ویدیو — منطق خالص.

   ⚠️ این‌ها اول داخل خود کامپوننت `VideoDetailsDialog` بودند، که
   `'use client'` است. یعنی هفت صفحه‌ی نقش برای گرفتن یک تابع رشته‌ای
   یک کامپوننت React ایمپورت می‌کردند — و `d0` هفت بار کپی شده بود.
   منطق خالص در `lib/` می‌ماند، بدون React.
   ───────────────────────────────────────────────────────────── */

export interface VideoDetail {
  title: string
  category: string
  description: string
  /** ⚠️ صریح، نه استنتاج از خالی‌بودن دسته‌بندی: «فقط در گالری
   *  بماند» یک تصمیم کاربر است و باید خودش را نشان بدهد. */
  publish: boolean
}

/* الگوهایی که عنوان خوبی نیستند — همان‌ها که سرور هم پس می‌زند */
const FILE_LIKE = /^[\w-]+\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/i
/* ⚠️ دنباله باید *فاصله* را هم بپذیرد: تابع بالا خط‌تیره و زیرخط
   را به فاصله تبدیل می‌کند، پس «screen record 04-14-2026» وقتی به
   این‌جا می‌رسد «screen record 04 14 2026» است — و الگوی بدون
   فاصله دقیقا همان نامی را که این قابلیت برای حذفش آمده بود رد
   نمی‌کرد. */
const MACHINE = /^(img|vid|video|movie|mvi|dsc|pxl|screen[ _-]?(record(ing)?|shot)|whatsapp|telegram)[\s_.-]*[\d\s._-]*$/i

/** نام فایل ⟵ یک پیشنهاد اولیه‌ی تمیز (نه لزوما عنوان خوب) */
export const titleFromFile = (name: string) =>
  name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)

/** آیا این عنوان برای بیننده و گوگل ارزشی دارد؟ رشته‌ی خالی یعنی بله. */
export const weakTitle = (t: string) => {
  const s = t.trim()
  if (s.length < 3) return 'عنوان دست‌کم ۳ نویسه باشد'
  if (FILE_LIKE.test(s)) return 'این نام فایل است، نه عنوان'
  if (MACHINE.test(s)) return 'این اسم ساخته‌ی دستگاه است؛ در جست‌وجوی گوگل هیچ‌کس با آن پیدایتان نمی‌کند'
  if (!/[\p{L}]{3}/u.test(s)) return 'عنوان باید کلمه داشته باشد، نه فقط عدد و نشانه'
  return ''
}

/** عنوان کاربر اولویت دارد؛ اگر فرم رد شده باشد، نام فایل تمیزشده. */
export const detailTitle = (d: VideoDetail[] | undefined, i: number, f: File) =>
  (d?.[i]?.title ?? '').trim() || titleFromFile(f.name)

/** وقتی ورودی‌ای در کار نیست — فقط نام فایل، بدون انتشار. */
export const galleryOnlyDetails = (files: File[]): VideoDetail[] =>
  files.map(f => ({ title: titleFromFile(f.name), category: '', description: '', publish: false }))
