export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { CORS, safeKey, readJson, writeJson } from '@/lib/social-server';

/* «دیده‌شدنِ» استوری، per-viewer و ماندگار روی سرور ⇒ حتی با لاگ‌اوت/لاگین یا
   دستگاهِ دیگر، رینگِ استوریِ دیده‌شده دیگر رنگی نمی‌شود (مثل اینستاگرام) */
const seenPath = (user: string) => `social/seen/${safeKey(user)}.json`;

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get('user') || '';
  if (!user) return NextResponse.json([], { headers: CORS });
  const ids = await readJson<string[]>(seenPath(user), []);
  return NextResponse.json(ids, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = String(body?.user || '');
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String) : [];
  if (!user || !ids.length) return NextResponse.json({ ok: true }, { headers: CORS });
  const cur = await readJson<string[]>(seenPath(user), []);
  const set = new Set(cur); ids.forEach(i => set.add(i));
  await writeJson(seenPath(user), [...set].slice(-3000));   // سقفِ نگه‌داری
  return NextResponse.json({ ok: true }, { headers: CORS });
}
