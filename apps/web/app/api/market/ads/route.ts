export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { consumeAdQuota, releaseConsumption, attachConsumptionRef } from '@/lib/ads/quota';
import { normalizeCategory, normalizeCondition } from '@/lib/market/categories';
import { isCatalogId, validateOnServer, getBrand, TYPE_PREFIX, isAccessoryCategory, isProductCatalog, ACCESSORY_TYPE_OF, type CatalogId } from '../../../../lib/market/catalog'
import { hasSpecCatalog, validateSpecsOnServer } from '../../../../lib/market/spec-catalog'
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

  /* ── اعتبارسنجیِ کاتالوگ (چوب و میز) ──
     شناسه‌ها از فرم می‌آیند ولی فرم قابلِ اعتماد نیست: هرکسی می‌تواند
     مستقیم به این روت POST بزند. سه چیزی که فقط سرور می‌تواند بسنجد:

       · برندِ اسنوکر در پاکت بی‌معناست — پیشوندِ شناسه باید با نوع بخواند.
       · شناسه‌ی سایز بینِ نوع‌ها **تکراری** است (`9ft` هم در اسنوکر
         هست هم در پاکت)، پس بدونِ سنجش، سایزِ نوعِ دیگر پذیرفته می‌شود.
       · «میز خانگی» فهرست ندارد؛ هر شناسه‌ای برایش جعلی است.

     پیش از مصرفِ سهمیه انجام می‌شود تا ورودیِ نامعتبر سهمیه نسوزاند. */
  let catalogCols: Record<string, string | null> = {};
  let clothCols: Record<string, string | null> = {};

  /* ── ستون‌های ایندکس‌دار ──
     این پنج مشخصه در `specs` (JSONB) هم هستند، ولی رویشان فیلتر
     خواهیم داشت («همه‌ی میزهای اسلیت ایتالیایی»، «چوب‌های کربن»)
     و فیلترِ JSONB نه ایندکس می‌گیرد نه در PostgREST خوانا می‌ماند.

     مهاجرتِ ۰۸۷ ستون‌هایشان را ساخت ولی هیچ‌چیز نمی‌نوشتشان —
     ایندکسی که پر نشود فقط هزینه‌ی نوشتن دارد. مقدار از همان
     `specs`ی می‌آید که چند خط بالاتر اعتبارسنجی شده. */
  const specIn = (b?.specs && typeof b.specs === 'object' ? b.specs : {}) as Record<string, unknown>;
  const pick = (k: string) => {
    const v = specIn[k];
    return typeof v === 'string' && v.trim() && v !== '__other__' ? v.trim().slice(0, 60) : null;
  };
  const indexedCols = {
    bedMaterial: pick('bedMaterial'),
    shaftMaterial: pick('shaftMaterial'),
    cuePieces: pick('pieces'),
  };

  /* ── بازه‌های عددیِ مشخصات ──
     `min`/`max` در `specs_catalog.json` تعریف شده‌اند نه در کد، تا
     اصلاحشان دیپلوی نخواهد. فرم همان‌ها را می‌سنجد؛ این‌جا دوباره
     سنجیده می‌شوند چون فرم قابلِ اعتماد نیست. */
  /* پارچه هم نوع دارد و همان رشته‌ی میز است */
  const catType = str(category === 'cue' ? b?.cueType : category === 'table' ? b?.tableType : b?.catalogType, 40);
  if (hasSpecCatalog(category) && b?.specs && typeof b.specs === 'object') {
    const sv = validateSpecsOnServer(category, b.specs as Record<string, unknown>, catType || undefined);
    if (!sv.ok) {
      const first = Object.values(sv.errors)[0] ?? 'مشخصات فنی معتبر نیست';
      return NextResponse.json({ message: first, errors: sv.errors }, { status: 400 });
    }
  }
  /* `cloth` هم یک شناسه‌ی کاتالوگ است ولی دسته‌ی محصولِ مستقلی هم
     هست؛ بدونِ این گیت، POST با category=cloth وارد این شاخه می‌شد. */
  if ((isProductCatalog(category) || isAccessoryCategory(category)) && catType) {
    const brandId = str(b?.brandId, 80) || null;
    const check = validateOnServer({
      /* دسته‌های لوازم زیرِ یک کاتالوگِ مشترک‌اند */
      category: (isAccessoryCategory(category) ? 'accessories' : category) as CatalogId,
      type: catType,
      brandId,
      /* برندِ دستی همان رشته‌ی `brand` است؛ قاعده «یکی از این دو» را
         فقط وقتی می‌سنجیم که واقعاً هر دو شکل در دست باشد. */
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
    catalogCols = {
      cueType: category === 'cue' ? val.type : null,
      tableType: category === 'table' ? val.type : null,
      brandId: val.brandId,
      modelId: val.modelId,
      tableSizeId: category === 'table' ? val.sizeId ?? null : null,
      tableSizeCustom: category === 'table' ? val.sizeCustom ?? null : null,
    };

    /* ── پارچه ──
       زنجیره‌ی خودش را دارد: مدل باید متعلق به همان برند باشد و
       برند باید در کاتالوگِ **همان نوعِ میز** وجود داشته باشد.
       فرم این را رعایت می‌کند ولی هرکسی می‌تواند مستقیم POST بزند. */
    if (category === 'table') {
      const cbId = str(b?.clothBrandId, 80) || null;
      const cmId = str(b?.clothModelId, 80) || null;
      const cbCustom = str(b?.clothBrandCustom, 60) || null;
      if (cbId) {
        const cb = getBrand('cloth', cbId);
        if (!cb) return NextResponse.json({ message: 'برند پارچه در فهرست نیست', errors: { clothBrand: 'برند پارچه در فهرست نیست' } }, { status: 400 });
        const prefix = TYPE_PREFIX.cloth[catType];
        if (prefix && !cbId.startsWith(prefix)) {
          return NextResponse.json({ message: 'این پارچه برای نوع میز انتخاب‌شده نیست', errors: { clothBrand: 'این پارچه برای نوع میز انتخاب‌شده نیست' } }, { status: 400 });
        }
        if (cmId && !cb.models.some(m => m.id === cmId)) {
          return NextResponse.json({ message: 'این مدل پارچه برای برند انتخاب‌شده نیست', errors: { clothModel: 'این مدل پارچه برای برند انتخاب‌شده نیست' } }, { status: 400 });
        }
      } else if (cmId) {
        return NextResponse.json({ message: 'ابتدا برند پارچه را انتخاب کنید', errors: { clothModel: 'ابتدا برند پارچه را انتخاب کنید' } }, { status: 400 });
      }
      clothCols = {
        clothBrandId: cbId,
        clothBrandCustom: cbId ? null : cbCustom,
        clothModelId: cbId ? cmId : null,
        clothModelCustom: cmId ? null : str(b?.clothModelCustom, 60) || null,
      };
    }
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

  /* ── فروشگاهِ آگهی‌دهنده از سرور پیدا می‌شود، نه از مرورگر ──
     تا امروز `storeSlug` هرچه فرم می‌فرستاد پذیرفته می‌شد، و فرم آن
     را با `findSellerByOwner()` از **localStorage** می‌خواند. ولی
     فروشگاه‌ها مدت‌هاست در جدولِ `profiles` زندگی می‌کنند، پس آن
     تابع چیزی پیدا نمی‌کرد و هر آگهی با `storeSlug: null` ذخیره
     می‌شد.

     نتیجه‌اش دقیقاً همان چیزی بود که دیده شد: صاحبِ فروشگاه ده‌ها
     محصول ثبت می‌کرد و صفحه‌ی فروشگاهش خالی می‌ماند — حتی آگهی‌ای که
     *بعد از* ساختنِ فروشگاه ثبت شده بود.

     خواندن از سرور علاوه بر رفعِ باگ، جعل را هم می‌بندد: پیش‌تر هر
     کسی می‌توانست نامکِ فروشگاهِ دیگری را بفرستد و آگهی‌اش را داخلِ
     ویترینِ او بنشاند. */
  let storeSlug: string | null = null;
  try {
    const { data: shop } = await sb().from('profiles')
      .select('slug').eq('kind', 'seller').eq('owner_id', actor.id)
      .eq('status', 'approved').maybeSingle();
    storeSlug = (shop as { slug?: string } | null)?.slug ?? null;
  } catch { /* جدول نبود ⇒ آگهیِ بی‌فروشگاه، مثل قبل */ }

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
    /* ── شناسه‌های کاتالوگ (مهاجرت ۰۸۶) ──
       رشته‌های `brand`/`model` بالا سرِ جایشان می‌مانند — کلِ سایت
       از همان‌ها می‌خواند. این‌ها کنارشان می‌نشینند: شناسه برای
       یکپارچگی و فیلتر، رشته برای نمایش.

       مقدارها همان‌هایی‌اند که چند خط بالاتر `validateOnServer`
       پاک و تأیید کرده؛ ورودیِ خام این‌جا نمی‌آید. */
    ...catalogCols,
    ...clothCols,
    ...indexedCols,
    specs: b?.specs && typeof b.specs === 'object' ? b.specs : null,
    section: str(b?.section, 20) || 'newest',
    sellerName: str(b?.sellerName ?? b?.shopName, 120),
    sellerPhone: str(b?.sellerPhone, 20),
    sellerWhatsapp: str(b?.sellerWhatsapp, 20),
    address: str(b?.address, 300),
    storeSlug,
    isDailyDeal: false,
    isSpecialSale: false,
    isVerified: false,
    requestedVerification: false,
    isOfficialStore: !!storeSlug,
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
