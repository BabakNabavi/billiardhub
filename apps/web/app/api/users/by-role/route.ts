export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role');
  const excludeId = req.nextUrl.searchParams.get('excludeId');
  if (!role) {
    return NextResponse.json({ message: 'role param required' }, { status: 400, headers: CORS_HEADERS });
  }

  let query = getSupabaseServer()
    .from('users')
    .select('id, firstName, lastName, city, bio, verificationStatus, primaryRole, secondaryRoles, coachProfile, avatar')
    .eq('isActive', true)
    .or(`primaryRole.eq.${role},secondaryRoles.cs.{${role}}`);

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(data ?? [], { status: 200, headers: CORS_HEADERS });
}
