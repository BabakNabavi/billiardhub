export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* تیکت‌های پشتیبانی برای ادمین — خواندن و رسیدگی.

   «رسیدگی» این‌جا یعنی بازکردنِ قفل، نه ویرایشِ مقدار. ادمین شماره
   کارت یا کد پستیِ تازه را خودش تایپ نمی‌کند: آن مقدار باید از همان
   زنجیره‌ی استعلام رد شود، وگرنه یک حسابِ تأییدنشده زیر عنوانِ
   «تأییدشده» می‌نشیند. پس ادمین قفل را باز می‌کند و کاربر یک بار
   دیگر — و فقط یک بار — استعلام می‌گیرد. */

interface Ticket {
  id: string; user_id: string | null; club_id: string | null;
  name: string; email: string | null; phone: string | null;
  subject: string; message: string; status: string;
  admin_note: string | null; created_at: string;
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'support'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') ?? '';

  let q = sb().from('support_tickets').select('*').order('created_at', { ascending: false }).limit(300);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    console.error('[admin/support] select error:', error.message);
    return NextResponse.json({ message: 'جدول تیکت هنوز ساخته نشده — مهاجرت ۰۳۹ را اجرا کنید' }, { status: 503 });
  }

  const tickets = (data ?? []) as Ticket[];

  /* وضعیتِ قفلِ هر تیکت کنارِ خودش می‌آید تا ادمین لازم نباشد برای
     فهمیدنِ «اصلاً قفل است؟» صفحه عوض کند. */
  const userIds = [...new Set(tickets.map(t => t.user_id).filter(Boolean))] as string[];
  const clubIds = [...new Set(tickets.map(t => t.club_id).filter(Boolean))] as string[];

  const locks: Record<string, unknown> = {};
  if (userIds.length) {
    const { data: us } = await sb().from('users')
      .select('id,bank_card,bank_card_verified').in('id', userIds);
    locks.users = us ?? [];
  }
  if (clubIds.length) {
    const { data: cs } = await sb().from('clubs')
      .select('id,name,"postalCode","postalCodeVerified","ibanVerified"').in('id', clubIds);
    locks.clubs = cs ?? [];
  }

  return NextResponse.json({ tickets, ...locks }, { headers: { 'Cache-Control': 'no-store' } });
}

/* رسیدگی: تغییر وضعیت و/یا بازکردنِ یکی از قفل‌ها.
   بدنه: { id, status?, adminNote?, unlock?: 'postal' | 'bank' } */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'support'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(b.id ?? '');
  if (!id) return NextResponse.json({ message: 'شناسه‌ی تیکت لازم است' }, { status: 400 });

  const { data: t } = await sb().from('support_tickets').select('*').eq('id', id).maybeSingle();
  if (!t) return NextResponse.json({ message: 'تیکت پیدا نشد' }, { status: 404 });
  const ticket = t as Ticket;

  const unlock = String(b.unlock ?? '');
  let unlocked: string | null = null;

  if (unlock === 'postal') {
    if (!ticket.club_id) {
      return NextResponse.json({ message: 'این تیکت به باشگاهی وصل نیست' }, { status: 400 });
    }
    const { error } = await sb().from('clubs')
      .update({ postalCodeVerified: false, postalCodeVerifiedAt: null })
      .eq('id', ticket.club_id);
    if (error) return NextResponse.json({ message: 'بازکردن قفل انجام نشد' }, { status: 500 });
    unlocked = 'postal';
    await audit({
      actorId: actor.id, actorRole: 'admin', action: 'unlock_postal_code',
      entityType: 'club', entityId: ticket.club_id, newValue: { ticketId: id, postalCodeVerified: false },
    });
  }

  if (unlock === 'bank') {
    if (!ticket.user_id) {
      return NextResponse.json({ message: 'این تیکت به کاربری وصل نیست' }, { status: 400 });
    }
    /* هر دو قفلِ بانکی با هم باز می‌شوند: کاربر ممکن است هم کارتِ
       شخصی و هم حسابِ باشگاه را عوض کند و دو تیکتِ جدا برای یک
       درخواست، هم برای او و هم برای ادمین اضافه‌کاری است. */
    const { error } = await sb().from('users')
      .update({ bank_card_verified: false, bank_card_verified_at: null })
      .eq('id', ticket.user_id);
    if (error) return NextResponse.json({ message: 'بازکردن قفل انجام نشد' }, { status: 500 });

    if (ticket.club_id) {
      await sb().from('clubs').update({ ibanVerified: false }).eq('id', ticket.club_id);
    }
    unlocked = 'bank';
    await audit({
      actorId: actor.id, actorRole: 'admin', action: 'unlock_bank_info',
      entityType: 'user', entityId: ticket.user_id,
      newValue: { ticketId: id, clubId: ticket.club_id, bankCardVerified: false },
    });
  }

  const patch: Record<string, unknown> = {
    handled_by: actor.id,
    handled_at: new Date().toISOString(),
  };
  if (b.status !== undefined) patch.status = String(b.status);
  if (b.adminNote !== undefined) patch.admin_note = String(b.adminNote).slice(0, 1000);
  /* بازکردنِ قفل خودش یعنی رسیدگی شد، مگر ادمین وضعیتِ دیگری بخواهد */
  if (unlocked && b.status === undefined) patch.status = 'resolved';

  const { data, error } = await sb().from('support_tickets')
    .update(patch).eq('id', id).select().single();
  if (error) {
    console.error('[admin/support] update error:', error.message);
    return NextResponse.json({ message: 'به‌روزرسانی تیکت انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticket: data, unlocked });
}
