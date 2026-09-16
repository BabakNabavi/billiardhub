-- ═══════════════════════════════════════════════════════════════════════════
-- ۰۹۶ — آزادسازیِ اتمیکِ یک هولدِ پرداخت‌نشده
--
-- ── مسئله ──
-- وقتی کاربر به درگاه می‌رود و پرداخت نمی‌کند، ساعتِ میز باید فورا آزاد
-- شود. این کار سه نوشتن دارد: لغوِ رزرو، حذفِ اسلات، بستنِ نشستِ درگاه.
-- انجامشان از سمتِ اپ یعنی سه درخواستِ جدا با سه تراکنشِ جدا:
--
--   ۱) اگر بینِ «خواندنِ وضعیت» و «لغو» کالبکِ درگاه برسد، رزروِ
--      پرداخت‌شده لغو می‌شود. با `bh_cancel_booking(id, 0, …)` نتیجه
--      فاجعه است: کلِ مبلغ `CANCELLATION_FEE` می‌شود، `refund_status`
--      روی NONE می‌ماند و پولِ کاربر نزدِ ما می‌ماند.
--
--   ۲) اگر لغو موفق شود ولی حذفِ اسلات شکست بخورد، ردیفِ `booking_slots`
--      برای همیشه می‌ماند. هیچ‌چیز آن را جمع نمی‌کند: `bh_expire_bookings`
--      فقط رزروهای PENDING_PAYMENT را می‌بیند و `bh_cancel_booking` روی
--      رزروِ CANCELLED همان اول برمی‌گردد. یعنی آن ساعت از آن روز به بعد
--      برای همه‌ی کاربران غیرقابلِ فروش می‌شود.
--
-- ── راه‌حل ──
-- هر سه نوشتن در یک تراکنش، پشتِ یک قفلِ ردیف. شرطِ مالکیت و
-- پرداخت‌نشده‌بودن پس از گرفتنِ قفل دوباره بررسی می‌شود، پس مسابقه با
-- `bh_confirm_payment` — که خودش هم `FOR UPDATE` می‌گیرد — همیشه به نفعِ
-- پرداخت تمام می‌شود.
--
-- عمدا شبیهِ `bh_cancel_booking` نیست: برای هولدی که هرگز پولی بابتش
-- نیامده هیچ اثرِ مالی‌ای وجود ندارد — نه دفترِ مالی، نه کارمزد، نه
-- reconcile. هر کدام از این‌ها این‌جا یعنی باگ.
--
-- بی‌خطر برای اجرای دوباره: فقط CREATE OR REPLACE FUNCTION.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.bh_release_hold(
  p_booking_id uuid,
  p_user_id    uuid,
  p_reason     text
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE b bookings;
BEGIN
  /* بیش از چند ثانیه انتظار بی‌معناست: این مسیر در حلقه‌ی درخواستِ
     کاربر است و اگر ردیف قفل باشد یعنی کالبک دارد کارش را می‌کند —
     که دقیقا همان حالتی است که نباید مزاحمش شویم. */
  SET LOCAL lock_timeout = '4s';

  /* ⚠️ ترتیبِ قفل‌ها باید با `bh_confirm_payment` یکی باشد: آن‌جا اول
     `payments` قفل می‌شود و بعد `bookings`. اگر این‌جا برعکس باشد،
     «انصراف» و کالبکِ درگاه روی یک رزرو یک چرخه‌ی بن‌بست می‌سازند و
     پستگرس یکی را می‌کشد (deadlock_timeout یک ثانیه است، زودتر از
     lock_timeout). اگر قربانی تأییدِ پرداخت باشد، کارت شارژ شده ولی
     کلِ تراکنشِ تأیید برمی‌گردد: نه ردیفِ PAID، نه دفترِ مالی، نه
     ردیفِ بازپرداخت. پس همان ترتیب گرفته می‌شود، حتی اگر این‌جا
     ردیفِ پرداختی وجود نداشته باشد. */
  PERFORM 1 FROM payments WHERE booking_id = p_booking_id ORDER BY id FOR UPDATE;

  SELECT * INTO b FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  /* هر سه شرط زیرِ قفل. مالکیت هم این‌جاست تا فرستادنِ شناسه‌ی رزروِ
     دیگری از سمتِ کلاینت هیچ اثری نداشته باشد. */
  IF b."userId"        IS DISTINCT FROM p_user_id THEN RETURN false; END IF;
  IF b.booking_status  <> 'PENDING_PAYMENT'       THEN RETURN false; END IF;
  IF b.payment_status  <> 'UNPAID'                THEN RETURN false; END IF;

  UPDATE bookings SET
    booking_status      = 'CANCELLED',
    status              = 'cancelled',
    cancelled_at        = now(),
    cancellation_reason = p_reason,
    expires_at          = NULL,
    "updatedAt"         = now()
   WHERE id = b.id;

  /* ساعت آزاد می‌شود — در همان تراکنش، پس یا هر دو یا هیچ‌کدام */
  DELETE FROM booking_slots WHERE booking_id = b.id;

  /* نشستِ بازِ درگاه بسته می‌شود تا تلاشِ بعدی authorityِ مرده را دوباره
     به کار نگیرد. شرطِ وضعیت نگه می‌دارد که پرداختِ PAID دست نخورد. */
  UPDATE payments SET status = 'CANCELED', updated_at = now()
   WHERE booking_id = b.id AND status IN ('INITIATED', 'PENDING');

  RETURN true;
END $$;

/* مثل بقیه‌ی توابعِ bh_: از مسیرِ عمومی قابلِ صدا زدن نباشد. حلقه‌ی
   کلیِ ۰۲۲ فقط توابعِ آن‌زمان را پوشش داده، پس این‌جا صریح می‌آید. */
REVOKE ALL ON FUNCTION public.bh_release_hold(uuid, uuid, text) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.bh_release_hold(uuid, uuid, text) IS
  'آزادسازیِ اتمیکِ هولدِ پرداخت‌نشده. فقط مالکِ رزرو و فقط روی PENDING_PAYMENT/UNPAID. true یعنی همین فراخوانی ساعت را آزاد کرد.';
