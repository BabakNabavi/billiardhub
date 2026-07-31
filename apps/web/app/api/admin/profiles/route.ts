export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import { PROFILE_KINDS, listProfiles, reviewProfile, type ProfileKind } from '@/lib/profiles/server';

/* بررسی پروفایل‌ها توسط ادمین — تأیید/رد، تیک آبی و تأیید جواز کسب */

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const kindParam = new URL(req.url).searchParams.get('kind');
  const kinds = kindParam && (PROFILE_KINDS as string[]).includes(kindParam)
    ? [kindParam as ProfileKind]
    : PROFILE_KINDS;

  const out: Record<string, unknown[]> = {};
  for (const k of kinds) {
    try { out[k] = await listProfiles(k, {}); } catch { out[k] = []; }
  }
  return NextResponse.json({ profiles: out }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  if (!id) return NextResponse.json({ message: 'شناسه‌ی پروفایل لازم است' }, { status: 400 });

  const patch: Parameters<typeof reviewProfile>[1] = {};
  if (['approved', 'pending', 'rejected'].includes(String(b?.status))) patch.status = b.status;
  if (typeof b?.verified === 'boolean') patch.verified = b.verified;
  if (typeof b?.licenseVerified === 'boolean') patch.licenseVerified = b.licenseVerified;
  if (b?.licenseNote !== undefined) patch.licenseNote = String(b.licenseNote ?? '').slice(0, 500);

  const saved = await reviewProfile(id, patch);
  if (!saved) return NextResponse.json({ message: 'به‌روزرسانی انجام نشد' }, { status: 500 });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PROFILE_REVIEWED',
    entityType: 'profile', entityId: id, newValue: patch,
  });

  return NextResponse.json({ profile: saved });
}
