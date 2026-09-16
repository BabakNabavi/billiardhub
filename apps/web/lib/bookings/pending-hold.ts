/* یادداشتِ «رفتم به درگاه» — تنها نشانه‌ای که مرورگر از خودش به‌جا
   می‌گذارد تا هنگام برگشت بداند رزروی معلق مانده است.

   چرا لازم است: کالبکِ درگاه فقط وقتی می‌آید که کاربر دکمه‌ی «انصراف»
   را بزند. بستنِ تب، دکمه‌ی back، یا اصلا نرسیدن به درگاه هیچ خبری به
   سرور نمی‌رساند و ساعت تا پایانِ مهلت قرمز می‌ماند. اندازه‌گیریِ زنده
   دقیقا همین دو حالت را نشان داد: رزروِ لغوشده‌از‌درگاه CANCELLED شده
   بود، ولی رزروی که پنجره‌اش بسته شده بود با `updated_at == created_at`
   در PENDING_PAYMENT مانده بود.

   چرا sessionStorage و نه localStorage: با بستنِ تب خودبه‌خود پاک
   می‌شود و بینِ تب‌ها نشت نمی‌کند. شناسه‌ی رزرو نشانه‌ی مالکیت نیست —
   سرور باز هم مالک و وضعیت را خودش بررسی می‌کند. */

const PENDING_KEY = 'bh_pending_booking';

/* هر سه تابع در برابرِ حالتِ خصوصیِ مرورگر (که دسترسی را throw می‌کند)
   و رندرِ سمتِ سرور امن‌اند. */

export function markPendingHold(bookingId: string): void {
  if (typeof window === 'undefined' || !bookingId) return;
  try { window.sessionStorage.setItem(PENDING_KEY, bookingId) } catch { /* حالت خصوصی */ }
}

/** فقط می‌خواند. پاک‌کردن عمداً جدا است: با خواندنِ ویرانگر،
 *  اجرای دوباره‌ی افکت در StrictMode بارِ دوم رشته‌ی خالی می‌دید و
 *  ساعت‌ها را پیش از رسیدنِ درخواستِ «رها کن» می‌گرفت — یعنی همان
 *  ساعتِ قرمز. شکستِ شبکه هم یادداشت را از دست می‌داد. */
export function peekPendingHold(): string {
  if (typeof window === 'undefined') return '';
  try { return window.sessionStorage.getItem(PENDING_KEY) ?? '' } catch { return '' }
}

export function clearPendingHold(): void {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem(PENDING_KEY) } catch { /* حالت خصوصی */ }
}
