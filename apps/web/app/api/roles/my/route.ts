export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';

/* درخواست‌های نقشِ خودِ کاربر.

   صفحه‌ی `/profile/role` این را می‌خواند تا نشان دهد کدام نقش در
   انتظار است، کدام تأیید شده و کدام رد. تا امروز مسیر وجود نداشت، پس
   صفحه همیشه فهرستِ خالی می‌گرفت: کاربر بعد از ثبتِ درخواست هیچ
   بازخوردی نمی‌دید و نمی‌دانست اصلاً چیزی ثبت شده یا نه.

   صاحبِ داده همیشه از نشست می‌آید، نه از کوئری. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data, error } = await sb().from('role_requests')
    .select('id,role,status,doc_url,rejection_note,requested_at,reviewed_at')
    .eq('user_id', actor.id)
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('[roles/my]', error.message);
    return NextResponse.json({ requests: [] });
  }

  /* نقش‌های فعلیِ کاربر هم برمی‌گردد تا صفحه بتواند «همین حالا داری» را
     از «درخواست داده‌ای» جدا کند. */
  const { data: u } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
  const row = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };

  return NextResponse.json({
    requests: data ?? [],
    current: { primaryRole: row.primaryRole ?? 'user', secondaryRoles: row.secondaryRoles ?? [] },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
