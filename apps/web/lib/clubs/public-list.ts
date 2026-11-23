/* ─────────────────────────────────────────────────────────────
   فهرستِ باشگاه‌ها — مشترکِ GET /api/clubs و رندرِ سرورِ صفحه‌ی /clubs.

   از app/api/clubs/route.ts جابه‌جا شد (آذرِ ۱۴۰۵) تا صفحه‌ی فهرست، داده‌ی
   اول را همراهِ HTML بفرستد: پیش‌تر کارت‌ها پس از دانلودِ JS و یک درخواستِ
   جدا می‌آمدند و Lighthouse روی گوشی ۲٫۸ ثانیه «تأخیرِ شروع» برای عکسِ
   اولین کارت داد. قاعده‌ها (کدام باشگاه عمومی است، فیلترها، شمارِ اعضا،
   تیکِ آبی) یک‌جا ماندند — هر تغییری این‌جا هر دو مسیر را عوض می‌کند.
   مجوز (`?all=true` فقط ادمین) همچنان در route است.
   ───────────────────────────────────────────────────────────── */

import 'server-only';
import { stripClubPrivate } from '@/lib/clubs/private-fields';
import { getSupabaseServer } from '@/lib/supabase-server';

/* شهر/استان/نام از کاربر می‌آید و مستقیم به PostgREST می‌رود؛ کاراکترهای
   کنترلی فیلتر (`,` و `%` و `*`) باید بی‌اثر شوند وگرنه می‌شود شرط تزریق کرد. */
export const clean = (v: string | null, max = 60) =>
  String(v ?? '').replace(/[,%*()"'\\]/g, '').trim().slice(0, max);

export interface ClubListAccess {
  /** درخواستِ ادمین با `?all=true` — همه‌ی ستون‌ها و همه‌ی وضعیت‌ها */
  isAdminReq: boolean;
  /** ادمینی که حقِ دیدنِ شماره‌حساب و مدارک را دارد */
  canSeePrivate: boolean;
}

/** فهرستِ باشگاه‌ها با همان فیلترهای querystringِ /api/clubs؛ خطای دیتابیس throw می‌شود */
export async function queryClubs(sp: URLSearchParams, { isAdminReq, canSeePrivate }: ClubListAccess): Promise<Record<string, unknown>[]> {
  /* ── چرا فهرست عمومی ستون‌هایش را نام می‌برد ──
     این‌جا `select('*')` بود و کل ردیف برمی‌گشت — از جمله ستون
     `albums`. اندازه‌گیری روی پروداکشن: پاسخ ۶۱۵ کیلوبایت بود و
     **۵۹۸ کیلوبایتش فقط `albums` یک باشگاه** — چهار عکس که به‌جای
     نشانی Storage به‌صورت base64 داخل همان ستون نشسته‌اند.

     این پاسخ در هر بارگذاری صفحه‌ی اصلی گرفته می‌شود (هم
     `HomeClient` هم نوار استوری، که با `sharedJson` یکی شده‌اند).
     روی Fast 3G دانلودش ۱۵ ثانیه طول می‌کشید و کل پنجره‌ی بحرانی
     را اشغال می‌کرد.

     هیچ‌کدام از مصرف‌کننده‌های عمومی `albums` را نمی‌خوانند:
       · HomeClient  → id, name, city, images, تعداد میزها, hasActiveStory
       · Stories     → id, name, logo, hasActiveStory
     مسیر ادمین (`?all=true`) دست‌نخورده `*` می‌گیرد، چون پنل به
     همه‌ی ستون‌ها نیاز دارد.

     ستون تازه‌ای که کارت لازم داشته باشد باید همین‌جا اضافه شود —
     نبودنش یعنی `undefined`، نه خطا. */
  const PUBLIC_COLUMNS = [
    'id', 'slug', 'name', 'city', 'province', 'address', 'logo', 'images',
    /* ⚠️ بدونِ این دو، «نزدیکِ من» در فهرست اجازه‌ی مکان را می‌گرفت، دکمه
       طلایی می‌شد و ترتیب «نزدیک‌ترین» نوشته می‌شد — ولی هیچ فاصله‌ای
       ساخته نمی‌شد. مختصات همان است که صفحه‌ی باشگاه روی نقشه نشان
       می‌دهد، پس چیزِ خصوصی‌ای بیرون نمی‌رود. */
    'latitude', 'longitude',
    'snookerTables', 'pocketTables', 'highballTables', 'vipSnookerTables', 'vipPocketTables',
    'playstations', 'hasCafe', 'hasParking', 'hasWifi', 'hasProfessionalCoach',
    /* ⚠️ `hasActiveStory` ستونی است که هیچ‌کس نمی‌نویسدش و دو خط
       پایین‌تر از روی `storyExpiresAt` بازنویسی می‌شود — انتخابش
       بی‌فایده بود. در عوض سه ستون خود استوری لازم‌اند: کارت
       باشگاه حلقه را روی `hasActiveStory && storyMediaUrl` می‌کشد،
       و چون رسانه انتخاب نمی‌شد حلقه هرگز رندر نمی‌شد. */
    'verificationStatus', 'storyExpiresAt', 'storyMediaUrl', 'storyType', 'storyText',
    'isActive', 'createdAt', 'workingHours',
  ].join(',');

  /* ── تعداد اعضا ──
     کارتِ باشگاه همیشه «۰ عضو» نشان می‌داد چون `memberCount` هیچ‌جا
     ساخته نمی‌شد. شمردن در جاوااسکریپت یعنی کشیدنِ کلِ
     `club_members` به حافظه و بی‌صدا کم‌شمار شدن زیرِ سقفِ سطرِ
     PostgREST. کلیدِ خارجیِ `club_members_club_fk` از مهاجرت ۰۳۲
     وجود دارد، پس شمارش سمتِ دیتابیس انجام می‌شود — یک کوئری و
     بدونِ سقف.

     ⚠️ اگر آن کلید نباشد، PostgREST **کلِ درخواست** را با
     `PGRST200` رد می‌کند، نه اینکه embed را نادیده بگیرد. و این
     مسیر را صفحه‌ی اصلی، نوارِ استوری و فهرستِ باشگاه‌ها می‌خوانند —
     یعنی یک ۴۰۰ این‌جا کلِ سایت را سفید می‌کند. پس کوئری دوبار
     ساخته می‌شود و در صورتِ خطای رابطه، بدونِ شمارش دوباره اجرا
     می‌شود: بدترین حالت «۰ عضو» است، همان رفتارِ امروز. */
  const MEMBERS = 'club_members(count)';
  const build = (withMembers: boolean) => {
    const cols = isAdminReq ? '*' : PUBLIC_COLUMNS;
    return getSupabaseServer().from('clubs')
      .select(withMembers ? `${cols},${MEMBERS}` : cols);
  };
  /* فیلترها باید روی هر دو نسخه یکسان اعمال شوند، پس یک‌جا تعریف
     می‌شوند و نه دو بار کپی — وگرنه روزی یکی عوض می‌شود و آن یکی نه. */
  const withFilters = (base: ReturnType<typeof build>) => {
    let q = base;

    if (!isAdminReq) {
    /* دیده‌شدن عمومی = هم منتشرشده، هم تأییدشده.
       `isActive` تنها کافی نیست: داده‌ی قدیمی با وضعیت pending هم
       isActive=true داشت و در فهرست عمومی می‌نشست.

       دو وضعیت دیده می‌شوند: `verified` (مدارک بررسی شده ⇒ تیک آبی)
       و `approved` (ادمین کارت را منتشر کرده ولی مدرکی تأیید نشده ⇒
       بدون تیک). این دو عمدا از هم جدا شده‌اند: پیش‌تر یک مقدار هم
       «دیده شو» بود هم «تیک بگیر»، و باشگاه بی‌مدرک راهی جز یکی از
       این دو انتها نداشت. */
    /* باشگاهِ نمایشی (is_demo) هم دیده می‌شود — ردیف‌های قدیمی‌اش با
       pending ساخته شده بودند (lib/clubs/demo) */
    q = q.eq('isActive', true).or('verificationStatus.in.(verified,approved),is_demo.eq.true');

    /* ── فیلترهای سمت سرور ──
       پیش‌تر همه‌ی فیلترها روی کلاینت بودند: کل جدول دانلود می‌شد و
       مرورگر فیلتر می‌کرد. با رشد تعداد باشگاه‌ها هم کند می‌شود هم
       پهنای‌باند هدر می‌دهد. */
    const city = clean(sp.get('city'));
    if (city && city !== 'همه شهرها') q = q.eq('city', city);

    const province = clean(sp.get('province'));
    if (province) q = q.eq('province', province);

    const search = clean(sp.get('q'), 80);
    if (search) q = q.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);

    /* نوع میز: «حداقل یکی داشته باشد» */
    for (const t of ['snookerTables', 'pocketTables', 'highballTables', 'vipSnookerTables']) {
      if (sp.get(t) === '1') q = q.gt(t, 0);
    }
    /* امکانات */
    for (const a of ['hasCafe', 'hasParking', 'hasWifi', 'hasProfessionalCoach']) {
      if (sp.get(a) === '1') q = q.eq(a, true);
    }
    if (sp.get('playstations') === '1') q = q.gt('playstations', 0);
    }

    return q.order('createdAt', { ascending: false }).limit(500);
  };

  let { data: clubs, error } = await withFilters(build(true));

  /* رابطه پیدا نشد ⇒ بدونِ شمارشِ اعضا دوباره اجرا کن. این‌طور
     ترتیبِ دیپلوی و مهاجرت بی‌اهمیت می‌شود و بدترین حالت «۰ عضو»
     است، نه صفحه‌ی سفید. */
  if (error && /PGRST200|relationship|schema cache/i.test(
    `${(error as { code?: string }).code ?? ''} ${error.message}`)) {
    console.warn('[clubs] شمارش اعضا در دسترس نیست — بدون آن ادامه:', error.message);
    ({ data: clubs, error } = await withFilters(build(false)));
  }

  if (error) throw new Error(`[clubs] db error: ${error.message}`);

  /* `isVerified` مشتق است، نه ستون دیتابیس.
     کارت‌های فهرست /clubs همیشه `club.isVerified` را می‌خواندند ولی
     چنین ستونی روی جدول clubs وجود ندارد — یعنی تیک آبی روی هیچ
     کارتی رندر نمی‌شد و کسی متوجه نشده بود، چون تا امروز *همه‌ی*
     باشگاه‌های عمومی `verified` بودند و نبود تیک به چشم نمی‌آمد.
     حالا که «تأییدشده بدون تیک» هم داریم، این تمایز دیده می‌شود و
     باید درست باشد. */
  /* `hasActiveStory` هم مشتق است، نه ستون.
     اگر ذخیره‌اش می‌کردیم، لحظه‌ی انقضای استوری کسی نبود که پرچم را
     پایین بیاورد و ۲۴ ساعت بعد رینگی نشان داده می‌شد که پشتش چیزی
     نیست. مقایسه با «حالا» هیچ‌وقت کهنه نمی‌شود. */
  const now = Date.now();
  /* فهرست ستون‌ها در زمان اجرا انتخاب می‌شود (عمومی در برابر ادمین)،
     پس PostgREST نمی‌تواند شکل ردیف را استنتاج کند. ردیف‌ها این‌جا
     همان چیزی‌اند که بالا انتخاب شده. */
  const rows = (clubs ?? []) as unknown as Record<string, unknown>[];

  /* PostgREST شمارشِ embed را به‌صورت `club_members: [{ count: n }]`
     برمی‌گرداند. اگر مهاجرت ۰۹۶ اجرا نشده باشد کلید اصلا نمی‌آید و
     عدد صفر می‌ماند — همان رفتارِ قبلی، نه خطا. */
  const memberCountOf = (c: Record<string, unknown>): number => {
    const raw = c.club_members;
    if (Array.isArray(raw)) return Number((raw[0] as { count?: number })?.count ?? 0) || 0;
    return Number((raw as { count?: number } | null)?.count ?? 0) || 0;
  };

  const withBadge = rows.map((c: Record<string, unknown>) => {
    const { club_members: _m, ...rest } = c;
    const base = isAdminReq && !canSeePrivate ? stripClubPrivate(rest) : rest;
    return {
      ...base,
      isVerified: c.verificationStatus === 'verified',
      hasActiveStory: !!c.storyExpiresAt && new Date(String(c.storyExpiresAt)).getTime() > now,
      memberCount: memberCountOf(c),
    };
  });
  return withBadge;
}
