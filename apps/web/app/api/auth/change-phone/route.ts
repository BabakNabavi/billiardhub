export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { sendOtp, verifyOtp } from '@/lib/otp-server';
import { verifyIdentity } from '@/lib/shahkar-server';

/* تغییرِ شماره‌ی موبایلِ حساب.

   کاربر ممکن است سیم‌کارتش را بفروشد و بخواهد شماره‌ی تازه بگذارد.
   شماره‌ی قبلی حذف می‌شود، ولی شماره‌ی تازه هم مثل روزِ اول استعلام
   می‌شود: کدِ پیامکی + شاهکار با همان کد ملیِ ثبت‌شده‌ی حساب. وگرنه
   می‌شد با تغییرِ شماره، هویتِ تأییدشده را به شماره‌ی شخصِ دیگری
   وصل کرد.

   دو گام:
     POST { phone }         ⇒ ارسالِ کدِ پیامکی به شماره‌ی تازه
     POST { phone, code }   ⇒ تأییدِ کد + شاهکار + جایگزینی
*/

const digits = (v: unknown) =>
  String(v ?? '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const phone = digits(b?.phone);
  const code = digits(b?.code);

  if (!/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ message: 'شماره موبایل معتبر نیست' }, { status: 400 });
  }

  const { data: meRow } = await sb().from('users')
    .select('id,phone,national_id,national_id_verified').eq('id', actor.id).maybeSingle();
  if (!meRow) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
  const me = meRow as { id: string; phone: string; national_id: string | null; national_id_verified: boolean };

  if (me.phone === phone) {
    return NextResponse.json({ message: 'این همان شماره‌ی فعلیِ شماست' }, { status: 400 });
  }

  /* شماره‌ی تازه نباید روی حسابِ دیگری باشد — قبل از خرجِ پیامک */
  const { data: taken } = await sb().from('users').select('id').eq('phone', phone).maybeSingle();
  if (taken && (taken as { id: string }).id !== actor.id) {
    return NextResponse.json({ message: 'این شماره قبلاً روی حسابِ دیگری ثبت شده است' }, { status: 409 });
  }

  /* ── گام ۱: ارسالِ کد ── */
  if (!code) {
    const r = await sendOtp(phone);
    if (!r.ok) return NextResponse.json({ message: r.message ?? 'ارسالِ کد ناموفق بود', wait: r.wait }, { status: 429 });
    return NextResponse.json({ sent: true, message: 'کد به شماره‌ی تازه پیامک شد' });
  }

  /* ── گام ۲: تأییدِ کد ── */
  const v = await verifyOtp(phone, code);
  if (!v.ok) return NextResponse.json({ message: v.message ?? 'کد نادرست است' }, { status: 400 });

  /* ── شاهکار: شماره‌ی تازه باید به‌نامِ همین کد ملی باشد ── */
  const nid = digits(me.national_id);
  if (/^\d{10}$/.test(nid)) {
    const idv = await verifyIdentity(phone, nid, { requireOtp: false });
    if (!idv.ok) {
      return NextResponse.json({ message: idv.message ?? 'استعلامِ احراز هویت ناموفق بود؛ دوباره تلاش کنید' }, { status: 502 });
    }
    if (!idv.match) {
      return NextResponse.json({
        message: 'این شماره به نامِ شما (کد ملیِ ثبت‌شده در حساب) نیست',
      }, { status: 422 });
    }
  }

  const old = me.phone;
  const { error } = await sb().from('users')
    .update({ phone, phone_verified: true, updatedAt: new Date().toISOString() })
    .eq('id', actor.id);
  if (error) {
    if (/duplicate key/i.test(error.message)) {
      return NextResponse.json({ message: 'این شماره قبلاً ثبت شده است' }, { status: 409 });
    }
    return NextResponse.json({ message: 'تغییرِ شماره انجام نشد' }, { status: 500 });
  }

  /* شماره‌ی قبلی از حساب پاک شد، ولی ردش می‌ماند */
  void sb().from('phone_changes').insert({
    user_id: actor.id, old_phone: old, new_phone: phone, ip: clientIp(req),
  }).then(() => { }, () => { });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PHONE_CHANGED',
    entityType: 'user', entityId: actor.id,
    oldValue: { phone: old }, newValue: { phone }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, phone });
}
