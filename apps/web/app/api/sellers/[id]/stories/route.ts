export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorOf, ownsSeller, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';
import { normalizeStory } from '@/lib/story-input';
import { storyIndex, StoryIndexError, type StoredStory } from '@/lib/story-index';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* خواندن و نوشتنِ فهرست در `lib/story-index` است — همان چیزی که مسیرِ
   باشگاه هم از آن استفاده می‌کند. دو نسخه‌ی جدا، دو رفتارِ جدا در برابر
   خطا ساخته بود. */
const idx = (id: string) => storyIndex('seller-media', 'sellers', id);

const isActive = (s: StoredStory, now: number) =>
  !!s.expiresAt && new Date(String(s.expiresAt)).getTime() > now;

const failed = (e: unknown, fallback: string) =>
  NextResponse.json(
    { message: e instanceof StoryIndexError ? e.message : fallback },
    { status: 500, headers: CORS },
  );

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = idx(id);
  let all: StoredStory[];
  try { all = await store.read(); } catch { return NextResponse.json([], { headers: CORS }); }

  const now = Date.now();
  const active = all.filter(s => isActive(s, now));
  if (active.length !== all.length) {
    /* منقضی‌ها هم از فهرست و هم از فضای ذخیره‌سازی می‌روند — وگرنه
       فایلِ عکس تا ابد می‌ماند و پولش پرداخت می‌شود. */
    const gone = all.filter(s => !isActive(s, now));
    void store.write(active).then(() => store.purge(gone)).catch(() => {});
  }
  return NextResponse.json(active, { headers: CORS });
}

/* همان مدل استوری باشگاه: خواندن عمومی، ولی نوشتن/حذف فقط مالک
   همان فروشگاه یا ادمین. */
async function guardOwner(req: NextRequest, sellerId: string) {
  const actor = await actorOf(req);
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401, headers: CORS });
  if (!(await ownsSeller(actor, sellerId))) return NextResponse.json(FORBIDDEN, { status: 403, headers: CORS });
  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await guardOwner(req, id);
  if (denied) return denied;

  /* شناسه و تاریخ‌ها روی سرور ساخته می‌شوند — دلیلش در `lib/story-input` */
  const story = normalizeStory(await req.json().catch(() => null));
  if (!story) return NextResponse.json({ message: 'رسانه‌ی استوری معتبر نیست' }, { status: 400, headers: CORS });

  const store = idx(id);
  try {
    const current = await store.read();
    const now = Date.now();
    const active = current.filter(s => isActive(s, now));
    if (active.length >= 10)
      return NextResponse.json({ message: 'حداکثر ۱۰ استوری مجاز است' }, { status: 400, headers: CORS });
    await store.write([...active, story]);
  } catch (e) {
    /* شکستِ نوشتن باید دیده شود: پیش‌تر ۲۰۱ برمی‌گشت و پنل «منتشر شد»
       نشان می‌داد در حالی که هیچ‌چیز ذخیره نشده بود. */
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
    /* «پیدا نشد» باید ۴۰۴ باشد نه ok: پنل روی همین پاسخ حذفِ محلی را
       برمی‌گرداند، و ok گفتن یعنی استوری با رفرشِ بعدی برمی‌گردد. */
    if (!current.some(s => s.id === storyId))
      return NextResponse.json({ message: 'استوری پیدا نشد' }, { status: 404, headers: CORS });

    const gone = current.filter(s => s.id === storyId || !isActive(s, now));
    await store.write(current.filter(s => s.id !== storyId && isActive(s, now)));
    void store.purge(gone);
  } catch (e) {
    return failed(e, 'حذفِ استوری انجام نشد');
  }
  return NextResponse.json({ ok: true }, { headers: CORS });
}
