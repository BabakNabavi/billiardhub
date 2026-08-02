export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* داستانِ کاملِ یک تراکنش — از پرداخت تا تسویه.
       /api/admin/finance/timeline?booking=<id>
       /api/admin/finance/timeline?registration=<id>

   هدف: بشود روی یک مبلغ کلیک کرد و دید چه بر سرش آمده. رویدادها از
   جدول‌های واقعی ساخته می‌شوند (پرداخت، دفتر، بازپرداخت، تسویه)، نه
   از یک ستونِ وضعیت — چون وضعیت فقط «الان کجاست» را می‌گوید، نه
   «چه مسیری آمده». */

interface Ev { at: string; kind: string; label: string; amount?: number; meta?: unknown }

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const bookingId = req.nextUrl.searchParams.get('booking') ?? '';
  const regId = req.nextUrl.searchParams.get('registration') ?? '';
  if (!bookingId && !regId) {
    return NextResponse.json({ message: 'شناسه‌ی رزرو یا ثبت‌نام لازم است' }, { status: 400 });
  }

  const events: Ev[] = [];
  let subject: Record<string, unknown> | null = null;

  if (bookingId) {
    const { data: bk } = await sb().from('bookings').select('*').eq('id', bookingId).maybeSingle();
    if (!bk) return NextResponse.json({ message: 'رزرو پیدا نشد' }, { status: 404 });
    subject = bk as Record<string, unknown>;

    events.push({ at: String(bk.createdAt ?? bk.created_at ?? ''), kind: 'BOOKING_CREATED', label: 'رزرو ساخته شد', amount: Number(bk.final_amount) });

    const { data: pays } = await sb().from('payments')
      .select('*').eq('booking_id', bookingId).order('created_at');
    for (const p of (pays ?? []) as Record<string, unknown>[]) {
      events.push({ at: String(p.created_at), kind: 'PAYMENT_CREATED', label: `پرداخت ساخته شد (${p.provider})`, amount: Number(p.amount) });
      if (p.paid_at) events.push({ at: String(p.paid_at), kind: 'PAYMENT_PAID', label: 'پرداخت موفق', amount: Number(p.amount), meta: { ref: p.provider_ref_id } });
      if (p.status === 'FAILED') events.push({ at: String(p.updated_at), kind: 'PAYMENT_FAILED', label: 'پرداخت ناموفق' });
    }

    if (bk.completed_at) events.push({ at: String(bk.completed_at), kind: 'BOOKING_COMPLETED', label: 'خدمت تحویل شد — سهم باشگاه ایجاد شد' });
    if (bk.cancelled_at) events.push({ at: String(bk.cancelled_at), kind: 'BOOKING_CANCELLED', label: `لغو شد: ${bk.cancellation_reason ?? '—'}` });
  } else {
    const { data: reg } = await sb().from('tournament_registrations').select('*').eq('id', regId).maybeSingle();
    if (!reg) return NextResponse.json({ message: 'ثبت‌نام پیدا نشد' }, { status: 404 });
    subject = reg as Record<string, unknown>;
    events.push({ at: String(reg.created_at), kind: 'REGISTRATION_CREATED', label: 'ثبت‌نام مسابقه', amount: Number(reg.amount) });
  }

  /* دفتر — قلبِ ماجرا */
  const ledgerQ = bookingId
    ? sb().from('ledger_entries').select('*').eq('booking_id', bookingId)
    : sb().from('ledger_entries').select('*').like('source_key', `treg:${regId}:%`);
  const { data: led } = await ledgerQ.order('created_at');

  const LABEL: Record<string, string> = {
    BOOKING_PAYMENT: 'پول وارد حساب مرکزی شد',
    TOURNAMENT_PAYMENT: 'پول ثبت‌نام وارد حساب مرکزی شد',
    PLATFORM_COMMISSION: 'کمیسیون پلتفرم قطعی شد',
    CLUB_EARNING: 'سهم باشگاه ایجاد شد (بدهی ما)',
    CLUB_EARNING_REVERSAL: 'سهم باشگاه برگشت خورد',
    CANCELLATION_FEE: 'جریمه لغو — درآمد پلتفرم',
    REFUND: 'بازپرداخت به کاربر',
    SETTLEMENT: 'تسویه با باشگاه',
    SETTLEMENT_REVERSAL: 'تسویه ناموفق — بدهی برگشت',
    ADJUSTMENT: 'اصلاح دستی',
  };
  for (const l of (led ?? []) as Record<string, unknown>[]) {
    events.push({
      at: String(l.created_at), kind: `LEDGER_${l.type}`,
      label: LABEL[String(l.type)] ?? String(l.type),
      amount: Number(l.amount),
      meta: { status: l.status, sourceKey: l.source_key },
    });
  }

  /* بازپرداخت‌ها */
  const refQ = bookingId
    ? sb().from('refunds').select('*').eq('booking_id', bookingId)
    : sb().from('refunds').select('*').eq('tournament_registration_id', regId);
  const { data: refs } = await refQ;
  for (const r of (refs ?? []) as Record<string, unknown>[]) {
    events.push({ at: String(r.created_at), kind: 'REFUND_REQUESTED', label: 'بازپرداخت ثبت شد', amount: Number(r.amount), meta: { fee: r.cancellation_fee } });
    if (r.completed_at) events.push({ at: String(r.completed_at), kind: 'REFUND_COMPLETED', label: 'بازپرداخت انجام شد', meta: { ref: r.provider_ref } });
  }

  /* تسویه‌هایی که این باشگاه را در بازه‌ی این رزرو پوشش داده‌اند */
  const clubId = String(subject?.clubId ?? subject?.club_id ?? '');
  if (clubId) {
    const { data: setts } = await sb().from('settlements')
      .select('id,amount,status,requested_at,completed_at,reference_number')
      .eq('club_id', clubId).order('requested_at', { ascending: false }).limit(10);
    for (const s of (setts ?? []) as Record<string, unknown>[]) {
      events.push({ at: String(s.requested_at), kind: 'SETTLEMENT_APPROVED', label: 'تسویه تأیید شد', amount: Number(s.amount), meta: { id: s.id, status: s.status } });
      if (s.completed_at) events.push({ at: String(s.completed_at), kind: 'SETTLEMENT_PAID', label: 'تسویه پرداخت شد', meta: { ref: s.reference_number } });
    }
  }

  events.sort((a, b) => String(a.at).localeCompare(String(b.at)));

  return NextResponse.json({ subject, events }, { headers: { 'Cache-Control': 'no-store' } });
}
