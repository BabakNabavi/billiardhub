export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership';
import { sb, isAdmin, audit, clientIp } from '@/lib/finance/db';

/* امتیاز و نظرِ باشگاه.

   ── ضدِ تقلب، سه لایه ──
   ۱) هر کاربر فقط یک نظر برای هر باشگاه (UNIQUE در دیتابیس)
   ۲) فقط کسی که واقعاً در آن باشگاه رزروِ قطعی داشته
   ۳) مالکِ باشگاه به باشگاهِ خودش امتیاز نمی‌دهد

   لایه‌ی دوم مهم‌ترین است: بدونِ آن هر حسابِ تازه‌ساخته می‌تواند به
   رقیب یک‌ستاره بدهد. با آن، هر نظرِ جعلی به یک رزروِ پرداخت‌شده نیاز
   دارد — که هزینه‌ی تقلب را از صفر به مبلغِ واقعیِ رزرو می‌برد.

   میانگین در `clubs.ratingAvg` با تریگر نگه داشته می‌شود، پس این مسیر
   خودش چیزی محاسبه نمی‌کند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** آیا این کاربر واقعاً در این باشگاه رزروِ قطعی داشته؟ */
async function hasStayed(userId: string, clubId: string): Promise<boolean> {
  const { count } = await sb().from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('userId', userId).eq('clubId', clubId).eq('status', 'confirmed');
  return (count ?? 0) > 0;
}

/* GET — نظرهای عمومیِ یک باشگاه */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const { data, error } = await sb().from('club_reviews')
    .select('id,user_id,rating,comment,created_at,updated_at')
    .eq('club_id', id).eq('is_hidden', false)
    .order('created_at', { ascending: false }).limit(100);

  if (error) return NextResponse.json({ reviews: [], summary: { avg: 0, count: 0, breakdown: {} } });

  const rows = (data ?? []) as {
    id: string; user_id: string; rating: number; comment: string | null;
    created_at: string; updated_at: string;
  }[];

  /* نامِ نویسنده لازم است ولی شماره و ایمیلش نه — فقط نامِ کوتاه */
  const ids = [...new Set(rows.map(r => r.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: us } = await sb().from('users').select('id,"firstName","lastName"').in('id', ids);
    for (const u of (us ?? []) as { id: string; firstName?: string; lastName?: string }[]) {
      const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
      names.set(u.id, full || 'کاربر بیلیارد هاب');
    }
  }

  /* توزیعِ ستاره‌ها — «۴.۲ از ۵» بدونِ توزیع، گمراه‌کننده است */
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;

  const actor = await actorOf(req);
  const mine = actor ? rows.find(r => r.user_id === actor.id) ?? null : null;

  return NextResponse.json({
    reviews: rows.map(r => ({
      id: r.id,
      author: names.get(r.user_id) ?? 'کاربر',
      isMine: !!actor && r.user_id === actor.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      edited: r.updated_at !== r.created_at,
    })),
    summary: {
      avg: rows.length ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 100) / 100 : 0,
      count: rows.length,
      breakdown,
    },
    /* آیا کاربرِ فعلی می‌تواند نظر بدهد — تا UI دکمه‌ی بی‌فایده نشان ندهد */
    canReview: actor ? (mine ? false : await hasStayed(actor.id, id)) : false,
    myReview: mine ? { id: mine.id, rating: mine.rating, comment: mine.comment } : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* POST { rating, comment } — ثبت یا ویرایشِ نظرِ خودم */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const { data: club } = await sb().from('clubs').select('id,"ownerId"').eq('id', id).maybeSingle();
  const c = club as { id: string; ownerId: string } | null;
  if (!c) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });

  /* لایه‌ی ۳ */
  if (c.ownerId === actor.id) {
    return NextResponse.json({ message: 'به باشگاهِ خودتان نمی‌توانید امتیاز بدهید' }, { status: 403 });
  }

  /* لایه‌ی ۲ */
  if (!(await hasStayed(actor.id, id))) {
    return NextResponse.json({
      message: 'برای ثبتِ نظر باید حداقل یک رزروِ قطعی در این باشگاه داشته باشید',
      code: 'no_booking',
    }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const rating = Math.round(Number(b?.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ message: 'امتیاز باید بین ۱ تا ۵ باشد' }, { status: 400 });
  }
  const comment = String(b?.comment ?? '').trim().slice(0, 1000) || null;

  /* لایه‌ی ۱ — UNIQUE؛ ارسالِ دوباره یعنی ویرایش، نه نظرِ جدید */
  const { data, error } = await sb().from('club_reviews')
    .upsert({
      club_id: id, user_id: actor.id, rating, comment,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'club_id,user_id' })
    .select('id').single();

  if (error) {
    console.error('[club_reviews] upsert:', error.message);
    return NextResponse.json({ message: 'ثبتِ نظر انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'CLUB_REVIEWED',
    entityType: 'club', entityId: id, newValue: { rating }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 });
}

/* DELETE — حذفِ نظرِ خودم (یا هر نظری، توسطِ ادمین) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ message: 'شناسه معتبر نیست' }, { status: 400 });

  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 });

  const target = req.nextUrl.searchParams.get('reviewId');
  const admin = await isAdmin(actor.id);

  let q = sb().from('club_reviews').delete().eq('club_id', id);
  if (admin && target && UUID.test(target)) q = q.eq('id', target);
  else q = q.eq('user_id', actor.id);      // غیرادمین فقط نظرِ خودش

  const { error } = await q;
  if (error) return NextResponse.json({ message: 'حذف انجام نشد' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
