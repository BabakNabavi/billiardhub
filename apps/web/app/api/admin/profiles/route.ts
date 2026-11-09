export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit } from '@/lib/finance/db';
import { PROFILE_KINDS, listProfiles, reviewProfile, type ProfileKind } from '@/lib/profiles/server';
import { can, canAny, PROFILE_KIND_KEY } from '@/lib/admin/permissions';

/* بررسی پروفایل‌ها توسط ادمین — تأیید/رد، تیک آبی و تأیید جواز کسب

   ⚠️ هر نوع پروفایل صفحه و کلید خودش را دارد (coach ⟵ coaches، …). تا آبان
   ۱۴۰۵ این مسیر فقط «ادمین بودن» را می‌پرسید و ادمینی با کلید «اخبار» هم
   می‌توانست مربی و داور تأیید یا رد کند. صفحه‌ی «تیک آبی» همه‌ی نوع‌ها را
   می‌خواند و «نقش‌ها» هم پروفایل را بررسی می‌کند. */
const VIEW_EXTRA = ['verified', 'roles'] as const;

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const kindParam = new URL(req.url).searchParams.get('kind');
  const asked = kindParam && (PROFILE_KINDS as string[]).includes(kindParam)
    ? [kindParam as ProfileKind]
    : PROFILE_KINDS;
  /* «تیک آبی» و «نقش‌ها» همه‌ی نوع‌ها را لازم دارند؛ بقیه فقط نوع‌هایی که کلیدشان را
     دارند — وگرنه کلید «مربیان» فهرست کامل فروشگاه‌ها و بازیکنان را هم با جواز می‌داد. */
  const kinds = (await canAny(actor.id, VIEW_EXTRA))
    ? asked
    : (await Promise.all(asked.map(async k => ((await can(actor.id, PROFILE_KIND_KEY[k] ?? 'access')) ? k : null))))
        .filter((k): k is ProfileKind => k !== null);
  if (kinds.length === 0) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const out: Record<string, unknown[]> = {};
  for (const k of kinds) {
    try { out[k] = await listProfiles(k, {}); } catch { out[k] = []; }
  }
  return NextResponse.json({ profiles: out }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  if (!(await canAny(actor.id, [...Object.values(PROFILE_KIND_KEY), ...VIEW_EXTRA]))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  if (!id) return NextResponse.json({ message: 'شناسه‌ی پروفایل لازم است' }, { status: 400 });

  const patch: Parameters<typeof reviewProfile>[1] = {};
  if (['approved', 'pending', 'rejected'].includes(String(b?.status))) patch.status = b.status;
  /* ── تیک آبی مجوز خودش را دارد ──
     بقیه‌ی این مسیر (تأیید/رد/جواز) کار همان ادمینی است که صفحه‌ی
     نقش را دارد، ولی اعطای تیک تصمیم جداگانه‌ای است و در
     `PERMISSION_GROUPS` کلید خودش را دارد. بدون این بررسی، ادمینی
     که عمدا کلید `verified` را ندارد می‌توانست با یک درخواست
     مستقیم تیک بدهد. */
  if (typeof b?.verified === 'boolean') {
    if (!(await can(actor.id, 'verified'))) {
      return NextResponse.json({ message: 'اجازه‌ی اعطای تیک آبی را ندارید' }, { status: 403 });
    }
    patch.verified = b.verified;
  }
  if (typeof b?.licenseVerified === 'boolean') patch.licenseVerified = b.licenseVerified;
  if (b?.licenseNote !== undefined) patch.licenseNote = String(b.licenseNote ?? '').slice(0, 500);

  /* تأیید، رد و جواز کار صفحه‌ی همان نوع (یا «نقش‌ها») است. نوع از دیتابیس
     خوانده می‌شود، نه از بدنه: درخواست دستکاری‌شده نمی‌تواند نوع دیگری بگوید. */
  if (patch.status !== undefined || patch.licenseVerified !== undefined || patch.licenseNote !== undefined) {
    const { data: row } = await sb().from('profiles').select('kind').eq('id', id).maybeSingle();
    const kindKey = PROFILE_KIND_KEY[String((row as { kind?: string } | null)?.kind ?? '')];
    if (!kindKey) return NextResponse.json({ message: 'پروفایل یافت نشد' }, { status: 404 });
    if (!(await canAny(actor.id, [kindKey, 'roles']))) {
      return NextResponse.json({ message: 'دسترسی به این بخش مجاز نیست' }, { status: 403 });
    }
  }

  const saved = await reviewProfile(id, patch);
  if (!saved) return NextResponse.json({ message: 'به‌روزرسانی انجام نشد' }, { status: 500 });

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'PROFILE_REVIEWED',
    entityType: 'profile', entityId: id, newValue: patch,
  });

  return NextResponse.json({ profile: saved });
}
