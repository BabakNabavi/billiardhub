export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { getQuotaState } from '@/lib/ads/quota';

/* آگهی‌های بیلیارد بازار — روی سرور، نه در مرورگرِ کاربر.

   پیش‌تر فرمِ ثبتِ آگهی نتیجه را در localStorage می‌نوشت؛ آگهی را کسی
   جز خودِ آگهی‌دهنده نمی‌دید و سرور هم نمی‌دانست چند آگهی ثبت شده،
   پس هیچ سهمیه‌ای قابلِ اعمال نبود. */

const num = (v: unknown, d = 0) => {
  const n = Number(String(v ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

/* ── فهرستِ آگهی‌ها ─────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get('mine') === '1';
  const limit = Math.min(200, Math.max(1, num(searchParams.get('limit'), 100)));

  let q = sb().from('products').select('*').order('createdAt', { ascending: false }).limit(limit);

  if (mine) {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
    q = q.eq('sellerId', actor.id);
  } else {
    q = q.eq('status', 'active');
  }

  const { data, error } = await q;
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return NextResponse.json({ ads: [] });
    return NextResponse.json({ message: 'خطا در دریافتِ آگهی‌ها' }, { status: 500 });
  }
  return NextResponse.json({ ads: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ── ثبتِ آگهیِ تازه ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'برای ثبت آگهی ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));

  const title = str(b?.name ?? b?.title, 160);
  const price = Math.max(0, Math.round(num(b?.price)));
  const category = str(b?.category, 60);
  if (!title || !price || !category) {
    return NextResponse.json({ message: 'نام، قیمت و دسته‌بندی الزامی است' }, { status: 400 });
  }

  /* سهمیه — تا وقتی ادمین روشنش نکرده، همیشه اجازه می‌دهد */
  const quota = await getQuotaState(actor.id);
  if (!quota.allowed) {
    return NextResponse.json({
      message: quota.message,
      quotaExceeded: true,
      quota: { used: quota.used, limit: quota.limit, period: quota.period, resetAt: quota.resetAt },
    }, { status: 429 });
  }

  const old = Math.max(price, Math.round(num(b?.old, price)));
  const disc = old > price ? Math.round((1 - price / old) * 100) : 0;
  const images = Array.isArray(b?.images) ? (b.images as string[]).slice(0, 8) : [];

  const { data, error } = await sb().from('products').insert({
    title,
    description: str(b?.description, 3000),
    price,
    discountPrice: disc > 0 ? price : null,
    discountPercent: disc,
    category,
    condition: str(b?.condition, 20) || 'new',
    status: 'active',
    city: str(b?.city, 60),
    province: str(b?.province, 60),
    stock: 1,
    images,
    video: str(b?.video, 500) || null,
    brand: str(b?.brand, 80),
    model: str(b?.model, 80),
    type: str(b?.type, 80),
    specs: b?.specs && typeof b.specs === 'object' ? b.specs : null,
    section: str(b?.section, 20) || 'newest',
    sellerName: str(b?.sellerName ?? b?.shopName, 120),
    sellerPhone: str(b?.sellerPhone, 20),
    sellerWhatsapp: str(b?.sellerWhatsapp, 20),
    address: str(b?.address, 300),
    storeSlug: str(b?.storeSlug, 80) || null,
    isDailyDeal: false,
    isSpecialSale: false,
    isVerified: false,
    requestedVerification: false,
    isOfficialStore: !!b?.storeSlug,
    sellerId: actor.id,
    views: 0,
  }).select().single();

  if (error) {
    console.error('create ad failed:', error.message);
    if (/does not exist|schema cache|column/i.test(error.message)) {
      return NextResponse.json({ message: 'ساختارِ جدولِ آگهی‌ها به‌روز نیست (مایگریشن ۰۰۶ اجرا نشده)' }, { status: 503 });
    }
    return NextResponse.json({ message: 'ثبت آگهی انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({ ad: data, quota: { used: quota.used + 1, limit: quota.limit } }, { status: 201 });
}
