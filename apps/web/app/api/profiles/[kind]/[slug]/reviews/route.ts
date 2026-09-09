export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, isAdmin, audit, clientIp } from '@/lib/finance/db';
import { publicDisplayName } from '@/lib/public-name';

/* امتیاز و نظر پروفایل — فعلا مربی.

   ── چرا این مسیر ساخته شد ──
   کارت مربی یک فیلد «امتیاز» داشت که خود باشگاه‌دار تایپ می‌کرد.
   عددی که صاحب کسب‌وکار درباره‌ی خودش می‌نویسد امتیاز نیست.

   ── ضد تقلب، سه لایه ──
   ۱) هر کاربر فقط یک نظر برای هر پروفایل (UNIQUE در دیتابیس)
   ۲) نظر‌دهنده باید در باشگاهی که این مربی در آن ثبت شده، رزرو قطعی
      داشته باشد — یعنی پولی پرداخت کرده باشد
   ۳) صاحب پروفایل به خودش امتیاز نمی‌دهد

   ⚠️ دو چیزی که این تضمین *نمی‌کند* و باید صریح نوشته شود:

   • اینکه نظر‌دهنده سر کلاس آن مربی رفته باشد. رزرو جلسه‌ی مربی در
     سیستم وجود ندارد؛ تا آن روز نزدیک‌ترین نشانه رزرو در همان باشگاه
     است.
   • فهرست مربیان باشگاه را خود باشگاه‌دار می‌نویسد و مربی تأییدش
     نمی‌کند. یعنی باشگاه‌دار می‌تواند نام مربی دیگری را اضافه کند و
     مشتری‌هایش را در دسترس امتیازدادن به او بگذارد. بستن کاملش
     «تأیید مربی» می‌خواهد که هنوز ساخته نشده.

   میانگین در `profiles.rating_avg` با تریگر نگه داشته می‌شود
   (مهاجرت ۰۸۹)، پس این مسیر خودش چیزی محاسبه نمی‌کند. */

/* ⚠️ فقط مربی. بازبینی درست گرفت: `profiles` روی (نوع، نامک) یکتاست،
   پس پروفایل مربی و داور یک نفر معمولا *یک نامک* دارند. با فهرست
   باز، درخواستی به `/api/profiles/referee/<همان نامک>/reviews` از
   گارد «مربی این باشگاه» رد می‌شد و امتیاز روی پروفایل داور
   می‌نشست. هر نقش تازه باید قاعده‌ی نسبت خودش را داشته باشد. */
const KINDS = new Set(['coach']);

interface ClubCoachRow { id: string; coaches: unknown }

/** باشگاه‌هایی که این مربی در آن‌ها ثبت شده */
async function clubsOfCoach(profileId: string, slug: string): Promise<string[]> {
  /* ⚠️ فیلتر سمت دیتابیس روی jsonb با PostgREST این‌جا شکننده است
     (ساختار `coaches` دو شکل قدیمی و تازه دارد: بعضی ردیف‌ها فقط
     `id` دارند و بعضی `slug`). تعداد باشگاه‌ها کوچک است، پس همان‌جا
     در حافظه فیلتر می‌شود — و اگر روزی بزرگ شد، این‌جا جای ایندکس
     GIN است. */
  const { data, error } = await sb().from('clubs').select('id,coaches');
  if (error) { console.error('[profile_reviews] clubs:', error.message); return [] }
  const rows = (data ?? []) as ClubCoachRow[];
  const out: string[] = [];
  for (const r of rows) {
    const list = Array.isArray(r.coaches) ? r.coaches as { id?: unknown; slug?: unknown; status?: unknown }[] : [];
    /* ⚠️ فقط دعوت پذیرفته‌شده. وگرنه باشگاه‌دار می‌توانست نام مربی
       دیگری را اضافه کند و مشتری‌هایش را در دسترس امتیازدادن به او
       بگذارد — همان سوراخی که بازبینی گرفت. نبود `status` یعنی
       ردیف قدیمی ⇒ پذیرفته. */
    const ok = (c: { status?: unknown }) => (typeof c.status === 'string' ? c.status : 'accepted') === 'accepted';
    if (list.some(c => c && ok(c) && (String(c.slug ?? '') === slug || String(c.id ?? '') === profileId))) out.push(r.id);
  }
  return out;
}

/** آیا این کاربر با این مربی نسبت واقعی دارد؟ */
async function canReview(userId: string, profileId: string, slug: string): Promise<boolean> {
  /* ── نشانه‌ی درجه‌یک: جلسه‌ی واقعی ──
     جلسه‌ای که خود مربی تأیید کرده و زمانش گذشته. دقیق‌ترین چیزی که
     سیستم می‌داند.

     ⚠️ چرا «تأییدشده + گذشته» و نه «مربی گفت برگزار شد»: اگر
     پایان جلسه دست مربی باشد، جلسه‌ی شاگرد ناراضی را نیمه‌کاره نگه
     می‌دارد و امتیازش را می‌بندد. تأیید در ابتدا لازم است و بعدش
     گذر زمان کار خودش را می‌کند. */
  /* ⚠️ «شروع شده» کافی نیست، «تمام شده» لازم است: نظر پیش از پایان
     جلسه معنایی ندارد. سقف چهار ساعت هم گذاشته می‌شود تا محاسبه به
     `duration_min` وابسته نباشد. */
  const past = await sb().from('coach_sessions').select('id', { count: 'exact', head: true })
    .eq('coach_id', profileId).eq('user_id', userId).eq('status', 'confirmed')
    .lt('starts_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString());
  if (past.error) console.error('[profile_reviews] sessions:', past.error.message);
  if ((past.count ?? 0) > 0) return true;

  /* ── نشانه‌ی درجه‌دو: رزرو میز در باشگاهی که مربی *پذیرفته* ──
     تا وقتی جلسه‌ی مربی تازه است و کسی سابقه‌ای ندارد، این تنها راه
     موجود است. عضویت باشگاه عمدا حساب نمی‌شود: خودسرویس است و هر
     حساب تازه می‌تواند عضو شود، پس هزینه‌ی نظر جعلی صفر می‌شد.
     رزرو دست‌کم پشتش پرداخت دارد. */
  const clubIds = await clubsOfCoach(profileId, slug);
  if (!clubIds.length) return false;
  const booked = await sb().from('bookings').select('id', { count: 'exact', head: true })
    .eq('userId', userId).in('clubId', clubIds).eq('status', 'confirmed');
  if (booked.error) { console.error('[profile_reviews] bookings:', booked.error.message); return false }
  return (booked.count ?? 0) > 0;
}

async function profileOf(kind: string, slug: string) {
  const { data, error } = await sb().from('profiles')
    .select('id,owner_id,status,rating_avg,rating_count')
    .eq('kind', kind).eq('slug', slug).maybeSingle();
  if (error) console.error('[profile_reviews] profile:', error.message);
  return data as { id: string; owner_id: string; status: string; rating_avg: number; rating_count: number } | null;
}

/* ⚠️ پروفایل تأییدنشده نباید امتیاز بگیرد و نباید وجودش لو برود —
   همان کاری که مسیر عمومی پروفایل می‌کند. */
const publicOrOwn = (p: { status: string; owner_id: string }, actorId: string | null) =>
  p.status === 'approved' || (!!actorId && actorId === p.owner_id);

/* GET — نظرهای عمومی یک پروفایل + وضعیت خود بیننده */
export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await ctx.params;
  if (!KINDS.has(kind)) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const actorEarly = await actorOf(req);
  const p = await profileOf(kind, slug);
  if (!p || !publicOrOwn(p, actorEarly?.id ?? null)) {
    return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });
  }

  const { data, error: listErr } = await sb().from('profile_reviews')
    .select('id,user_id,rating,comment,created_at,updated_at')
    .eq('profile_id', p.id).eq('is_hidden', false)
    .order('created_at', { ascending: false }).limit(200);
  if (listErr) {
    console.error('[profile_reviews] list:', listErr.message);
    return NextResponse.json({ message: 'خواندن نظرها انجام نشد' }, { status: 500 });
  }
  const rows = (data ?? []) as { id: string; user_id: string; rating: number; comment: string | null; created_at: string; updated_at: string }[];

  const actor = actorEarly;
  const mine = actor ? rows.find(r => r.user_id === actor.id) ?? null : null;

  /* نام نویسنده لازم است ولی شماره و ایمیلش نه — همان قاعده‌ی
     نظرهای باشگاه، با همان تابع مشترک. */
  const ids = [...new Set(rows.map(r => r.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: us } = await sb().from('users')
      .select('id,"firstName","lastName","primaryRole","secondaryRoles"').in('id', ids);
    type U = { id: string; firstName?: string; lastName?: string; primaryRole?: string; secondaryRoles?: string[] };
    for (const u of (us ?? []) as U[]) names.set(u.id, publicDisplayName(u, 'کاربر بیلیارد هاب'));
  }

  /* توزیع ستاره‌ها — «۴.۲ از ۵» بدون توزیع گمراه‌کننده است */
  const breakdown: Record<string, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) breakdown[String(r.rating)] = (breakdown[String(r.rating)] ?? 0) + 1;

  /* ⚠️ شکل پاسخ عمدا *دقیقا* همان مسیر نظرهای باشگاه است، تا هر
     دو یک کامپوننت را تغذیه کنند. شکل متفاوت یعنی کامپوننت دوم، و
     کامپوننت دوم یعنی روزی یکی درست شود و آن یکی نه. */
  return NextResponse.json({
    summary: {
      avg: Number(p.rating_avg ?? 0),
      count: p.rating_count ?? 0,
      breakdown,
    },
    /* اجازه‌ی نظر دادن، تا رابط دکمه‌ی بی‌فایده نشان ندهد */
    canReview: actor && !mine && actor.id !== p.owner_id ? await canReview(actor.id, p.id, slug) : false,
    isOwner: !!actor && actor.id === p.owner_id,
    myReview: mine ? { id: mine.id, rating: mine.rating, comment: mine.comment } : null,
    reviews: rows.map(r => ({
      id: r.id,
      author: names.get(r.user_id) ?? 'کاربر بیلیارد هاب',
      isMine: !!actor && r.user_id === actor.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      edited: r.updated_at !== r.created_at,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* POST { rating, comment } — ثبت یا ویرایش نظر خودم */
export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await ctx.params;
  if (!KINDS.has(kind)) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const p = await profileOf(kind, slug);
  if (!p || !publicOrOwn(p, actor.id)) {
    return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });
  }

  /* لایه‌ی ۳ */
  if (p.owner_id === actor.id) {
    return NextResponse.json({ message: 'به پروفایل خودتان نمی‌توانید امتیاز بدهید' }, { status: 403 });
  }

  /* لایه‌ی ۲ */
  if (!(await canReview(actor.id, p.id, slug))) {
    return NextResponse.json({
      message: 'برای ثبت نظر باید جلسه‌ای با این مربی داشته باشید که برگزار شده، یا در باشگاه او رزرو قطعی داشته باشید',
      code: 'no_relation',
    }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const rating = Math.round(Number(b?.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ message: 'امتیاز باید بین ۱ تا ۵ باشد' }, { status: 400 });
  }
  const comment = String(b?.comment ?? '').trim().slice(0, 1000) || null;

  /* لایه‌ی ۱ — UNIQUE؛ ارسال دوباره یعنی ویرایش، نه نظر تازه */
  const { data, error } = await sb().from('profile_reviews')
    /* ⚠️ `updated_at` فرستاده نمی‌شود: با فرستادنش، همان لحظه‌ی
       *ساخت* هم با `created_at` فرق می‌کرد و نشان «ویرایش‌شده» روی
       هر نظر نو می‌نشست. تریگر دیتابیس (مهاجرت ۰۹۰) نگهش می‌دارد. */
    .upsert({ profile_id: p.id, user_id: actor.id, rating, comment },
      { onConflict: 'profile_id,user_id' })
    .select('id').single();

  if (error) {
    console.error('[profile_reviews] upsert:', error.message);
    return NextResponse.json({ message: 'ثبت نظر انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PROFILE_REVIEWED',
    entityType: kind, entityId: p.id, newValue: { rating }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 });
}

/* DELETE — برداشتن نظر خودم */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await ctx.params;
  if (!KINDS.has(kind)) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const p = await profileOf(kind, slug);
  if (!p) return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });

  /* ── حذف ادمین ──
     مسیر نظرهای باشگاه این را دارد و این‌جا نداشت: نظر توهین‌آمیز
     روی پروفایل مربی فقط با psql پاک می‌شد. با `?reviewId=` ادمین
     هر نظری را برمی‌دارد؛ بدونش هرکس فقط نظر خودش را. */
  const reviewId = req.nextUrl.searchParams.get('reviewId');
  if (reviewId) {
    if (!(await isAdmin(actor.id))) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    const { error } = await sb().from('profile_reviews')
      .delete().eq('id', reviewId).eq('profile_id', p.id);
    if (error) return NextResponse.json({ message: 'حذف نظر انجام نشد' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await sb().from('profile_reviews')
    .delete().eq('profile_id', p.id).eq('user_id', actor.id);
  if (error) {
    console.error('[profile_reviews] delete:', error.message);
    return NextResponse.json({ message: 'حذف نظر انجام نشد' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
