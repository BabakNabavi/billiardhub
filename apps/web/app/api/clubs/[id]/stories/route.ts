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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await readIndex(id);
  const now = new Date();
  const active = all.filter((s: any) => new Date(s.expiresAt) > now);
  if (active.length !== all.length) {
    writeIndex(id, active).catch(() => {});
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
  return NextResponse.json({ ok: true }, { headers: CORS });
}
