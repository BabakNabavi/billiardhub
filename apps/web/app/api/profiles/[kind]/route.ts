export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest, isAdmin } from '@/lib/finance/db';
import {
  PROFILE_KINDS, getProfileByOwner, getProfileBySlug, listProfiles, saveProfile,
  type ProfileKind,
} from '@/lib/profiles/server';

/* پروفایل‌های نقش‌ها — فروشگاه، تولیدکننده و بقیه.
   GET  ?slug=  یک پروفایل | ?mine=1 پروفایل خودم | بدون هیچ‌کدام: فهرست
   POST ذخیره‌ی پروفایل خودم (ساخت یا به‌روزرسانی) */

const kindOf = (v: string): ProfileKind | null =>
  (PROFILE_KINDS as string[]).includes(v) ? (v as ProfileKind) : null;

const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = kindOf((await ctx.params).kind);
  if (!kind) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const mine = searchParams.get('mine') === '1';

  if (mine) {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
    const p = await getProfileByOwner(kind, actor.id);
    return NextResponse.json({ profile: p }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (slug) {
    const p = await getProfileBySlug(kind, slug);
    if (!p) return NextResponse.json({ message: 'پیدا نشد' }, { status: 404 });
    /* پروفایل تأییدنشده را فقط صاحبش و ادمین می‌بینند */
    if (p.status !== 'approved') {
      const actor = actorFromRequest(req);
      const allowed = !!actor && (actor.id === p.ownerId || (await isAdmin(actor.id)));
      if (!allowed) return NextResponse.json({ message: 'پیدا نشد' }, { status: 404 });
    }
    return NextResponse.json({ profile: p }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const all = await listProfiles(kind, { status: 'approved' });
    return NextResponse.json({ profiles: all }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'خطا در دریافت پروفایل‌ها' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = kindOf((await ctx.params).kind);
  if (!kind) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const data = b?.data && typeof b.data === 'object' ? b.data as Record<string, unknown> : null;
  if (!data) return NextResponse.json({ message: 'بدنه‌ی پروفایل خالی است' }, { status: 400 });

  const slug = str(b?.slug, 80);
  if (!slug) return NextResponse.json({ message: 'نامک پروفایل لازم است' }, { status: 400 });

  /* جواز کسب — عوض‌شدنش تأیید قبلی را باطل می‌کند (در PATCH ادمین دوباره بررسی می‌شود) */
  const licenseNumber = b?.licenseNumber !== undefined ? str(b.licenseNumber, 60) : undefined;
  const licenseUrl = b?.licenseUrl !== undefined ? str(b.licenseUrl, 600) : undefined;

  try {
    const saved = await saveProfile({
      kind, ownerId: actor.id, slug, data,
      ...(licenseNumber !== undefined ? { licenseNumber } : {}),
      ...(licenseUrl !== undefined ? { licenseUrl } : {}),
    });
    return NextResponse.json({ profile: saved }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/does not exist|schema cache/i.test(msg)) {
      return NextResponse.json({ message: 'جدول پروفایل‌ها هنوز ساخته نشده (مایگریشن ۰۰۸ اجرا نشده)' }, { status: 503 });
    }
    if (/duplicate key/i.test(msg)) {
      return NextResponse.json({ message: 'این نامک قبلاً استفاده شده است' }, { status: 409 });
    }
    console.error('save profile failed:', msg);
    return NextResponse.json({ message: 'ذخیره‌ی پروفایل انجام نشد' }, { status: 500 });
  }
}
