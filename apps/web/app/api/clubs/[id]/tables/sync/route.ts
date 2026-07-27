export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

/* هم‌گام‌سازیِ میزهای باشگاه با دیتابیس.
   تا امروز میزها فقط در localStorageِ مرورگرِ باشگاه‌دار بودند و همین باعث
   می‌شد میزی که در باشگاه ثبت نشده هم قابلِ رزرو باشد. حالا منبعِ حقیقت
   جدولِ tables است و این مسیر لیستِ باشگاه‌دار را روی آن می‌نشاند.

   ــ میزِ حذف‌شده پاک نمی‌شود، غیرفعال می‌شود تا رزروهای گذشته و قفلِ
     ساعت‌ها دست‌نخورده بمانند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InTable {
  id?: string; name?: string; number?: number | string | null; type?: string;
  brand?: string | null; model?: string | null; pricePerHour?: number | string;
  morningDiscount?: number | null; discountRules?: unknown; photoDataUrl?: string | null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  let payload: { sub: string; primaryRole?: string; roles?: string[] };
  try { payload = jwt.verify(token, process.env.JWT_SECRET!) as typeof payload; }
  catch { return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401 }); }

  const sb = getSupabaseServer();
  const { data: club } = await sb.from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle();
  const role = payload.primaryRole ?? payload.roles?.[0] ?? 'user';
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
  if ((club as { ownerId?: string }).ownerId !== payload.sub && role !== 'admin') {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const incoming: InTable[] = Array.isArray(body?.tables) ? body.tables.slice(0, 200) : [];

  const row = (t: InTable) => ({
    clubId,
    name: t.name ? String(t.name).slice(0, 120) : null,
    number: t.number === undefined || t.number === null || t.number === '' ? null : Number(t.number) || null,
    type: String(t.type || 'snooker').slice(0, 40),
    brand: t.brand ? String(t.brand).slice(0, 80) : null,
    model: t.model ? String(t.model).slice(0, 80) : null,
    pricePerHour: Math.max(0, Math.min(50_000_000, Math.round(Number(t.pricePerHour) || 0))),
    morningDiscount: Math.max(0, Math.min(100, Math.round(Number(t.morningDiscount) || 0))),
    discountRules: Array.isArray(t.discountRules) && t.discountRules.length > 0 ? t.discountRules : null,
    photoDataUrl: typeof t.photoDataUrl === 'string' ? t.photoDataUrl.slice(0, 400_000) : null,
    isActive: true,
  });

  const idMap: Record<string, string> = {};
  const keepIds: string[] = [];

  for (const t of incoming) {
    const existingId = t.id && UUID.test(String(t.id)) ? String(t.id) : null;
    if (existingId) {
      const { error } = await sb.from('tables').update(row(t)).eq('id', existingId).eq('clubId', clubId);
      if (error) return NextResponse.json({ message: 'خطا در به‌روزرسانیِ میز: ' + error.message }, { status: 500 });
      keepIds.push(existingId);
    } else {
      const { data, error } = await sb.from('tables').insert(row(t)).select('id').single();
      if (error) return NextResponse.json({ message: 'خطا در ثبتِ میز: ' + error.message }, { status: 500 });
      const newId = String((data as { id: string }).id);
      if (t.id) idMap[String(t.id)] = newId;
      keepIds.push(newId);
    }
  }

  /* میزهایی که دیگر در لیست نیستند ⇒ غیرفعال (نه حذف) */
  let stale = sb.from('tables').update({ isActive: false }).eq('clubId', clubId);
  if (keepIds.length > 0) stale = stale.not('id', 'in', `(${keepIds.join(',')})`);
  await stale;

  const { data: fresh } = await sb.from('tables').select('*').eq('clubId', clubId).eq('isActive', true);
  return NextResponse.json({ tables: fresh ?? [], idMap });
}
