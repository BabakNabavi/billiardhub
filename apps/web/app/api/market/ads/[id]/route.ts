export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* یک آگهی بیلیارد بازار — خواندن، ویرایش و حذف.
   ویرایش و حذف فقط برای صاحب آگهی یا ادمین. */

const num = (v: unknown, d = 0) => {
  const n = Number(String(v ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  const { data, error } = await sb().from('products').select('*').eq('id', id).maybeSingle();
  if (error) return null;
  return (data as Record<string, unknown>) ?? null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  /* شناسه‌های عددی متعلق به کاتالوگ نمونه‌اند و اصلاً در دیتابیس نیستند */
  if (!UUID.test(id)) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  const ad = await load(id);
  if (!ad || ad.status === 'deleted') return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  /* شمارنده‌ی بازدید — شکست آن نباید صفحه را خراب کند */
  void sb().from('products').update({ views: num(ad.views) + 1 }).eq('id', id).then(() => {}, () => {});

  return NextResponse.json({ ad }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  const ad = await load(id);
  if (!ad) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });
  if (String(ad.sellerId) !== actor.id && !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'این آگهی متعلق به شما نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (b?.name !== undefined || b?.title !== undefined) patch.title = str(b?.name ?? b?.title, 160);
  if (b?.description !== undefined) patch.description = str(b?.description, 3000);
  if (b?.category !== undefined) patch.category = str(b?.category, 60);
  if (b?.condition !== undefined) patch.condition = str(b?.condition, 20);
  if (b?.city !== undefined) patch.city = str(b?.city, 60);
  if (b?.province !== undefined) patch.province = str(b?.province, 60);
  if (b?.address !== undefined) patch.address = str(b?.address, 300);
  if (b?.brand !== undefined) patch.brand = str(b?.brand, 80);
  if (b?.model !== undefined) patch.model = str(b?.model, 80);
  if (b?.type !== undefined) patch.type = str(b?.type, 80);
  if (b?.sellerName !== undefined) patch.sellerName = str(b?.sellerName, 120);
  if (b?.sellerPhone !== undefined) patch.sellerPhone = str(b?.sellerPhone, 20);
  if (b?.sellerWhatsapp !== undefined) patch.sellerWhatsapp = str(b?.sellerWhatsapp, 20);
  if (b?.specs !== undefined) patch.specs = b?.specs && typeof b.specs === 'object' ? b.specs : null;
  if (Array.isArray(b?.images)) patch.images = (b.images as string[]).slice(0, 8);
  if (b?.status !== undefined && ['active', 'paused'].includes(String(b.status))) patch.status = String(b.status);

  if (b?.price !== undefined) {
    const price = Math.max(0, Math.round(num(b.price)));
    const old = Math.max(price, Math.round(num(b?.old, price)));
    patch.price = price;
    patch.discountPercent = old > price ? Math.round((1 - price / old) * 100) : 0;
    patch.discountPrice = old > price ? price : null;
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ ad });

  const { data, error } = await sb().from('products').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ message: 'ویرایش انجام نشد' }, { status: 500 });
  return NextResponse.json({ ad: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  const ad = await load(id);
  if (!ad) return NextResponse.json({ ok: true });
  if (String(ad.sellerId) !== actor.id && !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'این آگهی متعلق به شما نیست' }, { status: 403 });
  }

  const { error } = await sb().from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
