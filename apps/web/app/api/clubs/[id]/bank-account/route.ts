export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, ownsClub, audit, clientIp } from '@/lib/finance/db';

/* حساب بانکی باشگاه — ثبت/تغییر توسط مالک، تأیید توسط ادمین.
   هر تغییر، حساب را به وضعیت «در انتظار تأیید» می‌برد و تا تأیید، تسویه ممکن نیست. */

const normIban = (v: string) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const validIban = (v: string) => /^IR\d{24}$/.test(v)

/* POST { accountHolderName, bankName, iban, cardNumber? } — درخواست ثبت/تغییر */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  const admin = await isAdmin(actor.id);
  if (!(await ownsClub(actor.id, clubId)) && !admin) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const iban = normIban(b?.iban);
  const holder = String(b?.accountHolderName || '').trim();
  if (!holder) return NextResponse.json({ message: 'نام صاحب حساب الزامی است' }, { status: 400 });
  if (!validIban(iban)) return NextResponse.json({ message: 'شماره شبا معتبر نیست (IR و ۲۴ رقم)' }, { status: 400 });

  const card = String(b?.cardNumber || '').replace(/\D/g, '');
  const last4 = card.length >= 4 ? card.slice(-4) : null;   // شماره‌ی کارت کامل ذخیره نمی‌شود

  const { data: prev } = await sb().from('club_bank_accounts')
    .select('id,iban,verification_status').eq('club_id', clubId).eq('is_active', true).maybeSingle();

  /* حساب قبلی غیرفعال و حساب جدید در انتظار تأیید ثبت می‌شود (تاریخچه حفظ می‌شود) */
  if (prev) await sb().from('club_bank_accounts').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', (prev as { id: string }).id);

  const { data, error } = await sb().from('club_bank_accounts').insert({
    club_id: clubId, account_holder_name: holder, bank_name: b?.bankName ?? null,
    iban, account_number: b?.accountNumber ?? null, card_number_last4: last4,
    verification_status: 'PENDING', is_active: true,
  }).select('id,verification_status').single();

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return NextResponse.json({ message: 'سیستم مالی هنوز راه‌اندازی نشده است' }, { status: 503 });
    return NextResponse.json({ message: 'خطا در ثبت حساب بانکی' }, { status: 500 });
  }

  audit({ actorId: actor.id, actorRole: admin ? 'admin' : 'club_owner', action: 'BANK_ACCOUNT_CHANGE_REQUESTED',
          entityType: 'club_bank_account', entityId: String((data as { id: string }).id),
          oldValue: prev ?? null, newValue: { iban: `••••${iban.slice(-4)}`, holder }, ip: clientIp(req) ?? undefined });

  return NextResponse.json({ ok: true, status: 'PENDING', message: 'حساب ثبت شد و پس از تأیید ادمین قابل تسویه است' }, { status: 201 });
}

/* PATCH { status:'VERIFIED'|'REJECTED', reason? } — فقط ادمین */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const status = String(b?.status || '');
  if (!['VERIFIED', 'REJECTED'].includes(status)) return NextResponse.json({ message: 'وضعیت نامعتبر است' }, { status: 400 });

  const { data, error } = await sb().from('club_bank_accounts').update({
    verification_status: status, rejection_reason: status === 'REJECTED' ? (b?.reason ?? null) : null,
    verified_at: status === 'VERIFIED' ? new Date().toISOString() : null,
    verified_by: actor.id, updated_at: new Date().toISOString(),
  }).eq('club_id', clubId).eq('is_active', true).select('id,verification_status').maybeSingle();

  if (error || !data) return NextResponse.json({ message: 'حساب بانکی فعالی یافت نشد' }, { status: 404 });

  audit({ actorId: actor.id, actorRole: 'admin', action: 'BANK_ACCOUNT_' + status,
          entityType: 'club_bank_account', entityId: String((data as { id: string }).id),
          newValue: { status, reason: b?.reason ?? null }, ip: clientIp(req) ?? undefined });

  return NextResponse.json({ ok: true, status });
}
