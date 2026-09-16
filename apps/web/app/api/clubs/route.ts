export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { can } from '@/lib/admin/permissions';
import { stripClubPrivate } from '@/lib/clubs/private-fields';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { cardToIban, matchCard, matchIban } from '@/lib/bank-server';
import { actorFromRequest, isAdmin } from '@/lib/finance/db';
import { isUUID, isValidSlug } from '@/lib/slug';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/* شهر/استان/نام از کاربر می‌آید و مستقیم به PostgREST می‌رود؛ کاراکترهای
   کنترلی فیلتر (`,` و `%` و `*`) باید بی‌اثر شوند وگرنه می‌شود شرط تزریق کرد. */
const clean = (v: string | null, max = 60) =>
  String(v ?? '').replace(/[,%*()"'\\]/g, '').trim().slice(0, max);

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    /* `?all=true` فهرست کامل (شامل در انتظار و ردشده) را می‌دهد و **فقط**
       برای ادمین است.

       تا امروز این پارامتر اصلا خوانده نمی‌شد: پنل ادمین آن را می‌فرستاد
       ولی همان فهرست عمومی برمی‌گشت. چون باشگاه تازه‌ثبت‌شده
       `isActive=false` است، هیچ‌وقت در صف تأیید ظاهر نمی‌شد و عملا
       امکان تأییدش وجود نداشت — کل فلوی ثبت → تأیید → انتشار قطع بود. */
    const wantsAll = sp.get('all') === 'true';
    let isAdminReq = false, canSeePrivate = false;
    if (wantsAll) {
      const actor = actorFromRequest(req);
      isAdminReq = !!actor && (await isAdmin(actor.id));
      if (!isAdminReq) {
        return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403, headers: CORS_HEADERS });
      }
      /* ⚠️ دیدن *فهرست* حق هر ادمینی است (صف تأیید، تیک آبی)، ولی
         شماره‌حساب و مدارک نه. بدون این تفکیک، گارد مسیر تکی با یک
         `?all=true` دور می‌خورد — و بدتر، همه‌ی باشگاه‌ها یک‌جا. */
      canSeePrivate = await can(actor!.id, 'clubs');
    }

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
      'snookerTables', 'pocketTables', 'highballTables', 'vipSnookerTables', 'vipPocketTables',
      'playstations', 'hasCafe', 'hasParking', 'hasWifi', 'hasProfessionalCoach',
      /* ⚠️ `hasActiveStory` ستونی است که هیچ‌کس نمی‌نویسدش و دو خط
         پایین‌تر از روی `storyExpiresAt` بازنویسی می‌شود — انتخابش
         بی‌فایده بود. در عوض سه ستون خود استوری لازم‌اند: کارت
         باشگاه حلقه را روی `hasActiveStory && storyMediaUrl` می‌کشد،
         و چون رسانه انتخاب نمی‌شد حلقه هرگز رندر نمی‌شد. */
      'verificationStatus', 'storyExpiresAt', 'storyMediaUrl', 'storyType', 'storyText',
      'isActive', 'createdAt',
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
      q = q.eq('isActive', true).in('verificationStatus', ['verified', 'approved']);

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
      console.warn('[clubs] شمارشِ اعضا در دسترس نیست — بدونِ آن ادامه:', error.message);
      ({ data: clubs, error } = await withFilters(build(false)));
    }

    if (error) {
      console.error('[clubs] db error:', error.message);
      return NextResponse.json(
        { message: 'خطا در دریافت باشگاه‌ها' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

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

    return NextResponse.json(withBadge, { status: 200, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = sessionFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: 'احراز هویت الزامی است' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = await req.json();
    const {
      name, address, city, slug,
      /* پرچم‌های «تأییدشده» هرگز از کلاینت پذیرفته نمی‌شوند — وگرنه هر
         کسی می‌توانست با یک درخواست دستی، کارت تأییدنشده را
         «تأییدشده» ثبت کند. پایین‌تر خود سرور استعلام می‌گیرد. */
      ibanVerified: _iv, bankCardVerified: _bv, bankConfirmedByOwner: _bc,
      iban: _ib, ibanOwnerName: _io, bankCardOwner: _bo, bankName: _bn,
      bankCard,
      ...rest
    } = body;

    if (!name || !address || !city) {
      return NextResponse.json(
        { message: 'نام، آدرس و شهر الزامی هستند' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const insertData: Record<string, any> = {
      ...rest,
      name, address, city,
      ownerId: payload.id,
      /* ── باشگاه‌دار منتظر تأیید نمی‌ماند ──
         سیاست: فقط داور و بازیکن برای انتشار تأیید می‌خواهند. باشگاه
         مثل فروشگاه و مربی همان لحظه‌ی ثبت منتشر می‌شود.

         'approved' یعنی «منتشر»، 'verified' یعنی «تیک آبی» — دو چیز
         جدا روی یک ستون. تیک همچنان تصمیم ادمین است و در
         /admin/verified داده می‌شود. */
      isActive: true,
      verificationStatus: 'approved',
    };
    /* ── نشانی اختصاصی، همان‌طور که PUT می‌نویسدش ──
       پیش‌تر مقدار خام می‌نشست: بدونِ trim، بدونِ پایین‌حرف‌کردن و
       بدونِ بررسیِ قالب. حالا که نشانی پس از ثبتِ اول قفل می‌شود،
       یک حرفِ بزرگ یا فاصله‌ی اضافی برای همیشه روی ردیف می‌ماند و
       صاحبش راهی برای اصلاحش ندارد. */
    const cleanSlug = String(slug ?? '').trim().toLowerCase();
    if (cleanSlug) {
      if (!isValidSlug(cleanSlug) || isUUID(cleanSlug)) {
        return NextResponse.json(
          { message: 'آدرس اختصاصی نامعتبر است — فقط حروف انگلیسی کوچک، عدد و خط تیره' },
          { status: 400, headers: CORS_HEADERS });
      }
      insertData.slug = cleanSlug;
    }

    /* ── اطلاعات بانکی: اثبات سمت سرور ──
       کارت باید به نام همان کسی باشد که حسابش احراز شده. اگر استعلام
       نگرفت یا نخواند، باشگاه بدون اطلاعات بانکی ثبت می‌شود و مالک
       بعدا از داشبورد تکمیل می‌کند — ثبت باشگاه نباید شکست بخورد. */
    const cardDigits = String(bankCard ?? '').replace(/\D/g, '');
    if (cardDigits.length === 16) {
      try {
        const { data: me } = await getSupabaseServer().from('users')
          .select('national_id, national_id_verified, birth_date').eq('id', payload.id).maybeSingle();
        const u = (me ?? {}) as { national_id?: string; national_id_verified?: boolean; birth_date?: string };

        if (u.national_id && u.national_id_verified && u.birth_date) {
          const cm = await matchCard(u.national_id, u.birth_date, cardDigits);
          if (cm.ok && cm.match) {
            const r = await cardToIban(cardDigits);
            if (r.ok && r.found && r.iban) {
              const im = await matchIban(u.national_id, u.birth_date, r.iban);
              if (im.ok && im.match) {
                insertData.bankCard = cardDigits;
                insertData.bankCardOwner = r.ownerName ?? null;
                insertData.bankName = r.bankName ?? null;
                insertData.iban = r.iban;
                insertData.ibanOwnerName = r.ownerName ?? null;
                insertData.ibanVerified = true;
                insertData.bankCardVerified = true;
                insertData.bankCardCheckedAt = new Date().toISOString();
                insertData.bankConfirmedByOwner = true;
              }
            }
          }
        }
      } catch (e) {
        console.error('[clubs] bank verification failed:', e);
      }
    }

    let { data: club, error } = await getSupabaseServer()
      .from('clubs')
      .insert(insertData)
      .select()
      .single();

    // اگر ستون slug هنوز در دیتابیس نیست، بدون slug دوباره تلاش کن
    if (error?.message?.includes('slug')) {
      delete insertData.slug;
      ({ data: club, error } = await getSupabaseServer()
        .from('clubs')
        .insert(insertData)
        .select()
        .single());
    }

    if (error || !club) {
      console.error('[clubs] insert error:', error?.message);
      return NextResponse.json(
        { message: 'خطا در ثبت باشگاه' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    /* ── نقش «باشگاه‌دار» همین‌جا داده می‌شود ──
       تا امروز ساختن باشگاه هیچ نقشی به کاربر نمی‌داد: نقشش `user`
       می‌ماند. نتیجه‌اش دو ایراد به‌هم‌چسبیده بود که مثل «گم‌شدن
       باشگاه» دیده می‌شد:
         • در پروفایل باز هم می‌شد نقش باشگاه‌دار را انتخاب کرد و
           باشگاه تکراری ساخت
         • داشبورد و پروفایل هیچ نشانی از باشگاه ساخته‌شده نشان
           نمی‌دادند، چون بخش باشگاه به نقش گره خورده است
       خود رکورد باشگاه همیشه سالم بود؛ فقط دیده نمی‌شد. */
    try {
      const sbs = getSupabaseServer();
      const { data: u } = await sbs.from('users')
        .select('"primaryRole","secondaryRoles"').eq('id', payload.id).maybeSingle();
      const row = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };
      const secondary = Array.isArray(row.secondaryRoles) ? row.secondaryRoles : [];

      if (row.primaryRole !== 'club_owner' && !secondary.includes('club_owner')) {
        const patch: Record<string, unknown> = {
          /* نقش اصلی فقط وقتی عوض می‌شود که هنوز نقش معناداری نگرفته
             باشد؛ ادمین یا مربی نباید ناخواسته باشگاه‌دار شود. */
          secondaryRoles: [...secondary, 'club_owner'],
        };
        if (!row.primaryRole || row.primaryRole === 'user') patch.primaryRole = 'club_owner';
        await sbs.from('users').update(patch).eq('id', payload.id);
      }
    } catch (e) {
      /* باشگاه ثبت شده؛ نبود نقش نباید ثبت را برگرداند */
      console.error('[clubs] granting club_owner failed:', e);
    }

    /* ── «ثبت نهایی» نقش باشگاه‌دار ──
       باشگاه‌دار پروفایل ندارد، باشگاه دارد. پس ساختن باشگاه همان
       لحظه‌ای است که کارش را تمام کرده و درخواستش باید روی میز ادمین
       بنشیند — ردیف `draft` به `pending` می‌رود.

       بی‌صداست: اگر ردیفی نباشد (کاربر از مسیر دیگری آمده) ثبت
       باشگاه نباید شکست بخورد. جواز کسب اگر بارگذاری شده باشد همان
       مدرک تیک آبی است. */
    try {
      const sbs = getSupabaseServer();
      await sbs.from('role_requests')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString(),
          /* جواز کسب — اگر همراه فرم آمده باشد، همان مدرک تیک آبی است */
          ...(typeof rest?.licenseDocumentUrl === 'string' && rest.licenseDocumentUrl
            ? { doc_url: String(rest.licenseDocumentUrl).slice(0, 500) } : {}),
        })
        .eq('user_id', payload.id).eq('role', 'club_owner').eq('status', 'draft');
    } catch (e) {
      console.error('[clubs] role submit failed:', e);
    }

    return NextResponse.json(club, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
