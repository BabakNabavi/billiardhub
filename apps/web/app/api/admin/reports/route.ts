export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

const STATUSES = new Set(['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED']);

/* فهرست و رسیدگی به گزارش‌های تخلف — فقط ادمین */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await can(actor.id, 'reports'))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';

  let query = sb().from('reports').select('*').order('created_at', { ascending: false }).limit(200);
  if (status && STATUSES.has(status)) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ rows: [], counts: {}, pending: true });
    }
    return NextResponse.json({ message: 'خطا در دریافت گزارش‌ها' }, { status: 500 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const counts: Record<string, number> = {};
  for (const r of rows) counts[String(r.status)] = (counts[String(r.status)] ?? 0) + 1;

  return NextResponse.json({ rows, counts }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await can(actor.id, 'reports'))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || '');
  const status = String(body?.status || '');
  if (!id || !STATUSES.has(status)) return NextResponse.json({ message: 'ورودی نامعتبر است' }, { status: 400 });

  const patch: Record<string, unknown> = { status };
  if (typeof body?.adminNote === 'string') patch.admin_note = body.adminNote.slice(0, 1000);
  if (status === 'RESOLVED' || status === 'REJECTED') patch.resolved_at = new Date().toISOString();

  const { error } = await sb().from('reports').update(patch).eq('id', id);
  if (error) return NextResponse.json({ message: 'به‌روزرسانی انجام نشد' }, { status: 500 });

  audit({
    actorId: actor.id, actorRole: 'admin', action: 'REPORT_UPDATED',
    entityType: 'report', entityId: id, newValue: patch, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
