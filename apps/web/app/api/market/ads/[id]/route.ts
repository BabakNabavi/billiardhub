export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, isAdmin, clientIp } from '@/lib/finance/db';
import { viewerHash } from '@/lib/ads/preroll';
import { normalizeCategory, normalizeCondition } from '@/lib/market/categories';
import { normalizeAdImages } from '@/lib/market/images';

/* یک آگهی بیلیارد بازار — خواندن، ویرایش و حذف.
   ویرایش و حذف فقط برای صاحب آگهی یا ادمین. */

/* ورودیِ خالی پیش‌فرض می‌دهد نه صفر — `Number('')` صفر است و همین
   در مسیرِ فهرست باعث شده بود سقفِ نتایج ۱ شود. */
const num = (v: unknown, d = 0) => {
  const cleaned = String(v ?? '')
    .replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)))
    .replace(/[^0-9.]/g, '');
  if (!cleaned) return d;
  const n = Number(cleaned);
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

  /* ── چه کسی چه چیزی را می‌بیند ──

     `sold` و `expired` عمداً عمومی می‌مانند: لینکشان ممکن است در
     نتایج جست‌وجو یا در پیامِ کسی باشد و ۴۰۴ دادن به بازدیدکننده
     چیزی جز سردرگمی نیست — صفحه با نشانِ «فروخته شد» بازتر است.

     ولی `paused`، `pending` و `rejected` نباید عمومی باشند. تا امروز
     هر کسی که نشانی را داشت، آگهیِ متوقف‌شده یا ردشده را کامل — با
     شماره‌ی تماس — می‌دید. */
  const PUBLIC = ['active', 'sold', 'expired'];
  if (!PUBLIC.includes(String(ad.status))) {
    const actor = actorFromRequest(_req);
    const owner = actor && String(ad.sellerId) === actor.id;
    if (!owner && !(actor && await isAdmin(actor.id))) {
      return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });
    }
  }

  /* ── شمارنده‌ی بازدید ──
     پیش‌تر هر بارگذاریِ صفحه یکی بالا می‌برد، یعنی فروشنده با ده بار
     رفرش آگهی‌اش را «پربازدید» می‌کرد و مرتب‌سازیِ محبوب‌ترین بی‌معنی
     می‌شد.

     حالا هر بیننده در هر ساعت یک‌بار شمرده می‌شود. بیننده با هشِ
     برگشت‌ناپذیرِ IP+UA شناخته می‌شود — نه کوکی، نه شناسه‌ی کاربر —
     پس چیزی درباره‌ی هویتِ کسی ذخیره نمی‌شود. شمارش داخلِ دیتابیس و
     اتمیک است. شکستش نباید صفحه را خراب کند. */
  const viewer = viewerHash(clientIp(_req), _req.headers.get('user-agent'));
  if (viewer) {
    void rpc('count_product_view', { p_product: id, p_viewer: viewer })
      .then(() => { }, () => { });
  }

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
  if (b?.category !== undefined) patch.category = normalizeCategory(str(b?.category, 60));
  if (b?.condition !== undefined) patch.condition = normalizeCondition(str(b?.condition, 20));
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
  /* همان قاعده‌ی مسیرِ ثبت: base64 به Storage می‌رود و نشانی ذخیره
     می‌شود. قاعده‌ای که در یکی از دو مسیرِ نوشتن باشد و در دیگری نه،
     یعنی ویرایشِ آگهی همان متنِ چندمگابایتی را برمی‌گرداند. */
  if (Array.isArray(b?.images)) patch.images = await normalizeAdImages(b.images, actor.id);

  /* وضعیت‌هایی که خودِ فروشنده می‌تواند بگذارد.

     `sold` تازه است و لازم بود: بدونِ آن، فروشنده‌ای که کالایش رفته
     یا آگهی را متوقف می‌کرد (و خریدارِ بعدی فکر می‌کرد حذف شده) یا
     رهایش می‌کرد و تلفنش برای کالای نبوده زنگ می‌خورد.

     `pending`، `rejected` و `deleted` عمداً این‌جا نیستند — آن‌ها
     تصمیمِ ادمین‌اند و از این مسیر قابلِ گذاشتن نباشند. */
  const SELLER_STATUSES = ['active', 'paused', 'sold'];
  if (b?.status !== undefined && SELLER_STATUSES.includes(String(b.status))) {
    patch.status = String(b.status);
    /* لحظه‌ی فروش ثبت می‌شود و با فعال‌شدنِ دوباره پاک — وگرنه آگهیِ
       دوباره‌فعال، تاریخِ فروشِ قدیمی را با خودش می‌کشید. */
    patch.soldAt = String(b.status) === 'sold' ? new Date().toISOString() : null;
  }

  /* تمدید: عمرِ آگهی از همین لحظه شصت روز می‌شود.

     آگهیِ منقضی هم تمدید می‌شود و به فعال برمی‌گردد؛ نبودنِ این راه
     یعنی فروشنده باید آگهی را از نو بسازد و یک سهمیه‌ی دیگر بدهد. */
  if (b?.renew === true) {
    patch.expiresAt = new Date(Date.now() + 60 * 86400_000).toISOString();
    patch.renewedAt = new Date().toISOString();
    if (['expired', 'paused'].includes(String(ad.status))) patch.status = 'active';
  }

  if (b?.price !== undefined || b?.negotiable !== undefined) {
    const negotiable = b?.negotiable !== undefined ? b.negotiable === true : ad.negotiable === true;
    const price = Math.max(0, Math.round(num(b?.price ?? ad.price)));
    /* همان قاعده‌ی ثبتِ آگهی — قیمت فقط وقتی اجباری است که توافقی
       نباشد. تکرارِ قاعده در دو مسیر خطرناک است، پس دیتابیس هم قیدش
       را دارد (مهاجرتِ ۰۶۰). */
    if (!negotiable && price <= 0) {
      return NextResponse.json({ message: 'قیمت را وارد کنید یا گزینه‌ی «توافقی» را بزنید' }, { status: 400 });
    }
    if (price > 100_000_000_000) {
      return NextResponse.json({ message: 'مبلغ واردشده معتبر نیست' }, { status: 400 });
    }
    /* همان قراردادِ مسیرِ ثبت: `price` قیمتِ خط‌خورده و `discountPrice`
       قیمتِ پرداختی. اگر این‌جا برعکس بنویسیم، ویرایشِ یک آگهی عددِ
       خط‌خورده‌اش را دوباره خراب می‌کند. */
    const old = Math.max(price, Math.min(100_000_000_000, Math.round(num(b?.old, price))));
    const discounted = !negotiable && old > price;
    patch.price = discounted ? old : price;
    patch.negotiable = negotiable;
    patch.discountPercent = discounted ? Math.round((1 - price / old) * 100) : 0;
    patch.discountPrice = discounted ? price : null;
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
