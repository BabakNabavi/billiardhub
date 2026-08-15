export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { normalizeStory } from '@/lib/story-input';
import { storyIndex, StoryIndexError, type StoredStory } from '@/lib/story-index';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* فهرست در `lib/story-index` است — همان پیاده‌سازی که مسیرِ فروشگاه
   هم می‌خواند. آن‌جا خطای نوشتن و خطای خواندن جدی گرفته می‌شوند:
   نوشتنِ ناموفق دیگر ۲۰۱ نمی‌دهد، و خطای خواندن با «فهرست خالی» یکی
   گرفته نمی‌شود (که یک‌بار می‌توانست ده استوریِ زنده را پاک کند). */
const idx = (id: string) => storyIndex('club-media', 'clubs', id);

const isActive = (s: StoredStory, now: number) =>
  !!s.expiresAt && new Date(String(s.expiresAt)).getTime() > now;

const failed = (e: unknown, fallback: string) =>
  NextResponse.json(
    { message: e instanceof StoryIndexError ? e.message : fallback },
    { status: 500, headers: CORS },
  );

/* ── چرا رکوردِ باشگاه هم به‌روز می‌شود ─────────────────────────────────
   خودِ استوری‌ها در همین فایلِ ذخیره‌سازی می‌مانند، ولی صفحه‌ی اول و
   کارتِ باشگاه و صفحه‌ی باشگاه هیچ‌کدام این فایل را نمی‌خوانند: آن‌ها
   `club.hasActiveStory` و `club.storyMediaUrl` را از جدولِ `clubs`
   می‌خوانند. تا امروز هیچ‌چیز آن ستون‌ها را نمی‌نوشت (اصلاً وجود
   نداشتند) پس استوریِ باشگاه ذخیره می‌شد و هیچ‌جا دیده نمی‌شد.

   تازه‌ترین استوریِ فعال روی رکورد می‌نشیند؛ نبودنش یعنی پاک‌کردنِ
   ستون‌ها. بی‌صداست: اگر مهاجرتِ ۰۶۴ هنوز اجرا نشده باشد، نباید انتشارِ
   استوری شکست بخورد. */
async function syncClubRow(id: string, active: any[]): Promise<void> {
  const latest = [...active].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())[0];
  try {
    await getSupabaseServer().from('clubs').update(
      latest
        ? {
          storyMediaUrl: latest.mediaUrl ?? null,
          storyType: latest.mediaType ?? 'image',
          storyText: latest.text ?? null,
          storyExpiresAt: latest.expiresAt ?? null,
        }
        : { storyMediaUrl: null, storyType: null, storyText: null, storyExpiresAt: null },
    ).eq('id', id);
  } catch (e) {
    console.error('[clubs/:id/stories] sync failed:', e);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = idx(id);
  let all: StoredStory[];
  try { all = await store.read(); } catch { return NextResponse.json([], { headers: CORS }); }
  const now = Date.now();
  const active = all.filter(s => isActive(s, now));

  /* `?sync=1` — تعمیرِ رکورد از روی فایل. فقط پنلِ باشگاه‌دار آن را
     می‌فرستد؛ نوارِ استوریِ صفحه‌ی اول نه، وگرنه هر بارگذاریِ صفحه‌ی
     اول یک UPDATE بی‌فایده به دیتابیس می‌زد.

     این همان چیزی است که استوریِ ثبت‌شده‌ی پیش از مهاجرتِ ۰۶۴ را هم
     نجات می‌دهد: کافی است باشگاه‌دار یک‌بار تبِ گالری را باز کند. */
  const wantsSync = req.nextUrl.searchParams.get('sync') === '1';
  if (active.length !== all.length) {
    /* منقضی‌شده‌ها فقط از فهرست بیرون نروند — فایلشان هم برود.
       پاک‌سازی *بعد از* نوشتنِ موفق، وگرنه فایلی می‌رود که هنوز در
       فهرست است. */
    const gone = all.filter(s => !isActive(s, now));
    void store.write(active).then(() => store.purge(gone)).catch(() => { });
  }
  if (wantsSync || active.length !== all.length) {
    void syncClubRow(id, active);
  }
  return NextResponse.json(active, { headers: CORS });
}

/* خواندن عمومی است (استوری باشگاه محتوای عمومی است) ولی نوشتن و حذف
   فقط برای مالک همان باشگاه یا ادمین. پیش‌تر هیچ گاردی نبود و هر کسی
   با داشتن شناسه‌ی عمومی باشگاه می‌توانست استوری منتشر یا پاک کند. */
async function guardOwner(req: NextRequest, clubId: string) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS });
  if (!(await ownsClub(actor, clubId))) return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS });
  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await guardOwner(req, id);
  if (denied) return denied;

  /* همان قاعده‌ی فروشگاه: انقضا از سرور، نه از بدنه‌ی درخواست.
     این‌جا مهم‌تر هم هست چون `syncClubRow` همان تاریخ را داخلِ ستونِ
     `storyExpiresAt` می‌نویسد و حلقه‌ی کارتِ باشگاه از آن می‌آید. */
  const story = normalizeStory(await req.json().catch(() => null));
  if (!story) return NextResponse.json({ message: 'رسانه‌ی استوری معتبر نیست' }, { status: 400, headers: CORS });

  const store = idx(id);
  try {
    const current = await store.read();
    const now = Date.now();
    const active = current.filter(s => isActive(s, now));
    if (active.length >= 10)
      return NextResponse.json({ message: 'حداکثر ۱۰ استوری مجاز است' }, { status: 400, headers: CORS });
    const updated = [...active, story];
    await store.write(updated);
    await syncClubRow(id, updated);
  } catch (e) {
    return failed(e, 'ذخیره‌ی استوری انجام نشد');
  }
  return NextResponse.json(story, { status: 201, headers: CORS });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await guardOwner(req, id);
  if (denied) return denied;

  const storyId = req.nextUrl.searchParams.get('storyId');
  if (!storyId) return NextResponse.json({ message: 'شناسه‌ی استوری لازم است' }, { status: 400, headers: CORS });

  const store = idx(id);
  try {
    const current = await store.read();
    const now = Date.now();
    /* «پیدا نشد» یعنی ۴۰۴، نه ok — وگرنه پنل حذفِ محلی را نگه می‌دارد
       و استوری با رفرشِ بعدی برمی‌گردد. */
    if (!current.some(s => s.id === storyId))
      return NextResponse.json({ message: 'استوری پیدا نشد' }, { status: 404, headers: CORS });

    const updated = current.filter(s => s.id !== storyId && isActive(s, now));
    await store.write(updated);
    await syncClubRow(id, updated);
    /* هرچه از فهرست افتاد — چه حذفِ دستی چه انقضا — فایلش هم می‌رود */
    const keep = new Set(updated.map(s => s?.id));
    void store.purge(current.filter(s => !keep.has(s?.id)));
  } catch (e) {
    return failed(e, 'حذفِ استوری انجام نشد');
  }
  return NextResponse.json({ ok: true }, { headers: CORS });
}
