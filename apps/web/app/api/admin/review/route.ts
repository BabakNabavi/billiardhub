export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* همه‌ی اطلاعاتِ لازم برای یک تصمیمِ تأیید/رد — در یک مسیر.

   ── چرا لازم شد ──
   چند صفحه‌ی پنل فقط یک نام و دو دکمه نشان می‌دادند. تصمیم‌گرفتن
   درباره‌ی چیزی که دیده نمی‌شود تأیید نیست، امضای نادیده است: ادمین
   نمی‌دانست آن مربی کیست، آن باشگاه کجاست، مدرکی هست یا نه، و
   اطلاعاتش با هویتِ حسابش می‌خواند یا نه.

   ── چرا یک مسیر برای هر سه ──
   پروفایل، باشگاه و درخواستِ نقش سه جدولِ متفاوت‌اند ولی تصمیمِ ادمین
   یکی است و اطلاعاتِ لازمش هم تقریباً یکی: صاحبش کیست، چه چیزی ثبت
   کرده، و چه مدرکی دارد. سه مسیر یعنی سه شکلِ متفاوتِ خروجی و
   سه‌جا برای از قلم افتادن.

   ⚠️ کدِ ملی و شماره‌ی تماس این‌جا برمی‌گردند چون تصمیمِ ادمین بدونشان
   ممکن نیست — ولی مسیر فقط برای ادمین باز است و هیچ‌کدام در ممیزی یا
   لاگ نوشته نمی‌شوند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OwnerCard {
  id: string; name: string; phone: string | null
  nationalId: string | null; nationalIdVerified: boolean; phoneVerified: boolean
  email: string | null; birthDate: string | null; gender: string | null
  province: string | null; city: string | null
  createdAt: string | null
  primaryRole: string | null; secondaryRoles: string[]
  clubName: string | null
}

async function ownerCard(userId: string | null | undefined): Promise<OwnerCard | null> {
  if (!userId) return null;
  const { data } = await sb().from('users')
    .select('id,"firstName","lastName",phone,email,national_id,national_id_verified,phone_verified,' +
            'birth_date,gender,province,city,"createdAt","primaryRole","secondaryRoles",club_name_manual')
    .eq('id', userId).maybeSingle();
  if (!data) return null;
  const u = data as unknown as Record<string, unknown>;
  return {
    id: String(u.id),
    name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—',
    phone: (u.phone as string) ?? null,
    nationalId: (u.national_id as string) ?? null,
    nationalIdVerified: u.national_id_verified === true,
    phoneVerified: u.phone_verified === true,
    email: (u.email as string) ?? null,
    birthDate: (u.birth_date as string) ?? null,
    gender: (u.gender as string) ?? null,
    province: (u.province as string) ?? null,
    city: (u.city as string) ?? null,
    createdAt: (u.createdAt as string) ?? null,
    primaryRole: (u.primaryRole as string) ?? null,
    secondaryRoles: Array.isArray(u.secondaryRoles) ? u.secondaryRoles as string[] : [],
    clubName: (u.club_name_manual as string) ?? null,
  };
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') ?? '';
  const id = String(sp.get('id') ?? '').trim();
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه نامعتبر است' }, { status: 400 });

  /* ── پروفایلِ نقش ── */
  if (type === 'profile') {
    const { data } = await sb().from('profiles')
      .select('id,kind,slug,owner_id,data,status,verified,license_number,license_url,' +
              'license_verified,license_note,created_at,updated_at')
      .eq('id', id).maybeSingle();
    if (!data) return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });
    const p = data as unknown as Record<string, unknown>;
    return NextResponse.json({
      type, id,
      kind: p.kind, slug: p.slug, status: p.status, verified: p.verified,
      createdAt: p.created_at, updatedAt: p.updated_at,
      license: {
        number: p.license_number ?? null, url: p.license_url ?? null,
        verified: p.license_verified === true, note: p.license_note ?? null,
      },
      fields: p.data ?? {},
      owner: await ownerCard(p.owner_id as string),
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ── باشگاه ── */
  if (type === 'club') {
    const { data } = await sb().from('clubs').select('*').eq('id', id).maybeSingle();
    if (!data) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
    const c = data as Record<string, unknown>;

    const { count: tables } = await sb().from('tables')
      .select('id', { count: 'exact', head: true }).eq('clubId', id);
    const { count: members } = await sb().from('club_members')
      .select('id', { count: 'exact', head: true }).eq('club_id', id);

    /* ستون‌های حجیم و بی‌ربط به تصمیم کنار گذاشته می‌شوند تا
       صفحه پر از داده‌ی بی‌مصرف نشود. */
    const skip = new Set(['id', 'ownerId', 'createdAt', 'updatedAt', 'images', 'logo']);
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c)) {
      if (skip.has(k) || v === null || v === '' || v === false) continue;
      fields[k] = v;
    }

    return NextResponse.json({
      type, id,
      status: c.verificationStatus ?? null,
      isActive: c.isActive === true,
      createdAt: c.createdAt ?? null,
      counts: { tables: tables ?? 0, members: members ?? 0 },
      license: {
        number: c.licenseNumber ?? null, url: c.licenseDocumentUrl ?? null,
        verified: c.licenseVerified === true, note: c.rejectionReason ?? null,
      },
      images: Array.isArray(c.images) ? c.images : [],
      logo: c.logo ?? null,
      fields,
      owner: await ownerCard(c.ownerId as string),
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ── درخواستِ نقش ── */
  if (type === 'role') {
    const { data } = await sb().from('role_requests').select('*').eq('id', id).maybeSingle();
    if (!data) return NextResponse.json({ message: 'درخواست یافت نشد' }, { status: 404 });
    const r = data as Record<string, unknown>;

    /* پروفایلی که کاربر برای همین نقش ساخته — همان چیزی که ادمین
       باید ببیند تا بداند درخواست پشتوانه‌ای دارد یا خالی است. */
    const { data: prof } = await sb().from('profiles')
      .select('id,slug,data,status,license_url,license_number,updated_at')
      .eq('owner_id', r.user_id as string).eq('kind', r.role as string).maybeSingle();

    return NextResponse.json({
      type, id,
      role: r.role, status: r.status,
      docUrl: r.doc_url ?? null,
      note: r.rejection_note ?? null,
      requestedAt: r.requested_at ?? null,
      submittedAt: r.submitted_at ?? null,
      profile: prof
        ? {
          id: (prof as Record<string, unknown>).id,
          slug: (prof as Record<string, unknown>).slug,
          status: (prof as Record<string, unknown>).status,
          licenseUrl: (prof as Record<string, unknown>).license_url ?? null,
          licenseNumber: (prof as Record<string, unknown>).license_number ?? null,
          updatedAt: (prof as Record<string, unknown>).updated_at ?? null,
          fields: (prof as Record<string, unknown>).data ?? {},
        }
        : null,
      owner: await ownerCard(r.user_id as string),
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ message: 'نوع نامعتبر است' }, { status: 400 });
}
