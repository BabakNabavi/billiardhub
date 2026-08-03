export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* فهرستِ کاربران برای پنلِ ادمین.

   ── چرا این مسیر تازه ساخته شد ──
   صفحه‌ی «مدیریت کاربران» و «احراز هویت» هر دو `api.get('/user/all')`
   را صدا می‌زدند — بازمانده‌ی بک‌اندِ NestJS که حذف شده. چنین مسیری در
   Next وجود نداشت، پس هر دو صفحه ۴۰۴ می‌گرفتند، خطا را می‌بلعیدند و
   فهرستِ خالی نشان می‌دادند. در همان حال کارتِ داشبورد از
   `/api/admin/stats` درست ۲۱ کاربر می‌شمرد: دو عددِ متناقض در یک پنل،
   چون از دو جای متفاوت می‌آمدند.

   ── مرزِ داده ──
   این‌جا داده‌ی هویتیِ واقعیِ کاربران است. فقط ادمین، و فقط ستون‌هایی
   که پنل واقعاً نشان می‌دهد. `password`, `national_id` و توکن‌ها
   عمداً select نمی‌شوند تا حتی اگر روزی رابط تغییر کند، از این مسیر
   بیرون نروند. */

const COLUMNS =
  'id,phone,"firstName","lastName","primaryRole","secondaryRoles",' +
  '"isProfileComplete","verificationStatus","createdAt",city';

/* ── ستون‌های صفحه‌ی جزئیات (`?id=`) ──
   دکمه‌ی چشم در فهرست فقط به پروفایلِ عمومی می‌رفت و آن‌جا جز نام
   چیزی نبود — یعنی ادمین برای دیدنِ مشخصاتِ یک نفر هیچ راهی نداشت.

   این فهرست بلندتر است ولی همچنان بسته: `password`, `otp_code` و
   `otp_expires_at` عمداً نیستند و از این مسیر بیرون نمی‌روند.

   `national_id` هست، چون کارِ اصلیِ همین پنل احرازِ هویت است و بدونِ
   دیدنِ کدِ ملی نمی‌شود مدرک را با شخص تطبیق داد. */
const DETAIL_COLUMNS = COLUMNS + ',' + [
  'email', '"isActive"', 'avatar', 'bio', 'province', 'address', 'gender',
  '"birthDate"', 'birth_date', 'instagram', 'telegram', '"updatedAt"',
  'national_id', 'national_id_verified', 'phone_verified', 'email_verified',
  'work_phone', 'club_id', 'club_name_manual', 'documents',
  'bank_card', 'bank_card_owner', 'bank_iban', 'bank_card_verified',
  '"playerProfile"', '"coachProfile"', '"refereeProfile"',
  '"manufacturerProfile"', '"installerProfile"', '"sellerProfile"',
].join(',');

const VERIFICATION = new Set(['unverified', 'pending', 'verified', 'rejected']);

/* ── ستون‌هایی که ادمین می‌تواند ویرایش کند ──

   تا امروز هیچ راهی برای اصلاحِ مشخصاتِ یک کاربر از پنل نبود؛ حتی
   خودِ مالکِ سایت برای درست‌کردنِ نامِ خودش باید SQL می‌زد.

   فهرست عمداً بسته است. بیرونِ آن مانده‌اند:
   · `phone` — کلیدِ ورود است و به استعلامِ شاهکار گره خورده. عوض‌کردنش
     یعنی دزدیدنِ حساب، نه ویرایشِ پروفایل.
   · `password`, `otp_*` — از این مسیر اصلاً دیده هم نمی‌شوند.
   · `primaryRole`, `secondaryRoles` — کارِ /api/admin/grant-admin است
     که محافظ‌های خودش را دارد (آخرین ادمین، نقشِ خود، بایگانی).
   · پرچم‌های تأیید — تأیید باید نتیجه‌ی استعلام باشد، نه چیزی که با
     دست روشن شود. وگرنه نشانِ «تأییدشده» دروغ می‌گوید. */
const EDITABLE: Record<string, 'text' | 'nid' | 'birth' | 'email' | 'gender'> = {
  firstName: 'text', lastName: 'text', email: 'email',
  national_id: 'nid', birth_date: 'birth', gender: 'gender',
  province: 'text', city: 'text', address: 'text',
  work_phone: 'text', instagram: 'text', telegram: 'text',
  bio: 'text', club_name_manual: 'text',
};

/* پاک‌سازی و اعتبارسنجیِ یک مقدار. `null` یعنی «رد شد». */
function clean(kind: string, raw: unknown): string | null | undefined {
  const v = String(raw ?? '').trim();
  if (v === '') return '';                       // خالی‌کردنِ یک فیلد مجاز است
  switch (kind) {
    case 'nid':
      /* رقمِ فارسی هم پذیرفته می‌شود؛ کاربر از کیبوردِ فارسی تایپ می‌کند */
      { const d = v.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
        return /^\d{10}$/.test(d) ? d : undefined; }
    case 'birth':
      /* قالبِ ذخیره‌سازیِ سایت شمسی است — همان چیزی که ثبت‌نام می‌نویسد */
      { const d = v.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[-.]/g, '/');
        const m = /^(1[234]\d{2})\/(\d{1,2})\/(\d{1,2})$/.exec(d);
        if (!m) return undefined;
        const mo = +m[2]!, dy = +m[3]!;
        if (mo < 1 || mo > 12 || dy < 1 || dy > 31) return undefined;
        return `${m[1]}/${String(mo).padStart(2, '0')}/${String(dy).padStart(2, '0')}`; }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v.toLowerCase() : undefined;
    case 'gender':
      return v === 'male' || v === 'female' ? v : undefined;
    default:
      return v.slice(0, 400);
  }
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await can(actor.id, 'users'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  /* ?id=… → مشخصاتِ کاملِ یک کاربر برای پنجره‌ی جزئیات */
  const one = (req.nextUrl.searchParams.get('id') ?? '').trim();
  if (one) {
    const { data, error } = await sb().from('users').select(DETAIL_COLUMNS).eq('id', one).maybeSingle();
    if (error) {
      console.error('[admin/users:detail]', error.message);
      return NextResponse.json({ message: 'خواندن کاربر انجام نشد' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
    audit({
      actorId: actor.id, actorRole: 'admin', action: 'USER_DETAIL_VIEWED',
      entityType: 'user', entityId: one, ip: clientIp(req) ?? undefined,
    });
    return NextResponse.json({ user: data });
  }

  const sp = req.nextUrl.searchParams;
  const role = (sp.get('role') ?? '').trim();
  const status = (sp.get('status') ?? '').trim();
  const q = (sp.get('q') ?? '').trim();

  let query = sb().from('users').select(COLUMNS)
    .order('createdAt', { ascending: false }).limit(1000);

  if (role && role !== 'all') query = query.eq('primaryRole', role);
  if (status && status !== 'all' && VERIFICATION.has(status)) {
    query = query.eq('verificationStatus', status);
  }
  if (q) {
    /* رقمِ فارسی را هم بپذیر — کاربر معمولاً شماره را فارسی می‌نویسد */
    const digits = q.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    query = query.or(
      `firstName.ilike.%${q}%,lastName.ilike.%${q}%,phone.ilike.%${digits}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[admin/users]', error.message);
    return NextResponse.json({ message: 'خواندن کاربران انجام نشد' }, { status: 500 });
  }

  const users = (data ?? []) as unknown as Record<string, unknown>[];
  const counts: Record<string, number> = {};
  for (const u of users) {
    const k = String(u.verificationStatus ?? 'unverified');
    counts[k] = (counts[k] ?? 0) + 1;
  }

  return NextResponse.json({ users, total: users.length, counts },
    { headers: { 'Cache-Control': 'no-store' } });
}

/* PATCH { userId, verificationStatus } — تأیید یا ردِ مدارکِ کاربر.

   نقش از این‌جا عوض نمی‌شود؛ آن کارِ /api/admin/grant-admin است که
   محافظ‌های خودش را دارد (آخرین ادمین، نقشِ خود، بایگانیِ نقشِ قبلی). */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await can(actor.id, 'users'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const userId = String(b.userId ?? '');
  if (!userId) return NextResponse.json({ message: 'کاربر مشخص نیست' }, { status: 400 });

  /* ── شاخه‌ی ویرایشِ مشخصات ──
     جدا از تغییرِ وضعیتِ احراز نگه داشته شده تا هیچ‌کدام به‌طور جانبی
     دیگری را عوض نکند. */
  if (b.fields && typeof b.fields === 'object') {
    const incoming = b.fields as Record<string, unknown>;

    const patch: Record<string, unknown> = {};
    const rejected: string[] = [];
    for (const [k, kind] of Object.entries(EDITABLE)) {
      if (!(k in incoming)) continue;
      const v = clean(kind, incoming[k]);
      if (v === undefined) { rejected.push(k); continue }
      patch[k] = v === '' ? null : v;
    }
    if (rejected.length) {
      return NextResponse.json({ message: 'مقدارِ نامعتبر: ' + rejected.join('، ') }, { status: 400 });
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ message: 'چیزی برای تغییر نیست' }, { status: 400 });
    }

    const { data: before } = await sb().from('users')
      .select(DETAIL_COLUMNS).eq('id', userId).maybeSingle();
    if (!before) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });
    const prev = before as unknown as Record<string, unknown>;

    /* فقط چیزهایی که واقعاً عوض شده‌اند — تا گزارشِ ممیزی پر از
       «تغییر»هایی نشود که هیچ مقداری را جابه‌جا نکرده‌اند. */
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const [k, v] of Object.entries(patch)) {
      const old = prev[k] ?? null;
      if (String(old ?? '') !== String(v ?? '')) changed[k] = { from: old, to: v };
    }
    if (!Object.keys(changed).length) {
      return NextResponse.json({ ok: true, user: prev, unchanged: true });
    }

    /* عوض‌شدنِ کدِ ملی، تأییدِ شاهکار را باطل می‌کند.

       آن استعلام دقیقاً همین کد را به همین شماره گره زده بود؛ با
       کدِ تازه دیگر چیزی تأیید نشده است. اگر پرچم را دست‌نخورده
       بگذاریم، نشانِ «تأییدشده» درباره‌ی هویتی حرف می‌زند که هرگز
       استعلام نشده. اصلاحِ نام یا تاریخ این را باطل نمی‌کند —
       آن‌ها تصحیحِ نگارشی‌اند، نه ادعای هویتِ دیگر. */
    if ('national_id' in changed) patch.national_id_verified = false;

    patch.updatedAt = new Date().toISOString();
    const { data, error } = await sb().from('users')
      .update(patch).eq('id', userId).select(DETAIL_COLUMNS).single();

    if (error) {
      console.error('[admin/users] edit', error.message);
      return NextResponse.json({ message: 'ذخیره‌ی تغییرات انجام نشد' }, { status: 500 });
    }

    void audit({
      actorId: actor.id, actorRole: 'admin', action: 'USER_PROFILE_EDITED',
      entityType: 'user', entityId: userId,
      oldValue: Object.fromEntries(Object.entries(changed).map(([k, c]) => [k, c.from])),
      newValue: Object.fromEntries(Object.entries(changed).map(([k, c]) => [k, c.to])),
      ip: clientIp(req) ?? undefined,
    });

    return NextResponse.json({ ok: true, user: data, changed: Object.keys(changed) });
  }

  const next = String(b.verificationStatus ?? '');
  if (!VERIFICATION.has(next)) {
    return NextResponse.json({ message: 'وضعیت نامعتبر است' }, { status: 400 });
  }

  const { data: before } = await sb().from('users')
    .select('id,"verificationStatus"').eq('id', userId).maybeSingle();
  if (!before) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });

  const { data, error } = await sb().from('users')
    .update({ verificationStatus: next, updatedAt: new Date().toISOString() })
    .eq('id', userId).select(COLUMNS).single();

  if (error) {
    console.error('[admin/users] update', error.message);
    return NextResponse.json({ message: 'تغییر وضعیت انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'USER_VERIFICATION_CHANGED',
    entityType: 'user', entityId: userId,
    oldValue: { verificationStatus: (before as { verificationStatus?: string }).verificationStatus },
    newValue: { verificationStatus: next },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, user: data });
}
