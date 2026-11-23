export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { can, canAny } from '@/lib/admin/permissions';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { cardToIban, matchCard, matchIban } from '@/lib/bank-server';
import { actorFromRequest } from '@/lib/finance/db';
import { isUUID, isValidSlug } from '@/lib/slug';
import { queryClubs } from '@/lib/clubs/public-list';
import { revalidateHomeFeatured } from '@/lib/home-featured';
import { lockState, LOCKED_MESSAGE, LOCK_UNKNOWN_MESSAGE } from '@/lib/roles/revoke';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}


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
      /* «تیک آبی» هم فهرست را لازم دارد (نشان باشگاه منتشرشده)؛ داده‌ی خصوصی فقط با clubs */
      isAdminReq = !!actor && (await canAny(actor.id, ['clubs', 'verified']));
      if (!isAdminReq) {
        return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403, headers: CORS_HEADERS });
      }
      /* ⚠️ دیدن *فهرست* حق هر ادمینی است (صف تأیید، تیک آبی)، ولی
         شماره‌حساب و مدارک نه. بدون این تفکیک، گارد مسیر تکی با یک
         `?all=true` دور می‌خورد — و بدتر، همه‌ی باشگاه‌ها یک‌جا. */
      canSeePrivate = await can(actor!.id, 'clubs');
    }

    let withBadge: Record<string, unknown>[];
    try {
      withBadge = await queryClubs(sp, { isAdminReq, canSeePrivate });
    } catch (e) {
      console.error(e instanceof Error ? e.message : '[clubs] db error');
      return NextResponse.json(
        { message: 'خطا در دریافت باشگاه‌ها' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

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

    /* ساختنِ باشگاه نقشِ باشگاه‌دار را خودکار می‌دهد (پایین‌تر)؛ اگر مدیریت
       این نقش را برداشته، از این راه برنمی‌گردد (lib/roles/revoke) */
    const lock = await lockState(payload.id, 'club_owner');
    if (lock !== 'free') {
      return NextResponse.json(
        { message: lock === 'locked' ? LOCKED_MESSAGE : LOCK_UNKNOWN_MESSAGE },
        { status: lock === 'locked' ? 403 : 503, headers: CORS_HEADERS });
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
    /* «نمایشی» کارِ ادمین است (/admin/demo-content). از بدنه که می‌رسید، باشگاهِ
       یک کاربرِ عادی از محافظ‌هایی بیرون می‌افتاد که نمایشی‌ها را کنار می‌گذارند */
    delete (rest as Record<string, unknown>).is_demo;

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

      /* قفل دوباره درست پیش از دادنِ نقش (برداشتنِ مدیریت در فاصله‌ی همین درخواست) */
      if (row.primaryRole !== 'club_owner' && !secondary.includes('club_owner')
          && await lockState(payload.id, 'club_owner') === 'free') {
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

    /* باشگاهِ تازه همان لحظه «تأییدشده» است؛ بی‌این، صفحه‌ی اصلی تا پایانِ
       کشِ ۶۰ثانیه‌ایِ ISR و یک بازدیدِ دیگر نشانش نمی‌داد (lib/home-featured) */
    revalidateHomeFeatured();
    return NextResponse.json(club, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
