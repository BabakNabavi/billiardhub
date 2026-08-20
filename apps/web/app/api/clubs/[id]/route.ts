export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { notifyClubApproved, notifyClubRejected } from '@/lib/notify';
import { audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';
import { checkProfileData } from '@/lib/profiles/validate';
import { isUUID, isValidSlug } from '@/lib/slug';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServer();
  const { data, error } = isUUID(id)
    ? await supabase.from('clubs').select('*').eq('id', id).single()
    : await supabase.from('clubs').select('*').eq('slug', id).single();

  if (error || !data) {
    return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });
  }
  /* `hasActiveStory` ستون نیست — از تاریخِ انقضا ساخته می‌شود تا هیچ‌وقت
     کهنه نماند. صفحه‌ی باشگاه رینگِ استوری را از همین می‌خواند. */
  const row = data as Record<string, unknown>;
  /* ── مالکیت را سرور می‌گوید ──
     ⚠️ صفحه‌ی باشگاه تا امروز فقط `user.id === club.ownerId` را از
     `localStorage` می‌سنجید. همان چیزی که در پروفایل‌ها باگ شد:
     حافظه‌ی محلی می‌تواند کهنه یا پاک باشد و آن‌وقت صاحبِ باشگاه
     دکمه‌هایش را نمی‌بیند. پاسخِ کوکی قطعی است. */
  const actor = sessionFromRequest(req);
  const isMine = !!actor && String(actor.id ?? '') === String(row.ownerId ?? '');

  /* ── ⚠️ نشتِ اطلاعاتِ بانکی ──
     این مسیر کلِ ردیف را برمی‌گرداند و بدونِ هیچ احراز هویتی خوانده
     می‌شود. یعنی هرکس با یک درخواستِ ساده شماره‌ی شبا، شماره‌ی کارت و
     نامِ صاحبِ حساب را می‌دید — روی سرورِ زنده تأیید شد، نه فرضی.
     (فهرستِ عمومیِ `/api/clubs` از همان اول ستون‌ها را انتخاب می‌کرد؛
     فقط همین مسیرِ تکی `*` می‌گرفت.)

     پس فیلدهای حساس فقط برای مالک و ادمین می‌مانند. صفحه‌ی عمومی
     هیچ‌کدامشان را نمی‌خواند. */
  const PRIVATE = [
    'iban', 'ibanVerified', 'ibanOwnerName',
    'bankCard', 'bankCardOwner', 'bankName', 'bankCardVerified', 'bankCardCheckedAt',
    'bankConfirmedByOwner', 'licenseNumber', 'licenseVerified', 'licenseCheckedAt',
    'licenseDocumentUrl', 'postalCode', 'postalCodeVerified', 'postalCodeVerifiedAt',
    'notifyPhone', 'rejectionReason', 'reviewedAt', 'reviewedBy', 'submissionCount',
  ];
  const isAdminReq = !!actor && (await can(actor.id, 'clubs.review'));
  const safe: Record<string, unknown> = { ...row };
  if (!isMine && !isAdminReq) {
    for (const k of PRIVATE) delete safe[k];
    /* ── دعوتِ پذیرفته‌نشده عمومی نیست ──
       افزودنِ مربی حالا دعوت است. تا وقتی مربی نپذیرفته، نه نامش
       باید در صفحه‌ی باشگاه بیاید و نه اینکه «این باشگاه ادعا کرده و
       او رد کرده» به بیرون درز کند. صفحه هم همین فیلتر را دارد؛ این
       تورِ سمتِ سرور است. */
    if (Array.isArray(safe.coaches)) {
      safe.coaches = (safe.coaches as { status?: unknown }[])
        .filter(c => (typeof c?.status === 'string' ? c.status : 'accepted') === 'accepted');
    }
  }

  return NextResponse.json({
    ...safe,
    isMine,
    isVerified: row.verificationStatus === 'verified',
    hasActiveStory: !!row.storyExpiresAt && new Date(String(row.storyExpiresAt)).getTime() > Date.now(),
  }, { headers: CORS });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = sessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  const userId = payload.id;
  const isAdmin = payload.role === 'admin';

  const { data: club } = await getSupabaseServer().from('clubs').select('ownerId').eq('id', id).single();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });

  if (!isAdmin && club.ownerId !== userId) {
    return NextResponse.json({ message: 'شما مجاز به ویرایش این باشگاه نیستید' }, { status: 403, headers: CORS });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'بدنه‌ی درخواست نامعتبر است' }, { status: 400, headers: CORS });
  }

  /* ── مرزِ اندازه ──
     همان مرزی که برای `profiles.data` نوشته شد. این ردیف هم ستون‌های
     jsonbِ آزاد دارد (`albums` که عکس‌های base64 نگه می‌دارد،
     `coaches`، `clubStats` و حالا `galleryVideos`) و تا امروز هرچه
     می‌رسید مستقیم می‌نشست. */
  const tooBig = checkProfileData(body);
  if (tooBig) return NextResponse.json({ message: tooBig }, { status: 400, headers: CORS });

  /* فیلدهای «اعتماد» فقط سرورساید نوشته می‌شوند: تأیید جواز از مسیر
     استعلام اماکن (verify-license) و تأیید شبا از استعلام بانکی.
     پیش‌تر بدنه‌ی خام مستقیم UPDATE می‌شد و مالک باشگاه می‌توانست
     verificationStatus خودش را 'verified' کند — که از فاز ۳ به بعد
     یعنی گرفتن نقش تأییدشده‌ی باشگاه‌دار و سهمیه‌ی ۴تایی آگهی.
     ادمین همچنان می‌تواند این فیلدها را تغییر دهد. */
  if (!isAdmin) {
    for (const k of [
      'verificationStatus', 'licenseVerified', 'licenseCheckedAt', 'licenseNumber',
      'ibanVerified', 'ibanOwnerName', 'ownerId', 'id', 'createdAt',
      /* انتشار هم دست ادمین است؛ وگرنه مالک می‌توانست خودش باشگاه
         تأییدنشده را در فهرست عمومی بنشاند. */
      'isActive',
    ]) {
      if (Object.prototype.hasOwnProperty.call(body, k)) delete (body as Record<string, unknown>)[k];
    }
  }

  /* ── نشانیِ اختصاصی: قالبش سمتِ سرور هم بررسی می‌شود ──────────────
     مرورگر ورودی را پاک می‌کند، ولی یک درخواستِ دستی می‌تواند هر چیزی
     بفرستد. نشانیِ بدقالب یعنی مسیرِ `/clubs/<slug>` که یا باز نمی‌شود
     یا با شناسه‌ی UUID اشتباه گرفته می‌شود. یکتایی را ایندکسِ
     `clubs_slug_uniq` (مهاجرتِ ۰۶۶) تضمین می‌کند. */
  if (Object.prototype.hasOwnProperty.call(body, 'slug')) {
    const raw = String(body.slug ?? '').trim().toLowerCase();
    if (!raw) {
      /* خالی ⇒ NULL، نه رشته‌ی تهی: چند NULL با ایندکسِ یکتا مشکلی
         ندارند ولی دو رشته‌ی خالی با هم برخورد می‌کنند. */
      (body as Record<string, unknown>).slug = null;
    } else if (!isValidSlug(raw) || isUUID(raw)) {
      return NextResponse.json(
        { message: 'آدرس اختصاصی نامعتبر است — فقط حروف انگلیسی کوچک، عدد و خط تیره' },
        { status: 400, headers: CORS });
    } else {
      (body as Record<string, unknown>).slug = raw;
    }
  }

  /* ── آدرس: خروجیِ استعلام است، نه ورودیِ کاربر ────────────────────
     مسیرِ /api/address/postal-code خودش آن را می‌نویسد. اگر از این‌جا
     هم نوشتنی بماند، همان آدرسِ رسمی با یک درخواستِ دستی قابلِ تغییر
     است و دیگر معلوم نیست چه چیزی استعلام شده و چه چیزی تایپ.
     توضیحاتِ تکمیلی جای خودش را دارد (addressNote). */
  if (!isAdmin && Object.prototype.hasOwnProperty.call(body, 'address')) {
    delete (body as Record<string, unknown>).address;
  }

  /* ── نام مدیر: نوشتنی نیست، مشتق است ─────────────────────────────
     «نام مدیر» باید همان نام و نام خانوادگیِ احرازشده‌ی موقع ثبت‌نام
     باشد. تا امروز یک فیلد آزادِ متنی در داشبورد بود، یعنی باشگاه
     می‌توانست زیر نام هر کسی معرفی شود در حالی که استعلام‌ها به نام
     شخص دیگری گرفته شده. قفلِ UI به‌تنهایی کافی نیست — هر درخواستِ
     دستی هم باید رد شود، پس مقدار را از رکورد کاربرِ مالک بازمی‌نویسیم
     و هرچه از مرورگر آمده دور می‌ریزیم. */
  if (Object.prototype.hasOwnProperty.call(body, 'managerName')) {
    delete (body as Record<string, unknown>).managerName;
  }
  {
    const { data: owner } = await getSupabaseServer()
      .from('users').select('"firstName","lastName"').eq('id', club.ownerId).maybeSingle();
    const o = owner as { firstName?: string; lastName?: string } | null;
    const verified = `${o?.firstName ?? ''} ${o?.lastName ?? ''}`.trim();
    /* اگر کاربر هنوز نام ثبت نکرده، مقدار قبلی دست‌نخورده می‌ماند —
       بازنویسی با رشته‌ی خالی یعنی پاک کردنِ داده‌ی درست. */
    if (verified) (body as Record<string, unknown>).managerName = verified;
  }

  /* تأیید ادمین = انتشار. رد کردن = برداشتن از فهرست عمومی.
     این دو تا امروز از هم جدا بودند و «تأیید شده» هیچ اثری روی دیده‌شدن
     باشگاه نداشت. */
  const decision = isAdmin && typeof body.verificationStatus === 'string'
    ? String(body.verificationStatus) : null;

  /* مقدارِ ناشناخته را همین‌جا رد می‌کنیم تا به‌جای خطای ۵۰۰ از سمتِ
     قیدِ دیتابیس، پیامِ روشن برگردد. */
  if (decision && !['pending', 'verified', 'approved', 'rejected', 'unverified'].includes(decision)) {
    return NextResponse.json(
      { message: 'وضعیت تأیید نامعتبر است' }, { status: 400, headers: CORS });
  }

  /* ادمینِ محدود باید کلیدِ `clubs` را داشته باشد — تا امروز هر ادمینی
     می‌توانست وضعیتِ هر باشگاهی را عوض کند. */
  if (decision && !(await can(userId, 'clubs'))) {
    return NextResponse.json(
      { message: 'دسترسی مجاز نیست' }, { status: 403, headers: CORS });
  }

  /* ── وضعیتِ فعلی، پیش از تصمیم ──
     لازم است چون «تأییدِ تازه» با «جابه‌جایی بینِ دو حالتِ منتشرشده»
     فرق دارد و اثرهای جانبی فقط مالِ اولی‌اند. */
  let prevStatus = '';
  if (decision) {
    try {
      const { data: prev } = await getSupabaseServer()
        .from('clubs').select('"verificationStatus"').eq('id', id).maybeSingle();
      prevStatus = String((prev as { verificationStatus?: string } | null)?.verificationStatus ?? '');
    } catch { prevStatus = ''; }
  }
  const wasPublished = prevStatus === 'verified' || prevStatus === 'approved';

  if (decision) {
    /* هر دو «تأیید» باشگاه را منتشر می‌کنند؛ تفاوتشان فقط تیکِ آبی است.
       `approved` یعنی کارت در فهرست دیده شود ولی چون مدرکی بررسی
       نشده، نشانِ تأیید نگیرد. */
    if (decision === 'verified' || decision === 'approved') {
      /* ── چرا شرطی ──
         جابه‌جایی بینِ `verified` و `approved` فقط تیک را عوض می‌کند.
         بی‌قیدْ `isActive = true` گذاشتن یعنی برداشتنِ تیک از باشگاهی
         که ادمین قبلاً غیرفعالش کرده بود، بی‌صدا دوباره منتشرش
         می‌کرد. */
      if (!wasPublished) {
        body.isActive = true;
        body.rejectionReason = null;    // رد قبلی دیگر معتبر نیست
      }
    } else if (decision === 'rejected') {
      body.isActive = false;
      /* علت رد اجباری است: بدون آن مالک فقط می‌بیند «رد شد» و
         نمی‌داند چه چیزی را باید اصلاح کند. */
      const reason = String(body.rejectionReason ?? '').trim();
      if (!reason) {
        return NextResponse.json(
          { message: 'برای رد کردن، علت را بنویسید' }, { status: 400, headers: CORS });
      }
      body.rejectionReason = reason.slice(0, 500);
    }
    /* «چه کسی و کِی بررسی کرد» مالِ خودِ بررسی است. عوض‌کردنِ تیکِ
       باشگاهی که قبلاً بررسی شده، بررسیِ تازه نیست و نباید ردِ آن
       بررسی را پاک کند. */
    const badgeOnly = wasPublished && (decision === 'verified' || decision === 'approved');
    if (!badgeOnly) {
      body.reviewedAt = new Date().toISOString();
      body.reviewedBy = userId;
    }
  }

  /* ارسال دوباره پس از اصلاح: مالک که باشگاه ردشده را ویرایش می‌کند،
     دوباره به صف بررسی می‌رود. بدون این، باشگاه ردشده تا ابد ردشده
     می‌ماند و راهی برای بازبینی وجود ندارد. */
  let resubmitted = false;
  if (!isAdmin) {
    const { data: cur } = await getSupabaseServer()
      .from('clubs').select('"verificationStatus","submissionCount"').eq('id', id).maybeSingle();
    const c = cur as { verificationStatus?: string; submissionCount?: number } | null;
    if (c?.verificationStatus === 'rejected') {
      body.verificationStatus = 'pending';
      body.rejectionReason = null;
      body.submissionCount = (c.submissionCount ?? 1) + 1;
      resubmitted = true;
    }
  }

  /* ── حسابِ تأییدشده پس از تأیید قفل است ──────────────────────────
     شبا و کارت و نام دارنده و نام بانک، خروجیِ استعلام‌اند نه ورودیِ
     کاربر. تا امروز فقط تغییر شبا تأیید را باطل می‌کرد و بقیه آزاد
     بودند: یعنی می‌شد شبای تأییدشده را نگه داشت و «نام صاحب حساب» را
     به هر چیزی عوض کرد، و کارت را هم همین‌طور. نتیجه‌اش حسابی بود که
     تیکِ «تأییدشده» داشت ولی نامش با آنچه استعلام گفته یکی نبود.

     حالا هر تغییر در این چهار فیلد تأیید را باطل می‌کند، مگر تغییری
     که خودِ مسیرِ استعلام انجام می‌دهد (آن مسیر مستقیم به دیتابیس
     می‌نویسد و از این‌جا رد نمی‌شود). */
  if (!isAdmin) {
    const { data: cur } = await getSupabaseServer()
      .from('clubs').select('iban,"bankCard","ibanOwnerName","bankName","ibanVerified"')
      .eq('id', id).maybeSingle();
    const before = (cur ?? {}) as Record<string, unknown>;

    if (before.ibanVerified) {
      const norm = (v: unknown) => String(v ?? '').replace(/[\s-]/g, '');
      const changed = (['iban', 'bankCard', 'ibanOwnerName', 'bankName'] as const)
        .filter(k => Object.prototype.hasOwnProperty.call(body, k) && norm(body[k]) !== norm(before[k]));

      if (changed.length > 0) {
        /* باطل‌کردن، نه رد کردن: کاربر حق دارد حسابش را عوض کند —
           فقط باید دوباره استعلام بگیرد. */
        body.ibanVerified = false;
        body.ibanOwnerName = null;
        body.bankCardVerified = false;
        console.info('[clubs/:id] تأیید حساب باطل شد — تغییر در:', changed.join(','));
      }
    }
  }

  /* ── وضعیتِ دعوتِ مربی، مالِ سرور است نه فرستنده ────────────────
     پنلِ باشگاه کلِ آرایه‌ی `coaches` را می‌فرستد، پس هر ذخیره می‌تواند
     پاسخِ مربی را بازنویسی کند. این‌جا وضعیتِ *هر* ردیف از نو تعیین
     می‌شود، نه فقط ردیف‌هایی که قبلاً بوده‌اند:

       • ردیفی که در دیتابیس هست  ⟵ `status`/`decidedAt`ِ همان‌جا
       • ردیفِ تازه               ⟵ همیشه `pending`

     ⚠️ شرطِ دوم امنیتی است، نه ظاهری: بدونش صاحبِ باشگاه می‌توانست
     مستقیماً `status: 'accepted'` بفرستد و مربی‌ای را که هیچ دعوتی
     نپذیرفته منتشر کند — و از راهِ `clubsOfCoach` حقِ امتیازدهی هم
     برایش بسازد. همان سوراخی که کلِ جریانِ دعوت برای بستنش ساخته شد.

     ⚠️ ردیفِ قدیمیِ بدونِ `status` یعنی «پذیرفته» (پیش از این جریان
     ساخته شده)؛ فرستنده نباید بتواند پایین‌ترش بیاورد.

     کلیدها هم سفیدلیست‌اند تا کلیدِ مرده‌ای مثل `rating` — امتیاز حالا
     از `profile_reviews` می‌آید — از راهِ فرستنده برنگردد. */
  if (Object.prototype.hasOwnProperty.call(body, 'coaches') && Array.isArray(body.coaches)) {
    const { data: curC, error: curErr } = await getSupabaseServer()
      .from('clubs').select('coaches').eq('id', id).maybeSingle();

    /* ستونِ بدونِ مهاجرت را پایین‌تر `OPTIONAL_COLUMNS` می‌بخشد؛ هر
       خطای دیگری یعنی نمی‌دانیم وضعیتِ فعلی چیست و نوشتنِ آرایه‌ی
       فرستنده دقیقاً همان چیزی است که این بلوک جلویش را می‌گیرد. */
    if (curErr && !/does not exist|PGRST204/i.test(`${curErr.message} ${curErr.code ?? ''}`)) {
      console.error('[clubs/:id] خواندنِ مربیانِ فعلی:', curErr.message);
      return NextResponse.json({ message: 'به‌روزرسانی باشگاه انجام نشد' }, { status: 500, headers: CORS });
    }

    const stored = Array.isArray((curC as { coaches?: unknown } | null)?.coaches)
      ? ((curC as { coaches: Record<string, unknown>[] }).coaches)
      : [];
    const byKey = new Map<string, Record<string, unknown>>();
    for (const e of stored) {
      if (!e || typeof e !== 'object') continue;
      if (e.id) byKey.set(String(e.id), e);
      if (e.slug) byKey.set(`s:${String(e.slug)}`, e);
    }

    const KEEP = ['id', 'slug', 'name', 'title', 'exp', 'bio'] as const;
    const STATUS = new Set(['pending', 'accepted', 'rejected']);

    body.coaches = (body.coaches as unknown[]).map(raw => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
      const e = raw as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of KEEP) if (k in e) out[k] = e[k];

      const old = byKey.get(String(e.id ?? '')) ?? byKey.get(`s:${String(e.slug ?? '')}`);
      if (old) {
        out.status = STATUS.has(String(old.status)) ? old.status : 'accepted';
        if ('decidedAt' in old) out.decidedAt = old.decidedAt;
      } else {
        out.status = 'pending';
      }
      return out;
    });
  }

  const doUpdate = (payload: Record<string, unknown>) => getSupabaseServer()
    .from('clubs').update(payload).eq('id', id).select().single();

  let { data: updated, error } = await doUpdate(body);

  /* ── ستونی که هنوز مهاجرتش اجرا نشده ─────────────────────────────
     دیپلوی و مهاجرت هم‌زمان نیستند: کدِ تازه ممکن است پیش از اجرای SQL
     روی سرور بنشیند. بدون این، *کلِ* ذخیره‌ی اطلاعات باشگاه با یک ستونِ
     نبوده می‌شکست — یعنی یک فیلدِ نو، فرمی را که تا امروز کار می‌کرده
     از کار می‌انداخت.

     فقط فیلدهای واقعاً اختیاری این‌طور کنار گذاشته می‌شوند؛ هر ستونِ
     ناشناخته‌ی دیگری همان خطای قبلی را می‌دهد تا بی‌صدا گم نشود. */
  const OPTIONAL_COLUMNS = [
    'postalCode', 'addressNote',
    /* مهاجرتِ ۰۶۵ — محتوای نمایشیِ باشگاه */
    'coaches', 'albums', 'clubStats',
    /* مهاجرتِ ۰۸۸ — ویدیوهای گالری (جدا از `videos`ِ معرفیِ باشگاه) */
    'galleryVideos',
  ];
  if (error && /does not exist|PGRST204/i.test(`${error.message} ${error.code ?? ''}`)) {
    const dropped = OPTIONAL_COLUMNS.filter(
      k => Object.prototype.hasOwnProperty.call(body, k) && error!.message.includes(k));
    if (dropped.length > 0) {
      console.error('[clubs/:id] ستون‌های بدونِ مهاجرت کنار گذاشته شدند:', dropped.join(','));
      const trimmed = { ...body } as Record<string, unknown>;
      for (const k of dropped) delete trimmed[k];
      ({ data: updated, error } = await doUpdate(trimmed));
    }
  }

  if (error) {
    console.error('[clubs/:id] update error:', error.message);
    return NextResponse.json({ message: 'به‌روزرسانی باشگاه انجام نشد' }, { status: 500, headers: CORS });
  }

  /* اعلان و رد ممیزی — بی‌صدا، چون شکست پیامک نباید تصمیم ادمین را
     برگرداند. تا امروز هیچ‌کدام از این دو وجود نداشت. */
  /* ── چرا `!wasPublished` ──
     «باشگاه شما تأیید شد» فقط یک‌بار معنا دارد. بدونِ این شرط، هر
     اعطای تیک به باشگاهی که ماه‌ها پیش منتشر شده بود دوباره همان
     پیامک را می‌فرستاد. */
  if (decision === 'verified' && !wasPublished) {
    void notifyClubApproved(id).catch(() => { /* بی‌صدا */ });
    void audit({
      actorId: userId, actorRole: 'admin', action: 'CLUB_APPROVED',
      entityType: 'club', entityId: id, ip: clientIp(req) ?? undefined,
    });
  } else if (wasPublished && (decision === 'verified' || decision === 'approved')
             && decision !== prevStatus) {
    /* فقط تیک عوض شد — نه انتشار، نه پیامک. ولی همچنان یک تصمیمِ
       ادمین است و باید ردش بماند. */
    void audit({
      actorId: userId, actorRole: 'admin', action: 'CLUB_BADGE_CHANGED',
      entityType: 'club', entityId: id,
      newValue: { from: prevStatus, to: decision }, ip: clientIp(req) ?? undefined,
    });
  } else if (decision === 'rejected') {
    void notifyClubRejected(id, String(body.rejectionReason ?? '')).catch(() => { /* بی‌صدا */ });
    void audit({
      actorId: userId, actorRole: 'admin', action: 'CLUB_REJECTED',
      entityType: 'club', entityId: id,
      newValue: { reason: body.rejectionReason }, ip: clientIp(req) ?? undefined,
    });
  } else if (resubmitted) {
    void audit({
      actorId: userId, actorRole: 'club_owner', action: 'CLUB_RESUBMITTED',
      entityType: 'club', entityId: id, ip: clientIp(req) ?? undefined,
    });
  }

  return NextResponse.json({ ...updated, resubmitted }, { headers: CORS });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = sessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  const userId = payload.id;
  const isAdmin = payload.role === 'admin';

  const { data: club } = await getSupabaseServer().from('clubs').select('ownerId').eq('id', id).single();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });

  if (!isAdmin && club.ownerId !== userId) {
    return NextResponse.json({ message: 'شما مجاز به حذف این باشگاه نیستید' }, { status: 403, headers: CORS });
  }

  const { error } = await getSupabaseServer().from('clubs').delete().eq('id', id);
  if (error) {
    console.error('[clubs/:id] delete error:', error.message);
    return NextResponse.json({ message: 'حذف باشگاه انجام نشد' }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ success: true }, { headers: CORS });
}
