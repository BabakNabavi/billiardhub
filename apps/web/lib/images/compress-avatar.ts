/* فشرده‌سازیِ عکسِ آواتار پیش از آپلود.
 *
 * ⚠️ چرا فایلِ جدا: این تابع داخلِ `app/profile/me/page.tsx` نوشته شده
 * بود و export نمی‌شد، پس هر جای دیگری که آواتار می‌گیرد یا باید
 * کپی‌اش می‌کرد یا فایلِ خام را می‌فرستاد. جدولِ رنکینگ تا صد و بیست
 * و هشت ردیف دارد و هر ردیف یک عکسِ ۴۶ پیکسلی نشان می‌دهد — فرستادنِ
 * عکسِ چند مگابایتیِ دوربین برای آن، هم پهنای‌باندِ کاربرِ ایرانی را
 * می‌سوزاند هم فضای ذخیره‌سازی را.
 *
 * برشِ مربعِ وسط + ۴۲۰ پیکسل + JPEG با کیفیتِ ۰.۸۲ — همان عددهایی که
 * صفحه‌ی پروفایل سال‌هاست با آن کار می‌کند، نه انتخابِ تازه.
 */

export const AVATAR_SIZE = 420
export const AVATAR_QUALITY = 0.82

/** فایلِ تصویر را به مربعِ ۴۲۰ پیکسلیِ JPEG تبدیل می‌کند. */
export function compressAvatar(file: File, name = 'avatar.jpg'): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const c = document.createElement('canvas')
      /* ضلعِ مربعِ برش = کوچک‌ترین بُعدِ عکس، از مرکز */
      const s = Math.min(img.width, img.height)
      c.width = AVATAR_SIZE
      c.height = AVATAR_SIZE
      const ctx = c.getContext('2d')
      if (!ctx) { reject(new Error('canvas')); return }
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
      c.toBlob(
        b => (b ? resolve(new File([b], name, { type: 'image/jpeg' })) : reject(new Error('blob'))),
        'image/jpeg',
        AVATAR_QUALITY,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')) }
    img.src = url
  })
}
