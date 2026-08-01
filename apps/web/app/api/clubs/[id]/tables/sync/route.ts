export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';

/* هم‌گام‌سازی میزهای باشگاه با دیتابیس.
   تا امروز میزها فقط در localStorage مرورگر باشگاه‌دار بودند و همین باعث
   می‌شد میزی که در باشگاه ثبت نشده هم قابل رزرو باشد. حالا منبع حقیقت
   جدول tables است و این مسیر لیست باشگاه‌دار را روی آن می‌نشاند.

   ــ میز حذف‌شده پاک نمی‌شود، غیرفعال می‌شود تا رزروهای گذشته و قفل
     ساعت‌ها دست‌نخورده بمانند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InTable {
  id?: string; name?: string; number?: number | string | null; type?: string;
  brand?: string | null; model?: string | null; pricePerHour?: number | string;
  morningDiscount?: number | null; discountRules?: unknown; photoDataUrl?: string | null;
  playerSurchargeEnabled?: boolean; playerSurchargePercent?: number | string; playerSurchargeFrom?: number | string;
  reservationClosed?: boolean;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  const payload = sessionFromRequest(req);
  if (!payload) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const sb = getSupabaseServer();
  const { data: club } = await sb.from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
  if ((club as { ownerId?: string }).ownerId !== payload.id && payload.role !== 'admin') {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const incoming: InTable[] = Array.isArray(body?.tables) ? body.tables.slice(0, 200) : [];

  const TYPE_FA: Record<string, string> = {
    snooker: 'اسنوکر', pocket: 'پاکت', highball: 'هی‌بال',
    vip_snooker: 'VIP اسنوکر', vipSnooker: 'VIP اسنوکر',
    vip_pocket: 'VIP پاکت', vipPocket: 'VIP پاکت', airHockey: 'ایرهاکی',
  };

  const row = (t: InTable, i: number) => ({
    clubId,
    /* نام و شماره هیچ‌وقت خالی نمی‌مانند تا با اسکیمای قدیمی هم کار کند */
    name: String(t.name || `میز ${TYPE_FA[String(t.type ?? '')] ?? ''} ${Number(t.number) || i + 1}`).trim().slice(0, 120),
    number: Number(t.number) || i + 1,
    type: String(t.type || 'snooker').slice(0, 40),
    brand: t.brand ? String(t.brand).slice(0, 80) : null,
    model: t.model ? String(t.model).slice(0, 80) : null,
    pricePerHour: Math.max(0, Math.min(50_000_000, Math.round(Number(t.pricePerHour) || 0))),
    morningDiscount: Math.max(0, Math.min(100, Math.round(Number(t.morningDiscount) || 0))),
    discountRules: Array.isArray(t.discountRules) && t.discountRules.length > 0 ? t.discountRules : null,
    photoDataUrl: typeof t.photoDataUrl === 'string' ? t.photoDataUrl.slice(0, 400_000) : null,
    /* هزینه‌ی بازیکن اضافه در سطح میز. NULL معنادار است: یعنی «تنظیم
       باشگاه اعمال شود»، پس نبود مقدار نباید صفر ذخیره شود. */
    playerSurchargeEnabled: t.playerSurchargeEnabled === undefined ? null : !!t.playerSurchargeEnabled,
    playerSurchargePercent: Number.isFinite(Number(t.playerSurchargePercent))
      ? Math.max(0, Math.min(100, Math.round(Number(t.playerSurchargePercent)))) : null,
    playerSurchargeFrom: Number.isFinite(Number(t.playerSurchargeFrom))
      ? Math.max(1, Math.min(12, Math.round(Number(t.playerSurchargeFrom)))) : null,
    /* بستنِ رزروِ همین میز — میز ثبت‌شده می‌ماند ولی در صفحه‌ی رزرو
       دیده نمی‌شود. با isActive فرق دارد: آن یعنی میز اصلاً نیست و از
       گزارش‌ها هم بیرون می‌رود. */
    reservationClosed: !!t.reservationClosed,
    isActive: true,
  });

  /* اگر مایگریشن ۰۰۳ هنوز اجرا نشده باشد، پیام روشن بده نه خطای خام */
  /* متن خام خطای دیتابیس فقط در لاگ سرور می‌ماند؛ به کاربر پیام
     قابل‌فهم می‌رسد. تنها استثنا خطای «مایگریشن اجرا نشده» است که
     پیامش راهنمای خود ماست، نه نشت داده. */
  const msg = (what: string, raw: string) => {
    console.error(`[clubs/:id/tables/sync] ${what}:`, raw);
    return /does not exist|schema cache|column/i.test(raw)
      ? 'ساختار جدول میزها هنوز به‌روز نشده است (مایگریشن ۰۰۳ اجرا نشده)'
      : `خطا در ${what} میز`;
  };

  const idMap: Record<string, string> = {};
  const keepIds: string[] = [];

  /* ستونِ reservationClosed با مهاجرتِ ۰۳۶ می‌آید. تا وقتی اجرا نشده،
     نبودنش نباید ذخیره‌ی *کلِ* میزها را بشکند — یعنی یک فیلدِ نو،
     قابلیتی را که تا امروز کار می‌کرده از کار بیندازد. یک بار تشخیص
     داده می‌شود و بقیه‌ی حلقه بدونِ آن ادامه می‌دهد. */
  let hasClosedColumn = true;
  const rowFor = (t: InTable, i: number) => {
    const r = row(t, i) as Record<string, unknown>;
    if (!hasClosedColumn) delete r.reservationClosed;
    return r;
  };
  const isMissingClosed = (m: string) =>
    /does not exist|schema cache|PGRST204/i.test(m) && /reservationClosed/i.test(m);

  for (let i = 0; i < incoming.length; i++) {
    const t = incoming[i]!;
    const existingId = t.id && UUID.test(String(t.id)) ? String(t.id) : null;
    if (existingId) {
      let { error } = await sb.from('tables').update(rowFor(t, i)).eq('id', existingId).eq('clubId', clubId);
      if (error && isMissingClosed(error.message)) {
        hasClosedColumn = false;
        console.error('[tables/sync] ستون reservationClosed نیست — مهاجرت ۰۳۶ اجرا نشده');
        ({ error } = await sb.from('tables').update(rowFor(t, i)).eq('id', existingId).eq('clubId', clubId));
      }
      if (error) return NextResponse.json({ message: msg('به‌روزرسانی', error.message) }, { status: 500 });
      keepIds.push(existingId);
    } else {
      let { data, error } = await sb.from('tables').insert(rowFor(t, i)).select('id').single();
      if (error && isMissingClosed(error.message)) {
        hasClosedColumn = false;
        console.error('[tables/sync] ستون reservationClosed نیست — مهاجرت ۰۳۶ اجرا نشده');
        ({ data, error } = await sb.from('tables').insert(rowFor(t, i)).select('id').single());
      }
      if (error) return NextResponse.json({ message: msg('ثبت', error.message) }, { status: 500 });
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
