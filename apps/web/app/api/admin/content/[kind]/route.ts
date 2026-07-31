export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit, clientIp } from '@/lib/finance/db';
import { CONTENT, isContentKind, sanitize } from '@/lib/admin/content';

/* CRUD محتوای پنل ادمین — اخبار، رویدادها، رنکینگ و رسانه.

   یک مسیر برای هر چهار نوع، چون ساختارشان یکی است و نقشه‌شان در
   `lib/admin/content.ts` تعریف شده. هر چهار جدول در مهاجرت ۰۲۵ ساخته
   شدند و از anon بسته‌اند؛ تنها راه دسترسی همین مسیر است. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return { error: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!(await isAdmin(actor.id))) {
    return { error: NextResponse.json({ message: 'دسترسی به این بخش مجاز نیست' }, { status: 403 }) };
  }
  return { actor };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!isContentKind(kind)) return NextResponse.json({ message: 'نوع نامعتبر' }, { status: 404 });

  const g = await guard(req);
  if (g.error) return g.error;

  const spec = CONTENT[kind];
  const { data, error } = await sb().from(spec.table)
    .select('*')
    .order(spec.orderBy, { ascending: spec.ascending, nullsFirst: false })
    .limit(500);

  if (error) {
    console.error(`[admin/content/${kind}] read error:`, error.message);
    return NextResponse.json({ message: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!isContentKind(kind)) return NextResponse.json({ message: 'نوع نامعتبر' }, { status: 404 });

  const g = await guard(req);
  if (g.error) return g.error;

  const body = await req.json().catch(() => ({}));
  const row = sanitize(kind, body as Record<string, unknown>);
  if (!row.title && !row.player_name) {
    return NextResponse.json({ message: 'عنوان الزامی است' }, { status: 400 });
  }

  const { data, error } = await sb().from(CONTENT[kind].table).insert(row).select().single();
  if (error) {
    console.error(`[admin/content/${kind}] insert error:`, error.message);
    if (/duplicate key/i.test(error.message)) {
      return NextResponse.json({ message: 'این نشانی (slug) قبلاً ثبت شده است' }, { status: 409 });
    }
    return NextResponse.json({ message: 'ثبت انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CONTENT_CREATED',
    entityType: kind, entityId: String((data as { id?: string })?.id ?? ''),
    ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!isContentKind(kind)) return NextResponse.json({ message: 'نوع نامعتبر' }, { status: 404 });

  const g = await guard(req);
  if (g.error) return g.error;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(body?.id ?? '');
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه‌ی نامعتبر' }, { status: 400 });

  const patch = sanitize(kind, body);
  patch.updated_at = new Date().toISOString();
  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ message: 'چیزی برای تغییر داده نشد' }, { status: 400 });
  }

  const { data, error } = await sb().from(CONTENT[kind].table)
    .update(patch).eq('id', id).select().single();

  if (error) {
    console.error(`[admin/content/${kind}] update error:`, error.message);
    return NextResponse.json({ message: 'به‌روزرسانی انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CONTENT_UPDATED',
    entityType: kind, entityId: id, ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  if (!isContentKind(kind)) return NextResponse.json({ message: 'نوع نامعتبر' }, { status: 404 });

  const g = await guard(req);
  if (g.error) return g.error;

  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه‌ی نامعتبر' }, { status: 400 });

  const { error } = await sb().from(CONTENT[kind].table).delete().eq('id', id);
  if (error) {
    console.error(`[admin/content/${kind}] delete error:`, error.message);
    return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CONTENT_DELETED',
    entityType: kind, entityId: id, ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
