-- ─────────────────────────────────────────────────────────────
-- ۱۰۹ — درستیِ پولِ مسابقات
--
-- ممیزیِ مسیرِ پرداختِ مسابقه، مثلِ ممیزیِ رزروِ باشگاه. هر مورد با
-- خواندنِ نسخه‌ی **مستقرِ** تابع (نه اولین تعریف) و دیتابیسِ زنده
-- تأیید شد، و یک دورِ بازبینیِ کامل رویش رفت.
--
-- ── ۱) تأییدِ پرداخت حفاظ‌هایش را گم کرده بود (۰۴۱ ← ۰۲۷) ──
-- ثبت‌نامِ لغوشده زنده می‌شد، مسابقه‌ی لغوشده ثبت‌نام می‌گرفت، ظرفیت
-- سنجیده نمی‌شد، و کدِ پیگیری و زمانِ پرداخت نوشته نمی‌شدند. تنها
-- پرداختِ آنلاینِ واقعیِ دیتابیس `provider_ref_id` و `paid_at` را NULL
-- دارد.
--
-- ── ۲) «پول رسید ولی صندلی نمی‌خرد» ردی نداشت ──
-- فقط یک خطِ ژورنال. حالا پرداخت و بازپرداختش هم‌زمان در دفتر ثبت
-- می‌شوند و یک درخواستِ بازپرداخت در صفِ ادمین می‌نشیند.
--
-- ── ۳) ثبت‌نامِ دوباره پولِ دورِ دوم را گم می‌کرد ──
-- ثبت‌نامِ دوباره (و بازگشت به صفِ انتظار) **همان ردیف** را
-- بازاستفاده می‌کند، ولی کلیدهای دفتر و بازپرداخت فقط از شناسه‌ی ردیف
-- ساخته می‌شدند و ایندکسِ «یک بازپرداختِ فعال» روی کلِ عمرِ ردیف بود.
-- پرداخت ⟵ انصراف ⟵ ثبت‌نامِ دوباره ⟵ پرداخت: پرداختِ دوم در دفتر
-- ننشست و بازپرداختِ دوم یا بی‌صدا افتاد یا با خطا شکست. ستونِ
-- `cycle`، `bh_treg_key` و ایندکسِ تازه‌ی `refunds` این را حل می‌کنند؛
-- برای cycle = 0 کلید دقیقا همان رشته‌ی قبلی است.
--
-- ── ۴) انقضا از created_at ──
-- ردیفِ بازاستفاده‌شده و ردیفِ ارتقایافته از صفِ انتظار created_at
-- قدیمی دارند؛ با اولین بارگذاریِ صفحه‌ی مسابقه منقضی می‌شدند. حالا
-- updated_at. ثبت‌نام هم مانده‌های همان مسابقه را پیش از شمارش آزاد
-- می‌کند.
--
-- ── ۵) لغوِ مسابقه و بازپرداختِ برگزارکننده صفِ بازپرداخت نمی‌ساختند ──
-- لغو فقط وضعیت را عوض می‌کرد؛ بازپرداختِ برگزارکننده REFUNDED می‌نوشت
-- ولی هیچ ردیفی در `refunds` نمی‌گذاشت، و حضوری‌ها را هم از دفتر
-- «پس می‌داد». `bh_tournament_cancel` تازه است و `bh_tournament_refund`
-- بازنویسی شده.
--
-- ── ۶) «نگه‌داشته» ورودیه‌ی حضوری را هم می‌شمرد ──
-- پولی که هرگز به دفتر نیامده؛ ناوردای پنلِ مالی را منفی نگه می‌داشت.
--
-- ── سازگاری ──
-- اپِ مستقرِ فعلی با این مهاجرت کار می‌کند: امضای هیچ تابعِ موجودی
-- عوض نشده، `bh_tournament_confirm_payment` (۰۴۱) دست نخورده، و پاسخِ
-- `ok:false`ِ تازه را کالبکِ فعلی به صفحه‌ی «مبلغ برمی‌گردد» می‌برد.
-- پس **اول این مهاجرت، بعد دیپلوی** — و دیپلوی بلافاصله بعدش.
--
-- ── اجرا ──
-- ⚠️ نه با `Get-Content | ssh`. PowerShell 5.1 در لوله به برنامه‌ی
-- بیرونی متن را ASCII می‌کند و هر حرفِ فارسی «?» می‌شود — و این فایل
-- متنِ فارسی در بدنه‌ی توابع ذخیره می‌کند (دلیلِ لغو، دلیلِ
-- بازپرداخت). خودآزماییِ پایینِ فایل این را می‌گیرد و کل کار را
-- برمی‌گرداند. راهِ درست: فایل را کپی کن و ریدایرکت را **روی سرور**
-- انجام بده:
--
--   scp -i "$env:USERPROFILE\.ssh\billiardhub_parspack" supabase/migrations/109_tournament_payment_integrity.sql root@130.185.72.87:/tmp/109.sql
--   ssh -i "$env:USERPROFILE\.ssh\billiardhub_parspack" root@130.185.72.87 "docker exec -i -e PGCLIENTENCODING=UTF8 supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < /tmp/109.sql"
--
-- (هر کدام تک‌خطی. `--single-transaction` عمدا نیست: فایل خودش
-- BEGIN/COMMIT دارد و با آن، COMMITِ داخلی تراکنشِ بیرونی را زودتر
-- می‌بست. ON_ERROR_STOP با خطا psql را می‌بندد و تراکنشِ باز برمی‌گردد.)
--
-- پیش از آن، روی کپیِ اسکیما (از Git Bash):
--   bash db-dryrun.sh supabase/migrations/109_tournament_payment_integrity.sql
--
-- اجرای دوباره بی‌خطر است.
--
-- ⚠️ این فایل با اسکریپت از روی متنِ مستقرِ هر تابع ساخته شده (۰۲۶،
-- ۰۳۳، ۰۴۱، ۰۹۴) و فقط جایگزینی‌های علامت‌خورده با «۱۰۹:» رویشان
-- اعمال شده. `bh_tournament_confirm` و `bh_tournament_refund`
-- بازنویسیِ کامل‌اند و `bh_tournament_cancel` تازه است.
-- ─────────────────────────────────────────────────────────────

SET lock_timeout = '3s';

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- ۱) شماره‌ی دور و کلیدِ دفتر
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tournament_registrations
  ADD COLUMN IF NOT EXISTS cycle integer NOT NULL DEFAULT 0;

/* ردیف‌هایی که **پیش از ۱۰۹** بازاستفاده شده‌اند کلیدِ پولیِ دورِ ۰ را از
   دورِ قبل دارند؛ اگر دور ۰ بمانند، پرداخت یا بازپرداختِ بعدی‌شان با همان
   کلید برخورد می‌کند و بی‌صدا می‌افتد. این‌ها به دورِ ۱ می‌روند؛ و ردیفِ
   در انتظار/صفی که PAID یا REFUNDEDِ مانده دارد (هرگز منقضی نمی‌شد)
   بازنشانی می‌شود. سیاهه‌ی ۷ مهر صفر ردیف داشت؛ این بند فاصله‌ی تا
   اجرا را می‌پوشاند و اجرای دوباره بی‌اثر است (دورِ ۱ دیگر نمی‌خورد). */
UPDATE public.tournament_registrations r
   SET cycle = 1,
       payment_status = CASE WHEN r.status IN ('PENDING_PAYMENT','WAITLIST')
                              AND r.payment_status IN ('PAID','REFUNDED')
                             THEN 'UNPAID' ELSE r.payment_status END,
       provider_authority = CASE WHEN r.status IN ('PENDING_PAYMENT','WAITLIST')
                                  AND r.payment_status IN ('PAID','REFUNDED')
                                 THEN NULL ELSE r.provider_authority END
 WHERE r.cycle = 0
   AND (   (r.status IN ('PENDING_PAYMENT','EXPIRED','CANCELLED','WAITLIST')
            AND (EXISTS (SELECT 1 FROM public.ledger_entries l
                          WHERE l.source_key IN ('treg:' || r.id || ':PAYMENT', 'treg:' || r.id || ':REFUND'))
              OR EXISTS (SELECT 1 FROM public.refunds f WHERE f.idempotency_key = 'treg:' || r.id)))
        OR (r.status IN ('PENDING_PAYMENT','WAITLIST') AND r.payment_status IN ('PAID','REFUNDED')));

COMMENT ON COLUMN public.tournament_registrations.cycle IS
  'registration cycle: re-registering after cancel/expire (or rejoining the waitlist) reuses the row with cycle+1; ledger and refund keys are built from it (bh_treg_key).';

/* کلیدِ یکتای هر دور. برای cycle = 0 **دقیقا** همان رشته‌ی قبلی است
   ('treg:' || id)، پس هیچ ردیفِ موجودی در دفتر یا بازپرداخت کلیدِ
   تازه نمی‌گیرد. */
CREATE OR REPLACE FUNCTION public.bh_treg_key(p_id uuid, p_cycle integer)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'treg:' || p_id::text
         || CASE WHEN COALESCE(p_cycle, 0) = 0 THEN '' ELSE '#' || p_cycle::text END
$$;

-- ─────────────────────────────────────────────────────────────
-- ۲) «یک بازپرداختِ فعال» — در هر دور، نه در کلِ عمرِ ردیف
--
-- ۰۴۰ روی refunds(tournament_registration_id) ایندکسِ یکتای «فعال»
-- گذاشته بود. با ردیفِ بازاستفاده‌شده، بازپرداختِ دورِ دوم به آن
-- می‌خورد و **خطا** می‌داد (ON CONFLICT فقط idempotency_key را
-- می‌گیرد): انصراف ۴۰۰ می‌شد، لغوِ مسابقه کلا می‌شکست، و پرداختِ
-- بی‌صندلی بی‌ردّ برمی‌گشت.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS registration_cycle integer;
UPDATE public.refunds SET registration_cycle = 0
 WHERE tournament_registration_id IS NOT NULL AND registration_cycle IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS refunds_treg_cycle_active_uidx
  ON public.refunds (tournament_registration_id, registration_cycle)
  WHERE tournament_registration_id IS NOT NULL AND status <> 'FAILED';
DROP INDEX IF EXISTS public.refunds_treg_active_uidx;

-- ─────────────────────────────────────────────────────────────
-- ۳) ثبت‌نام — ۰۲۶ + انقضای درجا + بازنشانیِ دور
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_register(
  p_tournament uuid,
  p_user uuid,
  p_player_name text,
  p_phone text
) RETURNS jsonb AS $$
DECLARE t record; v_taken integer; v_existing record; v_id uuid;
BEGIN
  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF t.status <> 'registration_open' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'registration_closed', 'status', t.status);
  END IF;

  IF t.registration_ends_at IS NOT NULL AND t.registration_ends_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'deadline_passed');
  END IF;

  /* ۱۰۹: سفارش‌های مانده‌ی همین مسابقه **پیش از شمارش** آزاد می‌شوند.
     پیش‌تر فقط وقتی آزاد می‌شدند که کسی ظرفیت را از صفحه می‌خواند یا
     کرونِ روزانه می‌رسید؛ تا آن موقع پرداخت‌های رهاشده «پر» حساب
     می‌شدند. پانزده دقیقه = PAYMENT_WINDOW_MINUTES در lib/tournaments. */
  UPDATE public.tournament_registrations
     SET status = 'EXPIRED', updated_at = now()
   WHERE tournament_id = p_tournament
     AND status = 'PENDING_PAYMENT'
     AND payment_status IN ('UNPAID','INITIATED','FAILED')
     AND updated_at < now() - interval '15 minutes';

  /* ثبت‌نامِ قبلیِ همین کاربر */
  SELECT * INTO v_existing FROM public.tournament_registrations
   WHERE tournament_id = p_tournament AND user_id = p_user;

  /* توجه: `v_existing IS NOT NULL` این‌جا کار نمی‌کند. برای یک RECORD
     این عبارت فقط وقتی درست است که **همه‌ی** ستون‌ها ناتهی باشند، و
     ستون‌هایی مثل paid_at همیشه NULL هستند. پس ردیفِ موجود «تهی»
     دیده می‌شد و مسیر به INSERT می‌رفت و به UNIQUE می‌خورد. */
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status IN ('CONFIRMED') THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_registered', 'registrationId', v_existing.id);
    END IF;
    IF v_existing.status = 'PENDING_PAYMENT' THEN
      /* سفارشِ باز — همان را برگردان تا کاربر پرداخت را ادامه دهد */
      RETURN jsonb_build_object('ok', true, 'resumed', true,
        'registrationId', v_existing.id, 'amount', v_existing.amount);
    END IF;
    /* لغوشده یا منقضی ⇒ اجازه‌ی ثبت‌نامِ دوباره با به‌روزرسانیِ همان ردیف */
  END IF;

  SELECT count(*) INTO v_taken FROM public.tournament_registrations
   WHERE tournament_id = p_tournament AND status IN ('PENDING_PAYMENT','CONFIRMED');

  IF v_taken >= t.max_players THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'full');
  END IF;

  /* توجه: `v_existing IS NOT NULL` این‌جا کار نمی‌کند. برای یک RECORD
     این عبارت فقط وقتی درست است که **همه‌ی** ستون‌ها ناتهی باشند، و
     ستون‌هایی مثل paid_at همیشه NULL هستند. پس ردیفِ موجود «تهی»
     دیده می‌شد و مسیر به INSERT می‌رفت و به UNIQUE می‌خورد. */
  IF v_existing.id IS NOT NULL THEN
    UPDATE public.tournament_registrations
       SET status = 'PENDING_PAYMENT', payment_status = CASE WHEN t.entry_fee = 0 THEN 'PAID' ELSE 'UNPAID' END,
           amount = t.entry_fee, player_name = p_player_name, contact_phone = p_phone,
           provider_authority = NULL, provider_ref_id = NULL, cancel_reason = NULL,
           /* ۱۰۹: دورِ تازه. کلیدهای دفتر و بازپرداخت از cycle ساخته
              می‌شوند؛ بدونِ آن، پرداخت و بازپرداختِ دورِ دوم با کلیدِ
              دورِ اول برخورد می‌کردند و ON CONFLICT DO NOTHING بی‌صدا
              می‌انداختشان. فیلدهای پولیِ دورِ قبل هم پاک می‌شوند. */
           cycle = cycle + 1, provider = NULL, paid_at = NULL,
           refund_amount = 0, refunded_at = NULL,
           commission_percent = NULL, commission_amount = 0, net_amount = 0,
           updated_at = now()
     WHERE id = v_existing.id
     RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.tournament_registrations
      (tournament_id, user_id, player_name, contact_phone, amount, status, payment_status)
    VALUES (p_tournament, p_user, p_player_name, p_phone, t.entry_fee,
            'PENDING_PAYMENT', CASE WHEN t.entry_fee = 0 THEN 'PAID' ELSE 'UNPAID' END)
    RETURNING id INTO v_id;
  END IF;

  /* مسابقه‌ی رایگان همان‌جا قطعی می‌شود */
  IF t.entry_fee = 0 THEN
    UPDATE public.tournament_registrations
       SET status = 'CONFIRMED', paid_at = now(), updated_at = now()
     WHERE id = v_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'registrationId', v_id, 'amount', t.entry_fee,
                            'free', t.entry_fee = 0);
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- ۴) صفِ انتظار — ۰۳۳ + بازنشانیِ دور
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_waitlist_join(
  p_tournament uuid,
  p_user       uuid,
  p_name       text,
  p_phone      text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t   record;
  v_ex  record;
  v_pos integer;
BEGIN
  SELECT id, status, max_players INTO v_t FROM tournaments WHERE id = p_tournament FOR UPDATE;
  IF v_t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'مسابقه یافت نشد');
  END IF;

  IF v_t.status NOT IN ('published','registration_open') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'closed',
      'message', 'ثبت‌نامِ این مسابقه باز نیست');
  END IF;

  /* رکوردِ قبلیِ همین کاربر — RECORD کامل NULL نیست حتی وقتی ردیف
     پیدا نشود، پس باید روی یک ستونِ NOT NULL بررسی شود. */
  SELECT id, status INTO v_ex
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND user_id = p_user;

  IF v_ex.id IS NOT NULL THEN
    IF v_ex.status = 'WAITLIST' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'already_waiting',
        'message', 'شما از قبل در لیستِ انتظار هستید');
    END IF;
    IF v_ex.status IN ('CONFIRMED','PENDING_PAYMENT') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'already_registered',
        'message', 'شما قبلاً در این مسابقه ثبت‌نام کرده‌اید');
    END IF;
    /* لغوشده/منقضی ⇒ همان رکورد به صف برمی‌گردد */
    SELECT COALESCE(max(waitlist_position), 0) + 1 INTO v_pos
      FROM tournament_registrations
     WHERE tournament_id = p_tournament AND status = 'WAITLIST';

    UPDATE tournament_registrations
       SET status = 'WAITLIST', waitlist_position = v_pos, waitlisted_at = now(),
           promoted_at = NULL, cancel_reason = NULL, updated_at = now(),
           /* ۱۰۹: بازگشتِ ردیفِ لغوشده/بازپرداخت‌شده به صف هم دورِ تازه
              است — مثلِ ثبت‌نامِ دوباره. بدونِ آن، پرداختِ پس از ارتقا با
              کلیدِ دورِ قبل برخورد می‌کرد و بی‌صدا از دفتر می‌افتاد؛
              payment_statusِ «REFUNDED»ِ مانده هرگز منقضی نمی‌شد؛ و
              authorityِ قدیمی راهِ تأییدِ یک تبِ کهنه‌ی درگاه را باز
              می‌گذاشت. */
           payment_status = 'UNPAID',
           provider_authority = NULL, provider_ref_id = NULL,
           cycle = cycle + 1, provider = NULL, paid_at = NULL,
           refund_amount = 0, refunded_at = NULL,
           commission_percent = NULL, commission_amount = 0, net_amount = 0,
           player_name = COALESCE(NULLIF(btrim(p_name), ''), player_name),
           contact_phone = COALESCE(NULLIF(btrim(p_phone), ''), contact_phone)
     WHERE id = v_ex.id;

    RETURN jsonb_build_object('ok', true, 'registrationId', v_ex.id, 'position', v_pos);
  END IF;

  SELECT COALESCE(max(waitlist_position), 0) + 1 INTO v_pos
    FROM tournament_registrations
   WHERE tournament_id = p_tournament AND status = 'WAITLIST';

  INSERT INTO tournament_registrations
    (tournament_id, user_id, player_name, contact_phone, status, payment_status,
     amount, waitlist_position, waitlisted_at)
  VALUES
    (p_tournament, p_user, NULLIF(btrim(p_name), ''), NULLIF(btrim(p_phone), ''),
     'WAITLIST', 'UNPAID', 0, v_pos, now());

  RETURN jsonb_build_object('ok', true, 'position', v_pos);
END $$;

-- ─────────────────────────────────────────────────────────────
-- ۵) انقضا — ۰۲۶، سن از updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_expire_pending(p_minutes integer DEFAULT 30)
RETURNS integer AS $$
DECLARE n integer;
BEGIN
  /* ۱۰۹: سن از updated_at سنجیده می‌شود، نه created_at. ثبت‌نامِ دوباره
     و ارتقا از صفِ انتظار **همان ردیف** را دوباره PENDING می‌کنند و
     created_at را دست نمی‌زنند — پس با created_at، کسی که همین حالا
     پشتِ درگاه بود با اولین بارگذاریِ صفحه‌ی مسابقه منقضی می‌شد، و
     نفرِ ارتقایافته پیش از رسیدنِ پیامکش. updated_at با شروعِ هر
     پرداخت (INITIATED) هم تازه می‌شود. */
  UPDATE public.tournament_registrations
     SET status = 'EXPIRED', updated_at = now()
   WHERE status = 'PENDING_PAYMENT'
     AND payment_status IN ('UNPAID','INITIATED','FAILED')
     AND updated_at < now() - make_interval(mins => p_minutes);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- ۶) تأییدِ پرداخت — بازنویسیِ ۰۴۱ با حفاظ‌های ۰۲۷
-- ─────────────────────────────────────────────────────────────
/* ── چرا بازنویسی ──
   ۰۴۱ این تابع را برای دفترِ مالی بازنوشت و در همان کار چهار حفاظِ
   ۰۲۷ را انداخت. نسخه‌ی ۰۴۱ فقط می‌پرسید «قبلا PAID شده؟» و بعد هر
   ثبت‌نامی را CONFIRMED می‌کرد:

     ۱) ثبت‌نامِ لغوشده یا بازپرداخت‌شده دوباره زنده می‌شد؛
     ۲) مسابقه‌ی لغوشده ثبت‌نامِ تازه می‌گرفت؛
     ۳) ظرفیت دیگر سنجیده نمی‌شد — پرداختِ دیرهنگامِ ثبت‌نامی که
        منقضی شده و صندلی‌اش به دیگری رسیده، از سقف رد می‌شد؛
     ۴) `provider_ref_id` و `paid_at` نوشته نمی‌شدند. تنها پرداختِ
        آنلاینِ واقعیِ دیتابیس (۷ مهر ۱۴۰۵) هر دو را NULL دارد: کدِ
        پیگیریِ پی‌پینگ که برای بازپرداخت و پیگیری لازم است، گم شده،
        و ایندکسِ یکتای ضدِتکرار روی ستونی نشسته که هیچ‌کس پرش نمی‌کند.

   این نسخه منطقِ پولیِ ۰۴۱ را عینا نگه می‌دارد (کمیسیون از
   `bh_commission_*`، کلیدِ دفتر، ON CONFLICT) و آن چهار را برمی‌گرداند.

   ── پرداختی که صندلی نمی‌خرد ──
   ۰۲۷ در این حالت فقط `ok:false` برمی‌گرداند و کالبک یک خطِ ژورنال
   می‌نوشت. پول در حسابِ مرکزی بود و **هیچ ردیفی** نه در دفتر، نه در
   صفِ بازپرداخت. حالا پول ثبت و همان‌جا بازپرداختش باز می‌شود (مثلِ
   «کالبکِ دیرهنگامِ» رزرو در ۰۴۱): TOURNAMENT_PAYMENT و REFUND هم‌مبلغ
   در دفتر، و یک ردیفِ REQUESTED در `refunds` برای ادمین.

   ── ترتیبِ قفل ──
   اول مسابقه، بعد ثبت‌نام — همان ترتیبِ `bh_tournament_register`.
   ۰۲۷ برعکس قفل می‌کرد؛ ثبت‌نامِ دوباره‌ی همان کاربر هم‌زمان با
   تأییدِ پرداختش می‌توانست بن‌بست بسازد. قفلِ مسابقه شمارشِ ظرفیت را
   هم اتمیک می‌کند: دو تأییدِ هم‌زمان برای آخرین صندلی هر دو رد نمی‌شوند. */
CREATE OR REPLACE FUNCTION public.bh_tournament_confirm(
  p_registration_id uuid, p_provider text, p_ref_id text, p_amount bigint
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r tournament_registrations; t tournaments; rule commission_rules;
        comm bigint; net bigint; v_tid uuid; v_taken integer;
        v_reason text; v_reason_fa text; v_key text;
        v_ref text := NULLIF(btrim(COALESCE(p_ref_id, '')), '');
BEGIN
  SELECT tournament_id INTO v_tid FROM tournament_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;
  SELECT * INTO t FROM tournaments WHERE id = v_tid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;
  SELECT * INTO r FROM tournament_registrations WHERE id = p_registration_id FOR UPDATE;

  /* Idempotency — کالبکِ تکراری یا رفرشِ صفحه‌ی بازگشت */
  IF r.payment_status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'idempotent', true, 'registrationId', r.id);
  END IF;
  /* ⚠️ در همین دور، REFUNDED یعنی پولِ شناسه‌ی ذخیره‌شده قبلا رسیده و
     بازپرداختش باز شده — **صرف‌نظر از کدِ پیگیری**. شرطِ «همان کد» کافی
     نبود: پی‌پینگ برای پرداختِ از قبل تأییدشده کد را از خودِ درخواست
     برمی‌گرداند، و پرداخت‌های پیش از ۱۰۹ اصلا کد ندارند؛ بازگشتِ
     تکراری با کدِ دیگر یک پرداخت/بازپرداختِ دوم می‌ساخت. */
  IF r.payment_status = 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'refund_pending', 'refundPending', true,
                              'idempotent', true, 'registrationId', r.id);
  END IF;

  IF p_amount IS DISTINCT FROM r.amount THEN RAISE EXCEPTION 'amount_mismatch'; END IF;

  /* ضدِ Replay: یک کدِ پیگیری فقط یک ثبت‌نام را تأیید می‌کند. این پولِ
     تازه نیست، پس چیزی در دفتر نوشته نمی‌شود. */
  IF v_ref IS NOT NULL AND EXISTS (
       SELECT 1 FROM tournament_registrations WHERE provider_ref_id = v_ref AND id <> r.id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'ref_reused', 'registrationId', r.id);
  END IF;

  /* آیا این پرداخت هنوز صندلی می‌خرد?
     • WAITLIST: ردیف از صف برگشته ولی هنوز ارتقا نیافته؛ پرداختِ یک
       تبِ قدیمیِ درگاه نباید از صف بپرد.
     • EXPIRED عمدا این‌جا نیست: پرداختِ دیرهنگام اگر جا باشد پذیرفته
       می‌شود (رفتارِ ۰۲۷) — ولی نه به قیمتِ کسی که هنوز در مهلتِ
       پرداختش است؛ برای ردیفِ منقضی، سفارش‌های باز هم پر حساب می‌شوند.
     • `ongoing` بسته است چون قرعه کشیده شده. */
  IF r.status IN ('CANCELLED', 'REFUNDED', 'WAITLIST') THEN
    v_reason := 'registration_closed';   v_reason_fa := 'پرداخت پس از لغوِ ثبت‌نام';
  ELSIF t.status IN ('cancelled', 'completed', 'ongoing') THEN
    v_reason := 'tournament_closed';     v_reason_fa := 'پرداخت پس از بسته‌شدنِ مسابقه';
  ELSE
    /* مانده‌های همین مسابقه پیش از شمارش — همان قاعده‌ی ثبت‌نام. وگرنه
       یک سفارشِ رهاشده‌ی نیم‌ساعته که هنوز کسی منقضی‌اش نکرده، پرداختِ
       دیرهنگامِ این ردیف را بی‌دلیل به بازپرداخت می‌فرستاد. خودِ این
       ردیف مستثناست. مسابقه بالاتر قفل شده. */
    UPDATE tournament_registrations
       SET status = 'EXPIRED', updated_at = now()
     WHERE tournament_id = t.id AND id <> r.id
       AND status = 'PENDING_PAYMENT'
       AND payment_status IN ('UNPAID','INITIATED','FAILED')
       AND updated_at < now() - interval '15 minutes';

    SELECT count(*) INTO v_taken FROM tournament_registrations
     WHERE tournament_id = t.id AND id <> r.id
       AND (status = 'CONFIRMED'
            OR (r.status = 'EXPIRED' AND status = 'PENDING_PAYMENT'));
    IF v_taken >= t.max_players THEN
      v_reason := 'full_after_payment';  v_reason_fa := 'پرداخت پس از تکمیلِ ظرفیت';
    END IF;
  END IF;

  v_key := public.bh_treg_key(r.id, r.cycle);

  IF v_reason IS NOT NULL THEN
    /* کلیدِ دفتر جدا از کلیدِ عادیِ دور — کدِ پیگیری برای هر پرداختِ
       واقعی یکتاست و کالبکِ تکراری همان را می‌سازد. درخواستِ بازپرداخت
       با کلیدِ دور ساخته می‌شود و `registration_cycle` دارد، تا ایندکسِ
       «یک بازپرداختِ فعال در هر دور» آن را بشناسد. */
    UPDATE tournament_registrations SET
      status = 'REFUNDED', payment_status = 'REFUNDED',
      provider = p_provider, provider_ref_id = v_ref, paid_at = now(),
      refund_amount = r.amount, refunded_at = now(),
      commission_amount = 0, net_amount = 0,
      cancel_reason = v_reason_fa, updated_at = now()
     WHERE id = r.id;

    /* پول آمد … */
    INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
    VALUES (t.club_id, r.user_id, 'TOURNAMENT_PAYMENT', r.amount,
            v_key || ':late:' || COALESCE(v_ref, '-') || ':PAYMENT',
            jsonb_build_object('source','tournament','registrationId', r.id,
                               'tournamentId', t.id, 'tournamentTitle', t.title,
                               'provider', p_provider, 'refId', v_ref, 'cycle', r.cycle,
                               'rejected', v_reason))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    /* … و همان‌قدر بدهکاریم. کلیدِ REFUND = کلیدِ درخواست + ':REFUND' —
       همان جفتی که `bh_finance_totals` برای «نگه‌داشته» می‌سنجد. */
    INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
    VALUES (t.club_id, r.user_id, 'REFUND', -r.amount, v_key || ':REFUND',
            jsonb_build_object('source','tournament','registrationId', r.id,
                               'tournamentId', t.id, 'reason', v_reason_fa,
                               'gross', r.amount, 'cycle', r.cycle, 'refId', v_ref))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    INSERT INTO refunds
      (tournament_registration_id, club_id, user_id, amount, gross_amount,
       cancellation_fee, reason, status, idempotency_key, registration_cycle)
    VALUES (r.id, t.club_id, r.user_id, r.amount, r.amount, 0,
            v_reason_fa, 'REQUESTED', v_key, r.cycle)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    RETURN jsonb_build_object('ok', false, 'reason', v_reason, 'refundPending', true,
                              'registrationId', r.id, 'amount', r.amount);
  END IF;

  rule := public.bh_commission_rule(t.club_id, 'TOURNAMENT');
  comm := public.bh_commission_for_ctx(t.club_id, r.amount, 'TOURNAMENT');
  net  := r.amount - comm;

  UPDATE tournament_registrations SET
    payment_status='PAID', status='CONFIRMED',
    provider = p_provider, provider_ref_id = v_ref, paid_at = now(),
    commission_percent = CASE WHEN rule.type='PERCENTAGE' THEN rule.value ELSE NULL END,
    commission_amount = comm, net_amount = net, updated_at = now()
   WHERE id = r.id RETURNING * INTO r;

  /* پول وارد حسابِ مرکزی شد */
  INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
  VALUES (t.club_id, r.user_id, 'TOURNAMENT_PAYMENT', r.amount,
          v_key || ':PAYMENT',
          jsonb_build_object('source','tournament','registrationId', r.id,
                             'tournamentId', t.id, 'tournamentTitle', t.title,
                             'provider', p_provider, 'refId', v_ref, 'cycle', r.cycle,
                             'commissionPlanned', comm, 'clubSharePlanned', net))
  ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

  INSERT INTO club_accounts (club_id) VALUES (t.club_id) ON CONFLICT (club_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'registrationId', r.id, 'amount', r.amount,
                            'commission', comm, 'net', net);
END $$;


-- ─────────────────────────────────────────────────────────────
-- ۷) پایانِ مسابقه — ۰۴۱، کلید از دور
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_complete(p_tournament_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE n int := 0; t tournaments; r record;
BEGIN
  SELECT * INTO t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'tournament_not_found'; END IF;

  FOR r IN SELECT * FROM tournament_registrations
            WHERE tournament_id = p_tournament_id AND payment_status = 'PAID'
              AND status <> 'CANCELLED'
  LOOP
    IF r.commission_amount > 0 THEN
      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'PLATFORM_COMMISSION', r.commission_amount,
              public.bh_treg_key(r.id, r.cycle) || ':COMMISSION',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'gross', r.amount,
                                 'commissionPercent', r.commission_percent))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;

    IF r.net_amount > 0 THEN
      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'CLUB_EARNING', r.net_amount,
              public.bh_treg_key(r.id, r.cycle) || ':CLUB_EARNING',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'gross', r.amount))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;
    n := n + 1;
  END LOOP;

  UPDATE tournaments SET status='completed', updated_at=now() WHERE id = p_tournament_id;
  PERFORM public.bh_reconcile_club_account(t.club_id);
  RETURN n;
END $$;

-- ─────────────────────────────────────────────────────────────
-- ۸) انصرافِ بازیکن — ۰۹۴، کلید و دورِ بازپرداخت
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_tournament_self_cancel(
  p_registration uuid,
  p_user         uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r record; t record; v_deadline timestamptz; v_hours numeric; pay payments;
BEGIN
  SELECT * INTO r FROM public.tournament_registrations
   WHERE id = p_registration FOR UPDATE;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF r.user_id IS NULL OR r.user_id <> p_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_yours');
  END IF;

  IF r.status IN ('CANCELLED', 'REFUNDED', 'EXPIRED') THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = r.tournament_id;
  IF t.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tournament_matches WHERE tournament_id = t.id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bracket_drawn');
  END IF;

  v_deadline := coalesce(t.registration_ends_at, t.starts_at);
  IF v_deadline IS NOT NULL THEN
    v_hours := extract(epoch FROM (v_deadline - now())) / 3600.0;
    IF v_hours < 4 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'too_late',
        'hoursLeft', round(v_hours, 1));
    END IF;
  END IF;

  IF r.payment_status = 'PAID' THEN
    UPDATE public.tournament_registrations
       SET status = 'REFUNDED', payment_status = 'REFUNDED',
           refund_amount = r.amount, refunded_at = now(),
           cancel_reason = 'انصراف بازیکن', updated_at = now()
     WHERE id = p_registration;

    SELECT * INTO pay FROM public.payments
     WHERE tournament_registration_id = r.id AND status = 'PAID'
     ORDER BY paid_at DESC LIMIT 1;

    /* پول از حسابِ مرکزی خارج می‌شود */
    INSERT INTO public.ledger_entries
      (payment_id, club_id, user_id, type, amount, source_key, meta)
    VALUES (pay.id, t.club_id, r.user_id, 'REFUND', -r.amount,
            public.bh_treg_key(r.id, r.cycle) || ':REFUND',
            jsonb_build_object('source','tournament', 'registrationId', r.id,
                               'tournamentId', t.id, 'reason','انصراف بازیکن',
                               'gross', r.amount))
    ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

    /* و در صفِ دستورِ پرداختِ ادمین می‌نشیند */
    INSERT INTO public.refunds
      (tournament_registration_id, payment_id, club_id, user_id, amount, gross_amount,
       cancellation_fee, reason, status, idempotency_key, registration_cycle)
    VALUES (r.id, pay.id, t.club_id, r.user_id, r.amount, r.amount, 0,
            'انصراف بازیکن از مسابقه', 'REQUESTED', public.bh_treg_key(r.id, r.cycle), r.cycle)
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    PERFORM public.bh_reconcile_club_account(t.club_id);
    RETURN jsonb_build_object('ok', true, 'refunded', r.amount);
  END IF;

  UPDATE public.tournament_registrations
     SET status = 'CANCELLED', cancel_reason = 'انصراف بازیکن', updated_at = now()
   WHERE id = p_registration;
  RETURN jsonb_build_object('ok', true, 'refunded', 0);
END $$;

-- ─────────────────────────────────────────────────────────────
-- ۹) بازپرداختِ برگزارکننده — بازنویسیِ ۰۲۷
-- ─────────────────────────────────────────────────────────────
/* ── بازپرداخت توسط برگزارکننده — بازنویسیِ ۰۲۷ ──
   نسخه‌ی ۰۲۷ (هنوز مستقر) سه مشکل داشت:

     ۱) **هیچ ردیفی در `refunds` نمی‌ساخت.** وضعیت REFUNDED می‌شد و
        بازیکن پیامِ بازپرداخت می‌گرفت، ولی صفِ پرداختِ ادمین خالی
        می‌ماند — یعنی پولی که کسی برنمی‌گرداند.
     ۲) ثبت‌نامِ **حضوری** را هم با ردیفِ REFUND در دفتر می‌نوشت —
        برگرداندنِ پولی که هرگز به حسابِ مرکزی نیامده بود.
     ۳) ردیفِ دفتر کلیدِ یکتا نداشت و «قبلا بازپرداخت شده؟» را با هر
        REFUNDی برای همین شناسه در **هر دوری** می‌سنجید؛ و سهمِ باشگاه و
        کمیسیونِ همه‌ی دورها را REVERSED می‌کرد.

   حالا: فقط پرداختِ آنلاین به دفتر و صفِ بازپرداخت می‌رود؛ کلیدها از
   دورِ جاری؛ معکوس‌کردنِ سهمِ باشگاه فقط برای همین دور (اگر مسابقه
   تمام شده و ثبت شده باشد)؛ و موجودیِ باشگاه بازساخته می‌شود.

   اگر مبلغ کمتر از کل باشد، باقی‌مانده CANCELLATION_FEE ثبت می‌شود تا
   دفتر جمعش بخواند. مسیرِ اپ همیشه کامل بازپرداخت می‌کند. */
CREATE OR REPLACE FUNCTION public.bh_tournament_refund(
  p_registration uuid, p_amount integer, p_reason text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r tournament_registrations; t tournaments; v_tid uuid;
        v_refund bigint; v_key text; v_online boolean;
BEGIN
  SELECT tournament_id INTO v_tid FROM tournament_registrations WHERE id = p_registration;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  SELECT * INTO t FROM tournaments WHERE id = v_tid FOR UPDATE;
  SELECT * INTO r FROM tournament_registrations WHERE id = p_registration FOR UPDATE;

  IF r.status = 'REFUNDED' OR r.payment_status = 'REFUNDED' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true);
  END IF;
  IF r.payment_status <> 'PAID' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_paid');
  END IF;
  /* ⚠️ پس از پایانِ مسابقه، سهمِ باشگاه درآمدِ قطعی است و شاید تسویه هم
     شده باشد. بازپرداختِ برگزارکننده در آن حالت یعنی باشگاه‌دار خودش
     سهمِ پرداخت‌شده‌اش و کمیسیونِ پلتفرم را برگرداند و موجودی منفی
     شود — تصمیمی که با ادمین است، نه با این مسیر. پیش از ۱۰۹ همین
     معکوس‌کردن بود ولی چون درخواستِ بازپرداختی ساخته نمی‌شد، پولی
     جابه‌جا نمی‌شد؛ حالا واقعی است، پس بسته می‌شود. */
  IF t.status = 'completed' AND COALESCE(r.source, 'online') <> 'offline' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'completed');
  END IF;

  v_refund := LEAST(GREATEST(COALESCE(p_amount, r.amount), 0), r.amount);
  v_online := COALESCE(r.source, 'online') <> 'offline' AND r.amount > 0;
  v_key    := public.bh_treg_key(r.id, r.cycle);

  UPDATE tournament_registrations
     SET status = 'REFUNDED', payment_status = 'REFUNDED',
         refund_amount = v_refund, refunded_at = now(),
         cancel_reason = p_reason, updated_at = now()
   WHERE id = r.id;

  IF v_online THEN
    /* اگر مسابقه تمام شده، سهمِ باشگاه و کمیسیونِ **همین دور** در دفتر
       نشسته؛ برگشتِ پول یعنی آن‌ها دیگر درآمد نیستند. تنها گذرِ مجازِ
       تریگرِ ۰۴۰: POSTED → REVERSED بدونِ تغییرِ ستونِ دیگر. */
    UPDATE ledger_entries SET status = 'REVERSED'
     WHERE source_key IN (v_key || ':COMMISSION', v_key || ':CLUB_EARNING')
       AND status = 'POSTED';

    IF v_refund > 0 THEN
      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'REFUND', -v_refund, v_key || ':REFUND',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'reason', p_reason,
                                 'gross', r.amount, 'cycle', r.cycle, 'byOrganizer', true))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

      INSERT INTO refunds
        (tournament_registration_id, club_id, user_id, amount, gross_amount,
         cancellation_fee, reason, status, idempotency_key, registration_cycle)
      VALUES (r.id, t.club_id, r.user_id, v_refund, r.amount, r.amount - v_refund,
              COALESCE(p_reason, 'بازپرداخت توسط برگزارکننده'), 'REQUESTED', v_key, r.cycle)
      ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
    END IF;

    IF r.amount > v_refund THEN
      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'CANCELLATION_FEE', r.amount - v_refund, v_key || ':FEE',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'cycle', r.cycle))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;
    END IF;

    PERFORM public.bh_reconcile_club_account(t.club_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'refunded', v_refund, 'online', v_online);
END $$;


-- ─────────────────────────────────────────────────────────────
-- ۱۰) جمع‌های مالی — ۰۹۴
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_finance_totals(
  p_from timestamptz DEFAULT NULL,
  p_to   timestamptz DEFAULT NULL,
  p_club uuid        DEFAULT NULL,
  p_with_held boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE j jsonb; held bigint;
BEGIN
  SELECT jsonb_object_agg(t, s) INTO j FROM (
    SELECT type AS t, COALESCE(SUM(amount), 0) AS s
      FROM public.ledger_entries
     WHERE status = 'POSTED'
       AND (p_from IS NULL OR created_at >= p_from)
       AND (p_to   IS NULL OR created_at <= p_to)
       AND (p_club IS NULL OR club_id = p_club)
     GROUP BY type) x;

  /* کمیسیون به تفکیکِ منبع — برای «از رزرو» و «از مسابقات» */
  SELECT COALESCE(j, '{}'::jsonb) || jsonb_build_object(
    'COMMISSION_RESERVATION', COALESCE((
      SELECT SUM(amount) FROM public.ledger_entries
       WHERE status='POSTED' AND type IN ('PLATFORM_COMMISSION','PLATFORM_COMMISSION_REVERSAL')
         AND COALESCE(meta->>'source','reservation') = 'reservation'
         AND (p_from IS NULL OR created_at >= p_from)
         AND (p_to   IS NULL OR created_at <= p_to)
         AND (p_club IS NULL OR club_id = p_club)), 0),
    'COMMISSION_TOURNAMENT', COALESCE((
      SELECT SUM(amount) FROM public.ledger_entries
       WHERE status='POSTED' AND type IN ('PLATFORM_COMMISSION','PLATFORM_COMMISSION_REVERSAL')
         AND meta->>'source' = 'tournament'
         AND (p_from IS NULL OR created_at >= p_from)
         AND (p_to   IS NULL OR created_at <= p_to)
         AND (p_club IS NULL OR club_id = p_club)), 0)
  ) INTO j;

  IF NOT p_with_held THEN RETURN COALESCE(j, '{}'::jsonb); END IF;

  /* ── پولی که نگه داشته‌ایم و هنوز تکلیفش روشن نیست ──
     چهار منبع دارد و هر چهار باید بیایند، وگرنه ناوردایِ گزارش ذاتا
     ناصفر می‌شود و هشدارِ «ناترازی دفتر» همیشه روشن می‌ماند:

       ۱) رزروِ پرداخت‌شده‌ای که هنوز برگزار نشده (CONFIRMED)
       ۲) رزروی که مشتری نیامده (NO_SHOW) — هنوز نه درآمد است نه بدهی
       ۳) ثبت‌نامِ پرداخت‌شده‌ی مسابقه‌ای که هنوز `completed` نشده
       ۴) بدهیِ بازپرداختی که هنوز ردیفِ REFUND در دفتر ندارد

     ⚠️ موردِ چهارم از مسیرِ «کالبکِ دیرهنگام» (۰۴۱) می‌آید: پول رسیده،
     رزرو منقضی شده، یک ردیفِ `refunds` ساخته می‌شود ولی هیچ
     `REFUND`ی در دفتر نوشته نمی‌شود. بدونِ این بند، هر کالبکِ
     دیرهنگام ناوردا را برای همیشه به‌اندازه‌ی همان پرداخت خراب می‌کرد.

     ⚠️ `HELD` عمدا **کلِ تاریخ** است و به `p_from/p_to` توجه نمی‌کند:
     «چقدر همین حالا نگه داشته‌ایم» یک وضعیتِ لحظه‌ای است، نه جریانِ
     یک بازه. فراخوان باید در گزارشِ بازه‌ای نادیده‌اش بگیرد. */
  SELECT COALESCE(SUM(final_amount), 0) INTO held FROM public.bookings
   WHERE payment_status = 'PAID' AND booking_status IN ('CONFIRMED','NO_SHOW')
     AND (p_club IS NULL OR "clubId" = p_club);

  SELECT held + COALESCE(SUM(r.amount), 0) INTO held
    FROM public.tournament_registrations r
    JOIN public.tournaments t ON t.id = r.tournament_id
   WHERE r.payment_status = 'PAID' AND r.status <> 'CANCELLED'
     AND t.status <> 'completed'
     /* ۱۰۹: ثبت‌نامِ حضوری پولش نقدی به باشگاه رفته و هرگز در دفتر
        نیامده؛ شمردنش در «نگه‌داشته» ناوردا را به اندازه‌ی همه‌ی
        ورودیه‌های حضوریِ مسابقه‌های تمام‌نشده منفی می‌کرد. */
     AND COALESCE(r.source, 'online') <> 'offline'
     AND (p_club IS NULL OR t.club_id = p_club);

  SELECT held + COALESCE(SUM(f.amount), 0) INTO held
    FROM public.refunds f
   WHERE f.status <> 'FAILED'
     AND (p_club IS NULL OR f.club_id = p_club)
     AND NOT EXISTS (
       SELECT 1 FROM public.ledger_entries l
        WHERE l.type = 'REFUND' AND l.status = 'POSTED'
          AND ((f.booking_id IS NOT NULL AND l.booking_id = f.booking_id)
            OR (f.tournament_registration_id IS NOT NULL
                /* ۱۰۹: از کلیدِ خودِ بازپرداخت، نه بازسازیِ آن از شناسه —
                   تا دورِ دوم (cycle ≥ ۱) هم درست جفت شود. برای ردیف‌های
                   موجود دقیقا همان رشته است: هر دو نویسنده‌ی قبلی
                   idempotency_key = 'treg:' || id می‌گذاشتند. */
                AND l.source_key = COALESCE(f.idempotency_key,
                      'treg:' || f.tournament_registration_id) || ':REFUND')));

  RETURN COALESCE(j, '{}'::jsonb) || jsonb_build_object('HELD', held);
END $$;

-- ─────────────────────────────────────────────────────────────
-- ۱۱) لغوِ مسابقه — تازه
-- ─────────────────────────────────────────────────────────────
/* ── لغوِ مسابقه — اتمیک، با بازپرداخت ──
   تا امروز «لغو» در هر دو مسیر (`DELETE /tournaments/:id` و
   `PATCH /tournaments/:id/status`) فقط یک UPDATE روی وضعیتِ مسابقه
   بود. ثبت‌نام‌های پرداخت‌شده CONFIRMED/PAID می‌ماندند، هیچ ردیفی در
   صفِ بازپرداخت ساخته نمی‌شد، و `bh_finance_totals` پولشان را برای
   همیشه «نگه‌داشته» می‌شمرد. یعنی بازیکنی که پول داده بود فقط اگر
   ادمین خودش متوجه می‌شد پولش را پس می‌گرفت.

   ⚠️ فقط پرداختِ **آنلاین** بازپرداخت می‌شود. ثبت‌نامِ حضوری
   (`source = 'offline'`) پولش را نقدی به باشگاه داده و هرگز به حسابِ
   مرکزی نیامده. مسابقه‌ی رایگان (amount = 0) هم چیزی برای برگرداندن
   ندارد.

   مسابقه‌ی **از قبل لغوشده** هم پردازش می‌شود: اگر با نسخه‌ی قدیمی
   لغو شده باشد، ثبت‌نام‌هایش هنوز CONFIRMED/PAID‌اند و بازپرداخت
   ندارند. حلقه Idempotent است؛ `idempotent: true` فقط به فراخوان
   می‌گوید دوباره پیامک نفرستد.

   `notify` کاربرانی است که **پیش از** این لغو ثبت‌نامِ قطعی داشتند —
   بعدش هیچ ردیفی CONFIRMED نیست و خواندن از جدول کسی را پیدا نمی‌کند. */
CREATE OR REPLACE FUNCTION public.bh_tournament_cancel(
  p_tournament uuid,
  p_reason     text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE t tournaments; r tournament_registrations; v_key text;
        v_reason text := COALESCE(NULLIF(btrim(p_reason), ''), 'لغوِ مسابقه توسط برگزارکننده');
        v_already boolean;
        n_refunded int := 0; n_cancelled int := 0; v_total bigint := 0;
        v_notify uuid[] := '{}';
BEGIN
  SELECT * INTO t FROM tournaments WHERE id = p_tournament FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  /* مسابقه‌ی تمام‌شده سهمِ باشگاه و کمیسیونش در دفتر نشسته؛ لغوش یعنی
     برگرداندنِ پولی که درآمد شده — کارِ این تابع نیست. */
  IF t.status = 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'completed');
  END IF;
  v_already := t.status = 'cancelled';

  FOR r IN
    SELECT * FROM tournament_registrations
     WHERE tournament_id = p_tournament
       AND status NOT IN ('CANCELLED', 'REFUNDED', 'EXPIRED')
     ORDER BY created_at
     FOR UPDATE
  LOOP
    IF r.status = 'CONFIRMED' AND r.user_id IS NOT NULL THEN
      v_notify := array_append(v_notify, r.user_id);
    END IF;

    IF r.payment_status = 'PAID' AND r.amount > 0
       AND COALESCE(r.source, 'online') <> 'offline' THEN
      v_key := public.bh_treg_key(r.id, r.cycle);

      UPDATE tournament_registrations SET
        status = 'REFUNDED', payment_status = 'REFUNDED',
        refund_amount = r.amount, refunded_at = now(),
        cancel_reason = v_reason, updated_at = now()
       WHERE id = r.id;

      INSERT INTO ledger_entries (club_id, user_id, type, amount, source_key, meta)
      VALUES (t.club_id, r.user_id, 'REFUND', -r.amount, v_key || ':REFUND',
              jsonb_build_object('source','tournament','registrationId', r.id,
                                 'tournamentId', t.id, 'reason', v_reason,
                                 'gross', r.amount, 'cycle', r.cycle,
                                 'tournamentCancelled', true))
      ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO NOTHING;

      INSERT INTO refunds
        (tournament_registration_id, club_id, user_id, amount, gross_amount,
         cancellation_fee, reason, status, idempotency_key, registration_cycle)
      VALUES (r.id, t.club_id, r.user_id, r.amount, r.amount, 0,
              v_reason, 'REQUESTED', v_key, r.cycle)
      ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

      n_refunded := n_refunded + 1;
      v_total := v_total + r.amount;
    ELSE
      /* پرداخت‌نشده، در انتظارِ پرداخت، صفِ انتظار، یا حضوری */
      UPDATE tournament_registrations SET
        status = 'CANCELLED', cancel_reason = v_reason, updated_at = now()
       WHERE id = r.id;
      n_cancelled := n_cancelled + 1;
    END IF;
  END LOOP;

  IF NOT v_already THEN
    UPDATE tournaments SET status = 'cancelled', updated_at = now() WHERE id = p_tournament;
  END IF;
  PERFORM public.bh_reconcile_club_account(t.club_id);

  RETURN jsonb_build_object('ok', true, 'idempotent', v_already,
                            'refunded', n_refunded, 'refundTotal', v_total,
                            'cancelled', n_cancelled, 'notify', to_jsonb(v_notify));
END $$;


REVOKE ALL ON FUNCTION public.bh_treg_key(uuid, integer)                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_register(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_waitlist_join(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_expire_pending(integer)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_confirm(uuid, text, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_complete(uuid)                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_self_cancel(uuid, uuid)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_refund(uuid, integer, text)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_finance_totals(timestamptz, timestamptz, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bh_tournament_cancel(uuid, text)               FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- ۱۲) جارو: مسابقه‌هایی که با نسخه‌ی قدیم لغو شدند و پرداختِ آنلاینشان
--     هنوز بازپرداخت ندارد. سیاهه‌ی ۷ مهر صفر بود؛ این بند برای
--     فاصله‌ی میانِ این مهاجرت و دیپلوی است، و اجرای دوباره بی‌خطر است.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE x record; n int := 0;
BEGIN
  FOR x IN
    SELECT DISTINCT tr.tournament_id AS id
      FROM public.tournament_registrations tr
      JOIN public.tournaments t ON t.id = tr.tournament_id
     WHERE t.status = 'cancelled'
       AND tr.payment_status = 'PAID' AND tr.amount > 0
       AND COALESCE(tr.source, 'online') <> 'offline'
       AND tr.status NOT IN ('CANCELLED', 'REFUNDED', 'EXPIRED')
  LOOP
    PERFORM public.bh_tournament_cancel(x.id, NULL);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'cancelled tournaments swept for refunds: %', n;
END $$;

-- ─────────────────────────────────────────────────────────────
-- خودآزمایی — پیش از COMMIT
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE u uuid := '00000000-0000-4000-8000-000000000001'; f text;
BEGIN
  IF public.bh_treg_key(u, 0) || ':PAYMENT' <> 'treg:' || u || ':PAYMENT' THEN
    RAISE EXCEPTION 'ABORT: bh_treg_key(id, 0) is not the legacy key';
  END IF;
  IF public.bh_treg_key(u, 0) <> 'treg:' || u THEN
    RAISE EXCEPTION 'ABORT: refund idempotency key changed for cycle 0';
  END IF;
  IF public.bh_treg_key(u, 2) <> 'treg:' || u || '#2' THEN
    RAISE EXCEPTION 'ABORT: cycle key format';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'refunds_treg_cycle_active_uidx')
     OR EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'refunds_treg_active_uidx') THEN
    RAISE EXCEPTION 'ABORT: refunds unique index was not swapped';
  END IF;

  /* ⚠️ کدگذاری. متنِ فارسیِ این فایل در بدنه‌ی توابع ذخیره می‌شود
     (cancel_reason، دلیلِ بازپرداخت). لوله‌ی PowerShell 5.1 آن را «?»
     می‌کند و هیچ خطایی نمی‌دهد. «لغو» این‌جا از کدِ نویسه‌ها ساخته
     می‌شود — اگر از متنِ فایل بود، همراهِ بقیه خراب می‌شد و آزمون
     دروغی سبز می‌ماند. */
  IF NOT EXISTS (SELECT 1 FROM pg_proc
                  WHERE proname = 'bh_tournament_cancel'
                    AND prosrc LIKE '%' || chr(1604) || chr(1594) || chr(1608) || '%') THEN
    RAISE EXCEPTION 'ABORT: Persian text arrived corrupted (encoding). Copy the file with scp and run it on the server; do not pipe it through PowerShell.';
  END IF;

  /* فقط گزارش: توابعِ قدیمی‌تری که شاید با همان لوله خراب شده‌اند */
  FOR f IN SELECT proname FROM pg_proc
            WHERE pronamespace = 'public'::regnamespace AND prosrc LIKE '%????%'
            ORDER BY 1
  LOOP
    RAISE NOTICE 'NOTE: function % contains "????" - an earlier migration may have lost its Persian text', f;
  END LOOP;

  RAISE NOTICE '109 self-test passed';
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
