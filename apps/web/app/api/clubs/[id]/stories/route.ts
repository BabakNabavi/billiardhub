export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { actorOf, ownsClub, UNAUTHENTICATED, FORBIDDEN } from '@/lib/auth/ownership';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const BUCKET = 'club-media';
const indexPath = (id: string) => `clubs/${id}/stories/index.json`;

async function readIndex(id: string): Promise<any[]> {
  const { data, error } = await getSupabaseServer()
    .storage.from(BUCKET).download(indexPath(id));
  if (error || !data) return [];
  try { return JSON.parse(await data.text()); } catch { return []; }
}

async function writeIndex(id: string, stories: any[]): Promise<void> {
  const content = JSON.stringify(stories);
  const buf = Buffer.from(content, 'utf8');
  await getSupabaseServer()
    .storage.from(BUCKET)
    .upload(indexPath(id), buf, {
      upsert: true,
      contentType: 'application/json',
    });
}

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
  const all = await readIndex(id);
  const now = new Date();
  const active = all.filter((s: any) => new Date(s.expiresAt) > now);

  /* `?sync=1` — تعمیرِ رکورد از روی فایل. فقط پنلِ باشگاه‌دار آن را
     می‌فرستد؛ نوارِ استوریِ صفحه‌ی اول نه، وگرنه هر بارگذاریِ صفحه‌ی
     اول یک UPDATE بی‌فایده به دیتابیس می‌زد.

     این همان چیزی است که استوریِ ثبت‌شده‌ی پیش از مهاجرتِ ۰۶۴ را هم
     نجات می‌دهد: کافی است باشگاه‌دار یک‌بار تبِ گالری را باز کند. */
  const wantsSync = req.nextUrl.searchParams.get('sync') === '1';
  if (active.length !== all.length) {
    writeIndex(id, active).catch(() => { });
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

  const story = await req.json();
  const current = await readIndex(id);
  const now = new Date();
  const active = current.filter((s: any) => new Date(s.expiresAt) > now);
  if (active.length >= 10)
    return NextResponse.json({ message: 'حداکثر ۱۰ استوری مجاز است' }, { status: 400, headers: CORS });
  const updated = [...active, story];
  await writeIndex(id, updated);
  await syncClubRow(id, updated);
  return NextResponse.json(story, { status: 201, headers: CORS });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await guardOwner(req, id);
  if (denied) return denied;

  const storyId = req.nextUrl.searchParams.get('storyId');
  const current = await readIndex(id);
  const now = new Date();
  const updated = current.filter(
    (s: any) => s.id !== storyId && new Date(s.expiresAt) > now
  );
  await writeIndex(id, updated);
  await syncClubRow(id, updated);
  return NextResponse.json({ ok: true }, { headers: CORS });
}
