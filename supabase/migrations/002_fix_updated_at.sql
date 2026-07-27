-- ═══════════════════════════════════════════════════════════════════════════
--  اصلاحیه: ستونِ زمانِ به‌روزرسانیِ جدولِ bookings «updatedAt» است (نه updated_at)
--  فقط سه تابع دوباره تعریف می‌شوند؛ داده‌ای تغییر نمی‌کند.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function bh_expire_bookings() returns int language plpgsql as $$
declare n int;
begin
  with expired as (
    update bookings set booking_status='EXPIRED', status='cancelled', "updatedAt"=now()
     where booking_status='PENDING_PAYMENT' and expires_at is not null and expires_at < now()
     returning id)
  delete from booking_slots s using expired e where s.booking_id = e.id;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function bh_confirm_payment(
  p_payment_id uuid, p_provider_ref text, p_amount bigint
) returns bookings language plpgsql as $$
declare pay payments; b bookings;
begin
  select * into pay from payments where id = p_payment_id for update;
  if not found then raise exception 'payment_not_found'; end if;

  select * into b from bookings where id = pay.booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;

  -- قبلاً تأیید شده ⇒ هیچ عملیاتِ مالیِ تکراری انجام نده
  if pay.status = 'PAID' then return b; end if;

  if p_amount is distinct from pay.amount then raise exception 'amount_mismatch'; end if;

  update payments set status='PAID', provider_ref_id=p_provider_ref, paid_at=now(), updated_at=now()
   where id = pay.id;

  update bookings set
    payment_status='PAID', booking_status='CONFIRMED', settlement_status='PENDING',
    status='confirmed', "paymentId"=pay.id::text, gateway=pay.provider, "updatedAt"=now()
   where id = b.id returning * into b;

  insert into ledger_entries (booking_id, payment_id, club_id, user_id, type, amount, meta) values
    (b.id, pay.id, b."clubId", b."userId", 'BOOKING_PAYMENT',      b.final_amount,         jsonb_build_object('ref', p_provider_ref)),
    (b.id, pay.id, b."clubId", b."userId", 'PLATFORM_COMMISSION', -b.platform_commission,  jsonb_build_object('ref', p_provider_ref)),
    (b.id, pay.id, b."clubId", b."userId", 'CLUB_EARNING',         b.club_amount,          jsonb_build_object('ref', p_provider_ref));

  insert into club_accounts (club_id, owner_id) values (b."clubId", b.club_owner_id)
    on conflict (club_id) do nothing;
  update club_accounts set
    pending_balance  = pending_balance  + b.club_amount,
    total_earnings   = total_earnings   + b.club_amount,
    total_commission = total_commission + b.platform_commission,
    updated_at = now()
   where club_id = b."clubId";

  return b;
end $$;

create or replace function bh_cancel_booking(
  p_booking_id uuid, p_refund bigint, p_reason text
) returns bookings language plpgsql as $$
declare b bookings; club_back bigint; comm_back bigint; pend bigint;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status = 'CANCELLED' then return b; end if;

  delete from booking_slots where booking_id = b.id;   -- آزادسازیِ زمان

  if b.payment_status = 'PAID' and p_refund > 0 then
    club_back := (p_refund * b.club_amount) / greatest(b.final_amount, 1);
    comm_back := p_refund - club_back;

    insert into ledger_entries (booking_id, club_id, user_id, type, amount, meta) values
      (b.id, b."clubId", b."userId", 'REFUND', -p_refund, jsonb_build_object('reason', p_reason)),
      (b.id, b."clubId", b."userId", 'ADJUSTMENT', -club_back, jsonb_build_object('kind','club_refund_share')),
      (b.id, b."clubId", b."userId", 'ADJUSTMENT',  comm_back, jsonb_build_object('kind','commission_refund_share'));

    -- موجودیِ در انتظار پیش از کسر خوانده می‌شود تا محاسبه‌ی بدهی درست بماند
    select pending_balance into pend from club_accounts where club_id = b."clubId" for update;
    update club_accounts set
      pending_balance   = greatest(coalesce(pend,0) - club_back, 0),
      -- اگر قبلاً تسویه شده بود، مابه‌التفاوت از موجودیِ قابلِ برداشت کم می‌شود
      available_balance = available_balance - greatest(club_back - coalesce(pend,0), 0),
      total_earnings    = total_earnings   - club_back,
      total_commission  = total_commission - comm_back,
      updated_at = now()
     where club_id = b."clubId";
  end if;

  update bookings set
    booking_status='CANCELLED', status='cancelled', cancelled_at=now(),
    cancellation_reason=p_reason, refund_amount=p_refund,
    refund_status = case when p_refund > 0 then 'REQUESTED' else 'NONE' end,
    "updatedAt"=now()
   where id = b.id returning * into b;

  return b;
end $$;
