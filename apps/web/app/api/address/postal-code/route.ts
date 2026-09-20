export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit';
import { lookupPostalCode, composeAddress, normalizePostalCode } from '@/lib/address-server';
import { getProvinceNames, getCities, provinceOfCity } from '@/lib/iran-geo';
import { lockedResponse, isMissingColumn } from '@/lib/verification-lock';
import { z } from 'zod';

/* استان و شهر فقط اگر در فهرست رسمی پروژه باشند پذیرفته می‌شوند.
   نام سرویس همیشه با نام ما یکی نیست («تهران» بله، ولی خیلی جاها
   نگارش متفاوت دارند) و اگر خام ذخیره شود، ProvinceCitySelect آن را
   پیدا نمی‌کند و فرم خالی می‌ماند — درست همان تله‌ای که قانون
   «منبع واحد استان و شهر» برای جلوگیری از آن نوشته شده. */
/* نقش‌هایی که پروفایلشان نشانی دارد. فهرست بسته است تا این مسیر
   نتواند هر ردیفی از جدولِ پروفایل را بنویسد. */
const PROFILE_KINDS = ['manufacturer'] as const;
type ProfileKind = (typeof PROFILE_KINDS)[number];

const Body = z.object({
  postalCode: z.string().max(40),
  clubId: z.string().max(64).optional().default(''),
  profileKind: z.enum(PROFILE_KINDS).optional(),
  profileSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/i).optional(),
});

function normalizeGeo(province?: string, city?: string): { province?: string; city?: string } {
  const provinces = getProvinceNames();
  const p = province && provinces.includes(province) ? province : undefined;

  if (city) {
    /* ⚠️ استانِ خودِ سرویس مقدم است. `provinceOfCity` برای ۳۰ نامِ
       تکراری (سردشت در چهار استان، فیروزآباد در سه، …) همیشه
       «اولین» را برمی‌گرداند؛ اگر مقدم می‌بود، کارگاهِ سردشتِ
       خوزستان به آذربایجان غربی منتقل می‌شد. */
    if (p && getCities(p).includes(city)) return { province: p, city };
    const owner = provinceOfCity(city);
    if (owner) return { province: owner, city };
  }
  return { province: p };
}

/* استعلام کد پستی ⇒ آدرس.

   پشت ورود است و سقف نرخ دارد: هر فراخوان اعتبار سرویس بیرونی را
   مصرف می‌کند، پس یک مسیر باز عملا یک شیر باز روی حساب ماست.

   اگر `clubId` بیاید، نتیجه روی همان باشگاه هم ذخیره می‌شود — تا
   آدرس و مختصات همان چیزی بماند که سرویس گفته، نه چیزی که بعدا در
   مرورگر دستکاری شده باشد. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const rl = await hitRateLimit(req, { action: 'postal-code', max: 20, windowSec: 600 }, actor.id);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: 'ورودی نامعتبر است' }, { status: 400 });
  }
  const body = parsed.data;
  const postalCode = normalizePostalCode(body.postalCode);
  const clubId = body.clubId;
  /* ── هدفِ دوم: پروفایلِ نقش ──
     تا امروز این مسیر فقط باشگاه را می‌شناخت. تولیدکننده هم نشانیِ
     کارگاه دارد و مالک خواست «دقیقا مثل باشگاه» باشد. کلیدِ هدف
     عوض می‌شود، نه منطقِ استعلام. */
  const profileKind: ProfileKind | undefined = body.profileKind;
  const profileSlug = body.profileSlug ?? '';
  const wantsProfile = !!profileKind && !!profileSlug;

  const admin = await isAdmin(actor.id);

  /* بدون هدف این مسیر یک استعلام رایگان بود که هیچ‌جا ذخیره نمی‌شد
     — یعنی راهی برای سوزاندن اعتبار بدون هیچ اثری. */
  if (!clubId && !wantsProfile && !admin) {
    return NextResponse.json({ message: 'شناسه‌ی باشگاه یا پروفایل لازم است' }, { status: 400 });
  }

  /* ── مالکیتِ پروفایل، پیش از خرجِ اعتبار ──
     ⚠️ نتیجه روی پروفایل **نوشته نمی‌شود**. ستونِ `data` یک بلابِ
     jsonb است و هر نویسنده‌ای کلِ آن را یک‌جا جایگزین می‌کند؛ اگر
     این مسیر هم می‌نوشت دو نویسنده می‌شدیم و همان باگِ «فقط آخرین
     محصول ماند» برمی‌گشت — این‌بار بینِ دو تبِ باز، و بینِ خواندنِ
     ردیف و نوشتنش یک درخواستِ HTTPِ بیرونی فاصله بود. پس فقط
     برمی‌گردانیم و پنل با مسیرِ ذخیره‌ی همیشگی ثبتش می‌کند.
     بررسیِ مالکیت می‌ماند، چون همان است که نمی‌گذارد این مسیر یک
     استعلامِ رایگان روی حسابِ ما باشد. */
  if (wantsProfile) {
    const { data: row } = await sb().from('profiles')
      .select('owner_id').eq('kind', profileKind!).eq('slug', profileSlug).maybeSingle();
    if (!row) return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });
    const p = row as { owner_id?: string };
    if (p.owner_id !== actor.id && !admin) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
    }
  }

  if (clubId) {
    /* ستون قفل با مهاجرت ۰۳۹ می‌آید. تا اجرا نشده، نبودش نباید
       استعلام را بشکند — فقط قفل هنوز بی‌اثر است. */
    let { data: club, error: clubErr } = await sb().from('clubs')
      .select('"ownerId","postalCodeVerified"').eq('id', clubId).maybeSingle();
    if (clubErr && isMissingColumn(clubErr.message)) {
      console.error('[postal-code] ستون postalCodeVerified نیست — مهاجرت ۰۳۹ اجرا نشده');
      ({ data: club } = await sb().from('clubs').select('"ownerId"').eq('id', clubId).maybeSingle());
    }
    if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
    const c = club as { ownerId?: string; postalCodeVerified?: boolean };
    if (c.ownerId !== actor.id && !admin) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
    }

    /* قفل — و حتما پیش از lookupPostalCode، وگرنه هزینه‌اش را داده‌ایم
       و بعد جواب را دور ریخته‌ایم. ادمین مستثناست تا بتواند پس از
       تیکت، خودش استعلام تازه بگیرد. */
    if (c.postalCodeVerified && !admin) return lockedResponse('postal');
  }

  const r = await lookupPostalCode(postalCode);

  if (!r.ok) {
    /* پیام خام ارائه‌دهنده وضعیت حساب *ما* را می‌گوید (اعتبار، سطح
       دسترسی، قطعی بالادست) و جای نشان‌دادنش به هر کاربری نیست.
       `providerCode` می‌ماند چون یک عدد است و برای پشتیبانی کافی؛
       متن کامل فقط برای ادمین و در لاگ سرور. */
    const forUser = { ...r };
    if (!admin) delete forUser.providerMessage;
    return NextResponse.json(forUser, { status: r.unavailable ? 503 : 400 });
  }
  if (!r.found) return NextResponse.json(r, { status: 404 });

  const a = r.data!;
  const address = a.address || composeAddress(a);
  const geo = normalizeGeo(a.province, a.city);

  if (clubId) {
    /* فقط فیلدهایی نوشته می‌شوند که سرویس واقعا برگردانده — وگرنه یک
       استعلام ناقص، آدرس درست قبلی را با رشته‌ی خالی پاک می‌کرد.
       کد پستی از همین لحظه قفل می‌شود: استعلام موفق بوده. */
    const patch: Record<string, unknown> = {
      postalCode,
      postalCodeVerified: true,
      postalCodeVerifiedAt: new Date().toISOString(),
    };
    if (address) patch.address = address;
    if (geo.province) patch.province = geo.province;
    if (geo.city) patch.city = geo.city;

    /* مختصات فقط وقتی از این‌جا نوشته می‌شود که باشگاه هنوز مختصاتی
       نداشته باشد.

       دلیلش «هرکدام دقیق‌تر است»: کد پستی مرکز پلاک پستی را می‌دهد،
       ولی دکمه‌ی «ثبت موقعیت فعلی» اندازه‌گیری واقعی داخل باشگاه است
       و فقط وقتی ذخیره می‌شود که دقتش زیر ۱۵۰ متر باشد. پس اگر
       باشگاه‌دار آن را زده، این استعلام نباید مقدار بهترش را با
       تخمین پستی خراب کند. */
    const { data: cur } = await sb().from('clubs')
      .select('latitude,longitude').eq('id', clubId).maybeSingle();
    const c = (cur ?? {}) as { latitude?: number | null; longitude?: number | null };
    const hasCoords = !!Number(c.latitude) && !!Number(c.longitude);

    if (!hasCoords) {
      if (a.lat !== undefined) patch.latitude = a.lat;
      if (a.long !== undefined) patch.longitude = a.long;
    }

    const { error } = await sb().from('clubs').update(patch).eq('id', clubId);
    if (error) {
      /* ستون postalCode با مهاجرت ۰۳۵ اضافه می‌شود. تا وقتی اجرا نشده،
         استعلام نباید بشکند: آدرس — که ارزش اصلی است — ذخیره می‌شود و
         فقط خود کد پستی نگه داشته نمی‌شود. */
      if (/postalCode/i.test(error.message)) {
        console.error('[postal-code] ستون کد پستی نیست — مهاجرت ۰۳۵ یا ۰۳۹ اجرا نشده');
        delete patch.postalCode;
        delete patch.postalCodeVerified;
        delete patch.postalCodeVerifiedAt;
        await sb().from('clubs').update(patch).eq('id', clubId);
        return NextResponse.json({ ...r, address, geo, postalCodeStored: false, locked: false });
      }
      console.error('[postal-code] update error:', error.message);
      return NextResponse.json({ message: 'ذخیره‌ی آدرس انجام نشد' }, { status: 500 });
    }
  }

  if (wantsProfile) {
    /* مختصات هم فقط برگردانده می‌شود؛ پنل خودش تصمیم می‌گیرد که اگر
       از قبل مختصاتِ دقیق‌ترِ «موقعیت فعلی» را دارد نگهش دارد. */
    return NextResponse.json({
      ...r, address, geo,
      postalCodeStored: false,
      locked: false,
      latitude: a.lat !== undefined ? String(a.lat) : undefined,
      longitude: a.long !== undefined ? String(a.long) : undefined,
    });
  }

  /* `locked: true` یعنی از این پس همین مسیر ۴۰۹ می‌دهد؛ کلاینت با
     همین فیلد، فیلد را قفل می‌کند بی‌آنکه لازم باشد دوباره بخواند. */
  return NextResponse.json({ ...r, address, geo, postalCodeStored: !!clubId, locked: !!clubId });
}
