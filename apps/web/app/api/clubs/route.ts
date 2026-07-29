export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { cardToIban, matchCard, matchIban } from '@/lib/bank-server';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const { data: clubs, error } = await getSupabaseServer()
      .from('clubs')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[clubs] db error:', error.message);
      return NextResponse.json(
        { message: 'خطا در دریافت باشگاه‌ها' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(clubs ?? [], { status: 200, headers: CORS_HEADERS });
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
         کسی می‌توانست با یک درخواستِ دستی، کارتِ تأییدنشده را
         «تأییدشده» ثبت کند. پایین‌تر خودِ سرور استعلام می‌گیرد. */
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
      /* باشگاهِ تازه منتشر نمی‌شود تا ادمین تأییدش کند.
         تا امروز `isActive: true` بود و چون فهرستِ عمومی فقط همین ستون
         را فیلتر می‌کند، هر باشگاهی همان لحظه‌ی ثبت در سایت می‌نشست —
         بدونِ هیچ بررسی‌ای. مالک باشگاهش را در داشبوردِ خودش می‌بیند
         (آن مسیر روی مالکیت فیلتر می‌کند، نه انتشار). */
      isActive: false,
      verificationStatus: 'pending',
    };
    if (slug) insertData.slug = slug;

    /* ── اطلاعات بانکی: اثبات سمتِ سرور ──
       کارت باید به نامِ همان کسی باشد که حسابش احراز شده. اگر استعلام
       نگرفت یا نخواند، باشگاه بدونِ اطلاعات بانکی ثبت می‌شود و مالک
       بعداً از داشبورد تکمیل می‌کند — ثبتِ باشگاه نباید شکست بخورد. */
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

    /* ── نقشِ «باشگاه‌دار» همین‌جا داده می‌شود ──
       تا امروز ساختنِ باشگاه هیچ نقشی به کاربر نمی‌داد: نقشش `user`
       می‌ماند. نتیجه‌اش دو ایرادِ به‌هم‌چسبیده بود که مثلِ «گم‌شدنِ
       باشگاه» دیده می‌شد:
         • در پروفایل باز هم می‌شد نقشِ باشگاه‌دار را انتخاب کرد و
           باشگاهِ تکراری ساخت
         • داشبورد و پروفایل هیچ نشانی از باشگاهِ ساخته‌شده نشان
           نمی‌دادند، چون بخشِ باشگاه به نقش گره خورده است
       خودِ رکوردِ باشگاه همیشه سالم بود؛ فقط دیده نمی‌شد. */
    try {
      const sbs = getSupabaseServer();
      const { data: u } = await sbs.from('users')
        .select('"primaryRole","secondaryRoles"').eq('id', payload.id).maybeSingle();
      const row = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };
      const secondary = Array.isArray(row.secondaryRoles) ? row.secondaryRoles : [];

      if (row.primaryRole !== 'club_owner' && !secondary.includes('club_owner')) {
        const patch: Record<string, unknown> = {
          /* نقشِ اصلی فقط وقتی عوض می‌شود که هنوز نقشِ معناداری نگرفته
             باشد؛ ادمین یا مربی نباید ناخواسته باشگاه‌دار شود. */
          secondaryRoles: [...secondary, 'club_owner'],
        };
        if (!row.primaryRole || row.primaryRole === 'user') patch.primaryRole = 'club_owner';
        await sbs.from('users').update(patch).eq('id', payload.id);
      }
    } catch (e) {
      /* باشگاه ثبت شده؛ نبودِ نقش نباید ثبت را برگرداند */
      console.error('[clubs] granting club_owner failed:', e);
    }

    return NextResponse.json(club, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
