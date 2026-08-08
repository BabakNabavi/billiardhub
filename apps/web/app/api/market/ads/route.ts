export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { consumeAdQuota, releaseConsumption, attachConsumptionRef } from '@/lib/ads/quota';
import { normalizeCategory, normalizeCondition } from '@/lib/market/categories';
import { normalizeAdImages } from '@/lib/market/images';
import { getSetting } from '@/lib/ads/quota';

/* آگهی‌های بیلیارد بازار — روی سرور، نه در مرورگر کاربر.

   پیش‌تر فرم ثبت آگهی نتیجه را در localStorage می‌نوشت؛ آگهی را کسی
   جز خود آگهی‌دهنده نمی‌دید و سرور هم نمی‌دانست چند آگهی ثبت شده،
   پس هیچ سهمیه‌ای قابل اعمال نبود. */

/* ⚠️ ورودیِ خالی باید پیش‌فرض بدهد، نه صفر.

   پیش‌تر این تابع برای رشته‌ی خالی صفر برمی‌گرداند، چون `Number('')`
   صفر است و `Number.isFinite(0)` درست. نتیجه‌اش این بود:

     num(searchParams.get('limit'), 100)  →  0
     Math.min(200, Math.max(1, 0))        →  1

   یعنی فهرستِ بازار — که بدونِ پارامترِ limit صدا زده می‌شود — همیشه
   **فقط یک آگهی** برمی‌گرداند. صفحه پر به‌نظر می‌رسید چون کاتالوگِ
   ثابتِ ساختگی کنارش می‌نشست؛ با حذفِ آن کاتالوگ، بازار عملاً یک
   کارت داشت. */
const num = (v: unknown, d = 0) => {
  const cleaned = String(v ?? '')
    .replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)))
    .replace(/[^0-9.]/g, '');
  if (!cleaned) return d;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

/* ستون‌هایی که فهرستِ عمومی برمی‌گرداند.

   ⚠️ پیش‌تر این‌جا `select('*')` بود، یعنی شماره‌ی تلفن، واتساپ و
   آدرسِ *همه‌ی* فروشنده‌ها در یک درخواستِ بی‌نام برمی‌گشت — کافی بود
   کسی `/api/market/ads` را باز کند تا فهرستِ کاملِ شماره‌ها را داشته
   باشد. کارتِ بازار هیچ‌کدام از این‌ها را نشان نمی‌دهد؛ صفحه‌ی
   جزئیات آن‌ها را جدا می‌گیرد.

   `model` این‌جا اضافه شد چون کارت عنوان را دو تکه نشان می‌دهد —
   «چوب اسنوکر» درشت و «O'min classic» ریزتر. بدونِ این ستون، تکه‌ی
   دومِ عنوان روی کارت‌های فهرست خالی می‌ماند و فقط در صفحه‌ی محصول
   دیده می‌شود. مشخصه‌ی کالاست، نه داده‌ی شخصی. */
const LIST_COLS = [
  /* `discountPrice` قیمتِ پرداختی است و کارت بدونش نمی‌داند تخفیف
     چقدر بوده — پیش‌تر عددِ خط‌خورده از روی درصدِ گردشده بازسازی
     می‌شد و غلط درمی‌آمد. */
  'id', 'title', 'price', 'negotiable', '"discountPrice"', '"discountPercent"', 'category', 'condition',
  'city', 'province', 'brand', 'model', 'images', 'status', 'views',
  '"createdAt"', '"expiresAt"', '"soldAt"', '"storeSlug"', '"isOfficialStore"',
  /* ارتقا (مهاجرت ۰۷۹): اولی کلیدِ مرتب‌سازی است و دومی نشانِ فوری */
  'bumped_at', 'urgent_until',
].join(',');

/* فهرستِ کاملِ ستون‌ها فقط برای فهرستِ خودِ فروشنده — آگهیِ خودش را
   با همه‌ی جزئیات می‌بیند. */
const MINE_COLS = `${LIST_COLS},description,type,specs,address,"sellerName","sellerPhone","sellerWhatsapp","sellerId"`;

/* ── فهرست آگهی‌ها ─────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get('mine') === '1';
  const limit = Math.min(200, Math.max(1, num(searchParams.get('limit'), 100)));

  /* فقط آگهی‌های فوری — برای نوارِ بالای بازار */
  const urgentOnly = searchParams.get('urgent') === '1';

  /* ── چرا دو ستون و نه `createdAt` تنها ──
     «تازه‌سازی» آگهی را مثلِ آگهیِ تازه بالا می‌برد؛ اگر مرتب‌سازی
     فقط تاریخِ ثبت باشد، آن ارتقا هیچ اثری ندارد. `bumped_at` تهی
     یعنی هرگز تازه‌سازی نشده، پس همان تاریخِ ثبت ملاک می‌ماند. */
  let q = sb().from('products')
    .select(mine ? MINE_COLS : LIST_COLS)
    .order('bumped_at', { ascending: false, nullsFirst: false })
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (mine) {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
    q = q.eq('sellerId', actor.id);
  } else {
    /* فقط آگهیِ فعال و منقضی‌نشده.

       تا امروز فقط `status` فیلتر می‌شد و `expiresAt` — که از مهاجرتِ
       ۰۰۶ ستونش وجود داشت — هرگز خوانده نمی‌شد. یعنی آگهیِ دو سال
       پیش هنوز بالای فهرست بود. */
    q = q.eq('status', 'active').or(`expiresAt.is.null,expiresAt.gt.${new Date().toISOString()}`);
    /* انقضای «فوری» در خواندن سنجیده می‌شود، نه با کرانی که بولینی
       را خاموش کند. تابعی که کسی صدایش نزند، همان چیزی است که چند
       بار در این پروژه بی‌صدا از کار افتاد. */
    if (urgentOnly) q = q.gt('urgent_until', new Date().toISOString());
  }

  const { data, error } = await q;
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return NextResponse.json({ ads: [] });
    return NextResponse.json({ message: 'خطا در دریافت آگهی‌ها' }, { status: 500 });
  }
  return NextResponse.json({ ads: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ── ثبت آگهی تازه ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'برای ثبت آگهی ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));

  const title = str(b?.name ?? b?.title, 160);
  const negotiable = b?.negotiable === true;
  const price = Math.max(0, Math.round(num(b?.price)));
  /* دسته از منبعِ واحد نرمال می‌شود، نه هر رشته‌ای که کلاینت بفرستد —
     وگرنه آگهی با دسته‌ی من‌درآوردی ثبت می‌شد و در هیچ فیلتری پیدا
     نمی‌شد. */
  const category = normalizeCategory(str(b?.category, 60));

  if (!title) return NextResponse.json({ message: 'عنوان آگهی الزامی است' }, { status: 400 });
  /* قیمت فقط وقتی اجباری است که آگهی توافقی نباشد. این قاعده در
     دیتابیس هم قید دارد (مهاجرتِ ۰۶۰)، چون دو مسیرِ نوشتن روی این
     جدول هست و قاعده‌ای که در یکی باشد و در دیگری نه، باگِ فرداست. */
  if (!negotiable && price <= 0) {
    return NextResponse.json({ message: 'قیمت را وارد کنید یا گزینه‌ی «توافقی» را بزنید' }, { status: 400 });
  }
  /* سقفِ عقلانی: عددِ نجومی یعنی اشتباهِ تایپی یا آگهیِ مزاحم، و
     مرتب‌سازیِ «گران‌ترین» را برای همه خراب می‌کند. */
  if (price > 100_000_000_000) {
    return NextResponse.json({ message: 'مبلغ واردشده معتبر نیست' }, { status: 400 });
  }

  /* سهمیه — فاز ۳: بررسی و مصرف در یک قدم اتمیک، پیش از درج آگهی.
     سهمیه‌ی رایگان به «شخص» (کد ملی) گره خورده و بین همه‌ی حساب‌هایش
     مشترک است؛ مصرف در دفتر ثبت می‌شود و با حذف آگهی برنمی‌گردد. */
  const gate = await consumeAdQuota(actor.id);
  if (!gate.ok) {
    return NextResponse.json(gate.body, { status: gate.status });
  }

  /* ── قیمتِ قبل از تخفیف باید ذخیره شود، نه بازسازی ──
     پیش‌تر فقط `price` (قیمتِ تخفیف‌خورده) و درصدِ **گردشده** ذخیره
     می‌شد و صفحه‌ها عددِ خط‌خورده را از روی همان درصد بازمی‌ساختند:

         old = round(price / (1 - disc/100))

     نتیجه‌اش عددی بود که هیچ‌کس تایپش نکرده بود — آگهیِ ۷۵۰٬۰۰۰٬۰۰۰
     با ٪۹ تخفیف، «۸۲۴٬۱۷۵٬۸۲۴» نشان می‌داد به‌جای ۸۲۵٬۰۰۰٬۰۰۰. یک
     درصدِ صحیح نمی‌تواند عددِ اصلی را نگه دارد.

     حالا هر دو عدد ذخیره می‌شوند، با همان قراردادی که بقیه‌ی پروژه
     از قبل دارد (`app/shop/products.ts`، `lib/home-featured.ts`،
     `store/cart.store.ts`): **`price` قیمتِ خط‌خورده و
     `discountPrice` قیمتِ پرداختی.** درصد فقط برای نشانِ روی کارت
     می‌ماند. */
  const old = Math.max(price, Math.min(100_000_000_000, Math.round(num(b?.old, price))));
  const disc = old > price ? Math.round((1 - price / old) * 100) : 0;
  const discounted = !negotiable && disc > 0;
  /* ── تصویرها هرگز base64 در دیتابیس نمی‌نشینند ──
     پیش‌تر هرچه کلاینت می‌فرستاد همان ذخیره می‌شد، و کلاینت data URI
     می‌فرستاد: تصویرِ دومگابایتی ⇒ ۲٫۷ مگابایت متن داخلِ ردیف، و
     `/api/market/ads` همه‌ی آن را در هر بارگذاریِ بازار برمی‌گرداند.
     `normalizeAdImages` بایت‌ها را به Storage می‌برد و نشانی می‌دهد. */
  const images = await normalizeAdImages(b?.images, actor.id);

  const approvalRequired = await getSetting<boolean>('market_approval_required', false);

  const { data: meRow } = await sb().from('users')
    .select('"primaryRole"').eq('id', actor.id).maybeSingle();
  const sellerRole = (meRow as { primaryRole?: string } | null)?.primaryRole ?? 'user';

  const { data, error } = await sb().from('products').insert({
    title,
    description: str(b?.description, 3000),
    /* تخفیف‌دار ⇒ `price` همان قیمتِ قبل از تخفیف است */
    price: discounted ? old : price,
    negotiable,
    /* آگهیِ توافقی تخفیف ندارد — «۲۰٪ تخفیف روی قیمتی که نگفته‌ام»
       بی‌معناست و روی کارت هم بد می‌نشیند. */
    discountPrice: discounted ? price : null,
    discountPercent: negotiable ? 0 : disc,
    category,
    condition: normalizeCondition(str(b?.condition, 20)),
    /* ── بازبینیِ پیش از انتشار ──
       پیش‌فرض خاموش است و آگهی مثل امروز بی‌درنگ منتشر می‌شود.
       با روشن‌شدنِ `market_approval_required` هر آگهیِ تازه `pending`
       می‌ماند تا ادمین تأییدش کند.

       کلید در دیتابیس است نه در کد، چون این تصمیمِ کسب‌وکاری است و
       عوض‌کردنش نباید دیپلوی بخواهد. */
    status: approvalRequired ? 'pending' : 'active',
    city: str(b?.city, 60),
    province: str(b?.province, 60),
    stock: 1,
    images,
    video: str(b?.video, 500) || null,
    /* برند تمیز می‌شود ولی به فهرست اجبار نمی‌شود: بازارِ دستِ‌دوم
       پر از برندِ محلی است و اجبار یعنی همه «متفرقه» می‌زنند. */
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
    /* ── نشانِ نقش، Snapshot در لحظه‌ی انتشار ──
       کسی که هم فروشنده است هم مربی، آگهی را با نقشِ اصلیِ همان
       لحظه منتشر می‌کند. اگر بعداً از نقشِ فعلیِ کاربر خوانده شود،
       تغییرِ نقش بی‌صدا نشانِ همه‌ی آگهی‌های قدیمی را عوض می‌کند. */
    seller_role: sellerRole,
    views: 0,
  }).select().single();

  if (error) {
    console.error('create ad failed:', error.message);
    /* آگهی درج نشد ⇒ مصرف همین درخواست آزاد می‌شود (خطای فنی است، نه «حذف آگهی») */
    if (gate.consumptionId) await releaseConsumption(gate.consumptionId);
    if (/does not exist|schema cache|column/i.test(error.message)) {
      return NextResponse.json({ message: 'ساختار جدول آگهی‌ها به‌روز نیست (مایگریشن ۰۰۶ اجرا نشده)' }, { status: 503 });
    }
    return NextResponse.json({ message: 'ثبت آگهی انجام نشد' }, { status: 500 });
  }

  if (gate.consumptionId && data?.id) await attachConsumptionRef(gate.consumptionId, String(data.id));

  return NextResponse.json({
    ad: data,
    pending: approvalRequired,
    message: approvalRequired
      ? 'آگهی شما ثبت شد و پس از بررسی منتشر می‌شود.'
      : 'آگهی شما منتشر شد.',
    quota: { used: gate.used, limit: gate.limit },
  }, { status: 201 });
}
