export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, rpc, actorFromRequest, isAdmin, clientIp } from '@/lib/finance/db';
import { viewerHash } from '@/lib/ads/preroll';
import { normalizeCategory, normalizeCondition } from '@/lib/market/categories';
import { validateOnServer, getBrand, TYPE_PREFIX, isAccessoryCategory, isProductCatalog, ACCESSORY_TYPE_OF, type CatalogId } from '@/lib/market/catalog'
import { hasSpecCatalog, validateSpecsOnServer } from '@/lib/market/spec-catalog'
import { normalizeAdImages } from '@/lib/market/images';
import { normalizePhoneFa, isIranMobile, toStoredWhatsapp } from '@/lib/text-fa';

/* یک آگهی بیلیارد بازار — خواندن، ویرایش و حذف.
   ویرایش و حذف فقط برای صاحب آگهی یا ادمین. */

/* ورودی خالی پیش‌فرض می‌دهد نه صفر — `Number('')` صفر است و همین
   در مسیر فهرست باعث شده بود سقف نتایج ۱ شود. */
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
  /* شناسه‌های عددی متعلق به کاتالوگ نمونه‌اند و اصلا در دیتابیس نیستند */
  if (!UUID.test(id)) return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  const ad = await load(id);
  if (!ad || ad.status === 'deleted') return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });

  /* ── چه کسی چه چیزی را می‌بیند ──

     `sold` و `expired` عمدا عمومی می‌مانند: لینکشان ممکن است در
     نتایج جست‌وجو یا در پیام کسی باشد و ۴۰۴ دادن به بازدیدکننده
     چیزی جز سردرگمی نیست — صفحه با نشان «فروخته شد» بازتر است.

     ولی `paused`، `pending` و `rejected` نباید عمومی باشند. تا امروز
     هر کسی که نشانی را داشت، آگهی متوقف‌شده یا ردشده را کامل — با
     شماره‌ی تماس — می‌دید. */
  const PUBLIC = ['active', 'sold', 'expired'];
  const actor = actorFromRequest(_req);
  const isPublic = PUBLIC.includes(String(ad.status));
  /* پرس‌وجوی ادمین فقط وقتی لازم است که چیزی واقعا پنهان باشد — نه برای
     هر بازدیدِ آگهیِ عمومی */
  const needsCheck = !isPublic || ad.adminNote != null;
  const privileged = !!actor && (String(ad.sellerId) === actor.id
    || (needsCheck && await isAdmin(actor.id)));
  if (!isPublic && !privileged) {
    return NextResponse.json({ message: 'آگهی پیدا نشد' }, { status: 404 });
  }
  /* ⚠️ یادداشتِ ادمین (مثلا دلیلِ رد) فقط برای صاحبِ آگهی و ادمین.
     پیش‌تر `select('*')` آن را به هر بازدیدکننده‌ای می‌داد — آگهیِ ردشده
     که بعد دوباره فعال می‌شد، دلیلِ ردش را روی صفحه‌ی عمومی داشت. */
  if (!privileged) delete ad.adminNote;
  /* ⚠️ آدرسِ فروشنده‌ی شخصی داده‌ی خصوصی است (نشانیِ خانه‌اش). صفحه فقط
     آدرسِ فروشگاه را نشان می‌دهد و فرم همین را به فروشنده می‌گوید؛ پس
     پاسخِ خامِ API هم نباید آن را به هر کسی بدهد. */
  if (!privileged && !ad.storeSlug) delete ad.address;

  /* ── شمارنده‌ی بازدید ──
     پیش‌تر هر بارگذاری صفحه یکی بالا می‌برد، یعنی فروشنده با ده بار
     رفرش آگهی‌اش را «پربازدید» می‌کرد و مرتب‌سازی محبوب‌ترین بی‌معنی
     می‌شد.

     حالا هر بیننده در هر ساعت یک‌بار شمرده می‌شود. بیننده با هش
     برگشت‌ناپذیر IP+UA شناخته می‌شود — نه کوکی، نه شناسه‌ی کاربر —
     پس چیزی درباره‌ی هویت کسی ذخیره نمی‌شود. شمارش داخل دیتابیس و
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
  const owner = String(ad.sellerId) === actor.id;
  const admin = !owner && await isAdmin(actor.id);
  if (!owner && !admin) {
    return NextResponse.json({ message: 'این آگهی متعلق به شما نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  /* ── فروشگاه: نام و آدرس از پروفایلِ فروشگاه‌اند ──
     فرمِ ثبت این دو را برای صاحبِ فروشگاه از پروفایل پر و قفل می‌کند. بدونِ
     همین قفل این‌جا، ویرایش هر نامی را روی آگهیِ «فروشگاهِ رسمی» می‌گذاشت. */
  const storeLocked = !!ad.storeSlug && !admin;

  if (b?.name !== undefined || b?.title !== undefined) patch.title = str(b?.name ?? b?.title, 160);
  if (b?.description !== undefined) patch.description = str(b?.description, 3000);
  if (b?.category !== undefined) patch.category = normalizeCategory(str(b?.category, 60));
  if (b?.condition !== undefined) patch.condition = normalizeCondition(str(b?.condition, 20));
  if (b?.city !== undefined) patch.city = str(b?.city, 60);
  if (b?.province !== undefined) patch.province = str(b?.province, 60);
  if (b?.address !== undefined && !storeLocked) patch.address = str(b?.address, 300);
  if (b?.brand !== undefined) patch.brand = str(b?.brand, 80);
  if (b?.model !== undefined) patch.model = str(b?.model, 80);
  if (b?.type !== undefined) patch.type = str(b?.type, 80);
  if (b?.sellerName !== undefined && !storeLocked) patch.sellerName = str(b?.sellerName, 120);
  /* ⚠️ شماره‌ها در مرز سنجیده می‌شوند، نه فقط در فرم. این مسیر حالا فرمِ
     ویرایشِ تماس را پشتیبانی می‌کند و هر رشته‌ی بیست‌نویسه‌ای را
     می‌پذیرفت. خالی یعنی «بدونِ این شماره». */
  if (b?.sellerPhone !== undefined) {
    const raw = str(b?.sellerPhone, 30);
    if (raw && !isIranMobile(raw)) {
      return NextResponse.json({ message: 'شماره تماس معتبر نیست (۰۹xxxxxxxxx)', errors: { sellerPhone: 'شماره تماس معتبر نیست' } }, { status: 400 });
    }
    patch.sellerPhone = raw ? normalizePhoneFa(raw) : '';
  }
  if (b?.sellerWhatsapp !== undefined) {
    const raw = str(b?.sellerWhatsapp, 30);
    if (raw && !isIranMobile(raw)) {
      return NextResponse.json({ message: 'شماره‌ی واتساپ معتبر نیست', errors: { sellerWhatsapp: 'شماره‌ی واتساپ معتبر نیست' } }, { status: 400 });
    }
    patch.sellerWhatsapp = raw ? toStoredWhatsapp(raw) : '';
  }
  if (b?.specs !== undefined) patch.specs = b?.specs && typeof b.specs === 'object' ? b.specs : null;

  /* همان ستون‌های ایندکس‌دار مسیر ثبت — وگرنه ویرایش، ستون و
     `specs` را از هم دور می‌اندازد. */
  if (b?.specs && typeof b.specs === 'object') {
    const sIn = b.specs as Record<string, unknown>;
    const pk = (k: string) => {
      const v = sIn[k];
      return typeof v === 'string' && v.trim() && v !== '__other__' ? v.trim().slice(0, 60) : null;
    };
    patch.bedMaterial = pk('bedMaterial');
    patch.shaftMaterial = pk('shaftMaterial');
    patch.cuePieces = pk('pieces');
  }

  /* ── همان قاعده‌های مسیر ثبت ──
     تا امروز ویرایش نه ستون‌های کاتالوگ را می‌پذیرفت نه مشخصات را
     می‌سنجید. یعنی ستون‌های ایندکس‌دار با محتوای `specs` از هم دور
     می‌افتادند و کل اعتبارسنجی POST با یک PATCH دور زده می‌شد.
     قاعده‌ای که در یکی از دو مسیر نوشتن باشد و در دیگری نه، باگ
     فرداست — این پروژه چند بار همین را دیده. */
  const cat = normalizeCategory(str(b?.category, 60));
  const catType = str(cat === 'cue' ? b?.cueType : cat === 'table' ? b?.tableType : b?.catalogType, 40);
  if (hasSpecCatalog(cat) && b?.specs && typeof b.specs === 'object') {
    const sv = validateSpecsOnServer(cat, b.specs as Record<string, unknown>, catType || undefined);
    if (!sv.ok) {
      const first = Object.values(sv.errors)[0] ?? 'مشخصات فنی معتبر نیست';
      return NextResponse.json({ message: first, errors: sv.errors }, { status: 400 });
    }
  }

  if ((isProductCatalog(cat) || isAccessoryCategory(cat)) && catType) {
    const brandId = str(b?.brandId, 80) || null;
    const check = validateOnServer({
      /* دسته‌های لوازم زیر یک کاتالوگ مشترک‌اند */
      /* ── ترتیب این شرط مهم است ──
         «پارچه» هم شناسه‌ی کاتالوگ خودش را دارد و هم یکی از ده
         دسته‌ی لوازم است. تا امروز `isAccessoryCategory` اول سنجیده
         می‌شد، پس آگهی پارچه با `category='accessories'` اعتبارسنجی
         می‌شد و نوع «snooker» در فهرست نوع‌های لوازم نبود — نتیجه‌اش
         «نوع را انتخاب کنید» روی فرمی که نوع را انتخاب کرده بود.
         کاتالوگ اختصاصی مقدم است، مثل خود فرم. */
      category: (isProductCatalog(cat) ? cat : 'accessories') as CatalogId,
      type: catType,
      brandId,
      brandCustom: brandId ? null : str(b?.brand, 80) || null,
      modelId: str(b?.modelId, 80) || null,
      modelCustom: null,
      sizeId: str(b?.tableSizeId, 40) || null,
      sizeCustom: str(b?.tableSizeCustom, 40) || null,
    });
    if (!check.ok) {
      const first = Object.values(check.errors)[0] ?? 'اطلاعات محصول معتبر نیست';
      return NextResponse.json({ message: first, errors: check.errors }, { status: 400 });
    }
    const val = check.value;
    patch.cueType = cat === 'cue' ? val.type : null;
    patch.tableType = cat === 'table' ? val.type : null;
    patch.brandId = val.brandId;
    patch.modelId = val.modelId;
    patch.tableSizeId = cat === 'table' ? val.sizeId ?? null : null;
    patch.tableSizeCustom = cat === 'table' ? val.sizeCustom ?? null : null;

    /* ⚠️ ستون‌های پارچه فقط وقتی دست می‌خورند که درخواست آن‌ها را آورده
       باشد. فرمِ ویرایش تا امروز این چهار کلید را نمی‌فرستاد و این شاخه
       با مقدارِ غایب null می‌نوشت — یعنی **هر ویرایشِ آگهیِ میز، برند و
       مدلِ پارچه‌اش را پاک می‌کرد.** */
    const clothSent = ['clothBrandId', 'clothBrandCustom', 'clothModelId', 'clothModelCustom']
      .some(k => b?.[k] !== undefined);
    if (cat === 'table' && clothSent) {
      const cbId = str(b?.clothBrandId, 80) || null;
      const cmId = str(b?.clothModelId, 80) || null;
      if (cbId) {
        const cb = getBrand('cloth', cbId);
        const prefix = TYPE_PREFIX.cloth[catType];
        if (!cb || !prefix || !cbId.startsWith(prefix)) {
          return NextResponse.json({ message: 'این پارچه برای نوع میز انتخاب‌شده نیست', errors: { clothBrand: 'این پارچه برای نوع میز انتخاب‌شده نیست' } }, { status: 400 });
        }
        if (cmId && !cb.models.some(m => m.id === cmId)) {
          return NextResponse.json({ message: 'این مدل پارچه برای برند انتخاب‌شده نیست', errors: { clothModel: 'این مدل پارچه برای برند انتخاب‌شده نیست' } }, { status: 400 });
        }
      } else if (cmId) {
        return NextResponse.json({ message: 'ابتدا برند پارچه را انتخاب کنید', errors: { clothModel: 'ابتدا برند پارچه را انتخاب کنید' } }, { status: 400 });
      }
      patch.clothBrandId = cbId;
      patch.clothBrandCustom = cbId ? null : str(b?.clothBrandCustom, 60) || null;
      patch.clothModelId = cbId ? cmId : null;
      patch.clothModelCustom = cmId ? null : str(b?.clothModelCustom, 60) || null;
    }
  }
  /* همان قاعده‌ی مسیر ثبت: base64 به Storage می‌رود و نشانی ذخیره
     می‌شود. قاعده‌ای که در یکی از دو مسیر نوشتن باشد و در دیگری نه،
     یعنی ویرایش آگهی همان متن چندمگابایتی را برمی‌گرداند. */
  if (Array.isArray(b?.images)) patch.images = await normalizeAdImages(b.images, actor.id);

  /* وضعیت‌هایی که خود فروشنده می‌تواند بگذارد.

     `sold` تازه است و لازم بود: بدون آن، فروشنده‌ای که کالایش رفته
     یا آگهی را متوقف می‌کرد (و خریدار بعدی فکر می‌کرد حذف شده) یا
     رهایش می‌کرد و تلفنش برای کالای نبوده زنگ می‌خورد.

     `pending`، `rejected` و `deleted` عمدا این‌جا نیستند — آن‌ها
     تصمیم ادمین‌اند و از این مسیر قابل گذاشتن نباشند. */
  const SELLER_STATUSES = ['active', 'paused', 'sold'];
  /* ⚠️ توقفِ مدیریت (مهاجرتِ ۱۱۱). «توقف موقت»ِ پنلِ ادمین همان `paused`
     را می‌نویسد؛ بدونِ این پرچم فروشنده با «فعال‌سازی» یا «تمدید» آن را
     برمی‌گرداند. تا وقتی مهاجرت اجرا نشده ستون نیست و `undefined` است. */
  const held = ad.moderation_hold === true && !admin;
  if (held && (b?.status !== undefined || b?.renew === true)) {
    return NextResponse.json({
      message: 'این آگهی توسط مدیریت متوقف شده است؛ برای بررسی با پشتیبانی تماس بگیرید',
    }, { status: 409 });
  }
  if (b?.status !== undefined && SELLER_STATUSES.includes(String(b.status))) {
    /* ⚠️ فروشنده فقط **بینِ همین سه** جابه‌جا می‌شود. پیش‌تر هر آگهی‌ای را
       می‌شد `active` کرد — یعنی آگهیِ `pending` (منتظرِ بازبینیِ ادمین) یا
       `rejected` (ردشده) با یک درخواست منتشر می‌شد و کلیدِ
       `market_approval_required` عملا بی‌اثر بود. آگهیِ منقضی هم از راهِ
       «تمدید» فعال می‌شود، نه با تغییرِ مستقیمِ وضعیت. */
    const current = String(ad.status);
    if (!SELLER_STATUSES.includes(current) && !admin) {
      return NextResponse.json({
        message: current === 'pending' ? 'این آگهی هنوز در انتظار تأیید است'
          : current === 'rejected' ? 'این آگهی رد شده است؛ پس از اصلاح، دوباره بررسی می‌شود'
          : current === 'expired' ? 'مهلت این آگهی تمام شده — تمدیدش کنید'
          : 'وضعیت این آگهی قابل تغییر نیست',
      }, { status: 409 });
    }
    patch.status = String(b.status);
    /* لحظه‌ی فروش ثبت می‌شود و با فعال‌شدن دوباره پاک — وگرنه آگهی
       دوباره‌فعال، تاریخ فروش قدیمی را با خودش می‌کشید. */
    patch.soldAt = String(b.status) === 'sold' ? new Date().toISOString() : null;
  }

  /* تمدید: عمر آگهی از همین لحظه شصت روز می‌شود.

     آگهی منقضی هم تمدید می‌شود و به فعال برمی‌گردد؛ نبودن این راه
     یعنی فروشنده باید آگهی را از نو بسازد و یک سهمیه‌ی دیگر بدهد. */
  if (b?.renew === true) {
    patch.expiresAt = new Date(Date.now() + 60 * 86400_000).toISOString();
    patch.renewedAt = new Date().toISOString();
    if (['expired', 'paused'].includes(String(ad.status))) patch.status = 'active';
  }

  if (b?.price !== undefined || b?.negotiable !== undefined) {
    const negotiable = b?.negotiable !== undefined ? b.negotiable === true : ad.negotiable === true;
    const price = Math.max(0, Math.round(num(b?.price ?? ad.price)));
    /* همان قاعده‌ی ثبت آگهی — قیمت فقط وقتی اجباری است که توافقی
       نباشد. تکرار قاعده در دو مسیر خطرناک است، پس دیتابیس هم قیدش
       را دارد (مهاجرت ۰۶۰). */
    if (!negotiable && price <= 0) {
      return NextResponse.json({ message: 'قیمت را وارد کنید یا گزینه‌ی «توافقی» را بزنید' }, { status: 400 });
    }
    if (price > 100_000_000_000) {
      return NextResponse.json({ message: 'مبلغ واردشده معتبر نیست' }, { status: 400 });
    }
    /* همان قرارداد مسیر ثبت: `price` قیمت خط‌خورده و `discountPrice`
       قیمت پرداختی. اگر این‌جا برعکس بنویسیم، ویرایش یک آگهی عدد
       خط‌خورده‌اش را دوباره خراب می‌کند. */
    const old = Math.max(price, Math.min(100_000_000_000, Math.round(num(b?.old, price))));
    const discounted = !negotiable && old > price;
    patch.price = discounted ? old : price;
    patch.negotiable = negotiable;
    patch.discountPercent = discounted ? Math.round((1 - price / old) * 100) : 0;
    patch.discountPrice = discounted ? price : null;
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ ad });

  /* آگهیِ ردشده‌ای که صاحبش **محتوایش را** اصلاح می‌کند دوباره به صفِ
     بازبینی می‌رود. بدونِ این، آگهیِ رد شده بن‌بست بود. فقط تمدید یا
     تغییرِ وضعیت اصلاح نیست. */
  const META = new Set(['expiresAt', 'renewedAt', 'status', 'soldAt']);
  const contentEdit = Object.keys(patch).some(k => !META.has(k));
  if (String(ad.status) === 'rejected' && owner && contentEdit && patch.status === undefined) {
    patch.status = 'pending';
  }

  /* ⚠️ اگر وضعیت عوض می‌شود، فقط روی همان وضعیتی که خواندیم. وگرنه ادمینی
     که میانِ خواندن و نوشتن آگهی را رد کرده، با `paused`ِ فروشنده
     بازنویسی می‌شد. */
  let q = sb().from('products').update(patch).eq('id', id);
  if (patch.status !== undefined) {
    q = q.eq('status', String(ad.status));
    /* همان رقابت برای پرچمِ توقف: ادمینی که میانِ خواندن و نوشتن توقف
       زده، با فعال‌سازیِ فروشنده دور زده نشود. فقط وقتی ستون هست. */
    if (!admin && 'moderation_hold' in ad) q = q.eq('moderation_hold', false);
  }
  const { data, error } = await q.select().maybeSingle();
  if (error) return NextResponse.json({ message: 'ویرایش انجام نشد' }, { status: 500 });
  if (!data) {
    return NextResponse.json({ message: 'وضعیت آگهی همین حالا تغییر کرده؛ صفحه را تازه کنید' }, { status: 409 });
  }
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
