export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';

/* پروفایلِ کاربرِ واردشده — خواندن و ویرایش.

   فیلدهایی که موقعِ ثبت‌نام از ثبت‌احوال و شاهکار استعلام شده‌اند
   (نام، نام خانوادگی، کد ملی، تاریخ تولد) این‌جا هرگز نوشته نمی‌شوند:
   استعلام یک‌بار انجام شده و تغییرِ بعدیِ آن‌ها یعنی هویتِ تأییدشده
   دیگر معنایی ندارد. لیستِ سفیدِ زیر تنها چیزی است که تغییر می‌کند —
   نه اینکه فقط در UI قفل باشد و از راهِ API باز.

   شماره‌ی موبایل هم این‌جا عوض نمی‌شود؛ مسیرِ خودش را دارد
   (/api/auth/change-phone) که کد پیامکی و شاهکار می‌خواهد. */

const EDITABLE = [
  'bio', 'province', 'city', 'country', 'instagram', 'telegram',
  'avatar', 'gender', 'club_name_manual', 'address', 'work_phone',
] as const;

const str = (v: unknown, max = 300) => String(v ?? '').trim().slice(0, max);

/* ستون‌هایی که ممکن است در نسخه‌های قدیمیِ دیتابیس نباشند */
const OPTIONAL_COLS = new Set(['address', 'work_phone']);

function shape(u: Record<string, unknown>) {
  return {
    id: u.id,
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    phone: u.phone ?? '',
    email: u.email ?? '',
    avatar: u.avatar ?? '',
    bio: u.bio ?? '',
    province: u.province ?? '',
    city: u.city ?? '',
    country: u.country ?? '',
    gender: u.gender ?? '',
    instagram: u.instagram ?? '',
    telegram: u.telegram ?? '',
    address: u.address ?? '',
    workPhone: u.work_phone ?? '',
    clubNameManual: u.club_name_manual ?? '',
    /* هویتِ استعلام‌شده — فقط برای نمایش */
    nationalId: u.national_id ?? '',
    birthDate: u.birth_date ?? u.birthDate ?? '',
    nationalIdVerified: !!u.national_id_verified,
    phoneVerified: !!u.phone_verified,
    emailVerified: !!u.email_verified,
    verificationStatus: u.verificationStatus ?? 'none',
    primaryRole: u.primaryRole ?? 'user',
    secondaryRoles: Array.isArray(u.secondaryRoles) ? u.secondaryRoles : [],
    isProfileComplete: !!u.isProfileComplete,
  };
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data, error } = await sb().from('users').select('*').eq('id', actor.id).maybeSingle();
  if (error || !data) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });

  return NextResponse.json(shape(data as Record<string, unknown>), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;

  /* نامِ ورودیِ کلاینت camelCase است، ستونِ دیتابیس snake_case */
  const incoming: Record<string, unknown> = { ...b };
  if (b.clubNameManual !== undefined) incoming.club_name_manual = b.clubNameManual;
  if (b.workPhone !== undefined) incoming.work_phone = b.workPhone;

  const patch: Record<string, unknown> = {};
  for (const col of EDITABLE) {
    if (incoming[col] === undefined) continue;
    patch[col] = col === 'bio' ? str(incoming[col], 1000) : str(incoming[col]);
  }

  const blocked = ['firstName', 'lastName', 'nationalId', 'national_id', 'birthDate', 'birth_date', 'phone', 'email']
    .filter(k => b[k] !== undefined);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({
      message: blocked.length
        ? 'این اطلاعات هنگام ثبت‌نام استعلام شده‌اند و قابلِ ویرایش نیستند'
        : 'تغییری برای ذخیره فرستاده نشد',
    }, { status: 400 });
  }

  patch.updatedAt = new Date().toISOString();

  let { data, error } = await sb().from('users').update(patch).eq('id', actor.id).select().single();

  /* ستونِ اختیاری هنوز ساخته نشده ⇒ بدونِ آن دوباره تلاش کن، نه اینکه
     کلِ ذخیره‌ی پروفایل شکست بخورد */
  if (error && /column .* does not exist|schema cache/i.test(error.message)) {
    for (const c of OPTIONAL_COLS) delete patch[c];
    if (Object.keys(patch).length <= 1) {
      return NextResponse.json({ message: 'این فیلدها هنوز روی سرور فعال نیستند' }, { status: 503 });
    }
    ({ data, error } = await sb().from('users').update(patch).eq('id', actor.id).select().single());
  }

  if (error || !data) return NextResponse.json({ message: 'ذخیره‌ی پروفایل انجام نشد' }, { status: 500 });

  return NextResponse.json({
    ...shape(data as Record<string, unknown>),
    ...(blocked.length ? { ignored: blocked } : {}),
  });
}
