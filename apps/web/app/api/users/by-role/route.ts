export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS_HEADERS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/* نقش مستقیم داخل رشته‌ی فیلتر PostgREST می‌نشیند؛ پس باید از فهرست
   بسته بیاید. وگرنه یک ویرگول در مقدار، شرط اضافه به همان or() تزریق
   می‌کرد و مثلاً کاربران غیرفعال هم برمی‌گشتند. */
const ROLES = new Set([
  'user', 'player', 'coach', 'referee',
  'technician', 'seller', 'manufacturer', 'club_owner',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');
  const excludeId = req.nextUrl.searchParams.get('excludeId');
  if (!role) {
    return NextResponse.json({ message: 'role param required' }, { status: 400, headers: CORS_HEADERS });
  }
  if (!ROLES.has(role)) {
    return NextResponse.json([], { status: 200, headers: CORS_HEADERS });
  }

  let query = getSupabaseServer()
    .from('users')
    .select('id, firstName, lastName, city, bio, verificationStatus, primaryRole, secondaryRoles, coachProfile, avatar')
    .eq('isActive', true)
    .or(`primaryRole.eq.${role},secondaryRoles.cs.{${role}}`);

  /* شناسه‌ی بی‌شکل روی ستون uuid خطای 22P02 می‌داد و کل کوئری را می‌کشت */
  if (excludeId && UUID.test(excludeId)) query = query.neq('id', excludeId);

  const { data, error } = await query;

  if (error) {
    console.error('[users/by-role] db error:', error.message);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(data ?? [], { status: 200, headers: CORS_HEADERS });
}
