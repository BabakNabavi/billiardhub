import 'server-only';
import { sb, rpc, audit } from '@/lib/finance/db';

/* ─────────────────────────────────────────────────────────────
   آزادسازیِ یک هولدِ پرداخت‌نشده — اتمیک.

   ── چرا نه `bh_cancel_booking` ──
   آن تابع وضعیت را دوباره بررسی نمی‌کند. اگر بین «خواندن» و
   «نوشتن» کالبکِ درگاه برسد و رزرو PAID شود، فراخوانیِ
   `bh_cancel_booking(id, 0, …)` شاخه‌ی پرداخت‌شده را می‌گیرد و
   کلِ مبلغ را `CANCELLATION_FEE` می‌نویسد: پولِ کاربر نزدِ ما
   می‌ماند، `refund_status` روی NONE، اسلات آزاد و ساعت دوباره
   فروخته می‌شود. یعنی درست همان حالتی که باید غیرممکن باشد.

   ── راهِ درست ──
   `bh_release_hold` (مهاجرتِ ۰۹۶): هر سه نوشتن — لغوِ رزرو، حذفِ
   اسلات، بستنِ نشستِ درگاه — در یک تراکنش و پشتِ یک قفلِ ردیف.

   جهتِ معکوس از قبل امن است: اگر ما زودتر لغو کنیم و بعد پرداخت
   برسد، `bh_confirm_payment` می‌بیند رزرو دیگر PENDING_PAYMENT
   نیست، پول را ثبت می‌کند و یک ردیفِ `refunds` با وضعیت REQUESTED
   می‌سازد. پول گم نمی‌شود، بدهیِ بازپرداخت ثبت می‌شود.
   ───────────────────────────────────────────────────────────── */

/* پستگرست مقدارِ اسکالر را گاهی خودش، گاهی داخلِ آرایه و گاهی داخلِ
   شیئی به نامِ تابع برمی‌گرداند — بسته به نسخه و هدرِ Accept. همین
   ابهام یک‌بار در این پروژه باعث شد وضعیتِ برگشتیِ `bh_confirm_payment`
   اشتباه خوانده شود، پس این‌جا هر سه شکل پذیرفته می‌شود. */
function truthyRpc(v: unknown): boolean {
  if (v === true) return true;
  if (Array.isArray(v)) return v.length > 0 && truthyRpc(v[0]);
  if (v && typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).some(x => x === true);
  }
  return false;
}

export type ReleaseVia = 'abandon' | 'sweep';

const REASON: Record<ReleaseVia, string> = {
  /* این متن‌ها در `bookings.cancellation_reason` می‌نشینند و پنلِ ادمین
     عیناً چاپشان می‌کند — پس باید بگویند واقعاً چه اتفاقی افتاده. */
  abandon: 'انصراف از پرداخت — بازگشت از درگاه',
  sweep:   'هولد پرداخت‌نشده — پاک‌سازی خودکار',
};

/** سه حالت، نه دو تا: `failed` باید از `noop` جدا بماند تا کلاینت
 *  بداند نشانه‌ی «رفتم به درگاه» را نگه دارد و دوباره تلاش کند.
 *  اگر هر دو یکی بودند، یک خطای گذرا نشانه را نابود می‌کرد و جاروی
 *  ساعت‌ها هم نجاتش نمی‌داد (آن رزرو نشستِ بازِ درگاه دارد و عمداً
 *  رد می‌شود) — یعنی ساعت تمامِ پانزده دقیقه قرمز می‌ماند. */
export type ReleaseResult = 'released' | 'noop' | 'failed';

export async function releaseHold(
  bookingId: string, userId: string, via: ReleaseVia,
): Promise<ReleaseResult> {
  const { data, error } = await rpc<unknown>('bh_release_hold', {
    p_booking_id: bookingId, p_user_id: userId, p_reason: REASON[via],
  });

  if (!error) {
    const released = truthyRpc(data);
    if (released) void audit({
      actorId: userId, action: 'BOOKING_HOLD_RELEASED',
      entityType: 'booking', entityId: bookingId, newValue: { via },
    });
    return released ? 'released' : 'noop';
  }

  /* تابع هنوز روی این دیتابیس نیست (مهاجرتِ ۰۹۶ اجرا نشده) ⇒ مسیرِ
     پشتیبان. هر خطای دیگری واقعی است و نباید پنهان شود. */
  /* روی `code` تکیه می‌کنیم نه متنِ پیام: «does not exist» برای ستون
     و جدولِ ناموجود هم می‌آید و با تطبیقِ متنی، یک خطای واقعیِ اسکیما
     برای همیشه همه‌ی فراخوانی‌ها را بی‌صدا به مسیرِ غیراتمیک می‌فرستاد. */
  const missing = error.code === 'PGRST202' || /schema cache/i.test(error.message ?? '');
  if (!missing) {
    console.error('[release-hold] rpc:', error.message);
    void audit({
      actorId: userId, action: 'BOOKING_HOLD_RELEASE_FAILED',
      entityType: 'booking', entityId: bookingId,
      newValue: { via, error: error.message ?? null },
    });
    return 'failed';
  }
  return await releaseFallback(bookingId, userId, via);
}

/* ── مسیرِ پشتیبان، فقط تا وقتی مهاجرتِ ۰۹۶ اجرا شود ──
   همان سه نوشتن، ولی در سه تراکنشِ جدا. امنیتِ مالی حفظ می‌شود چون
   شرط‌ها داخلِ `WHERE` هستند و پستگرس آن‌ها را زیرِ قفلِ ردیف دوباره
   ارزیابی می‌کند؛ ولی اتمیک نیست و شکستِ حذفِ اسلات می‌تواند ساعت را
   یتیم بگذارد — برای همین آن حالت ممیزی می‌شود.

   ⚠️ هرگز به این UPDATE ‏`.limit()` یا `.single()` اضافه نکن. پستگرست
   جهشِ محدودشده را به `UPDATE … WHERE ctid IN (SELECT ctid … )` بازنویسی
   می‌کند؛ آن‌وقت شرط‌ها در اسنپ‌شاتِ ساب‌کوئری اجرا می‌شوند و ردیف با
   ctid گرفته می‌شود — یعنی دقیقا همان TOCTOUی که این فایل برای کشتنش
   نوشته شده، بی‌صدا برمی‌گردد. */
async function releaseFallback(
  bookingId: string, userId: string, via: ReleaseVia,
): Promise<ReleaseResult> {
  const now = new Date().toISOString();

  const { data, error } = await sb().from('bookings')
    .update({
      booking_status: 'CANCELLED', status: 'cancelled',
      cancelled_at: now, cancellation_reason: REASON[via],
      expires_at: null, updatedAt: now,
    })
    .eq('id', bookingId).eq('userId', userId)
    .eq('booking_status', 'PENDING_PAYMENT').eq('payment_status', 'UNPAID')
    .select('id');

  if (error) { console.error('[release-hold] update:', error.message); return 'failed' }
  if (!Array.isArray(data) || data.length === 0) return 'noop';

  /* ترتیب مهم است: اگر اول اسلات را پاک می‌کردیم و بعد UPDATE شکست
     می‌خورد، ساعتِ یک رزروِ تأییدشده آزاد شده بود. */
  const del = await sb().from('booking_slots').delete().eq('booking_id', bookingId);
  if (del.error) {
    /* رزرو لغو شده ولی ساعتش آزاد نشده و هیچ کارِ خودکاری سراغش
       نمی‌رود. باید در پنل دیده شود، نه فقط در لاگ. */
    console.error('[release-hold] slots:', del.error.message);
    void audit({
      actorId: userId, action: 'BOOKING_SLOT_ORPHANED',
      entityType: 'booking', entityId: bookingId,
      newValue: { via, error: del.error.message },
    });
  }

  const pay = await sb().from('payments')
    .update({ status: 'CANCELED', updated_at: now })
    .eq('booking_id', bookingId).in('status', ['INITIATED', 'PENDING']);
  if (pay.error) console.error('[release-hold] payment:', pay.error.message);

  void audit({
    actorId: userId, action: 'BOOKING_HOLD_RELEASED',
    entityType: 'booking', entityId: bookingId, newValue: { via, fallback: true },
  });

  return 'released';
}
