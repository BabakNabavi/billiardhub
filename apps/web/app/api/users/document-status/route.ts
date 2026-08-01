export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';

/* وضعیتِ واقعیِ «تأیید مدارک» برای کاربرِ واردشده.

   تا امروز نشانِ «تأیید مدارک» از `users.verificationStatus` خوانده
   می‌شد — ولی آن ستون با تأیید **کد ملی** روی 'verified' می‌رود
   (app/api/auth/register و /api/auth/verify/national-id). یعنی همان
   لحظه که هویت استعلام می‌شد، ردیفِ «تأیید مدارک» هم سبز می‌شد بدون
   اینکه هیچ مدرکی آپلود یا بررسی شده باشد. دو چیزِ متفاوت روی یک
   ستون سوار بودند.

   مدرک به نقش بستگی دارد و هرکدام جای خودش را دارد:
     باشگاه‌دار     ⇐ جوازِ کسبِ باشگاه (clubs.licenseDocumentUrl + licenseVerified)
     مربی/داور/…    ⇐ مدرکِ پروفایلِ همان نقش (profiles.license_url + license_verified)
     کاربرِ ساده     ⇐ مدرکی لازم نیست

   سه حالت برمی‌گردد، نه دو تا: «لازم نیست» با «هنوز نداده» فرق دارد
   و کاربرِ ساده نباید ردیفِ قرمزِ همیشگی ببیند. */

type State = 'verified' | 'pending' | 'missing' | 'not_required';

interface Result {
  state: State;
  /** نقشی که مدرک برای آن لازم است */
  role: string;
  /** فایل آپلود شده؟ */
  uploaded: boolean;
  /** استعلام/بررسی تأیید شده؟ */
  approved: boolean;
  message: string;
}

const MESSAGES: Record<State, string> = {
  verified: 'مدارک شما بررسی و تأیید شده است.',
  pending: 'مدرک شما بارگذاری شده و در انتظار بررسی است.',
  missing: 'مدرک مربوط به نقشتان را در پنل همان نقش آپلود کنید تا کارشناسان بررسی کنند.',
  not_required: 'برای نقش فعلی شما مدرکی لازم نیست.',
};

const reply = (r: Omit<Result, 'message'>) =>
  NextResponse.json({ ...r, message: MESSAGES[r.state] }, { headers: { 'Cache-Control': 'no-store' } });

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const { data: me } = await sb().from('users')
    .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
  const u = (me ?? {}) as { primaryRole?: string; secondaryRoles?: unknown };
  const roles = [u.primaryRole, ...(Array.isArray(u.secondaryRoles) ? u.secondaryRoles : [])]
    .filter((r): r is string => typeof r === 'string' && !!r);

  /* ── باشگاه‌دار: جوازِ کسب ── */
  if (roles.includes('club_owner')) {
    const { data: clubs } = await sb().from('clubs')
      .select('"licenseDocumentUrl","licenseVerified"').eq('ownerId', actor.id);
    const list = (clubs ?? []) as { licenseDocumentUrl?: string | null; licenseVerified?: boolean }[];

    /* یک باشگاهِ تأییدشده کافی است؛ ولی اگر هیچ‌کدام تأیید نشده، وضعیت
       سخت‌گیرانه‌ترین حالتِ ممکن است. */
    const approved = list.some(c => !!c.licenseVerified);
    const uploaded = list.some(c => !!String(c.licenseDocumentUrl ?? '').trim());

    return reply({
      role: 'club_owner', uploaded, approved,
      state: approved ? 'verified' : uploaded ? 'pending' : 'missing',
    });
  }

  /* ── نقش‌های پروفایل‌دار: مربی، داور، فروشنده، … ── */
  const PROFILE_ROLES = ['coach', 'referee', 'seller', 'manufacturer', 'technician'];
  const mine = roles.find(r => PROFILE_ROLES.includes(r));
  if (mine) {
    const { data: p } = await sb().from('profiles')
      .select('license_url, license_verified, status').eq('owner_id', actor.id).eq('kind', mine).maybeSingle();
    const row = (p ?? null) as { license_url?: string | null; license_verified?: boolean; status?: string } | null;

    const uploaded = !!String(row?.license_url ?? '').trim();
    const approved = !!row?.license_verified && row?.status === 'approved';

    return reply({
      role: mine, uploaded, approved,
      state: approved ? 'verified' : uploaded ? 'pending' : 'missing',
    });
  }

  return reply({ role: u.primaryRole ?? 'user', uploaded: false, approved: false, state: 'not_required' });
}
