export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb } from '@/lib/finance/db';

/* علاقه‌مندی‌های کاربر.

   عمومی نیست: هرکس فقط فهرست خودش را می‌بیند و فقط برای خودش
   اضافه/حذف می‌کند. `user_id` هرگز از بدنه‌ی درخواست خوانده نمی‌شود —
   همیشه از توکن می‌آید، وگرنه می‌شد فهرست دیگری را دستکاری کرد. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = new Set(['club', 'coach', 'referee', 'seller', 'product']);

/* جدول مقصد هر نوع — برای غنی‌سازی فهرست و انداختن رکورد یتیم */
const SOURCE: Record<string, { table: string; cols: string }> = {
  club:    { table: 'clubs',    cols: 'id,name,city,images,logo,"ratingAvg","ratingCount"' },
  seller:  { table: 'users',    cols: 'id,"firstName","lastName",avatar' },
  coach:   { table: 'users',    cols: 'id,"firstName","lastName",avatar' },
  referee: { table: 'users',    cols: 'id,"firstName","lastName",avatar' },
  product: { table: 'products', cols: 'id,title,price,"discountPrice",images' },
};

/* GET /api/favorites?type=club — فهرست من */
export async function GET(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const type = req.nextUrl.searchParams.get('type');
  let q = sb().from('favorites').select('id,entity_type,entity_id,created_at').eq('user_id', actor.id);
  if (type && TYPES.has(type)) q = q.eq('entity_type', type);

  const { data, error } = await q.order('created_at', { ascending: false }).limit(300);
  if (error) return NextResponse.json({ favorites: [] });

  const rows = (data ?? []) as { id: string; entity_type: string; entity_id: string; created_at: string }[];

  /* یک کوئری به‌ازای هر **نوع**، نه هر رکورد — وگرنه فهرست ۵۰تایی
     یعنی ۵۰ رفت‌وبرگشت. */
  const byType = new Map<string, string[]>();
  for (const r of rows) byType.set(r.entity_type, [...(byType.get(r.entity_type) ?? []), r.entity_id]);

  const entities = new Map<string, Record<string, unknown>>();
  await Promise.all([...byType.entries()].map(async ([t, ids]) => {
    const src = SOURCE[t];
    if (!src) return;
    const { data: ents } = await sb().from(src.table).select(src.cols).in('id', ids);
    for (const e of (ents ?? []) as unknown as Record<string, unknown>[]) {
      entities.set(`${t}:${String(e.id)}`, e);
    }
  }));

  /* موجودیت حذف‌شده از فهرست می‌افتد (FK چندمقصدی ممکن نیست) */
  const favorites = rows
    .map(r => ({ ...r, entity: entities.get(`${r.entity_type}:${r.entity_id}`) ?? null }))
    .filter(r => r.entity !== null);

  return NextResponse.json({ favorites }, { headers: { 'Cache-Control': 'no-store' } });
}

/* POST { entityType, entityId } — افزودن (idempotent) */
export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const entityType = String(b?.entityType ?? '');
  const entityId = String(b?.entityId ?? '');

  if (!TYPES.has(entityType)) return NextResponse.json({ message: 'نوع معتبر نیست' }, { status: 400 });
  if (!UUID.test(entityId)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  /* موجودیت باید واقعاً وجود داشته باشد — وگرنه فهرست علاقه‌مندی
     پر می‌شود از شناسه‌های ساختگی. */
  const src = SOURCE[entityType]!;
  const { data: ent } = await sb().from(src.table).select('id').eq('id', entityId).maybeSingle();
  if (!ent) return NextResponse.json({ message: 'مورد یافت نشد' }, { status: 404 });

  /* دوباره‌زدن قلب نباید خطا بدهد — همان وضعیت برمی‌گردد */
  const { error } = await sb().from('favorites')
    .upsert({ user_id: actor.id, entity_type: entityType, entity_id: entityId },
            { onConflict: 'user_id,entity_type,entity_id', ignoreDuplicates: true });

  if (error) {
    console.error('[favorites] insert:', error.message);
    return NextResponse.json({ message: 'ذخیره انجام نشد' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, favorited: true }, { status: 201 });
}

/* DELETE ?entityType=club&entityId=... */
export async function DELETE(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const entityType = String(sp.get('entityType') ?? '');
  const entityId = String(sp.get('entityId') ?? '');

  if (!TYPES.has(entityType) || !UUID.test(entityId)) {
    return NextResponse.json({ message: 'درخواست معتبر نیست' }, { status: 400 });
  }

  const { error } = await sb().from('favorites').delete()
    .eq('user_id', actor.id).eq('entity_type', entityType).eq('entity_id', entityId);

  if (error) return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
  return NextResponse.json({ ok: true, favorited: false });
}
