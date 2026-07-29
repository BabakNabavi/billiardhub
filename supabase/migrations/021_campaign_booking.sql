-- ─────────────────────────────────────────────────────────────────
-- ۰۲۱ — رزرو و پرداختِ تبلیغ (فاز ۶)
--
-- چرخه‌ی خرید:
--   انتخابِ جایگاه → انتخابِ پلن → محاسبه‌ی قیمت در سرور → ساختِ سفارش
--   → درگاه → verify سرورساید → PENDING_REVIEW → تأییدِ ادمین
--   → SCHEDULED/ACTIVE → EXPIRED (خودکار با کران)
--
-- قیمت هرگز از کلاینت خوانده نمی‌شود؛ همیشه از ردیفِ پلن در همین
-- دیتابیس. فعال‌سازی هم اتمیک و ایدمپوتنت است تا کالبکِ تکراری دو بار
-- اثر نگذارد — همان الگویی که در bh_activate_ad_plan اثبات شده.
-- ─────────────────────────────────────────────────────────────────

-- ── وضعیتِ REFUNDED برای سفارش‌ها ───────────────────────────────
ALTER TABLE public.campaign_orders DROP CONSTRAINT IF EXISTS campaign_orders_status_chk;
ALTER TABLE public.campaign_orders
  ADD CONSTRAINT campaign_orders_status_chk
  CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED'));

-- مدتِ خریداری‌شده باید در خودِ سفارش بماند: پلن ممکن است بعداً عوض
-- شود ولی سفارشِ ثبت‌شده باید همان چیزی بماند که کاربر پول داده.
ALTER TABLE public.campaign_orders ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 30;

-- فهرستِ سفارش‌های کاربر در داشبوردِ تبلیغ‌دهنده
CREATE INDEX IF NOT EXISTS campaign_orders_user_idx
  ON public.campaign_orders (user_id, created_at DESC);

-- ── فعال‌سازیِ اتمیکِ سفارشِ کمپین ──────────────────────────────
CREATE OR REPLACE FUNCTION public.bh_activate_campaign(p_order_id uuid, p_ref text)
RETURNS jsonb AS $$
DECLARE o record; c record; v_used integer; v_cap integer;
BEGIN
  SELECT * INTO o FROM public.campaign_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  /* قبلاً پرداخت شده ⇒ همان نتیجه، بدونِ اثرِ دوباره (کالبکِ تکراری) */
  IF o.status = 'PAID' THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'campaign_id', o.campaign_id);
  END IF;

  IF o.campaign_id IS NULL THEN RAISE EXCEPTION 'campaign_missing'; END IF;

  SELECT * INTO c FROM public.campaigns WHERE id = o.campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  /* ظرفیتِ جایگاه در همین تراکنش سنجیده می‌شود: دو خریدِ هم‌زمان برای
     آخرین جای خالی نباید هر دو موفق شوند. کمپین‌های در انتظارِ بررسی
     هم جا اشغال می‌کنند، وگرنه ادمین با صفی روبه‌رو می‌شود که ظرفیت
     ندارد. */
  SELECT capacity INTO v_cap FROM public.placements WHERE key = o.placement_key;
  SELECT count(*) INTO v_used FROM public.campaigns
   WHERE placement_key = o.placement_key
     AND status IN ('ACTIVE', 'SCHEDULED', 'PENDING_REVIEW')
     AND id <> c.id;

  /* عمداً RAISE نمی‌کنیم: استثنا کلِ تراکنش را برمی‌گرداند و همین دو
     UPDATE را هم خنثی می‌کند، آن‌وقت سفارش برای همیشه PENDING می‌ماند.
     به‌جایش نتیجه‌ی صریح برمی‌گردانیم تا تغییرها ثبت شوند. */
  IF v_cap IS NOT NULL AND v_used >= v_cap THEN
    UPDATE public.campaign_orders SET status = 'FAILED' WHERE id = p_order_id;
    UPDATE public.campaigns SET status = 'CANCELLED', updated_at = now() WHERE id = c.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'placement_full');
  END IF;

  UPDATE public.campaign_orders
     SET status = 'PAID', provider_ref_id = p_ref, paid_at = now()
   WHERE id = p_order_id;

  /* پرداخت شد ⇒ نوبتِ بررسیِ ادمین. پنجره‌ی زمانی هنگامِ تأیید از نو
     حساب می‌شود تا تبلیغ‌دهنده مدتِ کاملی که خریده را بگیرد. */
  UPDATE public.campaigns
     SET status = 'PENDING_REVIEW', updated_at = now()
   WHERE id = c.id;

  RETURN jsonb_build_object('ok', true, 'already', false, 'campaign_id', c.id);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_activate_campaign(uuid, text) FROM PUBLIC, anon, authenticated;

-- ── تأییدِ ادمین: شروعِ پنجره‌ی زمانیِ خریداری‌شده ───────────────
-- ادمین که کمپین را تأیید می‌کند، مدت از همان لحظه شروع می‌شود، نه از
-- زمانِ پرداخت — وگرنه تأخیرِ بررسی از سهمِ تبلیغ‌دهنده کم می‌کرد.
CREATE OR REPLACE FUNCTION public.bh_approve_campaign(p_campaign_id uuid, p_start timestamptz DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE c record; v_days integer; v_start timestamptz; v_status text;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  SELECT duration_days INTO v_days FROM public.campaign_orders
   WHERE campaign_id = p_campaign_id AND status = 'PAID'
   ORDER BY paid_at DESC NULLS LAST LIMIT 1;

  /* کمپینِ دستیِ ادمین سفارش ندارد ⇒ مدتِ خودِ جایگاه */
  IF v_days IS NULL THEN
    SELECT duration_days INTO v_days FROM public.placements WHERE key = c.placement_key;
  END IF;
  v_days := GREATEST(COALESCE(v_days, 30), 1);

  v_start := COALESCE(p_start, now());
  v_status := CASE WHEN v_start > now() THEN 'SCHEDULED' ELSE 'ACTIVE' END;

  UPDATE public.campaigns
     SET starts_at = v_start,
         ends_at = v_start + (v_days || ' days')::interval,
         status = v_status,
         updated_at = now()
   WHERE id = p_campaign_id;

  RETURN jsonb_build_object('status', v_status, 'starts_at', v_start, 'days', v_days);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.bh_approve_campaign(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
