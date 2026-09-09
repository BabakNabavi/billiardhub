export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, audit, clientIp } from '@/lib/finance/db';
import { publicDisplayName } from '@/lib/public-name';

/* جلسه‌ی مربی — درخواست، تأیید، لغو.

   ── دو طرف، یک مسیر ──
   شاگرد درخواست می‌دهد و مربی پاسخ. هر دو از همین مسیر می‌خوانند و
   هر کدام فقط ردیف‌های خودش را می‌بیند (`?role=coach` یا پیش‌فرض
   شاگرد). جدا کردنشان دو مسیر با یک منطق می‌شد.

   ── پرداخت ──
   ⚠️ نسخه‌ی اول پرداخت درون‌سایتی ندارد و مبلغ حضوری تسویه می‌شود.
   این عمدی است، نه فراموشی: وصل‌کردن درگاه یعنی کمیسیون، تسویه،
   استرداد و لغو — و هیچ‌کدامشان بدون سیاست روشن نباید حدس زده شود.
   ستون `payment_id` از حالا در جدول هست.

   ── چرا این جدول به امتیاز وصل است ──
   امتیاز مربی تا امروز با «رزرو میز در باشگاهی که مربی در آن ثبت
   شده» سنجیده می‌شد. با جلسه‌ی واقعی، نشانه دقیق می‌شود. */

const STATUS = new Set(['confirmed', 'rejected', 'cancelled']);

async function myCoachProfile(userId: string) {
  /* ⚠️ `maybeSingle` نبود: اگر کاربری دو ردیف مربی داشته باشد (مثلا
     پروفایل نمایشی که با شناسه‌ی ادمین ساخته می‌شود) PostgREST خطای
     «چند ردیف» می‌دهد و آن کاربر بی‌صدا دسترسی‌اش را از دست می‌دهد. */
  const { data, error } = await sb().from('profiles')
    .select('id,slug,session_price,session_min')
    .eq('kind', 'coach').eq('owner_id', userId)
    .order('created_at', { ascending: true }).limit(1);
  if (error) console.error('[coach-sessions] profile:', error.message);
  const rows = (data ?? []) as { id: string; slug: string | null; session_price: number; session_min: number }[];
  return rows[0] ?? null;
}

interface Row {
  id: string; coach_id: string; user_id: string; club_id: string | null;
  starts_at: string; duration_min: number; price: number; note: string | null;
  status: string;
}

/* GET ?role=coach|student — جلسه‌های من */
export async function GET(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const asCoach = req.nextUrl.searchParams.get('role') === 'coach';
  let q = sb().from('coach_sessions')
    .select('id,coach_id,user_id,club_id,starts_at,duration_min,price,note,status')
    .order('starts_at', { ascending: false }).limit(100);

  if (asCoach) {
    const p = await myCoachProfile(actor.id);
    if (!p) return NextResponse.json({ sessions: [] });
    q = q.eq('coach_id', p.id);
  } else {
    q = q.eq('user_id', actor.id);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[coach-sessions] list:', error.message);
    return NextResponse.json({ message: 'خواندن جلسه‌ها انجام نشد' }, { status: 500 });
  }
  const rows = (data ?? []) as Row[];

  /* نام طرف مقابل — شاگرد برای مربی، مربی برای شاگرد */
  const names = new Map<string, string>();
  const ids = [...new Set(rows.map(r => (asCoach ? r.user_id : r.coach_id)))];
  if (ids.length && asCoach) {
    const { data: us } = await sb().from('users')
      .select('id,"firstName","lastName","primaryRole","secondaryRoles"').in('id', ids);
    type U = { id: string; firstName?: string; lastName?: string; primaryRole?: string; secondaryRoles?: string[] };
    for (const u of (us ?? []) as U[]) names.set(u.id, publicDisplayName(u, 'کاربر بیلیارد هاب'));
  } else if (ids.length) {
    const { data: ps } = await sb().from('profiles').select('id,slug,data').in('id', ids);
    for (const p of (ps ?? []) as { id: string; slug: string; data: Record<string, unknown> }[]) {
      const d = p.data ?? {};
      names.set(p.id, `${String(d.firstNameFa ?? '')} ${String(d.lastNameFa ?? '')}`.trim() || p.slug);
    }
  }

  return NextResponse.json({
    sessions: rows.map(r => ({
      id: r.id,
      who: names.get(asCoach ? r.user_id : r.coach_id) ?? '—',
      clubId: r.club_id,
      startsAt: r.starts_at,
      durationMin: r.duration_min,
      price: r.price,
      note: r.note,
      status: r.status,
      /* گذشتن زمان را سرور می‌گوید؛ ساعت مرورگر قابل اعتماد نیست */
      past: new Date(r.starts_at).getTime() < Date.now(),
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* POST { coachSlug, startsAt, clubId?, note? } — درخواست جلسه */
export async function POST(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });

  const slug = String(b.coachSlug ?? '').trim();
  if (!slug) return NextResponse.json({ message: 'مربی مشخص نیست' }, { status: 400 });

  const { data: cp } = await sb().from('profiles')
    .select('id,owner_id,status,session_price,session_min,is_demo')
    .eq('kind', 'coach').eq('slug', slug).maybeSingle();
  const coach = cp as { id: string; owner_id: string; status: string; session_price: number; session_min: number; is_demo?: boolean } | null;
  if (!coach || coach.status !== 'approved' || coach.is_demo) {
    /* پروفایل نمایشی صاحبی ندارد که پاسخ بدهد */
    return NextResponse.json({ message: 'مربی یافت نشد' }, { status: 404 });
  }
  if (coach.owner_id === actor.id) {
    return NextResponse.json({ message: 'برای خودتان نمی‌توانید جلسه بگیرید' }, { status: 403 });
  }

  const startsAt = new Date(String(b.startsAt ?? ''));
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ message: 'زمان جلسه نامعتبر است' }, { status: 400 });
  }
  /* ⚠️ زمان گذشته را سرور رد می‌کند، نه فقط فرم: ساعت مرورگر
     دست‌کاری‌شدنی است و درخواست دستی هم می‌رسد. */
  if (startsAt.getTime() < Date.now() + 30 * 60 * 1000) {
    return NextResponse.json({ message: 'زمان جلسه باید دست‌کم نیم‌ساعت بعد باشد' }, { status: 400 });
  }

  /* ⚠️ `clubId` هنوز هیچ‌جا استفاده نمی‌شود و بدون اعتبارسنجی مستقیم
     به یک کلید خارجی می‌رفت: یک uuid ناشناخته خطای ۵۰۰ می‌داد.
     تا وقتی رابط جایی برایش ندارد، نوشته نمی‌شود. */
  const clubId = null;
  const note = String(b.note ?? '').trim().slice(0, 500) || null;

  /* سقف درخواست باز — ایندکس یکتا فقط ساعت تکراری را می‌گیرد، پس
     بدون این می‌شد صندوق مربی را با ده‌ها ساعت متفاوت پر کرد. */
  const open = await sb().from('coach_sessions').select('id', { count: 'exact', head: true })
    .eq('coach_id', coach.id).eq('user_id', actor.id).eq('status', 'requested');
  if ((open.count ?? 0) >= 3) {
    return NextResponse.json({ message: 'سه درخواست بی‌پاسخ دارید؛ اول تعیین تکلیف شوند' }, { status: 429 });
  }

  const { data, error } = await sb().from('coach_sessions').insert({
    coach_id: coach.id, user_id: actor.id, club_id: clubId,
    starts_at: startsAt.toISOString(),
    duration_min: coach.session_min || 60,
    /* مبلغ از پروفایل مربی برداشته می‌شود، نه از بدنه‌ی درخواست —
       همان قاعده‌ی طلایی مسابقات. */
    price: coach.session_price || 0,
    note,
  }).select('id').single();

  if (error) {
    /* ایندکس یکتا: همین شاگرد برای همین ساعت درخواست باز دارد */
    if (/duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ message: 'برای همین ساعت درخواست باز دارید' }, { status: 409 });
    }
    console.error('[coach-sessions] insert:', error.message);
    return NextResponse.json({ message: 'ثبت درخواست انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'COACH_SESSION_REQUESTED',
    entityType: 'coach', entityId: coach.id, newValue: { startsAt: startsAt.toISOString() },
    ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 });
}

/* PATCH { id, status } — پاسخ مربی، یا لغو شاگرد */
export async function PATCH(req: NextRequest) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const b = await req.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  const id = String(b?.id ?? '');
  const status = String(b?.status ?? '');
  if (!id || !STATUS.has(status)) {
    return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
  }

  const { data: row } = await sb().from('coach_sessions')
    .select('id,coach_id,user_id,status,starts_at').eq('id', id).maybeSingle();
  const s = row as { id: string; coach_id: string; user_id: string; status: string; starts_at: string } | null;
  if (!s) return NextResponse.json({ message: 'جلسه یافت نشد' }, { status: 404 });

  /* ── ⚠️ جلسه‌ای که شروع شده دیگر عوض نمی‌شود ──
     بازبینی دو سوءاستفاده را نشان داد و هر دو با همین یک قاعده بسته
     می‌شوند:

     • تأیید جلسه‌ای که زمانش گذشته = ساختن اجازه‌ی امتیاز از هوا.
     • لغو جلسه‌ی تأییدشده‌ی گذشته = پس‌گرفتن اجازه‌ی امتیاز، دقیقا
       وقتی مربی بوی نظر بد را می‌شنود.

     یعنی همان چیزی که توضیح مهاجرت ادعا می‌کرد جلویش را گرفته، تا
     امروز باز بود. */
  if (new Date(s.starts_at).getTime() <= Date.now()) {
    return NextResponse.json({ message: 'زمان این جلسه گذشته و دیگر قابل تغییر نیست' }, { status: 409 });
  }

  const p = await myCoachProfile(actor.id);
  const isCoach = !!p && p.id === s.coach_id;
  const isStudent = s.user_id === actor.id;
  if (!isCoach && !isStudent) return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });

  /* ── چه کسی چه کاری می‌تواند ──
     تأیید و رد کار مربی است؛ لغو کار هر دو. شاگرد نباید بتواند
     جلسه‌ی خودش را «تأییدشده» کند — همان چیزی که مبنای امتیاز است. */
  if ((status === 'confirmed' || status === 'rejected') && !isCoach) {
    return NextResponse.json({ message: 'تأیید یا رد جلسه با مربی است' }, { status: 403 });
  }
  /* پاسخ فقط به درخواست باز داده می‌شود؛ ردیف ردشده یا لغوشده
     دوباره «تأییدشده» نمی‌شود. */
  if ((status === 'confirmed' || status === 'rejected') && s.status !== 'requested') {
    return NextResponse.json({ message: 'این جلسه قبلا تعیین تکلیف شده' }, { status: 409 });
  }

  /* ⚠️ شرط وضعیت داخل خود UPDATE هم می‌آید: بین خواندن و نوشتن،
     طرف مقابل ممکن است همان ردیف را عوض کرده باشد. */
  const guard = status === 'cancelled' ? ['requested', 'confirmed'] : ['requested'];
  const { data: done, error } = await sb().from('coach_sessions')
    .update({
      status,
      ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : { decided_at: new Date().toISOString() }),
    })
    .eq('id', id).in('status', guard).select('id');
  if (!error && (done ?? []).length === 0) {
    return NextResponse.json({ message: 'وضعیت این جلسه هم‌زمان عوض شد؛ صفحه را تازه کنید' }, { status: 409 });
  }
  if (error) {
    console.error('[coach-sessions] update:', error.message);
    return NextResponse.json({ message: 'ثبت پاسخ انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: `COACH_SESSION_${status.toUpperCase()}`,
    entityType: 'coach', entityId: s.coach_id, newValue: { sessionId: id }, ip: clientIp(req) ?? undefined,
  });
  return NextResponse.json({ ok: true, status });
}
