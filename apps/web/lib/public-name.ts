import { OFFICIAL_DISPLAY_NAME } from './story-store'

/* ─────────────────────────────────────────────────────────────
   نامی که بقیه‌ی کاربران می‌بینند.

   حسابِ رسمیِ پلتفرم پشتِ نامِ یک شخصِ حقیقی است، ولی چیزی که در
   سایت دیده می‌شود باید نامِ برند باشد — استوری، پروفایلِ عمومی،
   نظر، کانالِ ویدیو، پیام. نامِ واقعی برای پنل، مدارک و استعلامِ
   شاهکار لازم است و آن‌جا دست‌نخورده می‌ماند؛ این تنها جای تفاوت
   است.

   چرا یک تابعِ مشترک: این تصمیم در چند مسیرِ مستقل تکرار می‌شود
   (API عمومیِ کاربر، استوری، رسانه، نظرها). اگر هرکدام نسخه‌ی خودش
   را داشته باشد، یکی‌شان از قلم می‌افتد و همان‌جا نامِ واقعی بیرون
   می‌زند — که دقیقاً همان اتفاقی بود که افتاد.
   ───────────────────────────────────────────────────────────── */

export interface NameSource {
  firstName?: string | null
  lastName?: string | null
  primaryRole?: string | null
  secondaryRoles?: string[] | null
}

/** آیا این حساب، حسابِ رسمیِ پلتفرم است؟ */
export function isOfficialAccount(u: NameSource | null | undefined): boolean {
  if (!u) return false
  return u.primaryRole === 'admin' || (u.secondaryRoles ?? []).includes('admin')
}

/** نامِ نمایشیِ عمومی — برای حسابِ رسمی نامِ برند، وگرنه نامِ خودِ کاربر. */
export function publicDisplayName(u: NameSource | null | undefined, fallback = 'کاربر'): string {
  if (isOfficialAccount(u)) return OFFICIAL_DISPLAY_NAME
  return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || fallback
}

/** همان کار روی یک ردیفِ خام: نامِ خانوادگی خالی می‌شود تا هرجا
    که این دو را کنارِ هم می‌چسباند، دوباره نامِ واقعی نسازد. */
export function withPublicName<T extends Record<string, unknown>>(row: T): T {
  const u = row as unknown as NameSource
  if (!isOfficialAccount(u)) return row
  return { ...row, firstName: OFFICIAL_DISPLAY_NAME, lastName: '' }
}
