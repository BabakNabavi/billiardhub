/* ─────────────────────────────────────────────────────────────
   کدام رزرو در فهرست «رزروها» دیده می‌شود؟ — قاعده‌ی واحد.

   ── چرا یک جا ──
   این شرط در دو مسیر جدا نوشته شده بود (`bookings/my` و
   `bookings/club/[clubId]`) و با هم نمی‌خواند: سمتِ باشگاه
   `PENDING_PAYMENT` را می‌انداخت ولی سمتِ کاربر همه‌چیز را نشان
   می‌داد. کاربر سه «در انتظار پرداخت» می‌دید که باشگاه‌دار اصلا
   نمی‌دیدشان.

   ── قاعده ──
   «رزرو» یعنی چیزی که پولش پرداخت شده. تا پیش از آن یک سبدِ خرید
   است: اگر رها شود نباید هیچ اثری از خودش بگذارد — نه در فهرستِ
   کاربر، نه در فهرستِ باشگاه، نه در آمار.

   پس دیده می‌شود، فقط اگر پول جابه‌جا شده باشد:
     • CONFIRMED / COMPLETED / NO_SHOW  ⟵ پرداخت‌شده
     • CANCELLED **که پرداخت شده بود**  ⟵ باشگاه باید بداند و
       بازپرداختش را پیگیری کند

   و دیده نمی‌شود:
     • PENDING_PAYMENT ⟵ هنوز تمام نشده
     • EXPIRED         ⟵ مهلت تمام شد، پولی نیامد
     • CANCELLED ولی هرگز پرداخت‌نشده ⟵ انصراف پشتِ درگاه

   ⚠️ موردِ آخر تازه است: پیش‌تر رزروِ رهاشده در `PENDING_PAYMENT`
   می‌ماند تا منقضی شود، ولی حالا کالبکِ درگاه همان لحظه رهایش
   می‌کند و CANCELLED می‌شود. بدونِ این بند، همان ردیف‌ها با برچسبِ
   «لغو شده» برمی‌گشتند — یعنی مشکل فقط اسمش عوض می‌شد.
   ───────────────────────────────────────────────────────────── */

/** وضعیت‌هایی که هرگز پول برایشان نیامده */
const NEVER_PAID = new Set(['UNPAID', '']);

export interface BookingVisibilityRow {
  booking_status?: unknown
  payment_status?: unknown
}

/** آیا این رزرو باید در فهرست دیده شود؟
 *
 *  ردیف‌های قدیمی این دو ستون را ندارند؛ آن‌ها نباید ناپدید شوند، پس
 *  نبودِ مقدار یعنی «نشان بده». */
export function isVisibleBooking(r: BookingVisibilityRow): boolean {
  const bs = r.booking_status == null ? '' : String(r.booking_status)
  const ps = r.payment_status == null ? '' : String(r.payment_status)

  if (!bs) return true                       // ردیف پیش از فاز مالی
  if (bs === 'PENDING_PAYMENT') return false
  if (bs === 'EXPIRED') return false
  if (bs === 'CANCELLED' && NEVER_PAID.has(ps)) return false
  return true
}

/** همان قاعده برای فیلترِ سمتِ دیتابیس — وضعیت‌هایی که هیچ‌وقت لازم
 *  نیست خوانده شوند. `CANCELLED` این‌جا نیست چون به `payment_status`
 *  بستگی دارد و در حافظه غربال می‌شود. */
export const HIDDEN_BOOKING_STATUSES = ['PENDING_PAYMENT', 'EXPIRED'] as const
