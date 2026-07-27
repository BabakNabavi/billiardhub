-- ═══════════════════════════════════════════════════════════════════════════
--  Billiard Hub — رزرو، پرداخت، کمیسیون، دفترِ مالی و تسویه
--  یک‌بار در Supabase → SQL Editor اجرا کنید. اجرای مجدد بی‌خطر است (idempotent).
--
--  واحدِ پول: تومان، همه‌جا BIGINT (هیچ اعشاری در محاسباتِ مالی نیست)
--  اتمی‌بودن: چون PostgREST تراکنشِ چندمرحله‌ای ندارد، عملیاتِ مالی داخلِ
--  توابعِ Postgres انجام می‌شود؛ هر تابع یک تراکنشِ واحد است.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) bookings — تفکیکِ سه وضعیت + مبالغِ سروری + انقضا
-- ───────────────────────────────────────────────────────────────────────────
alter table bookings
  add column if not exists booking_reference   text,
  add column if not exists booking_status      text    not null default 'PENDING_PAYMENT',
  add column if not exists payment_status      text    not null default 'UNPAID',
  add column if not exists settlement_status   text    not null default 'NONE',
  add column if not exists expires_at          timestamptz,
  add column if not exists base_amount         bigint  not null default 0,
  add column if not exists discount_amount     bigint  not null default 0,
  add column if not exists final_amount        bigint  not null default 0,
  add column if not exists platform_commission bigint  not null default 0,
  add column if not exists club_amount         bigint  not null default 0,
  add column if not exists club_owner_id       uuid,
  add column if not exists cancelled_at        timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists refund_amount       bigint  not null default 0,
  add column if not exists refund_status       text    not null default 'NONE';

create unique index if not exists bookings_reference_uidx on bookings(booking_reference) where booking_reference is not null;
create index if not exists bookings_status_idx  on bookings(booking_status);
create index if not exists bookings_expiry_idx  on bookings(expires_at) where booking_status = 'PENDING_PAYMENT';
create index if not exists bookings_club_idx    on bookings("clubId", "bookingDate");

-- وضعیت‌های قدیمی به مدلِ جدید نگاشت می‌شوند (فقط یک‌بار، برای ردیف‌های موجود)
update bookings set
  booking_status = case
    when status = 'cancelled' then 'CANCELLED'
    when status = 'confirmed' then 'CONFIRMED'
    when status = 'completed' then 'COMPLETED'
    else 'PENDING_PAYMENT' end,
  payment_status = case when status in ('confirmed','completed') then 'PAID' else 'UNPAID' end,
  final_amount   = coalesce("totalPrice", 0)
where booking_status = 'PENDING_PAYMENT' and final_amount = 0;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) booking_slots — تضمینِ قطعیِ ضدِ دابل‌بوکینگ (در سطحِ دیتابیس)
--    هر ساعت یک ردیف؛ کلیدِ یکتا اجازه‌ی رزروِ همزمان را نمی‌دهد.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists booking_slots (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  club_id      uuid not null,
  table_id     text not null,
  booking_date date not null,
  hour         smallint not null check (hour between 0 and 23),
  created_at   timestamptz not null default now(),
  constraint booking_slots_unique unique (club_id, table_id, booking_date, hour)
);
create index if not exists booking_slots_lookup_idx on booking_slots(club_id, table_id, booking_date);

-- ───────────────────────────────────────────────────────────────────────────
-- 3) payments — رکوردِ مستقلِ پرداخت (Provider-Agnostic)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists payments (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references bookings(id) on delete cascade,
  user_id            uuid not null,
  club_id            uuid not null,
  provider           text not null,                       -- mock | zarinpal | ...
  provider_authority text,                                -- شناسه‌ی درگاه (authority/token)
  provider_ref_id    text,                                -- شماره‌ی پیگیریِ نهایی
  amount             bigint not null check (amount >= 0), -- تومان
  currency           text   not null default 'IRT',
  status             text   not null default 'INITIATED'  -- INITIATED|PENDING|PAID|FAILED|CANCELED|REFUNDED
                     check (status in ('INITIATED','PENDING','PAID','FAILED','CANCELED','REFUNDED')),
  idempotency_key    text,
  raw_request        jsonb,
  raw_response       jsonb,
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists payments_authority_uidx   on payments(provider, provider_authority) where provider_authority is not null;
create unique index if not exists payments_idempotency_uidx on payments(idempotency_key) where idempotency_key is not null;
create index if not exists payments_booking_idx on payments(booking_id);
create index if not exists payments_club_idx    on payments(club_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- 4) ledger_entries — دفترِ مالی (منبعِ حقیقت)
--    مبلغ علامت‌دار است: + به نفعِ صاحبِ ردیف، − به ضررِ او.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists ledger_entries (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid,
  payment_id uuid,
  club_id    uuid,
  user_id    uuid,
  type       text not null check (type in (
               'BOOKING_PAYMENT','PLATFORM_COMMISSION','CLUB_EARNING','REFUND',
               'CANCELLATION_FEE','SETTLEMENT','SETTLEMENT_REVERSAL','ADJUSTMENT')),
  amount     bigint not null,
  currency   text not null default 'IRT',
  status     text not null default 'POSTED' check (status in ('POSTED','REVERSED')),
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ledger_club_idx    on ledger_entries(club_id, created_at desc);
create index if not exists ledger_booking_idx on ledger_entries(booking_id);
create index if not exists ledger_type_idx    on ledger_entries(type);

-- ───────────────────────────────────────────────────────────────────────────
-- 5) club_accounts — کَشِ موجودی (حقیقت همچنان ledger است)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists club_accounts (
  club_id           uuid primary key,
  owner_id          uuid,
  available_balance bigint not null default 0,
  pending_balance   bigint not null default 0,
  total_earnings    bigint not null default 0,
  total_commission  bigint not null default 0,
  total_settled     bigint not null default 0,
  updated_at        timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────────
-- 6) club_bank_accounts — اطلاعاتِ تسویه + گردشِ تأیید
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists club_bank_accounts (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null,
  account_holder_name text not null,
  bank_name           text,
  iban                text not null,                       -- IRxxxxxxxxxxxxxxxxxxxxxxxx
  account_number      text,
  card_number_last4   text,                                -- فقط ۴ رقمِ آخر نگهداری می‌شود
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','REJECTED')),
  rejection_reason    text,
  is_active           boolean not null default true,
  verified_at         timestamptz,
  verified_by         uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists club_bank_club_idx on club_bank_accounts(club_id, is_active);

-- ───────────────────────────────────────────────────────────────────────────
-- 7) settlements — تسویه با باشگاه (اسنپ‌شاتِ حسابِ بانکی)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists settlements (
  id                   uuid primary key default gen_random_uuid(),
  club_id              uuid not null,
  amount               bigint not null check (amount > 0),
  iban                 text,
  bank_account_snapshot jsonb,
  status               text not null default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','FAILED')),
  requested_at         timestamptz not null default now(),
  processed_at         timestamptz,
  completed_at         timestamptz,
  failure_reason       text,
  reference_number     text,
  admin_id             uuid,
  created_at           timestamptz not null default now()
);
create index if not exists settlements_club_idx on settlements(club_id, requested_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- 8) commission_rules — کمیسیونِ قابلِ تنظیم (سراسری یا پرباشگاه)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists commission_rules (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null default 'GLOBAL' check (scope in ('GLOBAL','CLUB')),
  club_id    uuid,
  type       text not null default 'PERCENTAGE' check (type in ('PERCENTAGE','FIXED_AMOUNT')),
  value      bigint not null default 0,          -- درصد (۰..۱۰۰) یا مبلغِ ثابت به تومان
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists commission_global_uidx on commission_rules(scope) where scope = 'GLOBAL' and is_active;
create unique index if not exists commission_club_uidx   on commission_rules(club_id) where scope = 'CLUB' and is_active;

-- کمیسیونِ پیش‌فرضِ سراسری: ۵٪
insert into commission_rules (scope, type, value)
select 'GLOBAL', 'PERCENTAGE', 5
where not exists (select 1 from commission_rules where scope = 'GLOBAL' and is_active);

-- ───────────────────────────────────────────────────────────────────────────
-- 9) refunds
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists refunds (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  payment_id   uuid,
  club_id      uuid,
  user_id      uuid,
  amount       bigint not null check (amount > 0),
  reason       text,
  status       text not null default 'REQUESTED' check (status in ('REQUESTED','PROCESSING','COMPLETED','FAILED')),
  provider_ref text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists refunds_booking_idx on refunds(booking_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 10) audit_logs — ردِ عملیاتِ حساسِ مالی
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  actor_role  text,
  action      text not null,
  entity_type text,
  entity_id   text,
  old_value   jsonb,
  new_value   jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_entity_idx on audit_logs(entity_type, entity_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
--  امنیت: این جداول فقط از سرور (service role) قابلِ دسترسی‌اند.
--  RLS روشن و بدونِ policy ⇒ anon/authenticated هیچ دسترسی ندارند.
-- ═══════════════════════════════════════════════════════════════════════════
alter table booking_slots      enable row level security;
alter table payments           enable row level security;
alter table ledger_entries     enable row level security;
alter table club_accounts      enable row level security;
alter table club_bank_accounts enable row level security;
alter table settlements        enable row level security;
alter table commission_rules   enable row level security;
alter table refunds            enable row level security;
alter table audit_logs         enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
--  توابعِ اتمیک (هر تابع = یک تراکنش)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── محاسبه‌ی کمیسیون: قانونِ باشگاه، وگرنه قانونِ سراسری ──────────────────
create or replace function bh_commission_for(p_club_id uuid, p_amount bigint)
returns bigint language plpgsql stable as $$
declare r record; c bigint;
begin
  select type, value into r from commission_rules
   where is_active and ((scope='CLUB' and club_id=p_club_id) or scope='GLOBAL')
   order by (scope='CLUB') desc limit 1;
  if not found then return 0; end if;
  if r.type = 'PERCENTAGE' then c := (p_amount * r.value) / 100;
  else c := r.value; end if;
  if c < 0 then c := 0; end if;
  if c > p_amount then c := p_amount; end if;
  return c;
end $$;

-- ── ساختِ رزروِ موقت + قفلِ اتمیکِ اسلات‌ها ────────────────────────────────
--    اگر حتی یک ساعت قبلاً گرفته شده باشد، کلِ تراکنش برمی‌گردد.
create or replace function bh_create_booking(
  p_user_id uuid, p_club_id uuid, p_table_id text, p_table_type text,
  p_date date, p_hours smallint[], p_base bigint, p_discount bigint, p_final bigint,
  p_reference text, p_ttl_minutes int default 10
) returns bookings language plpgsql as $$
declare b bookings; h smallint; owner uuid; comm bigint;
begin
  -- ابتدا رزروهای منقضی آزاد شوند تا اسلاتِ رهاشده مانع نشود
  perform bh_expire_bookings();

  select "ownerId" into owner from clubs where id = p_club_id;
  comm := bh_commission_for(p_club_id, p_final);

  insert into bookings (
    "userId","clubId","tableId","tableType","bookingDate","timeSlots","totalHours","totalPrice",
    status, booking_status, payment_status, settlement_status, expires_at,
    base_amount, discount_amount, final_amount, platform_commission, club_amount,
    club_owner_id, booking_reference
  ) values (
    p_user_id, p_club_id, p_table_id, p_table_type, p_date,
    array_to_string(p_hours, ','), array_length(p_hours,1), p_final,
    'pending', 'PENDING_PAYMENT', 'UNPAID', 'NONE', now() + (p_ttl_minutes || ' minutes')::interval,
    p_base, p_discount, p_final, comm, p_final - comm,
    owner, p_reference
  ) returning * into b;

  foreach h in array p_hours loop
    insert into booking_slots (booking_id, club_id, table_id, booking_date, hour)
    values (b.id, p_club_id, p_table_id, p_date, h);   -- یکتایی ⇒ خطا و rollback
  end loop;

  return b;
end $$;

-- ── آزادسازیِ رزروهای پرداخت‌نشده‌ی منقضی ─────────────────────────────────
create or replace function bh_expire_bookings() returns int language plpgsql as $$
declare n int;
begin
  with expired as (
    update bookings set booking_status='EXPIRED', status='cancelled', updated_at=now()
     where booking_status='PENDING_PAYMENT' and expires_at is not null and expires_at < now()
     returning id)
  delete from booking_slots s using expired e where s.booking_id = e.id;
  get diagnostics n = row_count;
  return n;
end $$;

-- ── تأییدِ پرداخت: idempotent، اتمیک، همراه با دفترِ مالی و موجودی ────────
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
    status='confirmed', "paymentId"=pay.id::text, gateway=pay.provider, updated_at=now()
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

-- ── کنسلی + بازپرداخت طبقِ سیاست ─────────────────────────────────────────
create or replace function bh_cancel_booking(
  p_booking_id uuid, p_refund bigint, p_reason text
) returns bookings language plpgsql as $$
declare b bookings; club_back bigint; comm_back bigint;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status = 'CANCELLED' then return b; end if;

  delete from booking_slots where booking_id = b.id;   -- آزادسازیِ زمان

  if b.payment_status = 'PAID' and p_refund > 0 then
    -- سهمِ بازگشتی به نسبتِ همان تفکیکِ اولیه
    club_back := (p_refund * b.club_amount) / greatest(b.final_amount, 1);
    comm_back := p_refund - club_back;

    insert into ledger_entries (booking_id, club_id, user_id, type, amount, meta) values
      (b.id, b."clubId", b."userId", 'REFUND', -p_refund, jsonb_build_object('reason', p_reason)),
      (b.id, b."clubId", b."userId", 'ADJUSTMENT', -club_back, jsonb_build_object('kind','club_refund_share')),
      (b.id, b."clubId", b."userId", 'ADJUSTMENT',  comm_back, jsonb_build_object('kind','commission_refund_share'));

    update club_accounts set
      pending_balance  = pending_balance  - least(club_back, pending_balance),
      -- اگر قبلاً تسویه شده بود، بدهی روی موجودیِ قابلِ برداشت می‌نشیند
      available_balance = available_balance - greatest(club_back - pending_balance, 0),
      total_earnings   = total_earnings   - club_back,
      total_commission = total_commission - comm_back,
      updated_at = now()
     where club_id = b."clubId";
  end if;

  update bookings set
    booking_status='CANCELLED', status='cancelled', cancelled_at=now(),
    cancellation_reason=p_reason, refund_amount=p_refund,
    refund_status = case when p_refund > 0 then 'REQUESTED' else 'NONE' end,
    updated_at=now()
   where id = b.id returning * into b;

  return b;
end $$;

-- ── تسویه: انتقالِ pending → settled ──────────────────────────────────────
create or replace function bh_create_settlement(p_club_id uuid, p_admin uuid)
returns settlements language plpgsql as $$
declare acc club_accounts; ba club_bank_accounts; s settlements; amt bigint;
begin
  select * into acc from club_accounts where club_id = p_club_id for update;
  if not found then raise exception 'account_not_found'; end if;

  amt := acc.pending_balance;
  if amt <= 0 then raise exception 'nothing_to_settle'; end if;

  select * into ba from club_bank_accounts
   where club_id = p_club_id and is_active and verification_status = 'VERIFIED' limit 1;
  if not found then raise exception 'bank_account_not_verified'; end if;

  insert into settlements (club_id, amount, iban, bank_account_snapshot, status, admin_id)
  values (p_club_id, amt, ba.iban,
          jsonb_build_object('holder', ba.account_holder_name, 'bank', ba.bank_name,
                             'iban', ba.iban, 'verified_at', ba.verified_at),
          'PENDING', p_admin)
  returning * into s;

  update club_accounts set pending_balance = 0, available_balance = available_balance + amt, updated_at = now()
   where club_id = p_club_id;

  insert into ledger_entries (club_id, type, amount, meta)
  values (p_club_id, 'SETTLEMENT', -amt, jsonb_build_object('settlement_id', s.id));

  update bookings set settlement_status = 'SETTLED'
   where "clubId" = p_club_id and settlement_status = 'PENDING' and payment_status = 'PAID';

  return s;
end $$;

-- ── نهایی‌کردنِ تسویه (پرداختِ واقعی انجام شد) ────────────────────────────
create or replace function bh_complete_settlement(p_id uuid, p_reference text)
returns settlements language plpgsql as $$
declare s settlements;
begin
  select * into s from settlements where id = p_id for update;
  if not found then raise exception 'settlement_not_found'; end if;
  if s.status = 'COMPLETED' then return s; end if;

  update settlements set status='COMPLETED', reference_number=p_reference,
         processed_at=coalesce(processed_at, now()), completed_at=now()
   where id = p_id returning * into s;

  update club_accounts set
    available_balance = available_balance - least(s.amount, available_balance),
    total_settled     = total_settled + s.amount,
    updated_at = now()
   where club_id = s.club_id;

  return s;
end $$;

-- توابع فقط برای سرویس‌رول (کلاینت‌ها هرگز مستقیم صدا نمی‌زنند)
revoke all on function bh_create_booking(uuid,uuid,text,text,date,smallint[],bigint,bigint,bigint,text,int) from anon, authenticated;
revoke all on function bh_confirm_payment(uuid,text,bigint)   from anon, authenticated;
revoke all on function bh_cancel_booking(uuid,bigint,text)    from anon, authenticated;
revoke all on function bh_create_settlement(uuid,uuid)        from anon, authenticated;
revoke all on function bh_complete_settlement(uuid,text)      from anon, authenticated;
revoke all on function bh_expire_bookings()                   from anon, authenticated;
